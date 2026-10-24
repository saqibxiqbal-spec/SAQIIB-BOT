#!/bin/bash
# Generate a fresh WhatsApp pairing code for a number.
# Usage: ./get-code.sh 923106762478
NUM="${1:-923106762478}"
BASE="http://127.0.0.1:3000"

# make sure the bot is up
if ! curl -s -m 5 "$BASE/health" >/dev/null 2>&1; then
  echo "[!] Bot not running on $BASE - starting it..."
  cd "$(dirname "$0")" || exit 1
  OWNER_NUMBER="$NUM" PORT=3000 nohup node index.js > /tmp/pair-bot.log 2>&1 &
  sleep 12
fi

# clean slate so WhatsApp never rejects a stale attempt
curl -s -m 20 -X POST "$BASE/api/pair/reset" -H 'Content-Type: application/json' -d "{\"number\":\"$NUM\"}" >/dev/null
sleep 3

curl -s -m 60 -X POST "$BASE/api/pair" -H 'Content-Type: application/json' -d "{\"number\":\"$NUM\"}" \
 | python3 -c "import sys,json;d=json.load(sys.stdin);print('CODE:',d.get('code'));print('NUMBER:',d.get('number'));print('VALID_FOR:',str(d.get('expiresIn'))+' seconds');print('STATUS:',d.get('status'))"
