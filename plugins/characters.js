/**
 * CHARACTERS — role/character commands + DP commands + rating commands
 * --------------------------------------------------------------------
 * Fixes:
 *  - mentions now use the *resolved* JID (LID → real number). No more fake
 *    numbers like `+212223345675336` leaking into mentions.
 *  - `.fool` now marks the *target* (the person you reply to / tag) as the fool,
 *    never the sender.
 *  - expanded role + rating + fun command set.
 */
const config = require('../config');
const { getJSON, pick, randInt, targetOf } = require('../lib/helpers');
const contacts = require('../lib/contacts');

// role -> [emoji, line]
const ROLES = {
  dad: ['👨', 'You are the *BAAP*! 😎'],
  abba: ['👨', 'You are the *ABBA*! 😎'],
  mom: ['👩', 'You are the *AMMI*! 🥰'],
  ammi: ['👩', 'You are the *AMMI*! 🥰'],
  son: ['👦', 'You are the *BETA*! 😄'],
  daughter: ['👧', 'You are the *BETI*! 🌸'],
  boyfriend: ['💑', 'You are the *BOYFRIEND*! 😍'],
  girlfriend: ['💏', 'You are the *GIRLFRIEND*! 🥰'],
  twin: ['👯', 'You are the *JUDAWA*! 😲'],
  partner: ['🤝', 'You are the *PARTNER*! 💪'],
  bodyguard: ['🛡️', 'your *BODYGUARD* is! \ud83e\udd77'],
  boss: ['💼', 'You are the *BOSS*! 😎'],
  employee: ['🧑‍💼', 'your *EMPLOYEE* is! \ud83d\udccb'],
  pet: ['🐾', 'You are the *PALTOO*! 🐶'],
  servant: ['🧹', 'You are the *NAUKAR*! 😅'],
  idol: ['🌟', 'You are the *IDOL*! 🤩'],
  fan: ['📣', 'You are the *FAN*! 🥳'],
  ghost: ['👻', 'You are the *BHOOT*! 😱'],
  angel: ['😇', 'You are the *FARISHTA*! ✨'],
  devil: ['😈', 'You are the *SHAITAN*! 🔥'],
  king: ['👑', 'You are the *KING*! 🤴'],
  queen: ['👸', 'You are the *QUEEN*! 💃'],
  slave: ['⛓️', 'your *slave* is! \ud83d\ude06'],
  master: ['🧙', 'You are the *MASTER*! 🔮'],
  rich: ['💰', 'you are the *RICH* friend! 🤑'],
  poor: ['🪙', 'you are the *POOR* friend! 😢'],
  bhai: ['🤝', 'You are the *BROTHER*! 💪'],
  bahan: ['👧', 'You are the *BEHN*! 🌸'],
  wife: ['👰', 'You are the *BIWI*! 💍'],
  husband: ['🤵', 'You are the *SHOHAR*! 💍'],
  chacha: ['🧔', 'You are the *CHACHA*! 😎'],
  chachi: ['👩', 'You are the *CHACHI*! 😄'],
  nana: ['👴', 'You are the *NANA*! 👑'],
  nani: ['👵', 'You are the *NANI*! 🥰'],
  mama: ['🧑', 'You are the *MAMA*! 😁'],
  mami: ['👩', 'You are the *MAMI*! 😊'],
  bestfriend: ['🫂', 'You are the *BEST FRIEND*! 💯'],
  enemy: ['⚔️', 'your *enemy* is! \ud83d\ude20'],
  crush: ['💘', 'You are the *CRUSH*! 😳'],
  teacher: ['👨‍🏫', 'your *USTAD* is! \ud83d\udcda'],
  student: ['🎒', 'You are the *STUDENT*! ✏️'],
  rival: ['🥊', 'You are the *RIVAL*! 🔥'],
  runmureed: ['🕋', 'You are the *ROOHANI MUREED*! 🤲'],
  cosplay: ['🎭', 'you are the *COSPLAY* partner! ✨'],
  seth: ['🏦', 'You are the *SETH*! 💸'],
  ustad: ['🎓', 'You are the *USTAD*! 🧠'],
  malik: ['👑', 'You are the *MALIK*! 😼'],
  dost: ['🫂', 'You are the *DOST*! 😄'],
  yaar: ['🤙', 'You are the *BESTIE*! 😎'],
  cousin: ['🧑‍🤝‍🧑', 'your *cousin* is! \ud83d\ude01'],
  khala: ['👩', 'You are the *KHALA*! 😊'],
  phuphi: ['👩', 'You are the *PHUPHI*! 😄'],
  saas: ['👩‍🦳', 'your *saas* is! \ud83d\ude2c'],
  sasur: ['👨‍🦳', 'your *SASUR* is! \ud83d\ude05'],
  bhabhi: ['👩', 'You are the *BHABHI*! 😍'],
  devar: ['🧑', 'You are the *DEVAR*! 😜'],
  jeth: ['🧑', 'You are the *JETH*! 😏'],
  classmate: ['🧑‍🎓', 'your *CLASSMATE* is! \ud83d\udcdd'],
  colleague: ['🧑‍💻', 'your *COLLEAGUE* is! \ud83d\udcbc'],
  neighbor: ['🏠', 'You are the *PADOSI*! 👋'],
  player: ['🎮', 'You are the *PLAYER*! 🕹️'],
  coach: ['📣', 'You are the *COACH*! 🏋️'],
  doctor: ['🩺', 'You are the *DOCTOR*! 💊'],
  lawyer: ['⚖️', 'your *WAKEEL* is! \ud83d\udcdc'],
  police: ['👮', 'You are the *POLICE*! 🚨'],
  soldier: ['🪖', 'You are the *SOLDIER*! 🎖️'],
  pilot: ['✈️', 'your *PILOT* is! \ud83d\udeeb'],
  chef: ['👨‍🍳', 'your *CHEF* is! \ud83c\udf73'],
  driver: ['🚗', 'You are the *DRIVER*! 🛞'],
  guard: ['💂', 'You are the *GUARD*! 🛡️'],
  alien: ['👽', 'You are the *ALIEN*! 🛸'],
  superhero: ['🦸', 'You are the *SUPERHERO*! 💥'],
  villain: ['🦹', 'You are the *VILLAIN*! 😈'],
  prince: ['🤴', 'You are the *PRINCE*! 👑'],
  princess: ['👸', 'You are the *PRINCESS*! 🎀'],
  baba: ['🧔', 'You are the *BABA*! 🙏'],
  maa: ['👩', 'You are the *MAA*! ❤️'],
  bhaiya: ['🧑', 'You are the *BHAIYA*! 💪'],
  didi: ['👩', 'You are the *DIDI*! 🌸'],
  pota: ['👦', 'You are the *POTA*! 😄'],
  poti: ['👧', 'You are the *POTI*! 🎀'],
  naukar: ['🧹', 'You are the *NAUKAR*! 😅'],
  mureed: ['🤲', 'You are the *MUREED*! 🕋'],
  murshid: ['🧙', 'You are the *MURSHID*! 🔮'],
  shagird: ['🎓', 'You are the *SHAGIRD*! 📖'],
};

