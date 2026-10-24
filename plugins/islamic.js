/**
 * ISLAMIC — Deen commands (Quran, hadith, prayer, duas, zakat…)
 * All data from free public APIs (alquran.cloud, aladhan, hadith-api CDN).
 */
const config = require('../config');
const { getJSON, getText, pick, randInt } = require('../lib/helpers');

const P = () => config.PREFIX;
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/**
 * Prayer timings from aladhan, but never let a flaky/empty API response crash a
 * command. Returns the timings object, or null when the lookup fails.
 */
async function safeTimings(city) {
  try {
    const d = await getJSON(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=PK&method=1`, {}, 15000);
    const t = d?.data?.timings;
    return t && t.Fajr ? t : null;
  } catch { return null; }
}

/* ---- hadith: fawazahmed0/hadith-api on jsDelivr ---- */
const HADITH_BOOKS = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah'];
async function randomHadith(book) {
  const b = HADITH_BOOKS.includes(book) ? book : pick(HADITH_BOOKS);
  const sec = randInt(1, 40);
  const d = await getJSON(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${b}/sections/${sec}.json`);
  const list = d?.hadiths || [];
  if (!list.length) throw new Error('empty');
  const h = pick(list);
  return { book: d?.metadata?.name || b, no: h.hadithnumber, text: clean(h.text) };
}

/* ---- quran ---- */
async function ayah(ref) {
  const d = await getJSON(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/editions/quran-uthmani,en.sahih,ur.jalandhry`);
  const [ar, en, ur] = d.data;
  return { ar: ar.text, en: en.text, ur: ur.text, ref: `${ar.surah.englishName} ${ar.numberInSurah}:${ar.surah.number}` };
}

const KAABA = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kaaba_Masjid_Haraam_Makkah.jpg/640px-Kaaba_Masjid_Haraam_Makkah.jpg';
const MADINAH = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Al-Masjid_an-Nabawi.jpg/640px-Al-Masjid_an-Nabawi.jpg';

const AZKAR = [
  ['SubhanAllah', 'سُبْحَانَ اللّٰه', 'Allah is pure — 33x'],
  ['Alhamdulillah', 'اَلْحَمْدُ لِلّٰه', 'All praise belongs to Allah — 33x'],
  ['Allahu Akbar', 'اَللّٰهُ أَكْبَر', 'Allah is the Greatest — 34x'],
  ['La ilaha illallah', 'لَا إِلٰهَ إِلَّا اللّٰه', 'There is no god worthy of worship except Allah'],
  ['Astaghfirullah', 'أَسْتَغْفِرُ اللّٰه', 'Seek forgiveness from Allah — 100x'],
  ['La hawla wa la quwwata illa billah', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰه', 'Strength comes only from Allah'],
];
const DUA = {
  sabr: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا\n_”Our Lord! Pour patience upon us and keep our feet firm.“_ (2:250)',
  shukr: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ\n_”If you are grateful, I will surely increase you.“_ (14:7)',
  nazar: 'أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ\n_Recite this dua for protection from the evil eye (Bukhari)._',
  tawbah: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ\n_”My Lord! Forgive me and accept my repentance.“_',
  safar: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ\n_Travel dua — recite when starting a journey._',
  khana: 'بِسْمِ اللّٰهِ وَعَلَى بَرَكَةِ اللّٰهِ\n_When starting a meal._',
  sona: 'اللّٰهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا\n_Before sleeping._',
  uthna: 'الْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ\n_Upon waking up._',
  istikhara: 'اللّٰهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ\n_Istikhara dua — recite after prayer, then follow what your heart inclines to._',
  jummah: 'اللّٰهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي\n_Send abundant durood on Friday and recite this dua._',
};
const KALIMA = [
  ['1st Kalima (Tayyab)', 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ'],
  ['2nd Kalima (Shahadat)', 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ'],
  ['3rd Kalima (Tamjeed)', 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ'],
  ['4th Kalima (Tawheed)', 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ'],
  ['5th Kalima (Istighfar)', 'أَسْتَغْفِرُ اللّٰهَ رَبِّي مِنْ كُلِّ ذَنْبٍ وَأَتُوبُ إِلَيْهِ'],
  ['6th Kalima (Radd-e-Kufr)', 'اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا'],
];
const ISLAMIC_Q = [
  ['How many surahs are in the Quran?', '114'],
  ['Which is the longest surah?', 'Al-Baqarah (2)'],
  ['How many rakats are obligatory across the five daily prayers?', '17'],
  ['Who was the first caliph?', 'Abu Bakr Siddique (RA)'],
  ['In which month did the revelation of the Quran begin?', 'Ramadan'],
  ['Which is the first mosque?', 'Masjid al-Haram (Makkah)'],
  ['What percentage is zakat?', '2.5% (40 me 1)'],
  ['In which month is Hajj performed?', 'Zil-Hijjah'],
];

const handler = async (ctx) => {
  const { command, reply, arg } = ctx;

  switch (command) {
    /* ---------------- QURAN ---------------- */
    case 'ayat': {
      try {
        const d = await getJSON('https://api.quran.com/api/v4/verses/random?translations=158&fields=text_uthmani');
        const v = d.verse;
        return reply(`📖 *Ayah of the day*\n\n${v.text_uthmani}\n\n_${clean(v.translations?.[0]?.text)}_\n\n— ${v.verse_key}`);
      } catch { return reply('❌ Ayah not found right now. Please try again in a moment.'); }
    }
    case 'quran': case 'tafsir': {
      if (!arg) return reply(`❌ Surah:ayah do. Example: ${P()}quran 2:255`);
      const ref = arg.trim().replace('-', ':');
      const a = await ayah(ref);
      const head = command === 'tafsir' ? `📚 *Tafsir — ${a.ref}*` : `📖 *${a.ref}*`;
      return reply(`${head}\n\n${a.ar}\n\n🇬🇧 ${a.en}\n\n🇵🇰 ${a.ur}`);
    }
    case 'surah': {
      if (!arg) return reply(`❌ Surah number do (1-114). Example: ${P()}surah 36`);
      const n = parseInt(arg, 10);
      if (!(n >= 1 && n <= 114)) return reply('❌ Surah number must be between 1 and 114.');
      const d = await getJSON(`https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,ur.jalandhry`);
      const [ar, ur] = d.data;
      const ayahs = ar.ayahs.slice(0, 5);
      const body = ayahs.map((x) => `${x.numberInSurah}. ${x.text}`).join('\n\n');
      await reply(`📖 *Surah ${ar.englishName} (${ar.name})*\n${ar.numberOfAyahs} ayahs — Makki/Madani: ${ar.revelationType}\n\n${body}\n\n_…baqi ${Math.max(0, ar.numberOfAyahs - 5)} ayahs._\n🇵🇰 ${clean(ur.ayahs[0].text)}`);
      break;
    }
    case 'quransearch': case 'qsearch': {
      if (!arg) return reply(`❌ Lafz do. Example: ${P()}quransearch sabr`);
      const d = await getJSON(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(arg)}&size=3&language=en`);
      const r = d.search?.results || [];
      if (!r.length) return reply('❌ Nothing found.');
      return reply(`🔎 *Quran search — “${arg}”*\n\n` + r.map((x) => `📖 *${x.verse_key}*\n${clean(x.text)}\n_${clean(x.translations?.[0]?.text)}_`).join('\n\n'));
    }
    case 'qaudio': {
      if (!arg) return reply(`❌ Surah ya surah:ayah do. Example: ${P()}qaudio 36`);
      const ref = arg.trim().replace('-', ':');
      const url = ref.includes(':')
        ? (await getJSON(`https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/ar.alafasy`)).data.audio
        : (await getJSON(`https://api.alquran.cloud/v1/surah/${parseInt(ref, 10)}/ar.alafasy`)).data.ayahs[0].audio;
      if (!url) return reply('❌ Audio not found.');
      await ctx.send(ctx.from, { audio: { url }, mimetype: 'audio/mpeg', ptt: false }, { quoted: ctx.m });
      break;
    }

    /* ---------------- HADITH ---------------- */
    case 'hadith': {
      try {
        const h = await randomHadith(arg ? arg.toLowerCase() : null);
        return reply(`📜 *${h.book} — Hadith #${h.no}*\n\n${h.text}`);
      } catch { return reply('❌ Hadith not found right now. Please try again in a moment.'); }
    }
    case 'sahaba': {
      const names = ['Abu Bakr Siddique (RA)', 'Umar Farooq (RA)', 'Usman Ghani (RA)', 'Ali (RA)', 'Saqiib (RA)', 'Salman Farsi (RA)', 'Khalid bin Waleed (RA)', 'Ayesha (RA)', 'Fatima (RA)', 'Hamza (RA)'];
      const who = pick(names);
      try {
        const h = await randomHadith('bukhari');
        return reply(`⭐ *${who}*\n\n📜 ${h.book} #${h.no}\n${h.text}`);
      } catch { return reply(`⭐ *${who}*\n\n_No hadith found about this companion right now — please try again in a moment._`); }
    }

    /* ---------------- PRAYER / TIME ---------------- */
    case 'salahtimer': case 'namaz': {
      const city = arg || 'Karachi';
      const t = await safeTimings(city);
      if (!t) return reply(`❌ *${city}* prayer times could not be fetched — API issue. Please try again in a moment.`);
      const now = new Date();
      const hhmm = (s) => { const [h, m] = s.split(':').map(Number); const x = new Date(now); x.setHours(h, m, 0, 0); return x; };
      const next = Object.entries({ Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha })
        .map(([k, v]) => [k, hhmm(v)]).sort((a, b) => a[1] - b[1])
        .find(([, dt]) => dt > now);
      const mins = next ? Math.round((next[1] - now) / 60000) : null;
      return reply(`🕌 *Namaz timings — ${city}*\n\n🌅 Fajr: ${t.Fajr}\n☀️ Dhuhr: ${t.Dhuhr}\n🌤️ Asr: ${t.Asr}\n🌇 Maghrib: ${t.Maghrib}\n🌙 Isha: ${t.Isha}\n\n⏳ Next prayer: *${next ? next[0] : '—'}*${mins !== null ? ` (${Math.floor(mins / 60)}h ${mins % 60}m later)` : ''}`);
    }
    case 'imsak': case 'sehri': {
      const city = arg || 'Karachi';
      const t = await safeTimings(city);
      if (!t) return reply(`❌ *${city}* prayer times could not be fetched — API issue. Please try again in a moment.`);
      return reply(`🌙 *Sehri / Iftar — ${city}*\n\n🌅 Sehri (Fajr): ${t.Fajr}\n🌇 Iftar (Maghrib): ${t.Maghrib}\n\n_Allah hamare roze qubool farmaye._`);
    }
    case 'tahajjud': {
      const city = arg || 'Karachi';
      const t = await safeTimings(city);
      if (!t) return reply(`❌ *${city}* prayer times could not be fetched — API issue. Please try again in a moment.`);
      return reply(`🌌 *Tahajjud — ${city}*\n\nThe last part of the night (before Fajr) — best time: *${t.Fajr}* about 1 hour before.\n\n_The Prophet ﷺ said: “In the last part of the night Allah accepts the supplication of His servants.”_`);
    }
    case 'hijri': {
      let d; try { d = await getJSON('https://api.aladhan.com/v1/gToH', {}, 15000); } catch { d = null; }
      const h = d?.data?.hijri;
      if (!h) return reply('❌ Hijri date could not be fetched — API issue. Please try again in a moment.');
      return reply(`🌙 *Hijri date*\n\n${h.day} ${h.month.en} ${h.year} AH\n_(${h.weekday.en})_\n\nMiladi: ${d.data.gregorian.date}`);
    }
    case 'qibla': {
      const city = arg || 'Karachi';
      const g = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).catch(() => null);
      const c = g?.results?.[0];
      if (!c) return reply('❌ City not found.');
      const d = await getJSON(`https://api.aladhan.com/v1/qibla/${c.latitude}/${c.longitude}`, {}, 15000).catch(() => null);
      const dir = d?.data?.direction;
      if (dir == null) return reply('❌ Qibla direction could not be fetched — API issue. Please try again in a moment.');
      return reply(`🧭 *Qibla direction — ${c.name}*\n\n📐 *${Number(dir).toFixed(1)}°* from North\n_(set this angle in a compass app)_`);
    }
    case 'dua': {
      const key = (arg || '').toLowerCase().trim();
      if (key && DUA[key]) return reply(`🤲 *Dua — ${key}*\n\n${DUA[key]}`);
      return reply(`🤲 *Duas*\n\n` + Object.keys(DUA).map((k) => `• ${P()}dua ${k}`).join('\n'));
    }
    case 'azkar': {
      const a = pick(AZKAR);
      return reply(`📿 *Zikr*\n\n${a[1]}\n*${a[0]}*\n_${a[2]}_`);
    }
    case 'asma': {
      const d = await getJSON('https://api.aladhan.com/v1/asmaAlHusna', {}, 15000).catch(() => null);
      const list = d?.data;
      if (!Array.isArray(list) || !list.length) return reply('❌ Asma-ul-Husna list could not be fetched — API issue.');
      if (arg) {
        const n = parseInt(arg, 10);
        const a = list.find((x) => Number(x.number) === n) || pick(list);
        return reply(`✨ *${a.transliteration}*\n\n${a.name}\n\n_${a.en?.meaning || ''}_`);
      }
      return reply(`✨ *Allah ke 99 naam*\n\n` + list.slice(0, 20).map((x) => `${x.number}. ${x.transliteration}`).join('\n') + `\n\n_${P()}asma <number> — poora naam + matlab_`);
    }
    case 'kalima': {
      const k = arg ? KALIMA.find((x) => x[0].toLowerCase().includes(arg.toLowerCase())) : pick(KALIMA);
      const item = k || KALIMA[0];
      return reply(`🕋 *${item[0]}*\n\n${item[1]}`);
    }
    case 'durood': {
      return reply(`ﷺ *Durood*\n\nاللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ\n\n_”O Allah! Send blessings upon Muhammad ﷺ and his family.“_\n\n💚 Recite abundantly on Friday — the promise is 100x.`);
    }
    case 'zikr': {
      const a = pick(AZKAR);
      return reply(`📿 *Dhikr of the day*\n\n${a[1]}\n*${a[0]}*\n_${a[2]}_\n\n${P()}tasbih — for the counter`);
    }
    case 'tasbih': {
      const n = parseInt(arg, 10) || 33;
      return reply(`📿 *Tasbih counter*\n\nTarget: *${n}x*\n\n` + '▫️'.repeat(Math.min(n, 33)) + `\n\n_Count verbally — ${P()}zikr for dhikr._`);
    }
    case 'khatma': {
      const n = Math.min(parseInt(arg, 10) || 0, 604);
      const pct = ((n / 604) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(n / 604 * 20)) + '░'.repeat(20 - Math.round(n / 604 * 20));
      return reply(`📖 *Quran Khatma tracker*\n\n${bar} ${pct}%\nPages: *${n} / 604*\n\n${P()}khatma <page> — to update`);
    }
    case 'sunnah': {
      const s = pick([
        'Use miswak — the Prophet ﷺ said: “Miswak cleanses the mouth and pleases the Lord.”',
        'Say Bismillah before eating and Alhamdulillah after.',
        'Eat and drink with the right hand.',
        'Perform wudu before sleeping.',
        'Spread the greeting of salam.',
        'Baith kar pani peena.',
        'Take a bath on Friday and wear white clothes.',
        'Seek permission three times before entering someone’s home.',
      ]);
      return reply(`🌟 *Sunnah of the day*\n\n${s}`);
    }
    case 'islamicq': {
      const [q, a] = pick(ISLAMIC_Q);
      return reply(`🕌 *Islamic Quiz*\n\n❓ ${q}\n\n_Think of the answer, then ${P()}islamicq again — the answer will appear._\n\n||Answer: ${a}||`);
    }
    case 'jummah': {
      const t = await safeTimings(arg || 'Karachi');
      if (!t) return reply(`❌ Prayer times could not be fetched — API issue. Please try again in a moment.`);
      return reply(`🕌 *Jummah*\n\nKhutbah time (Dhuhr): *${t.Dhuhr}*\n\n📌 Sunnahs: bath, miswak, white clothes, going early to the mosque, abundant durood, reciting Surah Kahf.\n\n${DUA.jummah}`);
    }
    case 'janazah': {
      return reply(`🕊️ *Funeral Prayer (Janazah)*\n\n• 4 takbeers — no ruku or sajdah\n• 1st: Subhanakallah\n• 2nd: Durood-e-Ibrahim\n• 3rd: Dua for the deceased\n• 4th: Salam\n\nThe deceased is placed facing the qibla. Janazah prayer is a communal obligation (farz-e-kifayah).`);
    }
    case 'wudu': {
      return reply(`💧 *How to perform wudu*\n\n1. Intention + Bismillah\n2. Both hands 3x (up to the wrists)\n3. Miswak / mouth 3x\n4. Nose 3x\n5. Mouth 3x\n6. Both arms up to the elbows 3x\n7. Wipe the head 1x\n8. Ears 1x\n9. Both feet up to the ankles 3x\n\nObligatory: 4 (mouth, arms, wiping the head, feet)`);
    }
    case 'roza': {
      return reply(`🌙 *Fasting rules*\n\n✅ Things that break the fast: eating, drinking, intimacy, deliberate vomiting.\n❌ Things that do not break the fast: eating/drinking forgetfully, wet dream, miswak, donating a little blood, bathing.\n\nMake-up: 1 fast = 1 make-up fast. Expiation: 60 fasts or feeding 60 needy people.`);
    }
    case 'zakat': {
      const n = parseFloat(String(arg).replace(/[^0-9.]/g, ''));
      if (!n) return reply(`❌ Raqam do. Example: ${P()}zakat 500000`);
      const z = n * 0.025;
      return reply(`💰 *Zakat calculator*\n\nAssets: PKR ${n.toLocaleString()}\nNisab check: PKR ${(n >= 135000 ? '✅ met' : '❌ not met (silver nisab ~135k)')}\n\n*Zakat (2.5%): PKR ${z.toLocaleString(undefined, { maximumFractionDigits: 2 })}*`);
    }
    case 'fitrana': {
      const p = parseFloat(String(arg).replace(/[^0-9.]/g, '')) || 0;
      return reply(`💰 *Fitrana*\n\nUsual rate: *PKR 250–300* per person (depending on flour/dates).\n${p ? `Your household (${p} people): *PKR ${(p * 275).toLocaleString()}* (avg 275/person)\n` : ''}\nIt must be paid before the Eid prayer.`);
    }
    case 'sadqa': {
      return reply(`🤲 *Sadqa*\n\nNabi ﷺ: “Charity wards off calamity and extends life.”\n\n• Give a little charity daily\n• Giving it secretly is better\n• Give charity in times of hardship\n\n${P()}fitrana — fitrana calculator`);
    }
    case 'eid': {
      let d; try { d = await getJSON('https://api.aladhan.com/v1/gToH', {}, 15000); } catch { d = null; }
      const g = d?.data?.gregorian, h = d?.data?.hijri;
      if (!g || !h) return reply('❌ Date could not be fetched — API issue. Please try again in a moment.');
      return reply(`🎉 *Eid*\n\nMiladi: ${g.date}\nHijri: ${h.day} ${h.month.en} ${h.year}\n\n_Eid Mubarak! 🌙_\n\n${P()}salahtimer — Eid prayer time`);
    }
    case 'kaaba': {
      await ctx.send(ctx.from, { image: { url: KAABA }, caption: '🕋 *Kaaba — Masjid al-Haram, Makkah*' }, { quoted: ctx.m });
      break;
    }
    case 'madinah': {
      await ctx.send(ctx.from, { image: { url: MADINAH }, caption: '🕌 *Masjid an-Nabawi — Madinah Munawwara*' }, { quoted: ctx.m });
      break;
    }
    case 'nasheed': {
      const list = ['Tala Al Badru Alayna', 'Maula Ya Salli', 'Assalamu Alayka', 'Hasbi Rabbi', 'Allah Hoo'];
      return reply(`🎵 *Islamic nasheed*\n\n*${pick(list)}*\n\n_Search on YouTube — ${P()}ytvideo <naam> to download it too._`);
    }
    case 'istikhara': {
      return reply(`🕌 *Istikhara*\n\n${DUA.istikhara}\n\n📌 Method: pray 2 rakats of nafl, then recite this dua. Act on whatever your heart feels at ease with. The Prophet ﷺ said: “Whoever seeks istikhara will never regret.”`);
    }
    case 'tawbah': return reply(`🤲 *Tawbah*\n\n${DUA.tawbah}\n\n_Allah is the Accepter of repentance, the Most Merciful — seek forgiveness sincerely, He forgives._`);
    case 'sabr': return reply(`🌿 *Patience (Sabr)*\n\n${DUA.sabr}`);
    case 'shukr': return reply(`🌿 *Gratitude (Shukr)*\n\n${DUA.shukr}`);
    case 'nazar': return reply(`🧿 *Evil Eye (Nazar)*\n\n${DUA.nazar}`);
    case 'ruqyah': {
      return reply(`🩺 *Ruqyah*\n\n• Surah Fatiha 7x\n• Ayat-ul-Kursi 3x\n• Surah Falaq 3x\n• Surah Naas 3x\n\nRecite while placing your hand on yourself or the person, blowing gently.\n\n${DUA.nazar}`);
    }
    case 'umrah': {
      return reply(`🕋 *Umrah guide*\n\n1. Ihram (intention at the miqat)\n2. Tawaf — 7 circuits\n3. Sa'i — 7 circuits between Safa and Marwa\n4. Halq/Taqseer — hair\n\n📌 Documents: passport (6+ months), visa, ticket, vaccination card.\n_For Umrah packages, contact a travel agent._`);
    }
    case 'hajj': {
      return reply(`🕋 *Hajj*\n\n• 8 Zil-Hijjah: Mina\n• 9 Zil-Hijjah: Arafah (the most important)\n• 10 Zil-Hijjah: Muzdalifah, Rami, Qurbani, Halq, Tawaf-uz-Ziyarah\n• 11–13: Rami in Mina\n\nObligatory: Ihram, Arafah, Tawaf-uz-Ziyarah.`);
    }
    case 'mosque': {
      const city = arg || 'Karachi';
      return reply(`🕌 *Masjid — ${city}*\n\nSearch on Google Maps: *mosque near ${city}*\n\nYa ${P()}map ${city} mosque — for a location link.`);
    }
    case 'ramadan': {
      const city = arg || 'Karachi';
      const t = await safeTimings(city);
      if (!t) return reply(`❌ *${city}* prayer times could not be fetched — API issue. Please try again in a moment.`);
      return reply(`🌙 *Ramadan — ${city}*\n\n🌅 Sehri: ${t.Fajr}\n🌇 Iftar: ${t.Maghrib}\n\n_May Allah accept everyone’s fasts._`);
    }
    default:
      return reply('❓ Unknown islamic command');
  }
};

module.exports = {
  commands: [
    'hadith', 'qibla', 'asma', 'hijri', 'azkar', 'tasbih', 'khatma', 'salahtimer', 'ayat', 'zikr',
    'istikhara', 'janazah', 'wudu', 'imsak', 'sahaba', 'islamicq', 'tahajjud', 'jummah', 'kaaba', 'madinah',
    'tawbah', 'sabr', 'shukr', 'nazar', 'ruqyah', 'nasheed', 'durood', 'kalima', 'sunnah', 'fitrana',
    'sadqa', 'roza', 'eid',
    // extras that belong in this family
    'quran', 'tafsir', 'qaudio', 'quransearch', 'dua', 'namaz', 'sehri', 'zakat', 'mosque', 'ramadan',
  ],
  category: '🕌 ISLAMIC',
  handler,
};
