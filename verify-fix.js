// Script to verify shuffle fix is working
const { neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
require('dotenv').config();

neonConfig.fetchConnectionCache = true;

async function verifyFix() {
  try {
    console.log('🔍 Verifying Shuffle Fix Implementation...\n');
    
    const db = drizzle(process.env.DATABASE_URL);

    // 1. Check if columns exist
    console.log('1️⃣  Checking database schema...');
    const columnsResult = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hasil_ujian_peserta'
        AND column_name IN ('soal_order', 'option_mappings')
      ORDER BY column_name
    `);

    if (columnsResult.rows.length === 2) {
      console.log('   ✅ soal_order column exists');
      console.log('   ✅ option_mappings column exists');
    } else {
      console.log('   ❌ Missing columns! Found:', columnsResult.rows.length);
      console.log('   Run: node push-shuffle-fix.js');
      return false;
    }

    // 2. Check for in_progress exams
    console.log('\n2️⃣  Checking active exams...');
    const activeExams = await db.execute(`
      SELECT 
        h.id,
        p.name as peserta_name,
        j.nama_ujian,
        h.soal_order IS NOT NULL as has_soal_order,
        h.option_mappings IS NOT NULL as has_option_mappings,
        h.status,
        h.waktu_mulai
      FROM hasil_ujian_peserta h
      JOIN peserta p ON h.peserta_id = p.id
      JOIN jadwal_ujian j ON h.jadwal_ujian_id = j.id
      WHERE h.status = 'in_progress'
      ORDER BY h.waktu_mulai DESC
      LIMIT 5
    `);

    if (activeExams.rows.length === 0) {
      console.log('   ℹ️  No active exams found (status = in_progress)');
      console.log('   This is OK - start a new exam to test the fix');
    } else {
      console.log(`   Found ${activeExams.rows.length} active exam(s):\n`);
      
      activeExams.rows.forEach((exam, i) => {
        console.log(`   Exam ${i + 1}:`);
        console.log(`     - Peserta: ${exam.peserta_name}`);
        console.log(`     - Ujian: ${exam.nama_ujian}`);
        console.log(`     - Has soal_order: ${exam.has_soal_order ? '✅' : '❌'}`);
        console.log(`     - Has option_mappings: ${exam.has_option_mappings ? '✅' : '❌'}`);
        console.log(`     - Started: ${exam.waktu_mulai}`);
        console.log('');
      });
    }

    // 3. Show sample data if exists
    console.log('\n3️⃣  Sample data from recent exam:');
    const sampleData = await db.execute(`
      SELECT 
        id,
        soal_order,
        option_mappings,
        jawaban,
        status
      FROM hasil_ujian_peserta
      WHERE soal_order IS NOT NULL
      ORDER BY waktu_mulai DESC
      LIMIT 1
    `);

    if (sampleData.rows.length > 0) {
      const sample = sampleData.rows[0];
      console.log('   ID:', sample.id.substring(0, 8) + '...');
      console.log('   Status:', sample.status);
      
      if (sample.soal_order) {
        try {
          const order = JSON.parse(sample.soal_order);
          console.log('   Soal order:', Array.isArray(order) ? `Array[${order.length}]` : 'Invalid');
          console.log('   First 3 IDs:', order.slice(0, 3).map(id => id.substring(0, 8) + '...').join(', '));
        } catch (e) {
          console.log('   Soal order: Invalid JSON');
        }
      }
      
      if (sample.option_mappings) {
        try {
          const mappings = JSON.parse(sample.option_mappings);
          const keys = Object.keys(mappings);
          console.log('   Option mappings:', `${keys.length} soal(s) mapped`);
          if (keys.length > 0) {
            const firstKey = keys[0];
            console.log('   Sample mapping:', mappings[firstKey]);
          }
        } catch (e) {
          console.log('   Option mappings: Invalid JSON');
        }
      }
      
      if (sample.jawaban) {
        try {
          const jawaban = JSON.parse(sample.jawaban);
          const count = Object.keys(jawaban).length;
          console.log('   Jawaban:', `${count} answered`);
        } catch (e) {
          console.log('   Jawaban: Invalid JSON');
        }
      }
    } else {
      console.log('   ℹ️  No exams with soal_order yet');
      console.log('   Start a new exam to populate this data');
    }

    // 4. Check for old exams without order (backward compat)
    console.log('\n4️⃣  Checking backward compatibility...');
    const oldExams = await db.execute(`
      SELECT COUNT(*) as count
      FROM hasil_ujian_peserta
      WHERE status = 'in_progress'
        AND soal_order IS NULL
    `);

    const oldCount = parseInt(oldExams.rows[0].count);
    if (oldCount > 0) {
      console.log(`   ⚠️  Found ${oldCount} old exam(s) without soal_order`);
      console.log('   These will get soal_order on next refresh (auto-fixed)');
    } else {
      console.log('   ✅ All active exams have soal_order');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification Complete!');
    console.log('='.repeat(60));
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start a new exam with acakSoal=true & acakOpsi=true');
    console.log('2. Answer soal 1 (note which option you selected)');
    console.log('3. Refresh page 3-5 times');
    console.log('4. Verify: Same option is still selected');
    console.log('5. Check browser console for:');
    console.log('   - First load: [SHUFFLE] Creating new shuffle order');
    console.log('   - Refresh: [SHUFFLE] Loading saved shuffle order');
    
    return true;

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error('\nError details:', error.message);
    return false;
  }
}

// Run verification
verifyFix().then(success => {
  process.exit(success ? 0 : 1);
});
