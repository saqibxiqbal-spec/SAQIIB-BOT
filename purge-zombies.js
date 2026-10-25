// Purge every UNREGISTERED (never-linked) session from MongoDB + disk.
// These are the zombie sessions that reconnect-storm on every boot and make
// WhatsApp answer 428 "Connection Terminated" (everOpened:false).
const fs = require('fs');
const path = require('path');
const mongo = require('./lib/mongo');
const config = require('./config');

(async () => {
  await mongo.init();
  for (let i = 0; i < 40 && !mongo.isReady(); i++) await new Promise(r => setTimeout(r, 500));
  if (!mongo.isReady()) { console.log('MONGO not ready'); process.exit(1); }

  const docs = await mongo.listDocs('sessions');
  console.log('sessions in mongo:', docs.length);

  let purged = 0, kept = 0;
  for (const d of docs) {
    const n = String(d.id);
    const files = (d.data && d.data.files) || {};
    let creds = null;
    try { creds = JSON.parse(files['creds.json']); } catch { creds = null; }
    const registered = !!(creds && creds.registered && creds.me && creds.me.id);
    if (!registered) {
      await mongo.delDoc('sessions', n);
      console.log('  PURGED (never linked):', n, 'registered=', creds && creds.registered);
      purged++;
    } else {
      console.log('  KEPT (linked):', n);
      kept++;
    }
  }

  // wipe disk copies of unregistered dirs too
  const base = path.resolve(config.SESSION_DIR);
  try {
    for (const dir of fs.readdirSync(base)) {
      const p = path.join(base, dir);
      if (!fs.statSync(p).isDirectory()) continue;
      let creds = null;
      try { creds = JSON.parse(fs.readFileSync(path.join(p, 'creds.json'), 'utf8')); } catch {}
      if (!(creds && creds.registered)) {
        fs.rmSync(p, { recursive: true, force: true });
        console.log('  disk wiped:', dir);
      }
    }
  } catch (e) { console.log('disk scan:', e.message); }

  console.log(`\nDONE purged=${purged} kept=${kept}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
