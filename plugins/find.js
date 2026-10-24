/**
 * FIND — natural-language command finder
 *   .find a command that can decode view once   ->  "yes I found a command .vv"
 *
 * It maps everyday descriptions to the closest real command in the bot and
 * answers in plain English.
 */
const config = require('../config');
const registry = require('./_registry');

const SYNONYMS = {
  'view once': 'vv', 'view-once': 'vv', 'viewonce': 'vv', 'one time view': 'vv',
  'decode view once': 'vv', 'open view once': 'vv', 'view once open': 'vv',
  'antiviewonce': 'antiviewonce', 'anti view once': 'antiviewonce',
  'song': 'song', 'music': 'song', 'mp3': 'song', 'audio': 'song', 'download song': 'song',
  'video': 'video', 'ytmp4': 'video', 'youtube video': 'video', 'mp4': 'video',
  'sticker': 'sticker', 'stiker': 'sticker', 'make sticker': 'sticker',
  'image': 'image', 'photo': 'image', 'picture': 'image',
  'ai': 'ai', 'chat gpt': 'ai', 'gpt': 'ai', 'ask ai': 'ai', 'artificial intelligence': 'ai',
  'pair': 'pair', 'pairing': 'pair', 'link bot': 'pair', 'connect bot': 'pair',
  'unban': 'unban', 'unblock number': 'unban', 'ban appeal': 'unban',
  'antidelete': 'antidelete', 'anti delete': 'antidelete', 'deleted message': 'antidelete',
  'antiedit': 'antiedit', 'anti edit': 'antiedit', 'edited message': 'antiedit',
  'antimention': 'antimention', 'anti mention': 'antimention',
  'autoreact': 'autoreact', 'auto react': 'autoreact', 'react': 'autoreact',
  'autotyping': 'autotyping', 'auto typing': 'autotyping', 'typing': 'autotyping',
  'autorecording': 'autorecording', 'auto recording': 'autorecording', 'recording': 'autorecording',
  'menu': 'menu', 'help': 'menu', 'commands': 'menu', 'all commands': 'menuall',
  'ping': 'ping', 'speed': 'ping', 'latency': 'ping',
  'weather': 'weather', 'temperature': 'weather',
  'translate': 'translate', 'translation': 'translate',
  'qr': 'qr', 'qrcode': 'qr', 'qr code': 'qr',
  'short url': 'shorturl', 'shorten': 'shorturl',
  'wiki': 'wiki', 'wikipedia': 'wiki',
  'news': 'news', 'headlines': 'news',
  'group': 'group', 'create group': 'newgc', 'group link': 'gclink',
  'kick': 'kick', 'remove member': 'kick',
  'promote': 'promote', 'make admin': 'promote',
  'demote': 'demote', 'remove admin': 'demote',
  'tag all': 'tagall', 'mention all': 'tagall', 'everyone': 'tagall',
  'owner': 'owner', 'contact owner': 'owner',
  'repo': 'repo', 'repository': 'repo', 'github': 'repo',
  'restart': 'restart', 'reboot': 'restart',
  'uptime': 'uptime', 'status': 'uptime',
  'vv': 'vv', 'save status': 'vv',
  'tiktok': 'tiktok', 'instagram': 'instagram', 'facebook': 'facebook',
  'calculator': 'calc', 'calculate': 'calc', 'math': 'calc',
  'password': 'gpass', 'generate password': 'gpass',
  'ss': 'ss', 'screenshot': 'ss', 'website screenshot': 'ss',
  'carbon': 'carbon', 'code image': 'carbon',
  'vcf': 'vcf', 'contact file': 'vcf',
  'say': 'say', 'text to speech': 'say', 'tts': 'say',
  'emojimix': 'emojimix', 'mix emoji': 'emojimix',
  'profile pic': 'pp', 'dp': 'pp', 'profile picture': 'pp',
};

const STOP = new Set(['a', 'an', 'the', 'that', 'can', 'could', 'which', 'what', 'is', 'are',
  'command', 'commands', 'to', 'for', 'me', 'please', 'find', 'there', 'any', 'some', 'of',
  'do', 'does', 'how', 'i', 'you', 'my', 'with', 'and', 'or', 'in', 'on', 'it', 'this']);

function allCommandNames() {
  const names = new Set();
  try {
    for (const p of registry.all() || []) for (const c of p.commands || []) names.add(c);
  } catch (_) { /* registry not ready */ }
  return names;
}

function tokens(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
}

function scoreCommand(words, cmd) {
  const c = cmd.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (w === c) score += 10;
    else if (c.startsWith(w) && w.length >= 3) score += 6;
    else if (c.includes(w) && w.length >= 4) score += 3;
    else if (w.includes(c) && c.length >= 3) score += 2;
  }
  return score;
}

function bestMatch(query) {
  const names = allCommandNames();
  const q = String(query || '').toLowerCase().trim();
  if (!q) return null;

  // 1) longest phrase synonym first
  const phrases = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length);
  for (const ph of phrases) {
    if (q.includes(ph) && names.has(SYNONYMS[ph])) return SYNONYMS[ph];
  }

  // 2) word scoring
  const words = tokens(q).filter((w) => !STOP.has(w) && w.length >= 2);
  let best = null; let bestScore = 0;
  for (const name of names) {
    const sc = scoreCommand(words, name);
    if (sc > bestScore) { bestScore = sc; best = name; }
  }
  return bestScore >= 4 ? best : null;
}

module.exports = {
  commands: ['find'],
  category: '🔎 TOOLS',
  handler: async (ctx) => {
    const { reply, arg, command } = ctx;
    const query = String(arg || '').trim();
    if (!query) {
      return reply(`\ud83d\udd0e *Find a command*\n\nDescribe what you want in plain English and I will find the command for you.\n\n*Example:*\n\u25aa\ufe0f \`${config.PREFIX}${command} a command that can decode view once\`\n\u25aa\ufe0f \`${config.PREFIX}${command} download a song\`\n\u25aa\ufe0f \`${config.PREFIX}${command} make a sticker\``);
    }
    const cmd = bestMatch(query);
    if (!cmd) {
      return reply(`\u274c *Sorry, I couldn't find a command for that.*\n\nTry describing it differently, or type \`${config.PREFIX}menu\` to see everything.`);
    }
    return reply(`\u2705 *Yes, I found a command:* \`${config.PREFIX}${cmd}\`\n\n_Type_ \`${config.PREFIX}${cmd}\` _to use it._`);
  },
};
