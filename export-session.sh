#!/usr/bin/env bash
# SAQIIB BOT — session/ folder ko base64 zip mein badal deta hai.
# Us output ko Render/Fly/Railway par SESSION_ID env var mein paste karein.
# Isse free host par restart hone ke baad bhi device linked rehta hai.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d session ]; then
  echo "session/ folder nahi mila. Pehle device link karein." >&2
  exit 1
fi

# sirf asli sessions (numeric + qr-link), junk nahi
TMP=$(mktemp -d)
for d in session/*/; do
  name=$(basename "$d")
  case "$name" in
    [0-9]*|qr-link) cp -r "$d" "$TMP/$name" ;;
  esac
done

if [ -z "$(ls -A "$TMP" 2>/dev/null)" ]; then
  echo "session/ mein koi valid session nahi mila." >&2
  rm -rf "$TMP"
  exit 1
fi

OUT="session-id.txt"
( cd "$TMP" && zip -qr - . ) | base64 -w0 > "$OUT"
rm -rf "$TMP"

echo "✅ ban gaya: $OUT  ($(wc -c < "$OUT") bytes)"
echo
echo "Render dashboard -> Environment -> SESSION_ID -> yeh value paste karein:"
echo "----------------------------------------------------------------------"
head -c 120 "$OUT"; echo " ..."
echo "----------------------------------------------------------------------"
echo "Poori value:  cat $OUT"
