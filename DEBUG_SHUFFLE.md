# 🐛 DEBUG: Shuffle Masih Berubah Saat Refresh

## Problem Statement

User melaporkan:
```
Soal 1 jawab A → Soal 2 jawab A → Soal 3 jawab A

Setelah refresh:
- Urutan soal berubah
- Pilihan A masih ter-check di semua nomor
- Tapi isi soal di nomor tersebut sudah berbeda!
```

**Root Cause Kemungkinan:**
1. ❌ Dev server belum restart (masih running code lama)
2. ❌ Test menggunakan ujian lama (soalOrder = NULL)
3. ❌ Backend belum save/load soalOrder dengan benar

---

## Step-by-Step Debug

### 1. VERIFY: Dev Server Sudah Restart?

**Check Process:**
```bash
# List proses yang running
ps aux | grep "tsx server"

# Jika ada proses lama (PID), kill
kill -9 [PID]

# Start fresh
cd /home/deniikbal/Documents/project/CBT
npm run dev
```

**Expected Output:**
```
> Ready on http://localhost:3000
> Socket.IO server running...
```

**PENTING:** 
- Jangan gunakan `nodemon` yang auto-reload, bisa skip changes
- Stop semua terminal yang running dev server
- Start 1 terminal baru dengan `npm run dev`

---

### 2. VERIFY: Database State

**Check soal_order di database:**
```bash
node verify-fix.js
```

**Expected:**
```
✅ soal_order column exists
✅ option_mappings column exists
```

**Manual Check:**
```bash
# Connect ke database
node -e "
const { drizzle } = require('drizzle-orm/neon-http');
require('dotenv').config();
const db = drizzle(process.env.DATABASE_URL);

(async () => {
  const result = await db.execute(\`
    SELECT 
      id,
      peserta_id,
      soal_order IS NOT NULL as has_order,
      option_mappings IS NOT NULL as has_mappings,
      status,
      waktu_mulai
    FROM hasil_ujian_peserta
    WHERE status = 'in_progress'
    ORDER BY waktu_mulai DESC
    LIMIT 3
  \`);
  console.log(JSON.stringify(result.rows, null, 2));
})();
"
```

**Look for:**
```json
{
  "has_order": false,   ← ❌ Ini masalah! soalOrder tidak ada
  "has_mappings": false
}
```

**If soal_order = NULL:**
→ Ujian ini dimulai SEBELUM fix
→ Harus start ujian BARU untuk testing!

---

### 3. START UJIAN BARU (Fresh Test)

**JANGAN lanjut ujian lama! Buat ujian baru:**

```
1. Login sebagai admin
2. Buat jadwal ujian baru:
   ┌─────────────────────────────────┐
   │ Nama: "Test Shuffle Debug V3"  │
   │ Bank Soal: [Pilih yang ada]    │
   │ ✅ Acak Soal: ON               │
   │ ✅ Acak Opsi: ON               │
   │ Tanggal: [Hari ini]            │
   │ Jam: [Sekarang + 2 menit]      │
   │ Durasi: 30 menit               │
   └─────────────────────────────────┘

3. Assign 1 peserta

4. Logout admin → Login peserta

5. PENTING: Tunggu sampai waktu ujian
   (Jangan mulai sebelum waktu!)

6. Klik "Mulai Ujian"
```

---

### 4. CHECK BROWSER CONSOLE (CRITICAL!)

**Open Developer Tools (F12) → Console Tab**

**Saat pertama kali mulai ujian:**
```
[START] Returning response with 10 soal
[START] First 3 soal IDs: ['abc12345', 'def67890', 'ghi11223']
[START] Has existing hasil: false
[START] Loaded from saved order: false

[SHUFFLE] Creating new shuffle order  ← ✅ Normal untuk first time
```

**Setelah REFRESH halaman:**
```
[START] Returning response with 10 soal
[START] First 3 soal IDs: ['abc12345', 'def67890', 'ghi11223']  ← Harus SAMA!
[START] Has existing hasil: true
[START] Loaded from saved order: true  ← ✅ HARUS TRUE!

[SHUFFLE] Loading saved shuffle order from database  ← ✅ HARUS INI!
```

**Jika muncul ini saat refresh:**
```
[SHUFFLE] Creating new shuffle order  ← ❌ MASALAH! soalOrder tidak di-load
```

→ Berarti code lama masih running!

