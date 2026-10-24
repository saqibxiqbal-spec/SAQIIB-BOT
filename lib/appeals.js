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
      'Open WhatsApp → Settings → Help → Contact us',
      'Or email us at support@whatsapp.com',
      'Subject: "My account was banned by mistake"',
      'Your number with country code (for example +92...)',
      'State the reason: this is a real number and nobody spammed from it.',
    ],
    note: 'WhatsApp review takes 24-48 hours. The in-app form is usually faster.',
  },
  whatsapp_business: {
    name: 'WhatsApp Business',
    email: 'smb_web@support.whatsapp.com',
    url: 'https://www.whatsapp.com/contact/?subject=messenger',
    steps: [
      'Appeal a banned business account at business.whatsapp.com.',
      'Email: smb_web@support.whatsapp.com',
      'Attach your business verification documents',
    ],
    note: 'Business appeals are handled by a separate team \u2014 not through normal support.',
  },
  instagram: {
    name: 'Instagram',
    email: '',
    url: 'https://help.instagram.com/contact/606967319425038',
    steps: [
      'On the login screen tap "Need more help?"',
      'Fill in the appeal form \u2014 give your username and email',
      'Or go to Settings \u2192 Help \u2192 Report a problem',
      'A photo ID is required, and the original ID must be sent.',
    ],
    note: 'Instagram only accepts the form, not email. Replies usually arrive within a day.',
  },
  facebook: {
    name: 'Facebook',
    email: 'disabled@fb.com',
    url: 'https://www.facebook.com/help/contact/260749603972907',
    steps: [
      'Appeal by logging in at facebook.com/support',
      'Or send email to disabled@fb.com',
      'Subject: "Appeal for disabled account"',
      'Attach photo of original ID',
    ],
    note: 'Appeals are rejected without an ID \u2014 upload a photo of it.',
  },
  telegram: {
    name: 'Telegram',
    email: 'recover@telegram.org',
    url: 'https://telegram.org/faq#q-my-account-was-limited-or-banned',
    steps: [
      'Email me at recover@telegram.org',
      'Your phone number with country code (for example +92...)',
      'Attach a screenshot of the limitation/ban notice',
      'Subject: "Account limitation appeal"',
    ],
    note: 'spam@telegram.org is a separate address for Telegram bots.',
  },
  tiktok: {
    name: 'TikTok',
    email: '',
    url: 'https://www.tiktok.com/legal/report/appeal',
    steps: [
      'Try logging in to the app \u2013 an appeal button will appear.',
      'Or go to tiktok.com/legal/report/appeal',
      'Give your username and registered email',
    ],
    note: 'TikTok only accepts the in-app form.',
  },
  twitter: {
    name: 'X (Twitter)',
    email: '',
    url: 'https://help.twitter.com/forms/restricted',
    steps: [
      'Open help.twitter.com/forms/restricted',
      'Fill in the suspended-account appeal form',
      'Give your @username',
    ],
    note: 'They do not answer email \u2014 only the form works.',
  },
  youtube: {
    name: 'YouTube',
    email: '',
    url: 'https://support.google.com/youtube/contact/account_appeal',
    steps: [
      'support.google.com/youtube → account appeal',
      'Give your channel URL',
      'Explain that your videos do not break the rules',
    ],
    note: 'For a banned Google account, appeal at accounts.google.com.',
  },
  discord: {
    name: 'Discord',
    email: 'support@discord.com',
    url: 'https://dis.gd/contact',
    steps: [
      'Fill in the appeal form at dis.gd/contact',
      'Or email support@discord.com',
      'Give your User ID (Settings \u2192 Advanced \u2192 Developer Mode)',
    ],
    note: 'Account bans become permanent after 30 days \u2013 act quickly.',
  },
  gmail: {
    name: 'Gmail / Google Account',
    email: '',
    url: 'https://support.google.com/accounts/contact/disabled2',
    steps: [
      'support.google.com/accounts → disabled account appeal',
      'Verify recovery through your email or phone.',
      'Describe your situation in the form',
    ],
    note: 'Google uses forms, not direct email.',
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
    `\ud83d\udcee *${info.name} \u2014 Ban Appeal*`,
    '',
    '📋 *Steps:*',
    ...info.steps.map((s, i) => `${i + 1}. ${s}`),
  ];
  if (info.email) lines.push('', `✉️ *Email:* ${info.email}`);
  if (info.url) lines.push(`🔗 *Link:* ${info.url}`);
  if (info.note) lines.push('', `ℹ️ ${info.note}`);
  lines.push('', `_${config.BOT_NAME} \u2014 Send the appeal yourself; no one can guarantee the account is restored._`);
  return lines.join('\n');
}

/** List every platform we have an appeal route for. */
function listAll() {
  return Object.keys(APPEALS).map((k) => APPEALS[k].name).join(', ');
}


/**
 * Build a ready-to-send appeal EMAIL for a platform.
 * Requirement: `.unban21 whatsapp` must hand the user a complete email they can
 * copy, paste and send \u2014 subject + body + the right address.
 *
 * @param {object} info  result of lookup()
 * @param {object} opts  { number, name, reason }
 * @returns {string} WhatsApp-formatted text
 */
function buildEmail(info, opts = {}) {
  if (!info) return null;
  const num = String(opts.number || '').replace(/[^0-9]/g, '');
  const name = String(opts.name || '').trim() || 'the account holder';
  const reason = String(opts.reason || '').trim() || 'I believe this was a mistake. My account was restricted without any violation of the Terms of Service on my part.';

  const subject = `Account recovery appeal${num ? ` \u2014 +${num}` : ''}`;
  const body = [
    `Dear ${info.name} Support Team,`,
    '',
    `My name is ${name} and I am writing to appeal the restriction placed on my ${info.name} account${num ? ` linked to the phone number +${num}` : ''}.`,
    '',
    reason,
    '',
    'I have always followed the community guidelines and I have never used automation, spam or any unauthorised third-party software on this account. The account is important to me because it holds years of personal messages, photos and contacts.',
    '',
    'I kindly request a manual review of my case. I am happy to provide any identity verification you require.',
    '',
    'Thank you for your time and consideration.',
    '',
    'Kind regards,',
    name,
    num ? `+${num}` : '',
  ].filter((l) => l !== null && l !== undefined).join('\n');

  const lines = [
    `\ud83d\udce7 *${info.name} \u2014 Unban Email (ready to send)*`,
    '',
    `\ud83d\udcec *To:* ${info.email || '(no public email \u2014 use the appeal form below)'}`,
    `\ud83d\udcdd *Subject:* ${subject}`,
    '',
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
    body,
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
    '',
    '\ud83d\udc49 *Copy the text above and send it as-is.*',
  ];
  if (info.url) lines.push(`\ud83d\udd17 *If email fails, use the form:* ${info.url}`);
  if (info.note) lines.push(`\u2139\ufe0f ${info.note}`);
  lines.push('', `_${config.BOT_NAME} \u2014 Send it yourself; no one can guarantee the account is restored._`);
  return lines.join('\n');
}

module.exports = { APPEALS, lookup, render, buildEmail, listAll };
