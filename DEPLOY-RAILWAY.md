# SAQIIB BOT — Deploy Guide (Railway + Render)

Repo: `https://github.com/saqibxiqbal-spec/SAQIIB-BOT` (branch `main`)
Everything needed is already committed: `railway.json`, `Dockerfile`, `start.sh`, `render.yaml`.

---

## Option A — Railway (new account, ~4 minutes)

Railway's free trial gives a one-time credit. A brand-new account gets a fresh
quota, which is exactly what the old account ran out of.

1. Go to **https://railway.app** -> **Login** -> sign in with the GitHub account
   `saqibxiqbal-spec` (this makes the repo appear automatically).
2. **New Project** -> **Deploy from GitHub repo** -> pick **SAQIIB-BOT**.
   Railway reads `railway.json` on its own — do not change the build settings.
3. Open the service -> **Variables** -> **Raw Editor** -> paste the block below
   (fill the `CHANGE_ME` values, everything else is already correct).
4. **Settings -> Networking -> Generate Domain**. That URL is your pairing portal.
5. Wait for the deploy log to show:
   ```
   SAQIIB BOT: 36 plugin files, 1884 commands
   SAQIIB BOT web portal: http://localhost:3000
   ```
6. Open the domain -> type your number -> get the pairing code -> WhatsApp ->
   Linked devices -> Link with phone number -> enter the code.

### Required variables (Raw Editor)

```
BOT_NAME=SAQIIB BOT
OWNER_NAME=SAQIIB
OWNER_NUMBER=923106762478
PREFIX=.
MODE=public
PORT=3000
MAX_SESSIONS=500
REPO_LINK=https://github.com/saqibxiqbal-spec/SAQIIB-BOT
CHANNEL_LINK=
GROUP_LINK=
ONLINE=true
AUTO_READ=false
AUTOVIEWONCE=true
MONGODB_URI=CHANGE_ME
MONGODB_DB=saqiib_bot
GITHUB_TOKEN=CHANGE_ME
GITHUB_USER=saqibxiqbal-spec
GITHUB_REPO=saqiib-md-state
GEMINI_API_KEY=CHANGE_ME
GEMINI_MODEL=gemini-3.5-flash
SESSION_DIR=/data/sessions
```

### Volume (important — keeps sessions after a restart)

Service -> **Settings -> Volumes -> Add Volume** -> mount path `/data`.
Without it every redeploy logs the bot out and you must pair again.

---

## Option B — Render (free, no card)

1. **https://render.com/deploy?repo=https://github.com/saqibxiqbal-spec/SAQIIB-BOT**
2. Render reads `render.yaml`, builds the Dockerfile, asks for the same variables.
3. Free plan sleeps after ~15 min idle; the bot wakes on the next message.

---

## Health check

Any host: `GET /health` must return

```json
{"ok":true,"bot":"SAQIIB BOT","status":"idle","connected":false,"sessions":0}
```

`connected:false` with `sessions:0` simply means nobody has paired yet.

---

## If the deploy fails

| Symptom | Cause | Fix |
|---|---|---|
| `Free plan resource provision limit exceeded` | account quota used up | new account / upgrade / delete old services |
| Build fails at `npm install` | Node < 20 | `engines` already forces >=20; use the Dockerfile builder |
| `Cannot find module 'dotenv'` | dependencies not installed | make sure the build ran `npm install`, not a cached layer |
| Portal loads, pairing code fails | session volume missing | add the `/data` volume and set `SESSION_DIR=/data/sessions` |
| `[MONGO] using GitHub state repo` | no `MONGODB_URI` | fine — state is saved to GitHub; add a URI for speed |

---

## Never commit secrets

`.env` is gitignored and no token is in the repo. Keep it that way — a leaked
token is the fastest way to get the GitHub account flagged.
