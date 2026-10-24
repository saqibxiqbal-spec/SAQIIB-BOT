/**
 * FUN — text-based fun commands (offline, always work)
 * (reaction commands live in reactions.js; roles in characters.js)
 */
const config = require('../config');
const { pick, randInt, targetOf } = require('../lib/helpers');
const interactions = require('../lib/interactions');

// ---------------------------------------------------------------------------
// ROASTS — 90+ lines
// ---------------------------------------------------------------------------
const ROASTS = [
  'I was also thinking like you that I want to try in life... then I stopped thinking. ???',
  'The WiFi signal is also stronger than yours. \ud83d\udcf6',
  'My camera resigned after seeing your profile photo. \ud83d\udcf8',
  'Because you are so slow, even the snail says, "Brother, you will win the race." \ud83d\udc0c',
  'You needed brain, you took WiFi router. \ud83e\udde0',
  'He also wore glasses to look at your face in the mirror. \ud83e\ude9e',
  'Google should also search your name to "did you mean: mistake"? \ud83d\udd0d',
  'You are so boring, your shadow also runs away from your door. \ud83c\udf11',
  'The password of your personality is "1234" - anyone can guess it. \ud83d\udd13',
  'After talking to you, I feel that silence is also a gift. \ud83e\udd10',
  'Only you laugh at your jokes \u2013 and that too out of necessity. \ud83d\ude05',
  'You are so late, your "time" should also be calendared. \ud83d\udcc5',
  'Your brain is always in airplane mode. \u2708\ufe0f',
  'It seems to you that "Ctrl+Z" was what happened in life. \u2328\ufe0f',
  'Your thought data plan seems to have been exhausted. \ud83d\udcf5',
  'You are so weak that even your WiFi doesn\'t detect you. \ud83d\udce1',
  'Seeing your smile, the bulb also said, "It seems that the main is off." \ud83d\udca1',
  'Your phone charger is more interesting than you. \ud83d\udd0c',
  'The autotune of the sun inside you may also become unique. \ud83c\udfa4',
  'You are such an unlucky black cat that you are looking for the right path. \ud83d\udc08\u2b1b',
  'Your talent is so great that it is "online". \ud83d\udfe2',
  'Seeing your typing speed the keyboard wrote a suicide note. \u2328\ufe0f',
  'Asked you why you made a career out of "not knowing". \ud83e\udd37',
  'Seeing your energy, even the sloth said, "Brother, relax." \ud83e\udda5',
  'You are so simple that your bio is also blank. \ud83d\udcc4',
  'The front camera became camera-shy after seeing your selfie. \ud83e\udd33',
  'You are too excited to hear your notification sound. \ud83d\udd14',
  'Tumhara humor "404 not found". \ud83d\udeab',
  'You are so late, your birthday is also late. \ud83c\udf82',
  'Seeing your knowledge, Wikipedia added "citation needed". \ud83d\udcda',
  'After talking to you ChatGPT also said "I am still retired". \ud83e\udd16',
  'Seeing your speed, the internet started dialing up. \u260e\ufe0f',
  'You are so confusing that even GPS is searching for you. \ud83d\uddfa\ufe0f',
  'Your confidence and your talent \u2014 both are moving in opposite directions. \ud83e\udded',
  'It seems to you that the "mute" button is the best invention of life. \ud83d\udd07',
  'I have been seeing your planning for a long time. \ud83d\uddd3\ufe0f',
  'You are so slow, your buffering has also gone ahead of you. \u23f3',
  'Your style is stuck in "2010". \ud83d\udd70\ufe0f',
  'You are too deep into your WhatsApp "typing..." indicator. \ud83d\udcac',
  'The basis of your arguments is "because I said". \ud83e\uddf1',
  'You are so predictable that even your horoscope becomes boring. \u2648',
  'The controller resigned after seeing your game. \ud83c\udfae',
  'After talking to you it seems that even the "block" button has blocked you. \u26d4',
  'Seeing your memory, the goldfish also said, "Brother, you have lost your mind." \ud83d\udc20',
  'You are so lazy, even your shadow works for you. \ud83d\ude34',
  'Your IQ and your shoe size \u2014 guess which one you are. \ud83d\udc5f',
  'You are more interesting than your "last seen" is. \ud83d\udc40',
  'The laugh track on your jokes also felt like force. \ud83c\udfac',
  'You are so average, your name is also "Average". \ud83d\udcca',
  'The crystal ball of seeing your future also broke. \ud83d\udd2e',
  'You got the message "error 404: personality not found". \ud83e\udde9',
  'Seeing your speed the tortoise broke the record. \ud83d\udc22',
  'Your swag is not "swag", it is "swag-off". \ud83d\udd15',
  'You are so boring that I keep listening to your echoes. \ud83d\udca4',
  'Einstein quit maths after seeing your logic. \u2797',
  'You have more charisma than your ringtone. \ud83d\udcde',
  'Your brain is always in "low battery" mode. \ud83d\udd0b',
  'The DJ played music in your room. \ud83c\udfa7',
  'You are so slow, your "now coming" means "good life". \ud83d\udeb6',
  'Your attitude and your result \u2014 both are mismatch. \ud83d\udcc9',
  'Talking to you feels like "airplane mode" is best feature. \u2708\ufe0f',
  'The best filter of your selfie is "off". \ud83d\udeab',
  'You are so unlucky that your lucky number is also 13. \ud83c\udf40',
  'Your humor is better than "dad joke". \ud83d\udc68',
  'Your phone\'s wallpaper is more interesting than you. \ud83d\uddbc\ufe0f',
  '\u201cSpontaneous\u201d also got confused after seeing your planning. \ud83e\udd14',
  'It\'s so simple that your password is "password". \ud83d\udd11',
  'Seeing your game face, even the poker table got eaten. \ud83c\udccf',
  'After talking to you it seems that "do not disturb" should always be on. \ud83d\udd15',
  'Seeing your speed, 2G also says "Brother, you are slow". \ud83d\udcf6',
  'Seeing your style the fashion police registered a case. \ud83d\udc6e',
  'You are so late that even your alarm goes off before you. \u23f0',
  'Seeing your knowledge, Google wrote "I give up". \ud83d\udd0d',
  'You are too deep to have "seen" the message. \ud83d\udc41\ufe0f',
  'Even the mirror should blush after seeing your confidence. \ud83e\ude9e',
  'You are so boring that even your WiFi gets disconnected from you. \ud83d\udd0c',
  'Your jokes just on cricket commentary were energetic. \ud83c\udfcf',
  'Your talent of "making excuses" is world-class. \ud83c\udfc6',
  'You feel like the "unfriend" button has hit you. \ud83d\udc4b',
  'The bullet train did not brake after seeing your speed. \ud83d\ude84',
  'You are so confusing that your GPS is also stuck in "recalculating". \ud83e\udded',
  'Resign the weather forecast after seeing your mood swings. \ud83c\udf26\ufe0f',
  'You are more interesting than your "typing..."\'s dot-dot is. \u2328\ufe0f',
  'Seeing your memory, the elephant also said, "Brother, who are you?" \ud83d\udc18',
  'You are so average, your report card also says "meh". \ud83d\udccb',
  'Seeing your swag, "Swag" also changed its name. \u25aa\ufe0f',
  'Talking to you feels like "silent mode" is a blessing. \ud83e\udd2b',
  'The photographer sold the camera after seeing your selfie. \ud83d\udcf7',
  'You are so slow, your "coming" means "never". \ud83d\ude97',
  'Seeing your logic the calculator gave an error. \ud83e\uddee',
  'You have more charisma than your "away" status. \ud83d\udca4',
  'Even the echoes of the sun inside you refuse to "repeat". \ud83d\udd01',
  'You are so boring, your shadow should also form a separate group. \ud83d\udc65',
  'Your future is not bright, it is "low battery". \ud83d\udd06',
  'It seems to you that "mute all" should be the motto of life. \ud83d\udd07',
];

