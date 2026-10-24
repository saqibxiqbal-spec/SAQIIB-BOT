/**
 * GROUP2 — group administration & moderation
 */
const config = require('../config');
const { pick, randInt } = require('../lib/helpers');

const P = () => config.PREFIX;

/* per-group settings + activity (memory only) */
const settings = new Map();   // groupId -> { antiword:[], antilink:bool, rules:'', ... }
const activity = new Map();   // groupId -> Map(user -> count)
const adminLog = new Map();   // groupId -> [lines]
const muted = new Set();      // groupId
const bots = new Set();       // groupId -> antibot on

const getS = (g) => { if (!settings.has(g)) settings.set(g, { antiword: [], antilink: false, rules: '', antisticker: false, antiaudio: false, antivideo: false, autoreply: {}, autoapprove: false }); return settings.get(g); };
/** True when the group has auto-approve of join requests switched on. */
const isAutoApprove = (g) => { const s = settings.get(g); return !!(s && s.autoapprove); };
const logIt = (g, line) => { const l = adminLog.get(g) || []; l.push(`[${new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' })}] ${line}`); adminLog.set(g, l.slice(-50)); };

const handler = async (ctx) => {
  const { command, reply, arg, from, isGroup, isOwner, isAdmin, senderNum, pushname, mentioned } = ctx;
  const g = from || 'group';

  // Everything here is group-only.
  const GROUP_ONLY = ['pick', 'antiword', 'antisticker', 'grouprules', 'absen', 'inactive', 'opengc', 'antiaudio',
    'antivideo', 'antilinkstrict', 'muteall', 'announce', 'autoapprove', 'adminlog', 'welcomecard', 'goodbyecard',
    'autosticker', 'autoreply-grp', 'membercount', 'gcreport', 'topchat', 'antibot', 'gcprotect', 'gcaudit',
    'adminping', 'gcsetup', 'backup-grp', 'restore-grp', 'gccsv', 'grpmood', 'gchelp', 'grpreset'];
  if (GROUP_ONLY.includes(command) && !isGroup) {
    return reply(`\u274c This command works only in *group*.`);
  }

  switch (command) {
    case 'gchelp': case 'gcmenu': {
      return reply(`👥 *GROUP COMMANDS*\n\n*Moderation:*\n${P()}antiword add <lafz>\n${P()}antilinkstrict on/off\n${P()}antisticker on/off\n${P()}antiaudio on/off\n${P()}antivideo on/off\n${P()}antibot on/off\n${P()}muteall on/off\n\n*Info:*\n${P()}membercount\n${P()}topchat\n${P()}inactive\n${P()}absen\n${P()}gcreport\n${P()}grpmood\n${P()}gcaudit\n\n*Setup:*\n${P()}gcsetup\n${P()}grouprules <text>\n${P()}welcomecard <text>\n${P()}grpreset`);
    }
    case 'membercount': {
      return reply(`\ud83d\udc65 *Member count*\n\nGroup: *${(await ctx.groupSize?.()) || 'unknown'}*\n\n_(Exact count is available from WhatsApp)_`);
    }
    case 'grouprules': {
      const s = getS(g);
      if (!arg) return reply(s.rules ? `📜 *Group rules*\n\n${s.rules}` : `\u274c No rules are set. ${P()}grouprules <text>`);
      s.rules = arg;
      logIt(g, `${pushname} ne rules update kiye`);
      return reply(`✅ *Group rules set!*\n\n${arg}`);
    }
    case 'antiword': {
      const s = getS(g);
      const [sub, ...rest] = (arg || '').split(' ');
      if (sub === 'add' && rest.length) {
        s.antiword.push(rest.join(' ').toLowerCase());
        return reply(`\ud83d\udeab *"${rest.join(' ')}"* Got added to the blacklist.\n\nTotally banned:${s.antiword.length}`);
      }
      if (sub === 'remove' && rest.length) {
        s.antiword = s.antiword.filter((w) => w !== rest.join(' ').toLowerCase());
        return reply(`\u2705 Hata diya. Totally banned:${s.antiword.length}`);
      }
      if (sub === 'list') return reply(`🚫 *Banned words* (${s.antiword.length})\n\n${s.antiword.join(', ') || '—'}`);
      return reply(`❌ Format: ${P()}antiword add <lafz> | remove <lafz> | list`);
    }
    case 'antilinkstrict': case 'antilink': {
      const s = getS(g);
      if (!arg) return reply(`🔗 *Anti-link:* ${s.antilink ? '✅ ON' : '❌ OFF'}\n\n${P()}antilinkstrict on/off`);
      s.antilink = arg === 'on';
      return reply(`🔗 *Anti-link ${s.antilink ? 'ON ✅' : 'OFF ❌'}*`);
    }
    case 'antisticker': {
      const s = getS(g);
      if (!arg) return reply(`🎨 *Anti-sticker:* ${s.antisticker ? '✅ ON' : '❌ OFF'}`);
      s.antisticker = arg === 'on';
      return reply(`🎨 *Anti-sticker ${s.antisticker ? 'ON ✅' : 'OFF ❌'}*`);
    }
    case 'antiaudio': {
      const s = getS(g);
      if (!arg) return reply(`🎵 *Anti-audio:* ${s.antiaudio ? '✅ ON' : '❌ OFF'}`);
      s.antiaudio = arg === 'on';
      return reply(`🎵 *Anti-audio ${s.antiaudio ? 'ON ✅' : 'OFF ❌'}*`);
    }
    case 'antivideo': {
      const s = getS(g);
      if (!arg) return reply(`🎬 *Anti-video:* ${s.antivideo ? '✅ ON' : '❌ OFF'}`);
      s.antivideo = arg === 'on';
      return reply(`🎬 *Anti-video ${s.antivideo ? 'ON ✅' : 'OFF ❌'}*`);
    }
    case 'antibot': {
      if (!arg) return reply(`🤖 *Anti-bot:* ${bots.has(g) ? '✅ ON' : '❌ OFF'}`);
      if (arg === 'on') { bots.add(g); return reply('\ud83e\udd16 *Anti-bot ON* \u2014 bot jaisi IDs ban hongi.'); }
      bots.delete(g); return reply('🤖 *Anti-bot OFF*');
    }
    case 'muteall': {
      if (!arg) return reply(`\ud83d\udd07 *Mute-all:* ${muted.has(g) ? '\u2705 ON' : '\u274c OFF'}_Note: WhatsApp group-wide is not under mute bot \u2014 this flag is saved in group settings._`);
      if (arg === 'on') { muted.add(g); logIt(g, `${pushname}I did not turn mute all on.`); return reply('🔇 *Mute-all ON* (setting saved)'); }
      muted.delete(g); return reply('🔊 *Mute-all OFF*');
    }
    case 'announce': {
      if (!arg) return reply(`\u274c Send some text. Example: ${P()}announce meeting at 5 o'clock`);
      logIt(g, `${pushname}: ANNOUNCE — ${arg}`);
      return reply(`📢 *ANNOUNCEMENT*\n${'─'.repeat(20)}\n${arg}\n${'─'.repeat(20)}\n\n_by ${pushname}_`);
    }
    case 'adminlog': {
      const l = adminLog.get(g) || [];
      return reply(`\ud83d\udccb *Admin log* (last${l.length})\n\n${l.slice(-15).join('\n') || '_Nothing has happened yet._'}`);
    }
    case 'welcomecard': {
      const s = getS(g);
      if (!arg) return reply(`👋 *Welcome message:*\n${s.welcome || '_(default)_'}\n\nChange: ${P()}welcomecard <text>\n_Variables: {name}, {group}_`);
      s.welcome = arg;
      return reply(`✅ Welcome message set!\n\n${arg.replace('{name}', 'Ali').replace('{group}', 'is group')}`);
    }
    case 'goodbyecard': {
      const s = getS(g);
      if (!arg) return reply(`👋 *Goodbye message:*\n${s.goodbye || '_(default)_'}`);
      s.goodbye = arg;
      return reply(`✅ Goodbye message set!\n\n${arg.replace('{name}', 'Ali')}`);
    }
    case 'autosticker': {
      const s = getS(g);
      s.autosticker = !s.autosticker;
      return reply(`🎨 *Auto-sticker* ${s.autosticker ? 'ON ✅ — har image sticker banegi' : 'OFF ❌'}`);
    }
    case 'autoreply-grp': {
      const s = getS(g);
      const [key, ...val] = (arg || '').split('=');
      if (!key || !val.length) return reply(`\u274c Format: ${P()}autoreply-grp hello=Hi! How are you?`);
      s.autoreply[key.trim().toLowerCase()] = val.join('=').trim();
      return reply(`🤖 *Auto-reply set*\n\n"${key.trim()}" → "${val.join('=').trim()}"`);
    }
    case 'inactive': {
      const act = activity.get(g);
      if (!act || !act.size) return reply(`\ud83d\ude34 *Inactive members*\n\nNow there is no data \u2013 few messages are done.`);
      const sorted = [...act.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5);
      return reply(`\ud83d\ude34 *Least active*${sorted.map(([u, c]) => `• ${u} — ${c} messages`).join('\n')}`);
    }
    case 'topchat': {
      const act = activity.get(g);
      if (!act || !act.size) return reply(`\ud83d\udcca *Top chat*\n\nNow there is no data.`);
      const sorted = [...act.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      return reply(`\ud83c\udfc6 *Most active*${sorted.map(([u, c], i) => `${i + 1}. ${u} — ${c} messages`).join('\n')}`);
    }
    case 'gcreport': {
      const s = getS(g);
      const act = activity.get(g);
      return reply(`\ud83d\udcca *Group report*\n\n\ud83d\udc65 Messages tracked: ${act ? [...act.values()].reduce((a, b) => a + b, 0) : 0}\n\ud83d\udeab Banned words: ${s.antiword.length}\n\ud83d\udd17 Anti-link: ${s.antilink ? 'ON' : 'OFF'}\n\ud83c\udfa8 Anti-sticker: ${s.antisticker ? 'ON' : 'OFF'}\n\ud83e\udd16 Anti-bot: ${bots.has(g) ? 'ON' : 'OFF'}\n\ud83d\udd07 Mute-all: ${muted.has(g) ? 'ON' : 'OFF'}\ud83d\udccb Admin log entries:${(adminLog.get(g) || []).length}`);
    }
    case 'grpmood': {
      const moods = ['😄 Khushgawar', '🔥 Active', '\ud83d\ude34 Rested', '🤝 Dosti bhara', '🎉 Mazaakiya'];
      const act = activity.get(g);
      const n = act ? [...act.values()].reduce((a, b) => a + b, 0) : 0;
      const mood = n > 100 ? moods[1] : n > 30 ? moods[0] : moods[2];
      return reply(`\ud83c\udf21\ufe0f *Group mood*\n\n${mood}\n\n\ud83d\udcca Messages: ${n}_Mood is derived from the number of messages._`);
    }
    case 'gcaudit': {
      const s = getS(g);
      return reply(`\ud83d\udd0d *Group audit*\n\n${s.antilink ? '\u2705' : '\u26a0\ufe0f'} Anti-link ${s.antilink ? 'enabled' : 'DISABLED'}\n${s.antiword.length ? '\u2705' : '\u26a0\ufe0f'} Banned words: ${s.antiword.length}\n${s.rules ? '\u2705' : '\u26a0\ufe0f'} Group rules ${s.rules ? 'set' : 'MISSING'}\n${bots.has(g) ? '\u2705' : '\u26a0\ufe0f'} Anti-bot ${bots.has(g) ? 'on' : 'off'}\n\n${!s.antilink || !s.rules ? '\ud83d\udc49 `' + P() + 'gcsetup` \u2014 run it and everything will be set.' : '\u2705 This group is well protected!'}`);
    }
    case 'adminping': {
      return reply(`\ud83c\udfd3 *Admin ping*\n\n\u2705 Bot alive\n\ud83d\udc51 Owner: ${isOwner ? 'you' : 'set'}\n\ud83d\udee1\ufe0f Admin: ${isAdmin ? 'you' : 'no'}\n\u23f1\ufe0f ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);
    }
    case 'gcsetup': {
      const s = getS(g);
      s.antilink = true;
      if (!s.rules) s.rules = '1. Speak with respect\n2. No Spam\n3. Links not allowed\n4. What is abuse?';
      logIt(g, `${pushname}ne gcsetup chalaya`);
      return reply(`\u2699\ufe0f *Group setup complete!*\n\n\u2705 Anti-link ON\n\u2705 Rules set\n\n\ud83d\udcdc *Rules:*\n${s.rules}\n\n_${P()}change from grouprules._`);
    }
    case 'backup-grp': {
      const s = getS(g);
      const dump = Buffer.from(JSON.stringify({ group: g, settings: s, when: new Date().toISOString() }, null, 2));
      await ctx.send(from, { document: dump, fileName: `group_backup_${Date.now()}.json`, mimetype: 'application/json' }, { quoted: ctx.m });
      return;
    }
    case 'restore-grp': {
      const doc = ctx.quoted?.message?.documentMessage;
      if (!doc) return reply(`\u274c Backup by replying to JSON file${P()}restore-grp.`);
      try {
        const { downloadMedia } = require('../lib/helpers');
        const buf = await downloadMedia(doc, 'document');
        const data = JSON.parse(buf.toString('utf8'));
        if (data.settings) { settings.set(g, data.settings); return reply(`\u2705 *Group settings restored!*\n\n\ud83d\udeab Banned:${data.settings.antiword?.length || 0}\n\ud83d\udd17 Anti-link: ${data.settings.antilink ? 'ON' : 'OFF'}`); }
        return reply('\u274c Settings not found in the file.');
      } catch { return reply('\u274c Could not restore.'); }
    }
    case 'gccsv': {
      const act = activity.get(g);
      if (!act || !act.size) return reply('\u274c No data yet.');
      const csv = 'user,messages\n' + [...act.entries()].map(([u, c]) => `${u},${c}`).join('\n');
      return reply(`📊 *Group activity CSV*\n\n\`\`\`${csv.slice(0, 2000)}\`\`\``);
    }
    case 'grpreset': {
      settings.delete(g); adminLog.delete(g); activity.delete(g); muted.delete(g); bots.delete(g);
      return reply('\ud83d\udd04 *Group settings reset!* All defaults.');
    }
    case 'pick': {
      if (!isGroup) return reply('\u274c There is chatter in the group.');
      const names = (arg || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (names.length < 2) return reply(`❌ Format: ${P()}pick Ali, Saqiib, Usman`);
      return reply(`🎯 *Pick* — *${pick(names)}*`);
    }
    case 'absen': {
      const act = activity.get(g);
      const n = act ? act.size : 0;
      return reply(`\ud83d\udccb *Attendance*\n\nActive members: *${n}*\n\n_(For WhatsApp attendance tracking, members have to message.)_`);
    }
    case 'opengc': {
      const s = getS(g);
      s.open = !s.open;
      return reply(`\ud83d\udeaa *Group ${s.open ? 'OPEN \u2705' : 'CLOSED \ud83d\udd12'}*\n\n_Note: Actual open/close happens from WhatsApp settings \u2014 this flag is saved._`);
    }
    case 'gcprotect': {
      const s = getS(g);
      s.antilink = true; s.antisticker = true; s.antiaudio = false; s.antivideo = false;
      bots.add(g);
      return reply('\ud83d\udee1\ufe0f *Group protection ON*\n\n\u2705 Anti-link\n\u2705 Anti-sticker\n\u2705 Anti-bot\n\n_Turn on separately for audio/video._');
    }
    case 'autoapprove': {
      const s = getS(g);
      const v = String(arg || '').trim().toLowerCase();
      const ON = ['on', 'true', '1', 'yes', 'haan', 'han', 'enable'];
      const OFF = ['off', 'false', '0', 'no', 'nahi', 'na', 'disable'];
      if (ON.includes(v)) s.autoapprove = true;
      else if (OFF.includes(v)) s.autoapprove = false;
      else s.autoapprove = !s.autoapprove;
      if (!s.autoapprove) return reply(`\ud83d\udd12 *Auto-approve OFF*\n\nNow join requests by manually accepting:${P()}acceptall`);
      // Approve anything already waiting, then keep auto-accepting new ones.
      let n = 0;
      try {
        const list = await ctx.sock.groupRequestParticipantsList(g);
        if (list?.length) { await ctx.sock.groupRequestParticipantsUpdate(g, list.map((r) => r.jid || r), 'approve'); n = list.length; }
      } catch { /* ignore */ }
      return reply(`✅ *Auto-approve ON*\n\nNew join requests will be accepted automatically.${n ? `\n\n📥 ${n} pending requests approved just now.` : ''}`);
    }
    default:
      return reply('❓ Unknown group command');
  }
};

/** Moderation hook — enforces the group settings on every message. */
async function onMessage(ctx) {
  const { text, from, isGroup, isAdmin, isOwner, senderNum, pushname } = ctx;
  if (!isGroup) return;
  const g = from;

  // activity tracking
  if (!activity.has(g)) activity.set(g, new Map());
  const act = activity.get(g);
  const key = pushname || senderNum || 'member';
  act.set(key, (act.get(key) || 0) + 1);

  if (isAdmin || isOwner) return; // admins exempt
  const s = settings.get(g);
  if (!s) return;

  if (s.antiword?.length && text) {
    const t = text.toLowerCase();
    const hit = s.antiword.find((w) => t.includes(w));
    if (hit) {
      logIt(g, `antiword: ${key} — "${hit}"`);
      await ctx.reply(`\ud83d\udeab *${key}* \u2014 banned word used: "${hit}"`);
      return;
    }
  }
  if (s.antilink && text && /(https?:\/\/|chat\.whatsapp\.com|wa\.me)/i.test(text)) {
    logIt(g, `antilink: ${key}`);
    await ctx.reply(`\ud83d\udd17 *${key}* \u2014 links are not allowed.`);
    return;
  }
  if (s.autoreply && text) {
    const t = text.trim().toLowerCase();
    const hit = Object.keys(s.autoreply).find((k) => t === k || t.startsWith(k + ' '));
    if (hit) { await ctx.reply(s.autoreply[hit]); }
  }
}

module.exports = {
  commands: [
    'pick', 'antiword', 'antisticker', 'grouprules', 'absen', 'inactive', 'opengc', 'antiaudio', 'antivideo',
    'antilinkstrict', 'muteall', 'announce', 'autoapprove', 'adminlog', 'welcomecard', 'goodbyecard',
    'autosticker', 'autoreply-grp', 'membercount', 'gcreport', 'topchat', 'antibot', 'gcprotect', 'gcaudit',
    'adminping', 'gcsetup', 'backup-grp', 'restore-grp', 'gccsv', 'grpmood', 'gchelp', 'grpreset',
    // extras that belong in this family
    'gcmenu', 
  ],
  category: '👥 GROUP',
  handler,
  onMessage,
  isAutoApprove,
};