---

### 5. CHECK SERVER TERMINAL (Backend Logs)

**Terminal yang running npm run dev:**

**First load:**
```
[SHUFFLE] Creating new shuffle order
[START] Returning response with 10 soal
[START] First 3 soal IDs: abc12345, def67890, ghi11223
```

**After refresh:**
```
[SHUFFLE] Loading saved shuffle order from database  ← HARUS INI!
[START] Returning response with 10 soal
[START] First 3 soal IDs: abc12345, def67890, ghi11223  ← SAMA!
```

**Jika tidak ada log [SHUFFLE]:**
→ Backend tidak hit / cached / old code running

---

### 6. MANUAL TEST SCENARIO

**Detailed step-by-step:**

```
Step 1: Mulai ujian baru
  ✓ Browser console: [SHUFFLE] Creating new shuffle order
  ✓ Server log: Same as above

Step 2: Lihat soal yang tampil
  Soal Nomor 1: [CATAT ID dan Pertanyaan]
  Contoh: 
    - Pertanyaan: "Apa ibu kota Indonesia?"
    - Opsi A: Jakarta
    - Opsi B: Bandung
    - Opsi C: Surabaya
    - Opsi D: Medan

Step 3: Jawab soal 1
  Pilih: A (Jakarta)
  ✓ Radio button A ter-check

Step 4: Pindah ke soal 2
  [CATAT juga]

Step 5: REFRESH HALAMAN (F5)
  
Step 6: CHECK HASIL REFRESH
  ✓ Browser console: [SHUFFLE] Loading saved shuffle order
  ✓ Server log: Same
  ✓ Soal Nomor 1 masih soal yang sama:
      - Pertanyaan: "Apa ibu kota Indonesia?" ← HARUS SAMA!
      - Opsi A: Jakarta ← HARUS SAMA!
      - Radio A: ter-check ← HARUS ter-check!
  
  ❌ JIKA BERBEDA:
      - Pertanyaan: "Apa ibu kota Jawa Barat?" ← SALAH! Soal berubah!
      - Opsi A: Bandung ← SALAH! Opsi berubah!
      - Radio A: ter-check ← Salah soal tapi masih checked!

Step 7: Refresh 3x lagi
  ✓ Setiap refresh: Soal & opsi harus IDENTIK!

Step 8: Check Database
  ```bash
  node -e "
  const { drizzle } = require('drizzle-orm/neon-http');
  require('dotenv').config();
  const db = drizzle(process.env.DATABASE_URL);
  
  (async () => {
    const result = await db.execute(\`
      SELECT 
        soal_order,
        option_mappings
      FROM hasil_ujian_peserta
      WHERE status = 'in_progress'
      ORDER BY waktu_mulai DESC
      LIMIT 1
    \`);
    
    const row = result.rows[0];
    console.log('soal_order:', row.soal_order ? 'EXISTS' : 'NULL');
    console.log('option_mappings:', row.option_mappings ? 'EXISTS' : 'NULL');
    
    if (row.soal_order) {
      const order = JSON.parse(row.soal_order);
      console.log('Order array length:', order.length);
      console.log('First 3 IDs:', order.slice(0, 3));
    }
  })();
  "
  ```

  Expected:
  ```
  soal_order: EXISTS
  option_mappings: EXISTS
  Order array length: 10
  First 3 IDs: ['abc...', 'def...', 'ghi...']
  ```
```

---

### 7. COMMON ISSUES & FIXES

#### Issue A: Console shows "Creating" saat refresh

**Problem:** Backend tidak load saved order

**Debug:**
```bash
# Check jika existingHasil.soalOrder ada
# Di backend start/route.ts tambah log:
console.log('existingHasil:', {
  id: existingHasil?.id,
  hasSoalOrder: !!existingHasil?.soalOrder,
  soalOrderLength: existingHasil?.soalOrder?.length || 0
});
```

**Fix:**
1. Restart dev server
2. Start ujian BARU (jangan lanjut ujian lama)

---

#### Issue B: soalOrder NULL di database

**Problem:** Code belum save ke database

**Check:**
```sql
SELECT soal_order FROM hasil_ujian_peserta 
WHERE id = '[hasil_id]';

-- Expected: JSON array, not NULL
```

**Fix:**
```bash
# Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'hasil_ujian_peserta' 
AND column_name = 'soal_order';

# If not exists, run migration
node push-shuffle-fix.js
```

---

#### Issue C: Code changes tidak apply

**Problem:** Node.js cached old code

**Fix:**
```bash
# Complete restart
pkill -f node
pkill -f tsx
rm -rf .next
rm -rf node_modules/.cache

# Install fresh
npm install

# Start
npm run dev
```

---

### 8. VERIFICATION CHECKLIST

Sebelum declare "FIX WORKS":

- [ ] Dev server di-restart dengan fresh terminal
- [ ] Ujian adalah BARU (bukan lanjut ujian lama)
- [ ] Browser console log: "Loading saved shuffle order" saat refresh
- [ ] Server terminal log: Same as above
- [ ] Database: soal_order EXISTS dan not NULL
- [ ] Soal nomor 1 SAMA setelah refresh 5x
- [ ] Opsi A isinya SAMA setelah refresh 5x
- [ ] Radio button tetap ter-check di soal yang sama
- [ ] Tidak ada "flash" atau "jump" saat refresh

**ALL CHECKBOXES MUST BE ✅ untuk declare success!**

---

### 9. NUCLEAR OPTION (If nothing works)

**Complete Clean & Restart:**

```bash
cd /home/deniikbal/Documents/project/CBT

# 1. Kill all node processes
pkill -f node
pkill -f tsx
pkill -f nodemon

# 2. Clean build artifacts
rm -rf .next
rm -rf node_modules/.cache
rm -rf dist

# 3. Clean git (optional, jika ada uncommitted changes)
git status
git stash  # If needed

# 4. Fresh install
rm -rf node_modules
npm install

# 5. Verify database
node verify-fix.js

# 6. Start clean
npm run dev

# 7. Test
# - Start NEW exam
# - Answer soal 1
# - Refresh 3x
# - Verify consistent
```

---

### 10. PRODUCTION CHECKLIST

Setelah fix confirmed di local:

```bash
# 1. Commit if not yet
git status
git add .
git commit -m "Add debug logs for shuffle verification"

# 2. Push
git push origin main

# 3. Verify Vercel deploy
# - Check https://vercel.com/dashboard
# - Wait for green checkmark (2-5 min)

# 4. Test production
# - Open https://cbt-ecru.vercel.app
# - Start NEW exam
# - Refresh test
# - Verify logs di Vercel Functions tab
```

---

## EXPECTED VS ACTUAL

### ✅ EXPECTED (After Fix):

```
Load 1:
  Nomor 1: Soal A (ID: abc123) → User jawab A (Jakarta)
  Nomor 2: Soal B (ID: def456) → User jawab A (Bandung)
  Nomor 3: Soal C (ID: ghi789) → User jawab A (Surabaya)
  
  Database: soal_order = ['abc123', 'def456', 'ghi789']

Refresh:
  Nomor 1: Soal A (ID: abc123) → A ter-check ✅
  Nomor 2: Soal B (ID: def456) → A ter-check ✅
  Nomor 3: Soal C (ID: ghi789) → A ter-check ✅
  
  Same IDs! Same order! Same answers!
```

### ❌ ACTUAL (Current Bug):

```
Load 1:
  Nomor 1: Soal A → User jawab A (Jakarta)
  Nomor 2: Soal B → User jawab A (Bandung)
  Nomor 3: Soal C → User jawab A (Surabaya)

Refresh:
  Nomor 1: Soal C → A ter-check ❌ (Wrong soal!)
  Nomor 2: Soal A → A ter-check ✅
  Nomor 3: Soal B → A ter-check ✅
  
  Order changed! Backend tidak load saved order!
```

**Diagnosis:** Backend masih shuffle ulang setiap request!

---

## FINAL ANSWER

**Masalah ini PASTI karena salah satu dari:**

1. **Dev server belum restart** ← MOST LIKELY!
2. **Test ujian lama** (soalOrder = NULL)
3. **Code tidak ter-save** (file belum disave?)

**Solution:**
```bash
# STOP semua dev server
pkill -f tsx

# START fresh
npm run dev

# START ujian BARU
# (Jangan lanjut ujian lama!)

# REFRESH 3x
# Check console: "Loading saved shuffle order"
```

Jika masih error setelah ini, screenshot:
1. Browser console (full)
2. Server terminal (full)
3. Database query result (soal_order value)

---

**Good Luck Debugging! 🐛🔍**
