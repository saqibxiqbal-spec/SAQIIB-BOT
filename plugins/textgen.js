/**
 * TEXTGEN — small text generators & one-liners
 */
const config = require('../config');
const { pick, randInt } = require('../lib/helpers');

const P = () => config.PREFIX;

const FORTUNES = [
  'Today is a happy day for you \u2013 an old friend will join you.',
  'Some news is coming soon. The fruit of patience will be sweet.',
  'Money issue will be resolved, but spend wisely.',
  'Help someone today and you will find happiness in return.',
  'Aik chhoti si koshish bara badlav layegi.',
  'Those who are looking for you are very close - look closely.',
  'Today the lesson of some past mistake will be useful.',
  'The result of hard work is always achieved, not before time.',
];
const ADVICE = [
  'What you can do today, don\'t wait for tomorrow.',
  'Count to 10 when you get angry.',
  'In every relationship listening is more important than speaking.',
  'Save money \u2013 there is no hope of tomorrow.',
  'Health first, everything else later.',
  'Whatever is yours, rely on it.',
  'Learn from new people, don\'t seek old friends.',
  'Sleeping 8 hours \u2014 this is investment, not laziness.',
];
const CONSPIRACY = [
  'Pigeons are basically government spies \u2013 that\'s why they are found in every street.',
  'WiFi router becomes slow at night because it is sleeping inside you.',
  'There is no point in meeting without tea \u2013 this is a corporate conspiracy.',
  'Due to the existence of Monday, calendar companies have created such that weekends are shortened.',
  'The original purpose of adding aloo in biryani was to cook rice.',
];
const DADJOKES = [
  'I told my fridge to stop \u2013 it was turning into ice. \ud83e\uddca',
  'Why is the electricity bill so high? Because he was charged. \u2713',
  'Why did WiFi bother me? Because the connection was weak. \ud83d\udcf6',
  'I was hungry, I ate food - now I "ate" it. \ud83c\udf7d\ufe0f',
  'Chai said: You are my cup of tea. \u2615',
  'Darakht told me to choose alone - main "tree" am. \ud83c\udf33',
];

const handler = async (ctx) => {
  const { command, reply } = ctx;
  switch (command) {
    case 'fortune': return reply(`\ud83d\udd2e *Today's destiny*\n\n${pick(FORTUNES)}`);
    case 'advice': return reply(`💡 *Mashwara*\n\n${pick(ADVICE)}`);
    case 'conspiracy': return reply(`\ud83d\udc7d *Conspiracy theory*${pick(CONSPIRACY)}\n\n_100% funny_ \ud83d\ude04`);
    case 'dadjoke': return reply(`😄 *Dad joke*\n\n${pick(DADJOKES)}`);
    default: return reply('❓ Unknown command');
  }
};

module.exports = {
  commands: ['fortune', 'advice', 'conspiracy', 'dadjoke'],
  category: '✍️ TEXT',
  handler,
};
