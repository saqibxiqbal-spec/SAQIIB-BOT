/**
 * BOTPIC — let the owner change the bot's MENU picture themselves
 * ---------------------------------------------------------------
 * Reply to an image (or send an image with the command) and the bot saves it to
 * the volume and uses it for `.menu` from then on. The choice persists across
 * restarts and redeploys (it is written next to the session data and recorded
 * in saqiib-settings.json).
 *
 *   .botpic            -> show how to set it + the current file name
 *   .botpic reset      -> go back to the bundled default picture
 *   (reply to an image) .botpic -> save that image as the menu picture
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const settings = require('../lib/settings');
const helpers = require('../lib/helpers');

// Volume-backed path (same directory as saqiib-settings.json / the session dir),
// so the picture survives redeploys.
const PIC_FILE = path.join(path.dirname(path.resolve(config.SESSION_DIR)), 'botpic.jpg');
const DEFAULT_PIC = process.env.BOT_PIC || './assets/bot.jpg';

/** Pull an imageMessage out of the replied-to message or the current message. */
function imageFrom(ctx) {
  const unwrap = (msg) => {
    if (!msg) return null;
    return (
      msg.imageMessage ||
      msg.viewOnceMessage?.message?.imageMessage ||
      msg.viewOnceMessageV2?.message?.imageMessage ||
      msg.viewOnceMessageV2Extension?.message?.imageMessage ||
      null
    );
  };
  return unwrap(ctx.quoted?.message) || unwrap(ctx.m?.message);
}

const handler = async (ctx) => {
  const { reply, arg } = ctx;
  const sub = String(arg || '').trim().toLowerCase();

  if (sub === 'reset') {
    config.BOT_PIC = DEFAULT_PIC;
    settings.save();
    try { require('./main').resetBotPic && require('./main').resetBotPic(); } catch { /* ignore */ }
    return reply('\u2705 Bot menu picture returned to default.');
  }

  const img = imageFrom(ctx);
  if (!img) {
    return reply(
      '🖼️ *Bot menu picture*\n\n' +
      `Reply to any *image* with \`${config.PREFIX}botpic\` \u2014 that picture will be used in the menu.\n\n` +
      `_Currently:_ ${path.basename(config.BOT_PIC)}\n` +
      `_Return to default:_ \`${config.PREFIX}botpic reset\``
    );
  }

  try {
    const buf = await helpers.downloadMedia(img, 'image');
    if (!buf || !buf.length) throw new Error('image empty');
    fs.mkdirSync(path.dirname(PIC_FILE), { recursive: true });
    fs.writeFileSync(PIC_FILE, buf);
    config.BOT_PIC = PIC_FILE;
    settings.save();
    // Drop the in-memory menu-pic cache so the NEXT `.menu` uses the new image.
    try { require('./main').resetBotPic && require('./main').resetBotPic(); } catch { /* ignore */ }
    await reply(`\u2705 Bot menu picture updated! Now this pic will appear in *${config.PREFIX}menu*.`);
  } catch (e) {
    await reply(`\u274c Pic can not be saved:${e?.message || e}`);
  }
};

module.exports = {
  commands: ['botpic', 'setbotpic', 'menupic'],
  category: '⚙️ SETTINGS',
  ownerOnly: true,
  handler,
};
