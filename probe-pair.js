// RAW pairing probe: fresh creds, ONE code request, log every node WhatsApp
// sends back that mentions link_code_companion_reg. Tells us definitively
// whether the SERVER rejects companion_hello (IP block / rate limit) or whether
// the phone's code entry never reaches us.
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
  getBinaryNodeChild,
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const pino = require('pino');
const { HttpsProxyAgent } = require('https-proxy-agent');
const PROXY = process.env.PROBE_PROXY || 'http://127.0.0.1:18080';
const agent = new HttpsProxyAgent(PROXY);
console.log('[PROXY]', PROXY);

const NUMBER = process.argv[2] || '923134182952';
const DIR = '/tmp/probe_' + Date.now();

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(DIR);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: 'silent' });
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStoreSafe(state) },
    qrTimeout: 300000,
    keepAliveIntervalMs: 300000,
    connectTimeoutMs: 30000,
    agent,
  });

  sock.ev.on('creds.update', saveCreds);

  // Log EVERY incoming binary node whose tag mentions companion reg
  const orig = sock.ws.listeners('message');
  sock.ws.on('message', (data) => {
    const s = data.toString('utf8');
    if (s.includes('link_code_companion_reg') || s.includes('companion') || s.includes('pair-device')) {
      console.log('[RAW IN]', s.slice(0, 700));
    }
  });

  sock.ev.on('connection.update', (u) => {
    console.log('[CONN]', JSON.stringify({ connection: u.connection, hasQr: !!u.qr, isNewLogin: u.isNewLogin }));
    if (u.connection === 'close') {
      const c = u.lastDisconnect?.error?.output?.statusCode;
      console.log('[CLOSE] statusCode=', c, 'msg=', u.lastDisconnect?.error?.message);
      if (c !== DisconnectReason.restartRequired) process.exit(0);
    }
  });

  await new Promise((r) => setTimeout(r, 4000));
  try {
    const code = await sock.requestPairingCode(NUMBER);
    console.log('\n>>> PAIRING CODE =', code, ' (number', NUMBER, ')\n');
  } catch (e) {
    console.log('requestPairingCode threw:', e.message);
  }

  // keep alive 4 minutes, log any iq error
  setTimeout(() => { console.log('probe timeout'); process.exit(0); }, 240000);
})();

function makeCacheableSignalKeyStoreSafe(state) {
  const { makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
  const pino = require('pino');
const { HttpsProxyAgent } = require('https-proxy-agent');
const PROXY = process.env.PROBE_PROXY || 'http://127.0.0.1:18080';
const agent = new HttpsProxyAgent(PROXY);
console.log('[PROXY]', PROXY);
  return makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }));
}