// ---------------------------------------------------------------------------
// Other fun banks
// ---------------------------------------------------------------------------
const COMPLIMENTS = [
  'You are the one whose arrival has brightened the vibe of the group.',
  'Smile to see, cheap sunblock is applied \u2600\ufe0f',
  'There is such a long list in your tariff because of the WhatsApp character limit.',
  'Seeing your energy, even Monday becomes weekend.',
  'You are the young one in the group \ud83c\udf1f',
];
const QUOTES = [
  'Work in such a way that your name gets written. \u2013 Anonymous',
  'Difficulties are found only by those who want to fight. \ud83c\udf31',
  'With patience the fruit is sweet, but the time lasts long. \u23f3',
  'That capital, relying on itself, never depreciates. motiv',
  'What seems small today, yesterday gave you strength. \ud83d\ude80',
];
const SHAYARI = [
  'By looking at the moon this mat society,\nWhat night have you eaten?\nHere is your message left. \ud83c\udf19',
  'My day starts with your name,\nAnd perfect for having "seen" you. \ud83d\udcac',
  'Stop for a moment in the fleeting phase of life,\nTake out a few moments for yourself to live. \ud83c\udf38',
  'My heart says that I will write to you,\nMy fingers have stopped on the keyboard. \u270d\ufe0f',
];
const JOKES = [
  'Doctor: No need to take tension. Patient: I am sharing it with the doctor, you want to take it. ???',
  'Teacher: Tomorrow\'s test. Student: I have been learning since yesterday. No mood today. \ud83d\ude05',
  'If you are sitting in front of WiFi then you will also be running on 5G speed. \ud83c\udf7d\ufe0f',
  'Wife: I don\'t like your behavior. Shohar: That\'s it, I don\'t want it either. \ud83d\ude06',
  'Interviewer: Your strength? Candidate: I don\'t get angry easily. Interviewer: Okay? Candidate: Yes, now ask me something else...\ud83d\ude24',
  'Pappu: I don\'t need it. Doctor: Count. Pappu: I said 1, 2, 3... and then I went like this. \ud83d\ude34',
  'Teacher: 2 and 2 how many? Student: 4. Teacher: Well done. Student: And 2 and 2? Teacher: That too 4. Student: Wah, what a coincidence! \ud83e\udd2f',
  'My bank account and my patience \u2014 both are exhausted at the same time. \ud83d\udcb8',
  'Mom: Please study. Me: I am doing it. Mummy: What? Main: Inspiration by watching reels. \ud83d\udcf1',
  'Friend: Have you joined the gym? Main: Yes. Friend: Result? Main: Now I sleep comfortably. \ud83c\udfcb\ufe0f',
  'Boss: Why are you late? Main:Traffic. Boss: Tomorrow? Main: Traffic season is going on. \ud83d\ude97',
  'My alarm and my determination \u2014 both go off in 5 minutes. \u23f0',
  'Doctor: Do exercise. Me: I do it daily. Doctor: What? Main: To open the fridge. \ud83e\uddca',
  'Teacher: Essay "My Cow". Student wrote: My sang... and main sang like this. \ud83d\udc04',
  'Auntie: When will you get married? Main: When my bank balance says \u201cyes\u201d. \ud83d\udc8d',
  'My diet plan: Morning healthy, lunch healthy, night...jo mile wo. \ud83c\udf55',
  'Friend: Who is your crush? Main: WiFi. Friend: Why? Main: Because connection is the strongest. \ud83d\udcf6',
  'Papa: Reduce the electricity bill. Main: Will you turn off the AC? Papa: No, take out your phone charger. \ud83d\udd0c',
  'My favorite exercise is "jumping to conclusions". \ud83e\udd38',
  'Teacher: Where is the homework? Me: At home. Teacher: Bring it. Me: I am at home, right. \ud83c\udfe0',
  'My saving secret: first spend, then...spend again. \ud83d\uded2',
  'Doctor: You need rest. Me: I rest 24 hours a day. Doctor: That\'s the problem. \ud83d\udecc',
  'My phone runs at 1% per 30 min, but my motivation is 100% per 30 sec. \ud83d\udd0b',
  'Friend: New year, new main. Main: Yes, same old me, new calendar. \ud83d\udcc5',
  'My personality and my WiFi \u2014 both appear "connected" but don\'t work. \ud83d\udce1',
  'Teacher: Why so late? Main: Sir, main came on time, everyone else came late. \ud83d\ude0a',
  'My life\'s motto: Start from tomorrow. And tomorrow also begins from yesterday. \ud83d\udd01',
  'Aunt: Son, eat something. Me: I am on a diet. Auntie: What will happen with one piece? Main: That thought took me so far. \ud83c\udf70',
  'My bank SMS: "Balance low". My reaction: "I know, and?" \ud83d\udce9',
  'Friend: Are you studying? Main: Yes. Friend: Where is the book? Main: Motivation me. \ud83d\udcda',
];
const FACTS = [
  'Octopus has 3 hearts \ud83d\udc19',
  'Shehad (honey) never gets spoiled \ud83c\udf6f',
  'Eiffel Tower was built only for 6 months \ud83c\udfdb\ufe0f',
  'Dolphin slept with one eye open \ud83d\udc2c',
  'The world\'s deepest peak K2 is in Pakistan\ud83c\udfd4\ufe0f',
  'Bees (madhumakhiyaan) make only 1 spoon of honey in your life.',
  'The human heart beats ~100,000 times a day \u2764\ufe0f',
  'The first step on the moon was made by Neil Armstrong in 1969.',
  'Electric light travels ~1 million times faster than lightning.',
  'Antarctica is the darkest desert in the world \ud83c\udfdc\ufe0f',
  'Aankh (eye) is capable of detecting 10 million colors \ud83d\udc41\ufe0f',
  'Banana is technically a berry.',
];
const G8 = ['Yes \u2705', 'No \u274c', 'never ever', 'Sure \ud83d\udcaf', 'Please ask me \ud83d\ude12', 'Is it possible?', 'My answer is: YES! \ud83d\udd25', 'Absolutely not \ud83d\ude0f', 'It is written in the stars... maybe \ud83c\udf1f'];
const DARES = [
  'Send your last photo to the group \ud83d\ude08',
  'Put your WhatsApp status "I am crazy" for 5 minutes \ud83d\ude02',
  'Write "Hello brother" to a stranger and take a screenshot \ud83d\ude06',
  'Send your voice note and sing the song \ud83c\udfa4',
  'Write "Hi" to your crush and tell the result \ud83d\ude33',
];
const TRUTHS = [
  'Who sent the most embarrassing message? \ud83d\udc40',
  'When did you last cry? \ud83d\ude05',
  'Tell me this secret which no one has known till now? \ud83e\udd2b',
  'What is the biggest mistake in life? \ud83d\ude2c',
  'Who are you most jealous of? \ud83d\ude0f',
];
const RIZZ = [
  'Are you on WiFi? Why does the connection seem so bad \ud83d\udcf6',
  'I searched on Google, found you here \ud83c\udf10',
  'Screenshot of your smile is the best photo in my gallery \ud83d\udcf8',
  'Are you a magnet? Why are you pulling me towards you \ud83e\uddf2',
  'Are you planning to drown in your eyes, try swimming first? \ud83c\udfca',
];
const MEMES = ['https://i.imgflip.com/30b1gx.jpg', 'https://i.imgflip.com/1bij.jpg', 'https://i.imgflip.com/26am.jpg', 'https://i.imgflip.com/1ur9b0.jpg'];
const EMOJIS = ['😀', '😂', '🥰', '😎', '🔥', '💯', '🎉', '🤩', '😇', '🤔', '😴', '🥳', '😭', '😱', '🤯'];

