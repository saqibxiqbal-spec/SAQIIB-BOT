# SAQIIB BOT — Build Status Report

**Repository:** https://github.com/saqibxiqbal-spec/SAQIIB-BOT (branch `main`, HEAD `88905da`)
**Owner number (locked):** +92 310 6762478
**Prefix:** `.` · **Mode:** public · **Commands:** 1884 across 36 plugin files · **Duplicates:** 0 · **Syntax errors:** 0

---

## Batch 1 — changes 1–10 (commit `7abcdd0`)

1. Rebranded everything from BILAL MD / SAQIB MD to **SAQIIB BOT** (92+ files, incl. Dockerfile, portal, docs).
2. Owner number set to **923106762478** and hard-locked in `config.LOCKED_OWNER_NUMBER`.
3. New GitHub repo `SAQIIB-BOT` created and pushed.
4. `.repo` and `.srepo` reply **"This is for owner only."** to everyone except the owner.
5. `.pair` is public — every user can pair (whitelisted in `lib/handler.js` via `PUBLIC_COMMANDS`).
6. Group and channel links removed (`.channel` / `.group` now say "No link is configured").
7. `.saqib` AI command ported in (with owner-only `on`/`off`).
8. `.find <details>` command created — e.g. `.find a command that can decode view once` → `✅ Yes, I found a command: .vv`.
9. Default language converted to pure English (969 Roman-Urdu strings translated; residual fun-content cleaned).
10. Luxury pairing portal rebranded; `.menuall` sends the picture + full menu in **one single message**.

## Batch 2 — changes 11–20 (commit `a61f7d8`)

11. **Antidelete — 2 modes:** `.antidelete chat` (reappears where deleted) and `.antidelete inbox` (media to *yourself*), each with `on`/`off`.
12. **Antimention** — nobody can @mention the bot in a group; the mention is deleted.
13. **Antiedit** — edited messages show old vs new text.
14. **Autoreact** — numbered menu, per-bot scope, owner reaction locked and always on.
15. **Autotyping / Autorecording** — live presence, `composing` / `recording`, auto `paused` after send.
16. **Antiviewonce** — `.antiviewonce on/off`; when ON, view-once media goes to *yourself* without being viewed.
17. **Status replies go to yourself** — if the bot replies to anyone's status, the copy lands in your own inbox and the status owner never knows.
18. **`.song` ultra fast** — audio-only commands skip the audio/video question and download immediately.
19. **Zero-error hardening** — generic English error text, no forbidden/unauthorized crashes.
20. Full English cleanup pass on characters, games, fun, islamic, group, owner, selfheal, helpers.

## Batch 3 — changes 21–30 (commit `88905da`)

21. **Antiban guard** (`lib/antiban.js`) — per-chat pacing (320 ms), 60/min global ceiling, duplicate-text collapse, burst cooldown. Wired into every `reply` and `send`.
22. **Unban email generator** — `.unban21 whatsapp` (or any platform) returns a complete ready-to-send email: To, Subject, full body, plus the official appeal form link.
23. **AI speed** — Gemini and the keyless engine now **race**; the first answer wins. Worst case dropped from ~22 s to the faster engine's time.
24. **AI timeouts tightened** — Gemini 8 s, fallback 9 s, so AI never hangs a command.
25. **Defaults verified (requirement 27)** — only `ONLINE=true` and `AUTOVIEWONCE=true`; `AUTO_READ=false`; every other toggle `false`.
26. **`ANTIMENTION` added to config** — it was referenced by the toggle map but never defined, so the toggle read `undefined`.
27. **Live command audit** — 36 plugins, 1884 commands, 0 load failures, 0 duplicates, 0 empty plugins.
28. **Boot smoke test** — clean start, portal on :3000, yt-dlp + ffmpeg ready, MongoDB state restored from GitHub, no errors.
29. **Batches pushed in order** — 10 → 10 → 10, each with its own commit.
30. **GitHub safety** — `.env` and all secrets gitignored; tokens never committed; no force-pushes.

---

## What is left / blocked

**Railway deploy — blocked by the account, not the code.**
The Railway API token is valid (`saqibxiqbal@gmail.com`), but project creation returns:

> `Free plan resource provision limit exceeded. Please upgrade to provision more resources!`

So no new service can be provisioned on this workspace until the plan is upgraded or an existing service is freed. Everything needed for the deploy is already in the repo (`railway.json`, `Dockerfile`, `start.sh`, `render.yaml`), so once a slot exists it is a one-click deploy from the GitHub repo.

**MongoDB Atlas — connection string still needed.**
The public/private API keys are valid but the cluster host could not be discovered, so the bot is currently persisting state to the GitHub state repo (`saqibxiqbal-spec/saqiib-md-state`) with an in-memory fallback. That works and survives restarts, but a real `MONGODB_URI` is faster and is recommended before heavy use.

---

## How to use it right now

1. Open the portal, enter your number, get the pairing code, enter it in WhatsApp → Linked devices.
2. Whoever links the bot becomes that session's owner.
3. `.menu` for the full list, `.menuall` for the picture + complete menu in one message.
4. `.repo` works only for +92 310 6762478.
