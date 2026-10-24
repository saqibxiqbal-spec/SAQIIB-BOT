/**
 * SAQIIB MD — ban appeal helper
 * ----------------------------
 * Each platform gets its OWN appeal channel, because a single generic "email us"
 * line is useless — WhatsApp bans, Instagram bans, Facebook bans and Telegram
 * bans all go through different forms/addresses.
 *
 * Everything here is static text: no API calls, no cost.
 */
const config = require('../config');

/**
 * platform -> appeal info.
 * `email` is the address to write to ('' when the platform only has a form).
 * `url`   is the official appeal page.
 * `steps` are the concrete things the user should do, in order.
 */
const APPEALS = {
  whatsapp: {
    name: 'WhatsApp',
    email: 'support@whatsapp.com',
    url: 'https://faq.whatsapp.com/1280874589015236',
    steps: [
      'WhatsApp kholo → Settings → Help → Contact us',
      'Or email us at support@whatsapp.com',
      'Subject: "My account was banned by mistake"',
      'Your number type (country code ke saath, jaise +92...)',
      'Wajah likha: The number is real, no one spammed.',
    ],
    note: 'WhatsApp review will take 24-48 hours. The form became faster.',
  },
  whatsapp_business: {
    name: 'WhatsApp Business',
    email: 'smb_web@support.whatsapp.com',
    url: 'https://www.whatsapp.com/contact/?subject=messenger',
    steps: [
      'Business account has been banned by appealing to business.whatsapp.com.',
      'Email: smb_web@support.whatsapp.com',
      'With business verification documents attached',
    ],
    note: 'Business appeals are handled by a separate team \u2014 not through normal support.',
  },
  instagram: {
    name: 'Instagram',
    email: '',
    url: 'https://help.instagram.com/contact/606967319425038',
    steps: [
      'Login screen par "Need more help?" dabao',
      'Appeal form bharo \u2014 your username + email do',
      'Or Settings \u2192 Help \u2192 Report a problem',
      'Photo ID will be required and original ID will be sent.',
    ],
    note: 'Instagram only took the form, not the email. Got reply within 1 day.',
  },
  facebook: {
    name: 'Facebook',
    email: 'disabled@fb.com',
    url: 'https://www.facebook.com/help/contact/260749603972907',
    steps: [
      'Please appeal by logging in to facebook.com/support',
      'Or send email to disabled@fb.com',
      'Subject: "Appeal for disabled account"',
      'Attach photo of original ID',
    ],
    note: 'Appeal rejected without ID - please upload photo.',
  },
  telegram: {
    name: 'Telegram',
    email: 'recover@telegram.org',
    url: 'https://telegram.org/faq#q-my-account-was-limited-or-banned',
    steps: [
      'Email me at recover@telegram.org',
      'Your number type (jaise +92...)',
      'By attaching screenshot of limited/banned',
      'Subject: "Account limitation appeal"',
    ],
    note: 'spam@telegram.org is separate for Telegram bots.',
  },
  tiktok: {
    name: 'TikTok',
    email: '',
    url: 'https://www.tiktok.com/legal/report/appeal',
    steps: [
      'Try to login to the app \u2013 appeal button will appear.',
      'Or go to tiktok.com/legal/report/appeal',
      'Username + registered email do',
    ],
    note: 'TikTok is just in-app form.',
  },
  twitter: {
    name: 'X (Twitter)',
    email: '',
    url: 'https://help.twitter.com/forms/restricted',
    steps: [
      'help.twitter.com/forms/restricted kholo',
      'Suspended account appeal form bharo',
      '@username do',
    ],
    note: 'No response to email except form.',
  },
  youtube: {
    name: 'YouTube',
    email: '',
    url: 'https://support.google.com/youtube/contact/account_appeal',
    steps: [
      'support.google.com/youtube → account appeal',
      'Channel URL do',
      'Faces don\'t break the rules',
    ],
    note: 'Google account should be banned by using appeal to accounts.google.com.',
  },
  discord: {
    name: 'Discord',
    email: 'support@discord.com',
    url: 'https://dis.gd/contact',
    steps: [
      'dis.gd/contact par appeal form bharo',
      'Or email support@discord.com',
      'User ID (Settings \u2192 Advanced \u2192 Developer Mode) do',
    ],
    note: 'Account ban becomes permanent after 30 days \u2013 do it quickly.',
  },
  gmail: {
    name: 'Gmail / Google Account',
    email: '',
    url: 'https://support.google.com/accounts/contact/disabled2',
    steps: [
      'support.google.com/accounts → disabled account appeal',
      'Verify recovery via email/phone.',
      'Write face in form',
    ],
    note: 'We use Google forms, not direct email.',
  },
};

const KEYWORDS = [
  ['whatsapp', 'whatsapp'], ['wa business', 'whatsapp_business'], ['whatsapp business', 'whatsapp_business'],
  ['instagram', 'instagram'], ['insta', 'instagram'], ['ig', 'instagram'],
  ['facebook', 'facebook'], ['fb', 'facebook'],
  ['telegram', 'telegram'], ['tg', 'telegram'],
  ['tiktok', 'tiktok'], ['tik tok', 'tiktok'],
  ['twitter', 'twitter'], ['x', 'twitter'],
  ['youtube', 'youtube'], ['yt', 'youtube'],
  ['discord', 'discord'],
  ['gmail', 'gmail'], ['google', 'gmail'],
];

/** Look up appeal info for a free-text platform name. */
function lookup(input) {
  const q = String(input || '').toLowerCase().trim();
  if (!q) return null;
  if (APPEALS[q]) return { key: q, ...APPEALS[q] };
  for (const [kw, key] of KEYWORDS) {
    if (q === kw || q.includes(kw)) return { key, ...APPEALS[key] };
  }
  return null;
}

/** Render one platform's appeal as WhatsApp text. */
function render(info) {
  if (!info) return null;
  const lines = [
    `\ud83d\udcee *${info.name}\u2014 Ban Appeal*`,
    '',
    '📋 *Steps:*',
    ...info.steps.map((s, i) => `${i + 1}. ${s}`),
  ];
  if (info.email) lines.push('', `✉️ *Email:* ${info.email}`);
  if (info.url) lines.push(`🔗 *Link:* ${info.url}`);
  if (info.note) lines.push('', `ℹ️ ${info.note}`);
  lines.push('', `_${config.BOT_NAME}\u2014 The appeal is made myself, but no one's account can be returned._`);
  return lines.join('\n');
}

/** List every platform we have an appeal route for. */
function listAll() {
  return Object.keys(APPEALS).map((k) => APPEALS[k].name).join(', ');
}

module.exports = { APPEALS, lookup, render, listAll };
