/**
 * SAQIIB MD — interactive API-key setup flow
 * -----------------------------------------
 * The owner types `.apikey` and gets a numbered list:
 *
 *     1 Tiktok
 *     2 Instagram
 *     3 Song
 *     4 Video
 *
 * They reply with a number → the bot asks for the API key → the owner replies
 * (ideally by REPLYING to that prompt) with the key → it is stored LIVE in
 * MongoDB, no restart.
 *
 * Pending state lives in lib/interactions (scoped per chat+sender, 5-min TTL),
 * so it never leaks between users or chats. Everything is owner-only.
 */
const config = require('../config');
const apikeys = require('./apikeys');
const interactions = require('./interactions');

// 1️⃣ … 🔟
const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

/** The numbered menu the owner sees (with a dot per configured service). */
function menuText() {
  const lines = apikeys.MENU.map((item) => {
    const rec = apikeys.getService(item.id);
    const dot = rec && rec.key ? '🟢' : '⚪';
    return `${NUM[item.n - 1] || item.n} ${dot} *${item.label}*`;
  }).join('\n');
  return (
    '\ud83d\udd11 *SET API KEYS*' +
    '━━━━━━━━━━━━━━━━━━\n' +
    lines + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '_Reply with the number and then ask for the API key._'
  );
}

/** Store a key (and optional endpoint) for a service and confirm. */
async function applyKey(ctx, serviceId, text) {
  const parts = String(text).split(/\s+/).filter(Boolean);
  const url = parts.find((p) => /^https?:\/\//i.test(p));
  const key = parts.filter((p) => p !== url).join(' ').trim();
  const meta = apikeys.getServiceMeta(serviceId);
  if (!key) {
    await ctx.reply(`\u274c *${meta.label}* key is empty - send again.`).catch(() => {});
    return;
  }
  apikeys.set(serviceId, key, url || undefined);
  const rec = apikeys.getService(serviceId) || {};
  await ctx.reply(
    `\u2705 *${meta.label}* API key set went \u2014 *live* (no restart required)!` +
    `🔑 Key: ${apikeys.mask(rec.key)}\n` +
    (rec.endpoint ? `🔗 Endpoint: ${rec.endpoint}\n` : '') +
    `_${config.PREFIX}See everything with apikey._`
  ).catch(() => {});
}

/** Ask for one service's key, then capture the owner's reply. */
async function askForKey(ctx, serviceId) {
  const meta = apikeys.getServiceMeta(serviceId);
  const sent = await ctx.reply(
    `${meta.emoji} *${meta.label}* chuna.\n\n` +
    '\ud83d\udce9 Now *reply* to this message and send your *API key*.' +
    '_Want to endpoint also write along:_' +
    '`KEY https://api.example.com/ytmp4`'
  ).catch(() => null);
  const promptId = sent && sent.key && sent.key.id;

  interactions.set(ctx.from, ctx.sender, 'custom', {
    handler: async (c, raw) => {
      if (!c.isOwner) return false;                 // owner-only
      const text = String(raw || '').trim();
      if (!text) return false;
      // Prefer a reply to our prompt, but accept a direct next message too.
      const isReply = !!(promptId && c.quoted && c.quoted.key && c.quoted.key.id === promptId);
      await applyKey(c, serviceId, text);
      return true;
    },
  });
}

/** Show the menu and arm the number-selection interaction. */
async function startMenu(ctx) {
  await ctx.reply(menuText()).catch(() => {});
  interactions.set(ctx.from, ctx.sender, 'custom', {
    handler: async (c, raw) => {
      if (!c.isOwner) return false;
      const m = String(raw || '').trim().match(/^([0-9]{1,2})\s*$/);
      if (!m) return false;                          // not a number -> cancel
      const n = parseInt(m[1], 10);
      const item = apikeys.MENU.find((x) => x.n === n);
      if (!item) {
        await c.reply(`❌ *1* se *${apikeys.MENU.length}* ke darmiyan number chuno.`).catch(() => {});
        return true;
      }
      await askForKey(c, item.id);
      return true;
    },
  });
}

/** `.apikey [<n>|<service>] [<key> [endpoint]]` — owner command entry point. */
async function handleCommand(ctx) {
  const arg = String(ctx.arg || '').trim();
  if (!arg) return startMenu(ctx);

  // `.apikey 2`  /  `.apikey 2 KEY [endpoint]`
  const m = arg.match(/^([0-9]{1,2})(?:\s+([\s\S]+))?$/);
  if (m) {
    const n = parseInt(m[1], 10);
    const item = apikeys.MENU.find((x) => x.n === n);
    if (!item) return ctx.reply(`❌ *1* se *${apikeys.MENU.length}* ke darmiyan number chuno.`);
    const rest = (m[2] || '').trim();
    if (rest) return applyKey(ctx, item.id, rest);
    return askForKey(ctx, item.id);
  }

  // `.apikey <serviceId> [key [endpoint]]`
  const parts = arg.split(/\s+/);
  const sid = (parts.shift() || '').toLowerCase();
  if (apikeys.SERVICE_IDS.includes(sid)) {
    const rest = parts.join(' ').trim();
    if (rest) return applyKey(ctx, sid, rest);
    return askForKey(ctx, sid);
  }
  return ctx.reply(`\u274c Number ya service do. Example: \`${config.PREFIX}apikey 1\``);
}

module.exports = { menuText, startMenu, askForKey, applyKey, handleCommand };
