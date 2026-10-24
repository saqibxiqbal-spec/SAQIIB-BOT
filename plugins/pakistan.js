/**
 * PAKISTAN — PK-specific commands (rates, cricket, tracking, holidays…)
 */
const config = require('../config');
const { getJSON, getText, pick, randInt } = require('../lib/helpers');

const P = () => config.PREFIX;

const PK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur'];
const PK_FOOD = ['Biryani', 'Nihari', 'Haleem', 'Chapli Kabab', 'Sajji', 'Karahi', 'Paya', 'Haleem', 'Aloo Keema', 'Chana Chaat', 'Gol Gappay', 'Jalebi'];
const PK_TRAVEL = [
  ['Hunza', 'Gilgit-Baltistan — Attabad Lake, Rakaposhi, Baltit Fort. Best: April–October.'],
  ['Skardu', 'Gilgit-Baltistan — Shangrila, Deosai, Katpana desert. Best: May–September.'],
  ['Swat', 'KPK — Kalam, Malam Jabba, Mahodand Lake. Best: March–October.'],
  ['Murree', 'Punjab — Mall Road, Patriata, Kashmir Point. Best: all year (snow in Jan).'],
  ['Naran', 'KPK — Saif-ul-Malook, Babusar Top. Best: June–September.'],
  ['Gwadar', 'Balochistan — Hammerhead, Kund Malir. Best: November–February.'],
  ['Fairy Meadows', 'Gilgit — Nanga Parbat view. Best: May–September.'],
  ['Neelum Valley', 'AJK — Keran, Sharda, Arang Kel. Best: April–October.'],
];
const PK_QUIZ = [
  ['What is the largest city of Pakistan?', 'Karachi'],
  ['What is the capital of Pakistan?', 'Islamabad'],
  ['What is the highest mountain?', 'K2 (8611m)'],
  ['In which year did Pakistan become independent?', '1947 (14 August)'],
  ['What is the longest river?', 'Indus (Sindh)'],
  ['What is the national flower?', 'Chambeli (Jasmine)'],
  ['What is the national animal?', 'Markhor'],
  ['What is the largest province (by area)?', 'Balochistan'],
];

