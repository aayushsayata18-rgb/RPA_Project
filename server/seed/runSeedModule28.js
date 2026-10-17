require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const seedModule28Reports = require('./seedModule28Reports');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_rpa_db');
  console.log('[Connected to DB]');
  await seedModule28Reports();
  await mongoose.disconnect();
  console.log('[Done seeding Module 28]');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
