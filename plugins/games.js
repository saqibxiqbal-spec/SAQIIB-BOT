/**
 * GAMES — mini games & group fun (state kept in memory per chat)
 */
const config = require('../config');
const { pick, randInt } = require('../lib/helpers');

const P = () => config.PREFIX;

/* ---------------- shared state ---------------- */
const scores = new Map();   // user -> points
const wallets = new Map();  // user -> coins
const games = new Map();    // chatId -> active game
const pets = new Map();     // user -> pet
const farms = new Map();    // user -> {planted, stage}

const points = (u) => scores.get(u) || 0;
const addPoints = (u, n) => { scores.set(u, points(u) + n); return scores.get(u); };
const coins = (u) => wallets.get(u) || 0;
const addCoins = (u, n) => { wallets.set(u, Math.max(0, coins(u) + n)); return wallets.get(u); };

const QUIZ = [
  ['Pakistan\'s national flower?', ['Chambeli', 'Gulab', 'Surajmukhi', 'Kamal'], 0],
  ['What did you say to everyone?', ['Mangal', 'Mushteri', 'Zuhal', 'Zameen'], 1],
  ['Chemical formula of water?', ['CO2', 'H2O', 'O2', 'NaCl'], 1],
  ['How many surahs are there in Quran?', ['100', '110', '114', '120'], 2],
  ['The fastest animal?', ['Sher', 'Cheetah', 'Ghora', 'Hiran'], 1],
  ['In which year did Pakistan become independent?', ['1945', '1946', '1947', '1948'], 2],
  ['The largest ocean in the world?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3],
  ['How many teeth does a human have (adult)?', ['28', '30', '32', '34'], 2],
];
const TRUTH = ['Whose gift is the most important?', 'When did you last say Jhoot?', 'What is the worst habit?', 'Do you like someone secretly?', 'What is the most embarrassing photo on the phone?'];
const DARE = ['send me your worst selfie', 'sing the song in voice note', 'give 3 compliments to someone', 'Tell me the first word of your search history', '10 second tak cheekhein maaro'];
const NHIE = ['Never have I ever... jhoot bola ho.', 'Never have I ever... slept in class.', 'Never have I ever... ignored someone\'s message.', 'Never have I ever... cheated in exams.', 'Never have I ever... kept calling the phone till 3 o\'clock at night.'];
const PARANOIA = ['What would you do if you got the chance to be invisible for 24 hours?', 'What rumors have been spread about you?', 'Why are you saying \'Jhoot\'?'];
const CAPITALS = [['Pakistan', 'Islamabad'], ['India', 'New Delhi'], ['China', 'Beijing'], ['Turkey', 'Ankara'], ['Japan', 'Tokyo'], ['Egypt', 'Cairo'], ['Iran', 'Tehran'], ['Saudi Arabia', 'Riyadh']];
const FLAGS = [['🇵🇰', 'Pakistan'], ['🇮🇳', 'India'], ['🇹🇷', 'Turkey'], ['🇯🇵', 'Japan'], ['🇨🇳', 'China'], ['🇸🇦', 'Saudi Arabia'], ['🇬🇧', 'United Kingdom'], ['🇺🇸', 'United States']];
const EMOJI_STORY = [['🚗💨😱🏥', 'Car accident'], ['👦❤️👧💍', 'Love marriage'], ['🎓📚💪🏆', 'Study success'], ['🍕😋🤤', 'Pizza craving']];
const SONGS = ['You Hi Ho', 'Kesariya', 'Pasoori', 'Afreen Afreen', 'Dil Dil Pakistan', 'Jee Le Zara'];

const handler = async (ctx) => {
  const { command, reply, arg, senderNum, from, isGroup, pushname } = ctx;
  const who = senderNum || pushname || 'player';
  const chat = from || 'chat';

  switch (command) {
    /* ---------------- simple fun ---------------- */
    case 'paranoia': return reply(`😳 *Paranoia*\n\n${pick(PARANOIA)}`);
    case 'nhie': return reply(`🙊 *Never Have I Ever*\n\n${pick(NHIE)}`);
    case 'couple': return reply(`\ud83d\udc91 *Couple of the day*${isGroup ? "Today's couple: *" + pick(['Ali \u2764\ufe0f Ayesha', 'Hamza \u2764\ufe0f Zara', 'Saqiib \u2764\ufe0f Hina', 'Usman \u2764\ufe0f Maryam']) + '*' : 'This command is fun inside a group \ud83d\ude04'}`);
    case 'spinthebottle': return reply(`🍾 *The bottle spun...*\n\n👉 ${isGroup ? 'It stopped on a member! Random pick: *' + (ctx.mentioned?.[0]?.split('@')[0] || 'you') + '*' : 'Try this in a group'}`);
    case 'songguess': {
      if (!isGroup) return reply('\u274c This is a group game.');
      const s = pick(SONGS);
      games.set(chat, { type: 'song', answer: s.toLowerCase(), tries: 0 });
      return reply(`\ud83c\udfb5 *Song Guess*\n\nGuess the name of the film/song \u2013 answer in 1 minute!\n\n_Hint: first laugh "${s.split(' ')[0]}"_\n\nWrite the answer and send it.`);
    }
    case 'emojistory': return reply(`\ud83d\udcf1 *Emoji Story*\n\n${pick(EMOJI_STORY).join(' \u2192 ')}_Do you understand what is the scene?_`);
    case 'flagguess': {
      const [f, n] = pick(FLAGS);
      games.set(chat, { type: 'flag', answer: n.toLowerCase() });
      return reply(`\ud83c\udff3\ufe0f *Flag Guess*\n\n${f}\n\nWhich property is it? Write your name.`);
    }
    case 'movieguess': return reply(`\ud83c\udfac *Movie Guess*\n\n_3 dreams, 1 magic, and a little lark_\n\nAnswer me!`);
    case 'antakshari': return reply(`🎶 *Antakshari*\n\nLast letter: *${pick(['A', 'M', 'S', 'T', 'K'])}*\n\nSing a song starting with this letter!`);
    case 'storygame': return reply(`\ud83d\udcd6 *Story Game*\n\nPehli line: *${pick(['One night, in a dark street...', 'Aik chhota gaon, aik bara khwab...', 'It was raining, and she was alone...'])}*\n\nNow every member adds a line!`);
    case 'fmk': return reply(`\ud83d\ude05 *FMK*\n\nFormat: ${P()}fmk Ali | Ayesha | Saqib\n\n_Do 3 names, enjoy._`);
    case 'mafia': return reply(`\ud83d\udd75\ufe0f *Mafia*\n\nPlay in group: Each group will send a role in DM, then will vote.\n\n_Moderator required \u2014${P()}start._`);
    case 'simon': return reply(`\ud83c\udfae *Simon Says*\n\n\ud83d\udfe2\ud83d\udd34\ud83d\udfe1\ud83d\udd35\n\nRemember the sequence: *\ud83d\udd34 \ud83d\udfe1 \ud83d\udd34 \ud83d\udfe2*\n\nSend this!`);
    case 'high-low': {
      const n = randInt(1, 100);
      games.set(chat, { type: 'highlow', n });
      return reply(`\ud83d\udcc8 *High or Low*\n\nI picked a number from 1-100. Tell me: *high* (50+) or *low* (1-49)?`);
    }
    case 'scratch': {
      const win = randInt(1, 100) <= 30;
      return reply(`🎟️ *Scratch card*\n\n${win ? `🎉 *JEET GAYE!* +${randInt(50, 500)} coins`: '\ud83d\ude22 Not much found \u2013 try again!'}`);
    }
    case 'lottery': {
      const nums = Array.from({ length: 6 }, () => randInt(1, 49)).sort((a, b) => a - b);
      return reply(`🎰 *Lottery numbers*\n\n${nums.join(' — ')}\n\n_Allah hafiz! 😄_`);
    }
    case 'loot': case 'daily': {
      const last = wallets.get(who + '_last') || 0;
      const day = 86400000;
      if (Date.now() - last < day) {
        const left = Math.ceil((day - (Date.now() - last)) / 3600000);
        return reply(`\u23f3 *Daily loot* Have already taken it.\n\nAbhi balance:*${coins(who)} coins*\nNext loot: ~${left} hours later`);
      }
      wallets.set(who + '_last', Date.now());
      const got = randInt(100, 500);
      addCoins(who, got);
      return reply(`💰 *Daily loot!*\n\n+${got} coins\n💳 Balance: *${coins(who)}*`);
    }
    case 'wallet': return reply(`\ud83d\udc5b *Wallet*\n\n${pushname}: *${coins(who)} coins*\n\n${P()}loot \u2014 daily coins\n${P()}shop \u2014 view items`);
    case 'shop': return reply(`\ud83d\uded2 *Shop*\n\n\ud83c\udf81 Gift \u2014 200 coins\n\ud83c\udf55 Pizza \u2013 300 coins\n\ud83d\udc8e Diamond \u2014 1000 coins\n\ud83d\udc51 VIP \u2014 5000 coins\n\n_(Wallet system is demo \u2014 not real items.)_`);
    case 'heist': {
      const win = randInt(1, 100) <= 45;
      const amt = randInt(100, 800);
      if (win) { addCoins(who, amt); return reply(`🕵️ *Heist successful!*\n\n+${amt} coins\n💳 Balance: *${coins(who)}*`); }
      addCoins(who, -200);
      return reply(`\ud83d\udea8 *Heist failed!*\n\nPolice imposed a fine of 200 coins.\n\ud83d\udcb3 Balance: *${coins(who)}*`);
    }
    case 'fish': return reply(`\ud83c\udfa3 *Fishing*\n\nYou did not read: *${pick(['Rohu \ud83d\udc1f', 'Surmai \ud83d\udc20', 'Pomfret \ud83d\udc21', 'old joota \\ud83e\udd7e'])}*\n\n${P()}fish - good`);
    case 'hunt': return reply(`\ud83c\udff9 *Hunting*\n\nShikaar: *${pick(['Khargosh \ud83d\udc07', 'Teetar \ud83d\udc26', 'Hiran \ud83e\udd8c', 'Not much \\ud83d\ude05'])}*`);
    case 'mine': {
      const found = pick(['Koyla 🪨', 'Loha ⛓️', 'Sona 🥇', 'Heera 💎', 'Not much \ud83d\udd73\ufe0f']);
      return reply(`⛏️ *Mining*\n\nMila: *${found}*`);
    }
    case 'farm': {
      const f = farms.get(who) || { stage: 0 };
      f.stage = Math.min(5, f.stage + 1);
      farms.set(who, f);
      const stages = ['🌱 Beej boya', '🌿 Chhota paudha', '\ud83c\udf3e It rained', '\ud83c\udf3e It is cooked - eat!', '\u2705 Chopped!'];
      return reply(`🌾 *Farm*\n\n${stages[Math.min(f.stage, 4)]}\n\nStage: ${f.stage}/4`);
    }
    case 'pets': {
      const p = pets.get(who) || { name: pick(['Billu', 'Sheru', 'Motu', 'Chotu']), hunger: 50, happy: 50 };
      pets.set(who, p);
      return reply(`\ud83d\udc3e *your pet*\n\nName: *${p.name}*\n\ud83c\udf56 Bhookh: ${p.hunger}%\n\ud83d\ude0a Happiness: ${p.happy}%\n\n_${P()}pets\u2014to see again_`);
    }

    /* ---------------- real games ---------------- */
    case 'capitals': {
      const [country, city] = pick(CAPITALS);
      games.set(chat, { type: 'capital', answer: city.toLowerCase() });
      return reply(`\ud83c\udfdb\ufe0f *Capital Quiz*\n\nWhat is the capital government of${country}?\n\nWrite your name.`);
    }
    case 'trivia': {
      const [q, opts, ans] = pick(QUIZ);
      games.set(chat, { type: 'trivia', answer: opts[ans].toLowerCase() });
      return reply(`🧠 *Trivia*\n\n❓ ${q}\n\n${opts.map((o, i) => `${'ABCD'[i]}. ${o}`).join('\n')}\n\n_Write your answer or option letter._`);
    }
    case 'guess': {
      games.set(chat, { type: 'guess', n: randInt(1, 100), tries: 0 });
      return reply(`\ud83d\udd22 *Number Guess*\n\nNumbers between 1 and 100 are thought.\nGuess it!`);
    }
    case 'hangman': {
      const words = ['biryani', 'karachi', 'cricket', 'chai', 'mango', 'pakistan', 'lahore', 'monsoon'];
      const w = pick(words);
      games.set(chat, { type: 'hangman', word: w, guessed: [], left: 6 });
      return reply(`\ud83c\udfaf *Hangman*\n\n${'_ '.repeat(w.length)}\u2764\ufe0f Lives: 6\n\nSend a letter.`);
    }
    case 'wordle': {
      const words = ['chai', 'kitaab', 'pani', 'dost', 'khush', 'mehnat', 'dunya', 'ilm'];
      const w = pick(words);
      games.set(chat, { type: 'wordle', word: w, tries: 0 });
      return reply(`\ud83d\udfe9 *Wordle*\n\n${w.length}Harf's words are thought. 6 tries.\n\nSend the first guess!`);
    }
    case 'wordchain': {
      const last = games.get(chat)?.last || pick(['a', 'b', 'm', 's']);
      games.set(chat, { type: 'chain', last });
      return reply(`🔗 *Word Chain*\n\nStart: *${last}*\n\nNext word starts with this letter: *${last.slice(-1).toUpperCase()}*`);
    }
    case 'mathsprint': {
      const a = randInt(10, 99), b = randInt(10, 99);
      games.set(chat, { type: 'math', answer: String(a + b) });
      return reply(`\u26a1 *Math Sprint*\n\n${a} + ${b}=?\n\nReply quickly!`);
    }
    case 'ttt': case 'rps': case 'chess': case 'uno': case 'connect4': case 'battleship': {
      const names = { ttt: 'Tic-Tac-Toe', rps: 'Rock Paper Scissors', chess: 'Chess', uno: 'Uno', connect4: 'Connect Four', battleship: 'Battleship' };
      if (command === 'rps') {
        const me = pick(['rock', 'paper', 'scissors']);
        const you = pick(['rock', 'paper', 'scissors']);
        const win = (me === 'rock' && you === 'scissors') || (me === 'paper' && you === 'rock') || (me === 'scissors' && you === 'paper');
        return reply(`\u270a *Rock Paper Scissors*\n\n\ud83e\udd16 Bot: ${me}\ud83d\udc64 You: ${you}\n\n${me === you ? '\ud83e\udd1d Draw!' : win ? '\\ud83d\ude22 Bot wins!' : '\\ud83c\udf89 You win!'}`);
      }
      return reply(`\ud83c\udfae *${names[command]}*\n\nThis game is currently not available in text-mode.\n\n\u2705To play:${P()}trivia, ${P()}guess, ${P()}hangman, ${P()}wordle, ${P()}rps, ${P()}high-low`);
    }
    case 'blackjack': {
      const card = () => randInt(1, 11);
      const you = card() + card();
      const bot = card() + card();
      const win = you <= 21 && (bot > 21 || you > bot);
      return reply(`\ud83c\udccf *Blackjack*\n\n\ud83d\udc64 You:${you}\n\ud83e\udd16 Bot: ${bot}\n\n${you > 21 ? '\\ud83d\udca5 Bust! You lost your hair.' : win ? '\\ud83c\udf89 You win!' : '\ud83d\ude22 Bot jeeta.'}`);
    }
    case 'memory': {
      const seq = Array.from({ length: 4 }, () => pick(['🍎', '🍌', '🍇', '🍒']));
      games.set(chat, { type: 'memory', answer: seq.join('') });
      return reply(`\ud83e\udde0 *Memory Game*\n\n${seq.join(' ')}Remember it in 5 seconds, then send that order!`);
    }
    case '2048': return reply(`\ud83c\udfae *2048*\n\nNot in text mode. Play on mobile: https://play2048.co`);
    case 'sudoku': {
      const puz = [
        '5 3 . | . 7 . | . . .',
        '6 . . | 1 9 5 | . . .',
        '. 9 8 | . . . | . 6 .',
        '------+-------+------',
        '8 . . | . 6 . | . . 3',
      ];
      return reply(`\ud83e\udde9 *Sudoku*\n\n\`\`\`\n${puz.join('\n')}''\`\n\n_Complete it! (Full puzzle: sudoku.com)_`);
    }
    case 'quizduel': return reply(`\u2694\ufe0f *Quiz Duel*\n\n${P()} Practice with trivia \u2014 1v1 mode coming soon!`);

    /* ---------------- scoreboard ---------------- */
    case 'rank': {
      const p = points(who);
      const lvl = Math.floor(p / 100) + 1;
      return reply(`🏅 *Rank*\n\n${pushname}\n⭐ Points: *${p}*\n🎖️ Level: *${lvl}*\n\n${'▰'.repeat(Math.min(10, lvl))}${'▱'.repeat(Math.max(0, 10 - lvl))}`);
    }
    case 'leaderboard': {
      const top = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (!top.length) return reply(`\ud83d\udcca *Leaderboard*\n\nAbhi no points.${P()}Start with trivia!`);
      return reply(`🏆 *Leaderboard*\n\n${top.map(([u, p], i) => `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} ${u} — ${p} pts`).join('\n')}`);
    }
    default:
      return reply('❓ Unknown game');
  }
};

