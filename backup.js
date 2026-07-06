// backup.js — downloads a snapshot of the live MongoDB data to a local JSON
// file. MongoDB Atlas's free M0 tier has NO automated backups, so it's worth
// running this occasionally (e.g. once a day during the event) as cheap
// insurance. It never writes back to the database — read-only.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node backup.js

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'srinakhon_games';

if (!MONGODB_URI) {
  console.error('✖ ไม่พบ MONGODB_URI — ตั้งค่าตัวแปรแวดล้อมก่อนรัน');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  const appState = await db.collection('appState').findOne({ _id: 'main' });
  const stats = await db.collection('stats').findOne({ _id: 'main' });

  const dir = path.join(__dirname, 'data', 'backups');
  fs.mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({ appState, stats }, null, 2), 'utf8');

  console.log(`✓ บันทึกไฟล์สำรองแล้ว: ${file}`);
  console.log(`  รายการแข่งขัน: ${appState.matches.length} รายการ`);

  await client.close();
}

main().catch((err) => {
  console.error('✖ สำรองข้อมูลไม่สำเร็จ:', err.message);
  process.exit(1);
});
