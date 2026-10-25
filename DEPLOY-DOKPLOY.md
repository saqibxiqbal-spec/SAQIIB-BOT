# Deploying SAQIIB BOT on Dokploy

Dokploy is a self-hosted PaaS (like Heroku/Vercel, but on your own VPS). This repo
already ships a production `Dockerfile`, so Dokploy builds it with zero changes.

---

## Why it works out of the box

| Requirement | How this repo satisfies it |
|---|---|
| Node runtime | `Dockerfile` → `FROM node:20-slim` |
| ffmpeg (audio/video conversion) | installed in the image at build time |
| yt-dlp (media downloads) | installed in the image + bootstrapped to `/tmp/saqiib-bin` |
| HTTP port | `ENV PORT=3000` + `EXPOSE 3000`, read by `config.js` |
| Long-running process | `CMD ["bash","start.sh"]` → `node index.js` |
| Persistent WhatsApp sessions | volume at `/app/session` |
| MongoDB | external Atlas cluster via `MONGODB_URI` |

---

## Option A — one command (fastest)

On your VPS, as root:

```bash
curl -sSL https://raw.githubusercontent.com/saqibxiqbal-spec/SAQIIB-BOT/main/dokploy/install-and-deploy.sh | bash
```

That script will:

1. Install Docker if it is missing.
2. Install Dokploy if it is missing (`curl -sSL https://dokploy.com/install.sh | sh`).
3. Clone this repo to `/opt/saqiib-bot`.
4. Build the image from the local `Dockerfile`.
5. Start the container with the `/app/session` volume, `--restart always`, and port `3000`.
6. Print the panel URL and the bot URL.

It reads secrets from `/opt/saqiib-bot/.env` — create that file first (see below).

---

## Option B — Dokploy web panel (recommended for ongoing management)

1. **Install Dokploy** on a fresh Ubuntu 22.04/24.04 VPS:
   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```
   Then open `http://YOUR_SERVER_IP:3000` and create the admin account.

2. **Create a project** → `Create Project` → name it `saqiib`.

3. **Add an application** → inside the project, `Create Service` → **Application**.
   Name it `saqiib-bot`.

4. **Connect the repo** → *General* tab:
   - Provider: **GitHub**
   - Repository: `saqibxiqbal-spec/SAQIIB-BOT`
   - Branch: `main`
   - Build Path: `/`
   - If the repo is private, connect the GitHub App first (Dokploy → Settings → Git).

5. **Build type** → *Build* tab:
   - Build Type: **Dockerfile**
   - Dockerfile Path: `./Dockerfile`
   - Docker Context Path: `.`
   - Leave the build command empty — the Dockerfile handles everything.

6. **Environment variables** → *Environment* tab, paste:
   ```
   BOT_NAME=SAQIIB BOT
   PREFIX=.
   OWNER_NAME=SAQIIB
   OWNER_NUMBER=923134182952
   MODE=public
   PORT=3000
   MONGODB_URI=mongodb+srv://USER:PASS@cluster0.2qkx7r6.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=saqiib_md
   GITHUB_TOKEN=ghp_your_token
   GITHUB_STATE_REPO=saqibxiqbal-spec/saqib-md-state
   ONLINE=true
   AUTOVIEWONCE=true
   AUTO_READ=false
   ADMIN_TOKEN=change_me_to_a_long_random_string
   ```
   Generate `ADMIN_TOKEN` with: `openssl rand -hex 16`

7. **Volume (critical)** → *Advanced* → *Mounts* → `Add Mount`:
   - Type: **Volume**
   - Name: `saqiib-session`
   - Mount Path: **`/app/session`**

   Without this, every redeploy wipes the paired WhatsApp session and you must
   re-enter the pairing code.

8. **Port** → *General* → *Ports*:
   - Container Port: `3000`
   - Protocol: `tcp`
   - Publishing: leave as internal (Dokploy's Traefik proxies it)

9. **Domain + SSL** → *Domains* → `Add Domain`:
   - Host: `bot.yourdomain.com` (point an A record at your server IP first)
   - Path: `/`
   - Container Port: `3000`
   - HTTPS: **on**, Certificate Provider: **Let's Encrypt**

10. **Deploy** → click `Deploy`. Watch the build log; a clean build takes ~3–5 minutes
    (the slow part is `apt-get install ffmpeg`).

11. **Pair WhatsApp** → open `https://bot.yourdomain.com`, enter your number with
    country code (e.g. `923134182952`), request the pairing code, then in WhatsApp:
    *Settings → Linked Devices → Link with phone number* and enter the 8-digit code.

---

## Server sizing

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU (ffmpeg transcodes are CPU-heavy) |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB | 20 GB (media cache + yt-dlp binaries) |
| OS | Ubuntu 22.04 / 24.04 | Ubuntu 24.04 |

Any VPS works: Hetzner CX22, DigitalOcean 2GB, Contabo VPS S, Oracle Cloud free tier.

---

## Verifying the deployment

```bash
curl https://bot.yourdomain.com/health
```

Expected:

```json
{"ok":true,"bot":"SAQIIB BOT","version":"3.0.0","status":"idle","connected":false,"sessions":0}
```

After pairing, `connected` becomes `true` and `sessions` becomes `1`.

---

## Common problems

**Build fails on `apt-get install ffmpeg`**
Your server is out of disk. Run `df -h`; you need at least 3 GB free.

**Container starts then exits immediately**
Check the logs in Dokploy. Usually a bad `MONGODB_URI` — the `@` and `:` in the
password must be URL-encoded (`@` → `%40`, `:` → `%3A`).

**Bot connects but commands do nothing**
`OWNER_NUMBER` must be digits only with country code, no `+` and no spaces.

**Session lost after redeploy**
The `/app/session` volume is missing or mounted at the wrong path.

**Portal loads but pairing code never appears**
Your VPS IP is likely blocked by WhatsApp. Try a different provider/region, or use
the QR flow instead of the pairing-code flow.

**`yt-dlp` fails on YouTube links**
YouTube blocks datacenter IPs. The bot already falls back to JioSaavn for audio;
for video, set a proxy via `YTDLP_PROXY` in the environment.

---

## Updating

Dokploy can auto-deploy on push. Enable *General → Auto Deploy* and add the
webhook to GitHub, or just click **Deploy** after pushing.
