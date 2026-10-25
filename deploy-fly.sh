#!/usr/bin/env bash
# One-shot Fly.io deploy for SAQIIB BOT.
# usage: ./deploy-fly.sh <FLY_API_TOKEN> [app_name]
set -uo pipefail
cd "$(dirname "$0")"

TOKEN="${1:?usage: ./deploy-fly.sh <FLY_API_TOKEN> [app_name]}"
APP="${2:-sqbot}"
export FLY_API_TOKEN="$TOKEN"
export FLYCTL_INSTALL="/root/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
export FLY_NO_UPDATE_CHECK=1

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

say "auth check"
flyctl auth whoami || { echo "TOKEN INVALID"; exit 1; }

say "app $APP"
flyctl apps list | grep -q "^$APP" || flyctl apps create "$APP" --org personal

say "volumes"
flyctl volumes list -a "$APP" 2>/dev/null | grep -q sqbot_session \
  || flyctl volumes create sqbot_session -a "$APP" --region sin --size 1 --yes
flyctl volumes list -a "$APP" 2>/dev/null | grep -q sqbot_logs \
  || flyctl volumes create sqbot_logs -a "$APP" --region sin --size 1 --yes

say "secrets from .env"
ARGS=()
while IFS= read -r line; do
  case "$line" in ''|\#*) continue;; esac
  key="${line%%=*}"
  [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
  ARGS+=("$line")
done < .env
flyctl secrets set -a "$APP" --stage "${ARGS[@]}"

say "deploy"
flyctl deploy -a "$APP" --remote-only --ha=false

say "health"
sleep 20
curl -s -m 20 "https://$APP.fly.dev/health"; echo
say "DONE -> https://$APP.fly.dev"