// Would You Rather bank (interactive)
const WYR = [
  { q: 'Be happy and stay alone', a: 'Paisa 💰', b: 'Rishtay ❤️' },
  { q: 'Always speak the truth', a: 'Sach 🗣️', b: 'Chup rehna 🤐' },
  { q: 'power of flight', a: 'Uddna 🕊️', b: 'Become invisible\ud83d\udc7b' },
  { q: 'forget everything', a: 'Bhoolna 🧠', b: 'Yaad rehna 📌' },
  { q: 'Only phone or only food', a: 'Phone 📱', b: 'Khaana 🍔' },
  { q: 'What are you doing Amir?', a: 'Amir 💸', b: 'Gareeb khush 😊' },
  { q: 'Time travel past', a: 'Past ⏪', b: 'Future ⏩' },
  { q: 'Hamesha late', a: 'Late 🐢', b: 'Hamesha pehle 🐇' },
  { q: 'Friend or money', a: 'Dost 🤝', b: 'Paisa 💰' },
  { q: 'sea or mountain', a: 'Samundar 🌊', b: 'Pahaad 🏔️' },
  { q: 'become famous alone', a: 'Famous 🌟', b: 'Normal khush 😌' },
  { q: 'Every day Monday', a: 'Monday 😩', b: 'Every day Friday \ud83d\udd25' },
];

