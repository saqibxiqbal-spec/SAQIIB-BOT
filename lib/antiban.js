/**
 * ANTI-BAN GUARD
 * --------------
 * WhatsApp bans numbers that behave like robots: hundreds of messages per
 * minute, identical text blasted to many chats, or bursts of media. This module
 * makes the bot behave like a human phone:
 *
 *   • PER-CHAT PACING  — at most one message every MIN_GAP_MS per chat.
 *   • GLOBAL PACING    — a hard ceiling of MAX_PER_MINUTE sends across all chats.
 *   • DUPLICATE GUARD  — the same text to the same chat twice in a row is
 *                        collapsed (this is the #1 spam signal).
 *   • BURST COOLDOWN   — after BURST_LIMIT sends in a row the bot pauses briefly.
 *
 * Everything is fire-and-forget and in-memory: no disk, no network, no cost.
 * It never throws — a broken guard must never break a command.
 */

const MIN_GAP_MS = 320;          // per-chat gap between two sends
const MAX_PER_MINUTE = 60;       // global ceiling
const BURST_LIMIT = 20;          // sends in a row before a short pause
const BURST_PAUSE_MS = 2500;
const DUP_WINDOW_MS = 8000;      // same text twice inside this window = skip

const lastSendAt = new Map();    // jid -> timestamp
const lastText = new Map();      // jid -> { text, at }
const minuteWindow = [];         // timestamps of recent sends
let burstCount = 0;
let burstResetAt = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Text fingerprint used for the duplicate guard. */
function fingerprint(content) {
  if (!content || typeof content !== 'object') return null;
  if (typeof content.text === 'string') return 't:' + content.text.slice(0, 400);
  if (typeof content.caption === 'string') return 'c:' + content.caption.slice(0, 400);
  return null;
}

/**
 * Wait until it is safe to send to `jid`.
 * Returns { skip: true } when the exact same text was just sent there.
 */
async function gate(jid, content) {
  try {
    const now = Date.now();

    // ---- duplicate guard ----
    const fp = fingerprint(content);
    if (fp) {
      const prev = lastText.get(jid);
      if (prev && prev.text === fp && now - prev.at < DUP_WINDOW_MS) {
        return { skip: true };
      }
      lastText.set(jid, { text: fp, at: now });
    }

    // ---- global per-minute ceiling ----
    while (minuteWindow.length && now - minuteWindow[0] > 60000) minuteWindow.shift();
    if (minuteWindow.length >= MAX_PER_MINUTE) {
      const wait = 60000 - (now - minuteWindow[0]) + 50;
      await sleep(Math.min(wait, 5000));
    }

    // ---- burst cooldown ----
    if (now > burstResetAt) { burstCount = 0; burstResetAt = now + 60000; }
    if (burstCount >= BURST_LIMIT) {
      await sleep(BURST_PAUSE_MS);
      burstCount = 0;
    }

    // ---- per-chat pacing ----
    const last = lastSendAt.get(jid) || 0;
    const gap = now - last;
    if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);

    const t = Date.now();
    lastSendAt.set(jid, t);
    minuteWindow.push(t);
    burstCount += 1;
    return { skip: false };
  } catch {
    return { skip: false };
  }
}

module.exports = { gate, MIN_GAP_MS, MAX_PER_MINUTE };