// rating-style commands -> [emoji, label]
const RATINGS = {
  chad: ['🗿', 'CHAD level'],
  npc: ['🤖', 'NPC energy'],
  maincharacter: ['🌟', 'Main Character energy'],
  delulu: ['🫠', 'DELULU level'],
  redflag: ['🚩', 'RED FLAG count'],
  greenflag: ['💚', 'GREEN FLAG count'],
  simp: ['🥺', 'SIMP level'],
  vibe: ['🎶', 'VIBE level'],
  muth: ['🤣', 'MUTH level'],
  cake: ['🎂', 'CAKE level'],
  pickup: ['😏', 'PICKUP line skill'],
  tecnologia: ['💻', 'TECH knowledge'],
  taroun: ['🔮', 'TAROT luck'],
  horoscope: ['♈', 'Horoscope luck'],
  swag: ['😼', 'SWAG level'],
  gareeb: ['🪙', 'GAREEBI level'],
  ameer: ['💰', 'AMEERI level'],
  handsome: ['😍', 'HANDSOME score'],
  cute: ['🥰', 'CUTENESS score'],
  dumb: ['🥴', 'DUMBNESS level'],
  lucky: ['🍀', 'LUCK level'],
  unlucky: ['☔', 'BAD-LUCK level'],
  loyal: ['🤝', 'LOYALTY level'],
  flirty: ['😉', 'FLIRT level'],
  funny: ['😂', 'COMEDY level'],
  boring: ['😴', 'BORING level'],
  attitude: ['😤', 'ATTITUDE level'],
  dil: ['❤️', 'HEART size'],
  dimagh: ['🧠', 'DIMAGH level'],
  shakal: ['🪞', 'SHAKAL score'],
  style: ['🕶️', 'STYLE score'],
  game: ['🎮', 'GAME level'],
  naach: ['💃', 'DANCE skill'],
  gana: ['🎤', 'SINGING skill'],
  comedy: ['🎭', 'COMEDY skill'],
  fight: ['🥊', 'FIGHT skill'],
  bhag: ['🏃', 'RUNNING speed'],
  neend: ['😴', 'SLEEP score'],
  bhukh: ['🍔', 'HUNGER level'],
  pyar: ['💞', 'PYAR level'],
  nafrat: ['💔', 'NAFRAT level'],
  iman: ['🕋', 'IMAN level'],
  gunah: ['😈', 'GUNAH count'],
  sawab: ['✨', 'SAWAB count'],
  qismat: ['🎰', 'QISMAT score'],
  body: ['💪', 'BODY level'],
  height: ['📏', 'HEIGHT score'],
  iq: ['🧠', 'IQ level'],
  eq: ['💗', 'EQ level'],
  bank: ['🏦', 'BANK balance'],
  followers: ['👥', 'FOLLOWERS count'],
  rizz2: ['🔥', 'ULTRA RIZZ'],
};

