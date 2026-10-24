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
  dad: ['👨', 'tumhara *BAAP* hy! 😎'],
  abba: ['👨', 'tumhara *ABBA* hy! 😎'],
  mom: ['👩', 'tumhari *AMMI* hy! 🥰'],
  ammi: ['👩', 'tumhari *AMMI* hy! 🥰'],
  son: ['👦', 'tumhara *BETA* hy! 😄'],
  daughter: ['👧', 'tumhari *BETI* hy! 🌸'],
  boyfriend: ['💑', 'tumhara *BOYFRIEND* hy! 😍'],
  girlfriend: ['💏', 'tumhari *GIRLFRIEND* hy! 🥰'],
  twin: ['👯', 'tumhara *JUDAWA* hy! 😲'],
  partner: ['🤝', 'tumhara *PARTNER* hy! 💪'],
  bodyguard: ['🛡️', 'your *BODYGUARD* is! \ud83e\udd77'],
  boss: ['💼', 'tumhara *BOSS* hy! 😎'],
  employee: ['🧑‍💼', 'your *EMPLOYEE* is! \ud83d\udccb'],
  pet: ['🐾', 'tumhara *PALTOO* hy! 🐶'],
  servant: ['🧹', 'tumhara *NAUKAR* hy! 😅'],
  idol: ['🌟', 'tumhara *IDOL* hy! 🤩'],
  fan: ['📣', 'tumhara *FAN* hy! 🥳'],
  ghost: ['👻', 'tumhara *BHOOT* hy! 😱'],
  angel: ['😇', 'tumhara *FARISHTA* hy! ✨'],
  devil: ['😈', 'tumhara *SHAITAN* hy! 🔥'],
  king: ['👑', 'tumhara *KING* hy! 🤴'],
  queen: ['👸', 'tumhari *QUEEN* hy! 💃'],
  slave: ['⛓️', 'your *slave* is! \ud83d\ude06'],
  master: ['🧙', 'tumhara *MASTER* hy! 🔮'],
  rich: ['💰', 'tumhara *AMEER* dost hy! 🤑'],
  poor: ['🪙', 'tumhara *GAREEB* dost hy! 😢'],
  bhai: ['🤝', 'tumhara *BHAI* hy! 💪'],
  bahan: ['👧', 'tumhari *BEHN* hy! 🌸'],
  wife: ['👰', 'tumhari *BIWI* hy! 💍'],
  husband: ['🤵', 'tumhara *SHOHAR* hy! 💍'],
  chacha: ['🧔', 'tumhara *CHACHA* hy! 😎'],
  chachi: ['👩', 'tumhari *CHACHI* hy! 😄'],
  nana: ['👴', 'tumhara *NANA* hy! 👑'],
  nani: ['👵', 'tumhari *NANI* hy! 🥰'],
  mama: ['🧑', 'tumhara *MAMA* hy! 😁'],
  mami: ['👩', 'tumhari *MAMI* hy! 😊'],
  bestfriend: ['🫂', 'tumhara *BEST FRIEND* hy! 💯'],
  enemy: ['⚔️', 'your *enemy* is! \ud83d\ude20'],
  crush: ['💘', 'tumhara *CRUSH* hy! 😳'],
  teacher: ['👨‍🏫', 'your *USTAD* is! \ud83d\udcda'],
  student: ['🎒', 'tumhara *STUDENT* hy! ✏️'],
  rival: ['🥊', 'tumhara *RIVAL* hy! 🔥'],
  runmureed: ['🕋', 'tumhara *ROOHANI MUREED* hy! 🤲'],
  cosplay: ['🎭', 'tumhara *COSPLAY* partner hy! ✨'],
  seth: ['🏦', 'tumhara *SETH* hy! 💸'],
  ustad: ['🎓', 'tumhara *USTAD* hy! 🧠'],
  malik: ['👑', 'tumhara *MALIK* hy! 😼'],
  dost: ['🫂', 'tumhara *DOST* hy! 😄'],
  yaar: ['🤙', 'tumhara *YAAR* hy! 😎'],
  cousin: ['🧑‍🤝‍🧑', 'your *cousin* is! \ud83d\ude01'],
  khala: ['👩', 'tumhari *KHALA* hy! 😊'],
  phuphi: ['👩', 'tumhari *PHUPHI* hy! 😄'],
  saas: ['👩‍🦳', 'your *saas* is! \ud83d\ude2c'],
  sasur: ['👨‍🦳', 'your *SASUR* is! \ud83d\ude05'],
  bhabhi: ['👩', 'tumhari *BHABHI* hy! 😍'],
  devar: ['🧑', 'tumhara *DEVAR* hy! 😜'],
  jeth: ['🧑', 'tumhara *JETH* hy! 😏'],
  classmate: ['🧑‍🎓', 'your *CLASSMATE* is! \ud83d\udcdd'],
  colleague: ['🧑‍💻', 'your *COLLEAGUE* is! \ud83d\udcbc'],
  neighbor: ['🏠', 'tumhara *PADOSI* hy! 👋'],
  player: ['🎮', 'tumhara *PLAYER* hy! 🕹️'],
  coach: ['📣', 'tumhara *COACH* hy! 🏋️'],
  doctor: ['🩺', 'tumhara *DOCTOR* hy! 💊'],
  lawyer: ['⚖️', 'your *WAKEEL* is! \ud83d\udcdc'],
  police: ['👮', 'tumhara *POLICE* hy! 🚨'],
  soldier: ['🪖', 'tumhara *SOLDIER* hy! 🎖️'],
  pilot: ['✈️', 'your *PILOT* is! \ud83d\udeeb'],
  chef: ['👨‍🍳', 'your *CHEF* is! \ud83c\udf73'],
  driver: ['🚗', 'tumhara *DRIVER* hy! 🛞'],
  guard: ['💂', 'tumhara *GUARD* hy! 🛡️'],
  alien: ['👽', 'tumhara *ALIEN* hy! 🛸'],
  superhero: ['🦸', 'tumhara *SUPERHERO* hy! 💥'],
  villain: ['🦹', 'tumhara *VILLAIN* hy! 😈'],
  prince: ['🤴', 'tumhara *PRINCE* hy! 👑'],
  princess: ['👸', 'tumhari *PRINCESS* hy! 🎀'],
  baba: ['🧔', 'tumhara *BABA* hy! 🙏'],
  maa: ['👩', 'tumhari *MAA* hy! ❤️'],
  bhaiya: ['🧑', 'tumhara *BHAIYA* hy! 💪'],
  didi: ['👩', 'tumhari *DIDI* hy! 🌸'],
  pota: ['👦', 'tumhara *POTA* hy! 😄'],
  poti: ['👧', 'tumhari *POTI* hy! 🎀'],
  naukar: ['🧹', 'tumhara *NAUKAR* hy! 😅'],
  mureed: ['🤲', 'tumhara *MUREED* hy! 🕋'],
  murshid: ['🧙', 'tumhara *MURSHID* hy! 🔮'],
  shagird: ['🎓', 'tumhara *SHAGIRD* hy! 📖'],
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
  dil: ['❤️', 'DIL size'],
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
  '\ud83e\udd21 @x\'s head *khali* hy, only hawa! \ud83d\udca8',
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
