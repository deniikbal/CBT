// Manual script to push shuffle fix migration to database
const { neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
require('dotenv').config();

neonConfig.fetchConnectionCache = true;

async function pushMigration() {
  try {
    console.log('Connecting to database...');
    const db = drizzle(process.env.DATABASE_URL);

    console.log('Adding soal_order column...');
    await db.execute(`ALTER TABLE "hasil_ujian_peserta" ADD COLUMN IF NOT EXISTS "soal_order" text`);
    console.log('✅ soal_order column added');

    console.log('Adding option_mappings column...');
    await db.execute(`ALTER TABLE "hasil_ujian_peserta" ADD COLUMN IF NOT EXISTS "option_mappings" text`);
    console.log('✅ option_mappings column added');

    console.log('\n✅ Migration completed successfully!');
    console.log('Database is now ready to store shuffle order and prevent answer inconsistency.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

pushMigration();