// dedicated fool lines (the TARGET is the fool)
const FOOL_LINES = [
  '🤡 @x *PAGAL* nikla! 😂',
  '\ud83e\udd21 @x\'s brain has been eaten by *grass*! \ud83c\udf3f',
  '\ud83e\udd21 @x the world\'s *No.1 PAGAL* is! \ud83c\udfc6',
  '\ud83e\udd21 @x looked in the mirror and the mirror *broke*! \ud83e\ude9e\ud83d\udca5',
  '\ud83e\udd21 @x\'s wisdom is singing on *chhutti*! \ud83c\udfd6\ufe0f',
  '\ud83e\udd21 @x has been declared *PAGAL*! \ud83d\udce2',
  '\ud83e\udd21 @x\'s head is *empty*, just air! \ud83d\udca8',
  '\ud83e\udd21 @x *PAGLON*\'s leader is! \ud83d\udc51\ud83e\udd2a',
  '\ud83e\udd21 There is no one more *bewaqoof* than @x! \ud83d\ude43',
  '\ud83e\udd21 @x\'s IQ is *minus* me is! \ud83d\udcc9',
  '\ud83e\udd21 @x is a VIP member of the *mental* hospital! \ud83c\udfe5',
  '\ud83e\udd21 @x was fed *mad* food! \ud83c\udf7d\ufe0f\ud83e\udd2a',
  '\ud83e\udd21 @x\'s brain *Windows 95* is crazy! \ud83d\udda5\ufe0f',
  '\ud83e\udd21 @x *PAGAL*, and he is proud of it! \ud83e\udd21\ud83e\udd21',
  '\ud83e\udd21 @x\'s *Akal* has resigned! \ud83d\udcc4',
  '\ud83e\udd21 Even the *mad* laughed after seeing @x! ???',
];

async function nekoImg(cat) {
  const r = await getJSON(`https://nekos.best/api/v2/${cat}`);
  return r?.results?.[0]?.url || null;
}

/** FNV-1a hash → stable number (so the same person always gets the same score). */
function hashNum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic score 1–100 for (target, command). */
function scoreFor(num, cmd) {
  return (hashNum(`${cmd}:${num}`) % 100) + 1;
}

const handler = async (ctx) => {
  const { command, reply } = ctx;

  // Resolve the target: replied-to person → @mention → phone-number arg.
  const target = targetOf(ctx);
  // `target.tag` is name-safe: an unresolved LID prints the display name
  // instead of digits that WhatsApp would render against the wrong contact.
  const tag = target ? target.tag : null;
  const mentions = target ? [target.jid] : [];

  // ---- .fool — the TARGET is the fool (never the sender) ----
  if (command === 'fool' || command === 'pagal' || command === 'bewaqoof') {
    if (!target) {
      return reply('\ud83e\udd21 Who is the *MAG* banana? *Reply* or *@tag* our message.');
    }
    const line = pick(FOOL_LINES).replace('@x', tag);
    return ctx.send(ctx.from, { text: line, mentions }, { quoted: ctx.m });
  }

  // ---- role commands ----
  if (ROLES[command]) {
    if (!target) {
      return reply(`\ud83e\udd14 Who? Reply to their message or *@tag* them, then \`${config.PREFIX}${command}\` send it.`);
    }
    const [emoji, line] = ROLES[command];
    return ctx.send(ctx.from, { text: `${emoji} ${tag} ${line}`, mentions }, { quoted: ctx.m });
  }

  // ---- rating commands (deterministic per person) ----
  if (RATINGS[command]) {
    const [emoji, label] = RATINGS[command];
    const who = target ? target.num : ctx.senderNum;
    const whoTag = target ? tag : `@${contacts.displayNum(ctx.senderNum)}`;
    const whoMentions = target ? mentions : [`${contacts.resolve(ctx.sender)}`];
    const pct = scoreFor(who, command);
    const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
    return ctx.send(ctx.from, {
      text: `${emoji} *${label}* for ${whoTag}\n${bar} *${pct}%*`,
      mentions: whoMentions,
    }, { quoted: ctx.m });
  }

  // ---- DP commands (boydp1..22 / girldp1..22) ----
  if (/^(boy|girl)dp\d+$/.test(command)) {
    const isGirl = command.startsWith('girl');
    try {
      const url = await nekoImg(isGirl ? 'waifu' : 'husbando');
      if (!url) throw new Error('no img');
      await ctx.send(ctx.from, { image: { url }, caption: `${isGirl ? '👧' : '👦'} *${command}* DP\n👑 ${config.BOT_NAME}` }, { quoted: ctx.m });
    } catch { await reply('\u274c DP not found, try again.'); }
    return;
  }

  await reply('❓ Unknown character command');
};

const commands = [
  ...Object.keys(ROLES), ...Object.keys(RATINGS),
  'fool', 'pagal', 'bewaqoof',
  ...Array.from({ length: 22 }, (_, i) => `boydp${i + 1}`),
  ...Array.from({ length: 22 }, (_, i) => `girldp${i + 1}`),
];

module.exports = { commands, category: '🎎 CHARACTERS', handler };
