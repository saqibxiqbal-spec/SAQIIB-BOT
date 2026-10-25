# RUN ON YOUR OWN PC — pairing will work here

WhatsApp terminates connections from this cloud sandbox with
`428 Connection Terminated` before the pairing handshake can finish.
That is an IP-level block, not a code bug. On your own PC / VPS the IP is
yours, so pairing completes normally.

## Option A — Docker (easiest, works on Windows/Mac/Linux)

```bash
git clone https://github.com/saqibxiqbal-spec/SAQIIB-BOT.git
cd SAQIIB-BOT
cp .env.example .env      # then edit OWNER_NUMBER=923134182952
docker build -t saqiib .
docker run -d --name saqiib --restart always -p 3000:3000 \
  --env-file .env -v saqiib-session:/app/session saqiib
```

Open <http://localhost:3000> → enter your number → get the code → pair.

## Option B — Node directly (no Docker)

```bash
git clone https://github.com/saqibxiqbal-spec/SAQIIB-BOT.git
cd SAQIIB-BOT
npm install
# edit .env:  OWNER_NUMBER=923134182952
bash start.sh
```

Open <http://localhost:3000>.

## Option C — your VPS (permanent, always online)

```bash
ssh root@YOUR_SERVER_IP
curl -fsSL https://raw.githubusercontent.com/saqibxiqbal-spec/SAQIIB-BOT/main/dokploy/install-and-deploy.sh | bash
```

Then open `http://YOUR_SERVER_IP:3000`.

## If you must run it from a cloud IP

Set `PROXY_URL` in `.env` to a residential/VPN proxy and the bot will egress
through it:

```
PROXY_URL=http://user:pass@proxy-host:port
# or
PROXY_URL=socks5://127.0.0.1:1080
```

## Diagnosing a failed pairing

```bash
node probe-pair.js 923134182952
```

It prints the pairing code, every `link_code_companion_reg` node WhatsApp sends
back, and the exact disconnect `statusCode`:

| statusCode | meaning |
|---|---|
| `515` | phone accepted the code — normal, it reconnects and links |
| `428` | WhatsApp refused the connection (IP flagged / too many pending attempts) |
| `401` | logged out — session creds are dead, wipe `session/` |
| `408` | QR refs exhausted — pairing window closed |