const handler = async (ctx) => {
  const { command, reply, arg } = ctx;

  switch (command) {
    /* ---------------- rates ---------------- */
    case 'dollar': case 'currency2': {
      try {
        const d = await getJSON('https://open.er-api.com/v6/latest/USD');
        const r = d.rates;
        return reply(`💵 *Currency rates (1 USD)*\n\n🇵🇰 PKR: *${r.PKR}*\n🇮🇳 INR: ${r.INR}\n🇦🇪 AED: ${r.AED}\n🇸🇦 SAR: ${r.SAR}\n🇬🇧 GBP: ${r.GBP}\n🇪🇺 EUR: ${r.EUR}\n\n_Updated: ${d.time_last_update_utc?.slice(5, 16)}_`);
      } catch {
        try {
          const c = await getJSON('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
          return reply(`💵 *1 USD*\n\n🇵🇰 PKR: *${c.usd.pkr}*\n🇦🇪 AED: ${c.usd.aed}\n🇸🇦 SAR: ${c.usd.sar}\n🇬🇧 GBP: ${c.usd.gbp}\n\n_${c.date}_`);
        } catch { return reply('❌ Currency rates not found. Please try again in a moment.'); }
      }
    }
    case 'gold': {
      try {
        const g = await getJSON('https://api.gold-api.com/price/XAU');
        const s = await getJSON('https://api.gold-api.com/price/XAG');
        const fx = await getJSON('https://open.er-api.com/v6/latest/USD');
        const pkr = fx.rates.PKR;
        const tolaG = (g.price / 31.1035) * 11.6638 * pkr;
        const tolaS = (s.price / 31.1035) * 11.6638 * pkr;
        return reply(`🪙 *Gold & Silver*\n\n🥇 Gold: $${Number(g.price).toFixed(2)}/oz\n   ≈ *PKR ${Math.round(tolaG).toLocaleString()} / tola*\n🥈 Silver: $${Number(s.price).toFixed(2)}/oz\n   ≈ *PKR ${Math.round(tolaS).toLocaleString()} / tola*\n\n_USD rate: ${pkr}_\n_International rate + customs/making charges alag hote hain._`);
      } catch { return reply('❌ Rates not found. Please try again in a moment.'); }
    }
    case 'petrol': {
      return reply(`⛽ *Petrol prices (Pakistan)*\n\nOGRA updates live rates every 15 days.\n\n📌 Current rates: https://www.ogra.org.pk\n\n_For your city’s rate use ${P()}news petrol._`);
    }
    case 'psx': {
      try {
        const d = await getText('https://dps.psx.com.pk/indices');
        const m = /KSE100[^0-9]*([0-9,]+\.[0-9]+)/.exec(d);
        return reply(`📈 *PSX*\n\nKSE-100: *${m ? m[1] : 'live data unavailable'}*\n\n📊 Detail: https://dps.psx.com.pk`);
      } catch { return reply('❌ PSX data not found. Check https://dps.psx.com.pk.'); }
    }

    /* ---------------- cricket ---------------- */
    case 'pakcricket': {
      try {
        const d = await getJSON('https://api.cricapi.com/v1/currentMatches?apikey=&offset=0');
        return reply(`🏏 *Pakistan cricket*\n\nLive scores: https://www.espncricinfo.com/team/pakistan-7\n\n_For the PCB schedule use ${P()}pknews cricket_`);
      } catch {
        return reply(`🏏 *Pakistan cricket*\n\n📊 Live score & schedule:\nhttps://www.espncricinfo.com/team/pakistan-7\n\n_PCB fixtures: https://www.pcb.com.pk_`);
      }
    }
    case 'psl': {
      return reply(`🏆 *PSL (Pakistan Super League)*\n\n6 teams: Karachi Kings, Lahore Qalandars, Islamabad United, Peshawar Zalmi, Quetta Gladiators, Multan Sultans.\n\n📊 Points table & fixtures: https://www.psl-t20.com\n\n_The season usually runs from February to March._`);
    }

    /* ---------------- tracking ---------------- */
    case 'track': {
      const no = (arg || '').replace(/\s/g, '');
      if (!no) return reply(`❌ Tracking number do. Example: ${P()}track 123456789`);
      return reply(`📦 *Courier tracking — ${no}*\n\n🚚 TCS: https://www.tcsexpress.com/track/${no}\n🚚 Leopards: https://www.leopardscourier.com/tracking/${no}\n🚚 M&P: https://www.mulphilog.com/tracking/${no}\n🚚 Pakistan Post: https://ep.gov.pk/track/${no}\n\n_Open any link — the status will appear._`);
    }
    case 'tcs': {
      const no = (arg || '').replace(/\s/g, '');
      if (!no) return reply(`❌ Tracking number do. Example: ${P()}tcs 123456789`);
      return reply(`📦 *TCS — ${no}*\n\n🔗 https://www.tcsexpress.com/track/${no}\n\n_Check the status at this link._`);
    }
    case 'leopards': {
      const no = (arg || '').replace(/\s/g, '');
      if (!no) return reply(`❌ Tracking number do. Example: ${P()}leopards 123456789`);
      return reply(`📦 *Leopards — ${no}*\n\n🔗 https://www.leopardscourier.com/tracking/${no}`);
    }
    case 'echallan': {
      const no = (arg || '').replace(/\s/g, '');
      return reply(`🚗 *E-Challan check*\n\n${no ? `📌 Vehicle/CNIC: *${no}*\n\n` : ''}🔗 Punjab: https://echallan.punjab.gov.pk\n🔗 Sindh: https://echallan.sindhpolice.gov.pk\n🔗 ICT: https://ictp.traffic.pk\n\n_Enter the number to check._`);
    }
    case 'pta': {
      const imei = (arg || '').replace(/[^0-9]/g, '');
      return reply(`📱 *PTA device check*\n\n${imei ? `IMEI: *${imei}*\n\n` : ''}🔗 https://dirbs.pta.gov.pk/drs\n\n_Dial *#06# for the IMEI — then enter it on the site._`);
    }
    case 'siminfo': {
      const no = (arg || '').replace(/[^0-9]/g, '');
      const net = no.startsWith('030') || no.startsWith('031') || no.startsWith('032') ? 'Jazz / Zong / Warid' : no.startsWith('033') ? 'Ufone' : no.startsWith('034') ? 'Telenor' : no.startsWith('035') ? 'SCOM' : '—';
      return reply(`📶 *SIM info*\n\n${no ? `Number: ${no}\nNetwork: *${net}*\n` : ''}\n📌 Owner details are checked in the PTA/SIM database — there is no public API.`);
    }

    /* ---------------- daily life ---------------- */
    case 'pknews': {
      try {
        const xml = await getText('https://news.google.com/rss?hl=en-PK&gl=PK&ceid=PK:en');
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6);
        const out = items.map((m, i) => {
          const t = (/<title>([\s\S]*?)<\/title>/.exec(m[1]) || [])[1] || '';
          return `${i + 1}. ${t.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').trim()}`;
        }).join('\n');
        return reply(`📰 *Pakistan news*\n\n${out}`);
      } catch { return reply('❌ News not found.'); }
    }
    case 'pkholiday': {
      // nager.date has no PK data (204), so use the fixed national calendar.
      const list = [
        ['23 March', 'Pakistan Day'],
        ['1 May', 'Labour Day'],
        ['14 August', 'Independence Day'],
        ['6 September', 'Defence Day'],
        ['9 November', 'Iqbal Day'],
        ['25 December', 'Quaid-e-Azam Day'],
        ['Eid-ul-Fitr', 'After Ramadan (depends on the moon)'],
        ['Eid-ul-Azha', 'Zil-Hijjah 10 (depends on the moon)'],
        ['12 Rabi-ul-Awwal', 'Eid Milad-un-Nabi (depends on the moon)'],
        ['9–10 Muharram', 'Ashura (depends on the moon)'],
      ];
      return reply(`🗓️ *Pakistan holidays*\n\n` + list.map((x) => `• *${x[0]}* — ${x[1]}`).join('\n') + `\n\n_Islamic dates change according to the moon._`);
    }
    case 'loadshedding': case 'light': {
      const city = arg || 'Karachi';
      return reply(`💡 *Loadshedding — ${city}*\n\n📌 Check the schedule with your DISCO:\n• K-Electric: https://www.ke.com.pk\n• LESCO: https://lesco.gov.pk\n• IESCO: https://iesco.com.pk\n• GEPCO: https://gepco.com.pk\n• PESCO: https://pesco.gov.pk\n\n_Tip: ${P()}aqi ${city} — check the weather too._`);
    }
    case 'aqi': {
      const city = arg || 'Karachi';
      try {
        const g = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const c = g.results?.[0];
        if (!c) throw new Error('no city');
        const a = await getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.latitude}&longitude=${c.longitude}&current=pm10,pm2_5,us_aqi`);
        const q = a.current;
        const lvl = q.us_aqi <= 50 ? '🟢 Good' : q.us_aqi <= 100 ? '🟡 Moderate' : q.us_aqi <= 150 ? '🟠 Unhealthy (sensitive)' : q.us_aqi <= 200 ? '🔴 Unhealthy' : '🟣 Very unhealthy';
        return reply(`🌫️ *Air quality — ${c.name}*\n\nAQI: *${Math.round(q.us_aqi)}* ${lvl}\nPM2.5: ${q.pm2_5} µg/m³\nPM10: ${q.pm10} µg/m³\n\n_Mask pehno agar AQI 150+ ho._`);
      } catch { return reply('❌ City not found.'); }
    }
    case 'earthquake2': case 'quake': {
      try {
        const d = await getJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson');
        const q = (d.features || []).slice(0, 4);
        if (!q.length) return reply('✅ No major earthquake occurred this week.');
        return reply(`🌍 *Recent earthquakes*\n\n` + q.map((x) => `• M${x.properties.mag} — ${x.properties.place}\n  _${new Date(x.properties.time).toUTCString().slice(5, 22)}_`).join('\n'));
      } catch { return reply('❌ Earthquake data not found. Please try again in a moment.'); }
    }

    /* ---------------- PK content ---------------- */
    case 'pkfood': {
      const dish = arg || pick(PK_FOOD);
      return reply(`🍛 *${dish}*\n\n📌 Recipe: https://www.food.com/search?q=${encodeURIComponent(dish + ' pakistani')}\n📌 Video: Search "${dish} recipe" on YouTube — ${P()}ytvideo <link> to download it too.`);
    }
    case 'pktravel': {
      const t = arg ? PK_TRAVEL.find((x) => x[0].toLowerCase().includes(arg.toLowerCase())) || pick(PK_TRAVEL) : pick(PK_TRAVEL);
      return reply(`🏔️ *${t[0]}*\n\n${t[1]}\n\n📌 ${P()}pknews — for travel updates`);
    }
    case 'k2': {
      return reply(`🏔️ *K2 — Chogori*\n\n📏 Height: 8,611 m (world #2)\n📍 Karakoram range, Gilgit-Baltistan\n🥇 First ascent: 1954 (Italian expedition)\n☠️ World's 2nd deadliest 8000er\n\n_Tip: ${P()}pktravel skardu — qareeb ke spots_`);
    }
    case 'pkquiz': {
      const [q, a] = pick(PK_QUIZ);
      return reply(`🇵🇰 *Pakistan Quiz*\n\n❓ ${q}\n\n||Answer: ${a}||`);
    }
    case 'urduword': {
      const words = [['Chashm-e-bad-daur', 'A prayer for protection from the evil eye'], ['Dil-joi', 'To delight the heart'], ['Khush-numa', 'Pleasant-looking'], ['Sargarmi', 'Enthusiasm and energy'], ['Waqar', 'Dignity and seriousness'], ['Faraaghat', 'Leisure time'], ['Takhleeq', 'To create something new'], ['Meharbani', 'Kindness and favour']];
      const w = pick(words);
      return reply(`📖 *Urdu lafz*\n\n*${w[0]}*\n_${w[1]}_`);
    }
    case 'azadi': {
      const target = new Date('2027-08-14T00:00:00+05:00');
      const days = Math.ceil((target - Date.now()) / 86400000);
      return reply(`🇵🇰 *Jashn-e-Azadi*\n\n14 August 1947 — Pakistan became independent.\n\n⏳ Next 14 August: *${days} days left*\n\n_Quaid’s motto: “Work, work and only work.”_`);
    }
    case 'polio': {
      return reply(`💉 *Polio campaign*\n\n📌 For campaign dates in your area:\n• NEOC: https://www.endpolio.com.pk\n• Helpline: 1166\n\n_Always give children polio drops — this is a national responsibility._`);
    }
    case 'license': {
      return reply(`🪪 *Driving license (Punjab)*\n\n1. Learner permit: https://dlims.punjab.gov.pk\n2. Pass the online test\n3. Apply for the permanent licence 42 days after the learner permit\n4. Fees: ~PKR 2,500 (learner + permanent)\n\n_Sindh: https://dls.sindh.gov.pk_`);
    }
    case 'visa': {
      const c = arg || '';
      if (!c) return reply(`❌ Country do. Example: ${P()}visa UAE`);
      return reply(`🛂 *Visa — ${c}*\n\n📌 Requirements generally: passport (6+ months), photo, bank statement, itinerary.\n🔗 Apply: search "official ${c} visa application"\n\n_${P()}pknews visa — latest updates_`);
    }
    default:
      return reply('❓ Unknown Pakistan command');
  }
};

module.exports = {
  commands: [
    'dollar', 'gold', 'petrol', 'psx', 'pakcricket', 'psl', 'track', 'tcs', 'leopards', 'echallan', 'pta',
    'siminfo', 'pknews', 'pkholiday', 'loadshedding', 'aqi', 'pkfood', 'pktravel', 'k2', 'pkquiz',
    'urduword', 'azadi', 'polio', 'license', 'visa',
    // extras that belong in this family
    'currency2', 'quake', 'earthquake2', 'light',
  ],
  category: '🇵🇰 PAKISTAN',
  handler,
};