// ---------------------------------------------------------------------------
// Deterministic aura (same user -> same score, so it feels "real")
// ---------------------------------------------------------------------------
function hashNum(str) {
  let h = 2166136261;
  for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function auraFor(num) {
  const h = hashNum(num || 'guest');
  const score = 1000 + (h % 9000); // 1000 - 9999
  const tiers = [
    { min: 9000, title: 'MYTHIC 👑', note: 'You are a legend brother! \ud83d\udd25' },
    { min: 7500, title: 'SIGMA 🗿', note: 'Aura maxed out! motiv' },
    { min: 6000, title: 'ALPHA 🦁', note: 'Solid aura, respect! \u25aa\ufe0f' },
    { min: 4500, title: 'BETA 🐺', note: 'What I want, and what I want, I have to do it.' },
    { min: 3000, title: 'GAMMA 🐣', note: 'A little grind is needed \ud83d\udcc8' },
    { min: 0, title: 'NPC 🤖', note: 'With Aura recharge\ud83d\ude05' },
  ];
  const tier = tiers.find((t) => score >= t.min);
  const bars = Math.max(1, Math.min(10, Math.round(score / 1000)));
  const bar = '█'.repeat(bars) + '░'.repeat(10 - bars);
  return { score, tier, bar };
}

const handler = async (ctx) => {
const contacts = require('../lib/contacts');
  const { command, reply, arg } = ctx;
  // Real target: replied-to user → @mention → number arg → else sender.
  // `targetOf` resolves LIDs to real numbers and returns the correct JID domain,
  // so mentions never render a fake number like +212223345675336.
  const target = targetOf(ctx);
  const tagNum = target ? target.num : ctx.senderNum;
  // Print-safe tag: unresolved LIDs show the person's name, never fake digits.
  const tag = target ? target.tag : `@${contacts.displayNum(ctx.senderNum)}`;
  const tagJid = target ? target.jid : contacts.resolve(ctx.sender);
  const mention = (txt) => ctx.send(ctx.from, { text: txt, mentions: [tagJid] }, { quoted: ctx.m });

  switch (command) {
    case 'roast': return mention(`${tag} 🔥 ${pick(ROASTS)}`);
    case 'compliment': return mention(`${tag} ${pick(COMPLIMENTS)}`);
    case 'quote': return reply(`💬 *Quote:*\n\n${pick(QUOTES)}`);
    case 'shayari': return reply(`🌹 *Shayari:*\n\n${pick(SHAYARI)}`);
    case 'joke': case 'bacha': return reply(`😂 ${pick(JOKES)}`);
    case 'fact': return reply(`🧠 *Fact:* ${pick(FACTS)}`);
    case 'emoji': return reply(`🎲 ${pick(EMOJIS)}`);
    case 'meme': return ctx.send(ctx.from, { image: { url: pick(MEMES) }, caption: `😂 *${config.BOT_NAME} Meme*` }, { quoted: ctx.m });
    case '8ball': return arg ? reply(`🎱 *${arg}*\n\n${pick(G8)}`) : reply('\u274c Question: .8ball will I pass?');
    case 'lovetest': case 'ship': {
      const [a, b] = arg.split(/,|&|vs|and/i).map((x) => x && x.trim()).filter(Boolean);
      if (!a || !b) return reply(`\u274c Do naam do. Example:${config.PREFIX}${command} Ali, Sana`);
      const pct = randInt(50, 100);
      const hearts = '❤️'.repeat(Math.ceil(pct / 20));
      return reply(`💕 *${a} 💘 ${b}*\n\n${hearts} *${pct}%*\n${pct > 80 ? 'Time to celebrate the wedding! 🎉' : 'A lovely pair, mashallah 😄'}`);
    }
    case 'shipname': {
      const [a, b] = arg.split(/,|&|vs|and/i).map((x) => x && x.trim()).filter(Boolean);
      if (!a || !b) return reply(`\u274c Do naam do. Example:${config.PREFIX}shipname Ali, Sana`);
      const name = (a.slice(0, Math.ceil(a.length / 2)) + b.slice(Math.floor(b.length / 2))).replace(/\s/g, '');
      return reply(`💞 *Ship Name:* ${name.charAt(0).toUpperCase() + name.slice(1)} 💘`);
    }
    case 'compatibility': {
      const [a, b] = arg.split(/,|&|vs|and/i).map((x) => x && x.trim()).filter(Boolean);
      if (!a || !b) return reply(`\u274c Do naam do. Example:${config.PREFIX}compatibility Ali, Sana`);
      const pct = randInt(30, 100);
      return reply(`🧩 *Compatibility: ${a} + ${b}*\n\n*${pct}%*\n${pct > 75 ? 'Perfect match! 💯' : 'A little effort is needed 😅'}`);
    }
    case 'aura': {
      const { score, tier, bar } = auraFor(tagNum);
      return mention(`${tag}\u2713 *AURA:${score}*\n${bar}\n\ud83c\udfc5 Rank: *${tier.title}*\n${tier.note}`);
    }
    case 'rate': case 'character': {
      const pct = (hashNum('rate' + tagNum) % 41) + 60; // 60-100, deterministic
      return mention(`${tag} \u2b50 *Rate: ${pct}/100*\n${pct > 85 ? 'Top class! \ud83c\udfc6' : pct > 70 ? 'Solid person \\ud83d\udcaf' : 'Keep trying harder \\ud83d\ude0e'}`);
    }
    case 'truth': return reply(`🕵️ *TRUTH:* ${pick(TRUTHS)}`);
    case 'dare': return reply(`😈 *DARE:* ${pick(DARES)}`);
    case 'wyr': {
      const w = pick(WYR);
      interactions.set(ctx.from, ctx.sender, 'choice', {
        options: [
          { result: () => `\u2705 You choose: *${w.a}*\n_${w.q} \u2014 interesting choice! \ud83d\ude0f_` },
          { result: () => `\u2705 You choose: *${w.b}*\n_${w.q} \u2014 nice pick! \ud83d\ude0e_` },
        ],
      });
      return reply(`\ud83e\udd14 *Would You Rather:*\n\n1\ufe0f\u20e3 ${w.a}\n2\ufe0f\u20e3 ${w.b}\n\n_Reply *1* or *2*!_`);
    }
    case 'rizz': return reply(`😏 *Rizz line:*\n\n"${pick(RIZZ)}"`);
    case 'sigma': {
      const { score, tier } = auraFor('sigma' + tagNum);
      return mention(`🗿 *SIGMA CHECK*\n\nSigma level: ${score}/10000\nRank: ${tier.title}\nRespect +${score % 100} 🗿`);
    }
    case 'dice': return reply(`🎲 Dice: *${randInt(1, 6)}*`);
    case 'coin': case 'coinflip': case 'flip': return reply(`🪙 ${pick(['HEADS', 'TAILS'])}!`);
    case 'slot': {
      const s = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
      const r = [pick(s), pick(s), pick(s)];
      const win = r[0] === r[1] && r[1] === r[2];
      return reply(`\ud83c\udfb0 *SLOT MACHINE*\n\n[ ${r.join(' | ')} ]\n\n${win ? '\\ud83c\udf89 JACKPOT! You win!' : '\ud83d\ude22 Try again!'}`);
    }
    case 'font': {
      if (!arg) return reply(`\u274c Text do. Example:${config.PREFIX}font SAQIIB`);
      const map = { a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' };
      return reply(arg.toLowerCase().split('').map((c) => map[c] || c).join(''));
    }
    case 'repeat': return reply(arg || '\u274c Text do.');
    case 'heart': return reply('💖💖💖 *Hearts for you!* 💖💖💖');
    default: return reply('❓ Unknown fun command');
  }
};

module.exports = {
  commands: [
    'roast', 'compliment', 'quote', 'shayari', 'joke', 'bacha', 'fact', 'emoji', 'meme', '8ball',
    'lovetest', 'ship', 'shipname', 'compatibility', 'aura', 'rate', 'character', 'truth', 'dare',
    'wyr', 'rizz', 'sigma', 'dice', 'coin', 'coinflip', 'flip', 'slot', 'font', 'repeat', 'heart',
  ],
  category: '😂 FUN',
  handler,
};
