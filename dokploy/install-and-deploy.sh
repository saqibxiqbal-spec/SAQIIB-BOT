#!/usr/bin/env bash
# ============================================================
#  SAQIIB BOT — one-shot VPS deploy
#  Installs Docker + Dokploy (if missing), builds the image
#  from this repo's Dockerfile, and starts the bot with a
#  persistent session volume.
#
#  Usage (on the VPS, as root):
#     bash dokploy/install-and-deploy.sh
#
#  Reads secrets from /opt/saqiib-bot/.env
# ============================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/saqibxiqbal-spec/SAQIIB-BOT.git}"
APP_DIR="${APP_DIR:-/opt/saqiib-bot}"
IMAGE="saqiib-bot:latest"
CONTAINER="saqiib-bot"
HOST_PORT="${HOST_PORT:-3000}"
VOLUME="saqiib-session"

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m[!] %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m[x] %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root (sudo bash $0)"

# ---------- 1. Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  say "Docker already installed ($(docker --version | cut -d, -f1))"
fi

# ---------- 2. Dokploy ----------
if [[ ! -d /etc/dokploy ]] && [[ ! -d "$HOME/.dokploy" ]]; then
  say "Installing Dokploy"
  if curl -fsSL https://dokploy.com/install.sh -o /tmp/dokploy-install.sh 2>/dev/null; then
    bash /tmp/dokploy-install.sh || warn "Dokploy installer returned non-zero — continuing with plain Docker"
  else
    warn "Could not download the Dokploy installer — continuing with plain Docker"
  fi
else
  say "Dokploy already installed"
fi

# ---------- 3. Source ----------
if [[ -d "$APP_DIR/.git" ]]; then
  say "Updating existing checkout in $APP_DIR"
  git -C "$APP_DIR" fetch --depth 1 origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  say "Cloning $REPO_URL -> $APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# ---------- 4. Env ----------
if [[ ! -f .env ]]; then
  say "Creating .env from template"
  cat > .env <<'ENVEOF'
BOT_NAME=SAQIIB BOT
PREFIX=.
OWNER_NAME=SAQIIB
OWNER_NUMBER=923134182952
MODE=public
PORT=3000
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.2qkx7r6.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=saqiib_md
GITHUB_TOKEN=
GITHUB_STATE_REPO=saqibxiqbal-spec/saqib-md-state
ONLINE=true
AUTOVIEWONCE=true
AUTO_READ=false
ENVEOF
  echo "ADMIN_TOKEN=$(openssl rand -hex 16)" >> .env
  warn "Edit $APP_DIR/.env and set MONGODB_URI + OWNER_NUMBER, then re-run this script."
  exit 0
fi

grep -q '^MONGODB_URI=mongodb' .env || die "MONGODB_URI is not set in $APP_DIR/.env"
grep -q '^ADMIN_TOKEN=.\{8,\}' .env || echo "ADMIN_TOKEN=$(openssl rand -hex 16)" >> .env

# ---------- 5. Build ----------
say "Building image (this takes 3-5 min: ffmpeg + yt-dlp)"
docker build -t "$IMAGE" .

# ---------- 6. Run ----------
say "Starting container"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker volume create "$VOLUME" >/dev/null

docker run -d \
  --name "$CONTAINER" \
  --restart always \
  --env-file "$APP_DIR/.env" \
  -p "${HOST_PORT}:3000" \
  -v "${VOLUME}:/app/session" \
  -v "${APP_DIR}/logs:/app/logs" \
  --log-opt max-size=10m --log-opt max-file=3 \
  "$IMAGE"

# ---------- 7. Verify ----------
say "Waiting for the portal to come up"
for i in $(seq 1 40); do
  sleep 2
  if curl -fsS "http://127.0.0.1:${HOST_PORT}/health" >/tmp/saqiib-health.json 2>/dev/null; then
    say "Bot is healthy:"
    cat /tmp/saqiib-health.json; echo
    break
  fi
  [[ $i -eq 40 ]] && { warn "Portal did not respond in 80s. Logs:"; docker logs --tail 60 "$CONTAINER"; exit 1; }
done

IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || echo YOUR_SERVER_IP)"
cat <<EOF

============================================================
  SAQIIB BOT is running
============================================================
  Pairing portal : http://${IP}:${HOST_PORT}
  Health check   : http://${IP}:${HOST_PORT}/health
  Dokploy panel  : http://${IP}:3000   (if installed)
  Session volume : ${VOLUME} -> /app/session
  Container      : ${CONTAINER}

  Pair WhatsApp:
    1. Open the pairing portal
    2. Enter your number with country code (e.g. 923134182952)
    3. Request the code, then in WhatsApp go to
       Settings -> Linked Devices -> Link with phone number
    4. Enter the 8-digit code

  Logs    : docker logs -f ${CONTAINER}
  Restart : docker restart ${CONTAINER}
  Update  : bash ${APP_DIR}/dokploy/install-and-deploy.sh
============================================================
EOF
