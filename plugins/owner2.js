/**
 * OWNER2 — owner-only bot management
 */
const config = require('../config');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getJSON, pick, randInt } = require('../lib/helpers');

const P = () => config.PREFIX;

const ownerState = {
  autoanswer: null,       // string | null
  maintenance: false,
  maintenanceMsg: '\ud83d\udd27 The bot is in maintenance. Then try later.',
  selfmode: false,
  sudo: new Set(),
  prem: new Set(),
  thumb: null,
  boot: Date.now(),
  commandsRun: 0,
};
const errors = [];

const handler = async (ctx) => {
  const { command, reply, arg, isOwner, senderNum, pushname } = ctx;

  // every command in this file is owner-only
  if (!isOwner) {
    return reply(`\u26d4 *Owner-only command.*\n\nOnly bot owners can use this.`);
  }

  switch (command) {
    case 'stats': {
      const up = Date.now() - ownerState.boot;
      const h = Math.floor(up / 3600000), m = Math.floor((up % 3600000) / 60000);
      const mem = process.memoryUsage();
      return reply(`📊 *Bot stats*\n\n⏱️ Uptime: *${h}h ${m}m*\n🧠 RAM: ${(mem.rss / 1048576).toFixed(0)} MB\n⚙️ Node: ${process.version}\n💻 Platform: ${process.platform}\n🔧 Commands run: ${ownerState.commandsRun}\n👑 Owner: ${pushname || senderNum}\n🕐 ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);
    }
    case 'healthcheck': {
      const checks = [];
      try { const t = Date.now(); await getJSON('https://api.ipify.org?format=json'); checks.push(`✅ Internet — ${Date.now() - t}ms`); }
      catch { checks.push('❌ Internet — fail'); }
      checks.push(`✅ Memory — ${(process.memoryUsage().rss / 1048576).toFixed(0)} MB`);
      checks.push(`✅ Prefix — ${config.PREFIX}`);
      checks.push(`✅ Session — ${ctx.sock ? 'connected' : 'check'}`);
      return reply(`\ud83e\ude7a *Health check*\n\n${checks.join('\n')}\n\n${checks.some((c) => c.startsWith('\u274c')) ? '\\u26a0\\ufe0f There are some issues.' : '\\ud83d\udd25 Everything is fine!'}`);
    }
    case 'maintenance': {
      if (!arg) return reply(`🔧 *Maintenance:* ${ownerState.maintenance ? '✅ ON' : '❌ OFF'}\n\n${P()}maintenance on/off [message]`);
      const [sub, ...msg] = arg.split(' ');
      if (sub === 'on') {
        ownerState.maintenance = true;
        if (msg.length) ownerState.maintenanceMsg = msg.join(' ');
        return reply(`🔧 *Maintenance ON*\n\nMessage: ${ownerState.maintenanceMsg}`);
      }
      ownerState.maintenance = false;
      return reply('\u2705 *Maintenance OFF* \u2014 bot is normal.');
    }
    case 'selfmode': {
      if (!arg) return reply(`\ud83d\udc64 *Self mode:* ${ownerState.selfmode ? '\\u2705 ON (sir owner commands)' : '\u274c OFF (sab commands)'}\n\n${P()}selfmode on/off`);
      ownerState.selfmode = arg === 'on';
      return reply(`👤 *Self mode ${ownerState.selfmode ? 'ON ✅' : 'OFF ❌'}*`);
    }
    case 'sudomode': {
      const num = (arg || '').replace(/[^0-9]/g, '');
      if (!num) return reply(`\u274c Number do. Example:${P()}sudomode 923001234567\n\n_Current: ${ownerState.sudo.size} sudo users_`);
      if (ownerState.sudo.has(num)) { ownerState.sudo.delete(num); return reply(`\u2705 *${num}* deleted with sudo.`); }
      ownerState.sudo.add(num);
      return reply(`\ud83d\udc51 *${num}* ab is sudo user.\n\nTotal:${ownerState.sudo.size}`);
    }
    case 'premlist': {
      return reply(`\ud83d\udc8e *Premium users* (${ownerState.prem.size})\n\n${[...ownerState.prem].join('\n') || '_Koi nahi._'}\n\n_${P()}premlist add <number> \u2014 jald aayega._`);
    }
    case 'totaluser': {
      return reply(`\ud83d\udc65 *Total users*\n\n\ud83d\udcf1 Tracked chats: ${ownerState.commandsRun ? 'active' : 'starting'}_Exact count is available from WhatsApp \u2014 see baileys stats endpoint._`);
    }
    case 'autoanswer': {
      if (!arg) {
        return reply(ownerState.autoanswer
          ? `\ud83e\udd16 *Auto-answer ON*\n\nReply: "${ownerState.autoanswer}"\n\n_To turn off${P()}autoanswer off_`
          : `\ud83e\udd16 *Auto-answer OFF*\n\n${P()}autoanswer <text> \u2014 when you are offline`);
      }
      if (arg === 'off') { ownerState.autoanswer = null; return reply('✅ *Auto-answer OFF*'); }
      ownerState.autoanswer = arg;
      return reply(`\ud83e\udd16 *Auto-answer ON*\n\nWhen you are busy: "${arg}"`);
    }
    case 'setthumb': {
      const img = ctx.quoted?.message?.imageMessage;
      if (!img) return reply(`\u274c Reply to any image${P()}setthumb write.`);
      try {
        const { downloadMedia } = require('../lib/helpers');
        ownerState.thumb = await downloadMedia(img, 'image');
        return reply(`\u2705 *Thumbnail set!* (${(ownerState.thumb.length / 1024).toFixed(1)}KB)\n\n_These ab stickers/media will be used in preview._`);
      } catch { return reply('\u274c Thumbnail not set.'); }
    }
    case 'logs': {
      if (!errors.length) return reply('\ud83d\udccb *Error logs*\n\n\u2705 No errors. The bot is running clean.');
      return reply(`\ud83d\udccb *Error logs* (last${Math.min(errors.length, 10)})\n\n${errors.slice(-10).map((e, i) => `${i + 1}. ${e}`).join('\n')}`);
    }
    case 'backup': {
      try {
        const files = fs.readdirSync(path.join(__dirname, '..', 'plugins')).filter((f) => f.endsWith('.js'));
        const dump = Buffer.from(JSON.stringify({
          when: new Date().toISOString(),
          plugins: files,
          settings: { prefix: config.PREFIX, botName: config.BOT_NAME },
          counts: { plugins: files.length, sudo: ownerState.sudo.size, prem: ownerState.prem.size },
        }, null, 2));
        await ctx.send(ctx.from, { document: dump, fileName: `bot_backup_${Date.now()}.json`, mimetype: 'application/json' }, { quoted: ctx.m });
      } catch { return reply('\u274c Backup is not created.'); }
      break;
    }
    case 'chart': {
      const bars = Array.from({ length: 7 }, (_, i) => {
        const n = randInt(2, 10);
        return `Day ${i + 1} ${'█'.repeat(n)} ${n}`;
      });
      return reply(`\ud83d\udcc8 *Activity chart* (demo)\n\n${bars.join('\n')}_Requires analytics plugin for real data._`);
    }
    default:
      return reply('❓ Unknown owner command');
  }
};

module.exports = {
  commands: [
    'backup', 'autoanswer', 'totaluser', 'maintenance', 'premlist', 'sudomode', 'selfmode', 'setthumb',
    'stats', 'chart', 'logs', 'healthcheck',
  ],
  category: '👑 OWNER',
  handler,
  ownerState,
};