/** Answer-catcher: hooks into every message to resolve active games. */
async function onMessage(ctx) {
  const { text, from, senderNum, pushname } = ctx;
  if (!text || text.startsWith(config.PREFIX)) return;
  const chat = from || 'chat';
  const g = games.get(chat);
  if (!g) return;
  const t = text.trim().toLowerCase();
  const who = senderNum || pushname || 'player';

  if (g.type === 'trivia' || g.type === 'flag' || g.type === 'capital') {
    if (t === g.answer || t === g.answer[0]) {
      games.delete(chat);
      const p = addPoints(who, 10);
      await ctx.reply(`\u2705 *Correct answer!*${g.answer}\n\n+10 points (total ${p})`);
    }
  } else if (g.type === 'guess') {
    const n = parseInt(t, 10);
    if (isNaN(n)) return;
    g.tries++;
    if (n === g.n) { games.delete(chat); const p = addPoints(who, 20); await ctx.reply(`\ud83d\ude4f *Absolutely true!* The number was${g.n}.\n+20 points (total ${p})`); }
    else if (g.tries >= 7) { games.delete(chat); await ctx.reply(`\ud83d\ude05 I ate 7 tries! The number was *${g.n}*.`); }
    else await ctx.reply(n < g.n ? '\u2b06\ufe0f try bara number' : '\u2b07\ufe0fTry the desired number.');
  } else if (g.type === 'math') {
    if (t === g.answer) { games.delete(chat); const p = addPoints(who, 5); await ctx.reply(`\u26a1 *Sahi!* +5 points (total${p})`); }
  } else if (g.type === 'highlow') {
    if (t === 'high' || t === 'low') {
      games.delete(chat);
      const isHigh = g.n >= 50;
      const win = (t === 'high') === isHigh;
      await ctx.reply(`\ud83d\udd22 The number was *${g.n}* \u2014 ${isHigh ? 'HIGH' : 'LOW'}\n\n${win ? '\\ud83c\udf89 You are true!' : '\\ud83d\ude22 Galatian!'}`);
    }
  } else if (g.type === 'song') {
    if (g.answer.includes(t) || t.includes(g.answer)) { games.delete(chat); const p = addPoints(who, 15); await ctx.reply(`\ud83c\udfb5 *Sahi gaana!*${g.answer}\n+15 points (total ${p})`); }
  } else if (g.type === 'wordle') {
    if (t.length !== g.word.length) return;
    g.tries++;
    if (t === g.word) { games.delete(chat); const p = addPoints(who, 25); await ctx.reply(`🟩 *Wordle solved!* ${g.word}\n+25 points (total ${p})`); }
    else {
      const hint = t.split('').map((c, i) => (c === g.word[i] ? '🟩' : g.word.includes(c) ? '🟨' : '⬜')).join('');
      if (g.tries >= 6) { games.delete(chat); await ctx.reply(`\ud83d\ude05 Tries finished! The word was*${g.word}*.`); }
      else await ctx.reply(`${hint}\n\n_Try ${g.tries}/6_`);
    }
  } else if (g.type === 'hangman') {
    const c = t[0];
    if (!/^[a-z]$/.test(c)) return;
    if (g.guessed.includes(c)) return;
    g.guessed.push(c);
    if (!g.word.includes(c)) g.left--;
    const shown = g.word.split('').map((x) => (g.guessed.includes(x) ? x : '_')).join(' ');
    if (!shown.includes('_')) { games.delete(chat); const p = addPoints(who, 15); await ctx.reply(`\ud83c\udf89 *Word found:*${g.word}\n+15 points (total ${p})`); }
    else if (g.left <= 0) { games.delete(chat); await ctx.reply(`\ud83d\udc80 *Game over!* The word was *${g.word}*.`); }
    else await ctx.reply(`${shown}\n❤️ Lives: ${g.left}\n_Guessed: ${g.guessed.join(', ')}_`);
  } else if (g.type === 'memory') {
    if (t.replace(/\s/g, '') === g.answer.replace(/\s/g, '')) { games.delete(chat); const p = addPoints(who, 10); await ctx.reply(`🧠 *Perfect memory!* +10 points (total ${p})`); }
  } else if (g.type === 'chain') {
    if (t[0] === g.last.slice(-1)) { g.last = t; await ctx.reply(`✅ *${t}* — next word starts with *${t.slice(-1).toUpperCase()}*!`); }
  }
}

module.exports = {
  commands: [
    'paranoia', 'nhie', 'couple', 'rank', 'leaderboard', 'wallet', 'shop', 'trivia', 'guess', 'hangman',
    'lottery', 'scratch', 'loot', 'heist', 'fish', 'hunt', 'mine', 'farm', 'pets', 'mathsprint', 'wordle',
    'wordchain', 'antakshari', 'songguess', 'emojistory', 'movieguess', 'flagguess', 'capitals', 'storygame',
    'spinthebottle', 'blackjack', 'high-low', 'memory', '2048', 'sudoku', 'mafia', 'simon',
    // extras that belong in this family
    'daily', 'ttt', 'rps', 'chess', 'uno', 'connect4', 'battleship', 'quizduel', 'fmk',
  ],
  category: '🎮 GAMES',
  handler,
  onMessage,
};
