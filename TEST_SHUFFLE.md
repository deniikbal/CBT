# 🧪 Testing Shuffle Fix - Step by Step

## Test Case 1: Ujian Baru (Fresh Start)

### Steps:
```
1. Login sebagai admin
2. Buat jadwal ujian baru:
   - Nama: "Test Shuffle Fix"
   - Bank Soal: Pilih yang ada minimal 5 soal
   - ✅ Acak Soal: ON
   - ✅ Acak Opsi: ON
   - Tanggal: Hari ini
   - Jam: Sekarang + 5 menit
   - Durasi: 30 menit

3. Assign 1 peserta untuk testing

4. Login sebagai peserta

5. Buka halaman ujian
   URL: /student/ujian

6. Klik "Mulai Ujian" pada ujian test

7. **CATAT** urutan soal dan opsi:
   Screenshot atau tulis:
   - Soal 1: [Pertanyaan] → A. [...], B. [...], C. [...], D. [...]
   - Soal 2: [Pertanyaan] → A. [...], B. [...], C. [...], D. [...]
   
8. **Jawab soal 1** → Pilih opsi A (catat isi dari opsi A, misal "Ayam")

9. **Refresh halaman** (F5 atau Ctrl+R)

10. **VERIFY:**
    ✅ Soal 1 masih sama pertanyaannya
    ✅ Opsi A masih berisi "Ayam" (tidak berubah jadi "Bebek")
    ✅ Radio button A masih ter-check
    ✅ Tidak ada perubahan urutan soal
    ✅ Tidak ada perubahan urutan opsi

11. **Refresh lagi 3x** → Verify semua tetap konsisten

12. **Jawab soal 2** → Pilih opsi B

13. **Refresh** → Verify jawaban soal 1 (A) dan soal 2 (B) masih checked

14. **Submit ujian**

15. **Verify grading:**
    - Jika jawaban benar → skor 100%
    - Check di database hasil_ujian_peserta
```

### Expected Database State:
```sql
SELECT 
  id,
  peserta_id,
  soal_order,
  option_mappings,
  jawaban,
  status
FROM hasil_ujian_peserta
WHERE status = 'in_progress'
ORDER BY waktu_mulai DESC
LIMIT 1;
```

**Expected Result:**
```
soal_order: ["uuid-1", "uuid-3", "uuid-5", ...] -- Order setelah shuffle
option_mappings: {
  "uuid-1": { "A": "C", "B": "A", "C": "B", "D": "D" },
  "uuid-3": { "A": "B", "B": "D", "C": "A", "D": "C" },
  ...
}
jawaban: { "uuid-1": "A", "uuid-3": "B", ... }
```

---

## Test Case 2: Browser Console Log Check

### Open Browser Console (F12) saat start ujian:

**First Load (Pertama kali):**
```
[SHUFFLE] Creating new shuffle order
✅ Ini normal untuk first load
```

**Refresh (Load kedua dst):**
```
[SHUFFLE] Loading saved shuffle order from database
✅ Ini harus muncul, berarti load dari cache
```

**Jika muncul ini saat refresh:**
```
[SHUFFLE] Creating new shuffle order  ← ❌ INI MASALAH!
```
→ Berarti soalOrder tidak tersimpan di database

---

## Test Case 3: Verify Grading

### Steps:
```
1. Mulai ujian baru dengan 3 soal simple

2. CATAT jawaban benar dari setiap soal:
   Soal 1: Jawaban benar = B (original dari database)
   Soal 2: Jawaban benar = A (original dari database)
   Soal 3: Jawaban benar = C (original dari database)

3. Setelah shuffle, soal tampil di UI:
   Soal 1: A. [...], B. [...], C. [...], D. [...]
   
4. CARI opsi mana yang isinya = jawaban benar
   Misal setelah shuffle:
   - Opsi A = [isi opsi C original] ← Ini jawaban benar!
   - Opsi B = [isi opsi A original]
   - Opsi C = [isi opsi B original]
   - Opsi D = [isi opsi D original]

5. Pilih opsi A (karena isinya adalah jawaban benar)

6. Refresh → Verify opsi A masih ter-check

7. Submit ujian

8. Verify skor = 100% (1/1 benar)
```

### Check Server Logs (Vercel atau Terminal):
```
[GRADING] Starting grading process
[GRADING] Has option mappings: true
[GRADING] {
  soalId: 'abc12345',
  pesertaAnswer: 'A',        ← Jawaban dari UI
  convertedAnswer: 'C',      ← Converted ke original (B → C)
  correctAnswer: 'C',        ← Jawaban benar original
  isCorrect: true            ← ✅ Match!
}
[GRADING] Result: { benar: 1, total: 1, skor: 1, skorMaksimal: 1 }
```

**Jika log tidak ada `convertedAnswer`:**
→ Mapping tidak digunakan, grading bisa salah!

---

## Test Case 4: Backward Compatibility

**Testing ujian yang sudah dimulai SEBELUM fix:**

### Skenario:
- Ada ujian yang sudah `in_progress`
- `soal_order` = NULL (belum ada)
- `option_mappings` = NULL

### Expected Behavior:
```
Backend harus:
1. Detect soalOrder = NULL
2. Create new shuffle
3. Save ke database
4. Return ke frontend

✅ Ujian lama tetap bisa dilanjutkan
✅ Setelah refresh pertama, jadi konsisten
```

### Test:
```
1. Cari ujian yang `in_progress` dengan soal_order = NULL
   
   SELECT * FROM hasil_ujian_peserta
   WHERE status = 'in_progress' 
   AND soal_order IS NULL;

2. Buka ujian tersebut di browser

3. Refresh

4. Check database lagi:
   
   SELECT soal_order FROM hasil_ujian_peserta WHERE id = '[id]';
   
   ✅ soal_order sekarang harus ada (not NULL)
```

---

## Test Case 5: Multiple Refresh Stress Test

### Steps:
```
1. Mulai ujian

2. Jawab soal 1 → pilih A (isi: "Jakarta")

3. Refresh 10x berturut-turut dengan cepat

4. Verify setelah setiap refresh:
   ✅ Opsi A masih berisi "Jakarta"
   ✅ Radio button A masih ter-check
   ✅ Tidak ada flash/flicker urutan soal

5. Jawab soal 2 → pilih C

6. Refresh 10x lagi

7. Verify:
   ✅ Soal 1 = A masih checked
   ✅ Soal 2 = C masih checked
```

---

## Debugging Commands

### 1. Check Database:
```sql
-- Check if soal_order exists for current ujian
SELECT 
  h.id,
  p.name as peserta_name,
  j.nama_ujian,
  h.soal_order IS NOT NULL as has_order,
  h.option_mappings IS NOT NULL as has_mappings,
  h.status,
  h.waktu_mulai
FROM hasil_ujian_peserta h
JOIN peserta p ON h.peserta_id = p.id
JOIN jadwal_ujian j ON h.jadwal_ujian_id = j.id
WHERE h.status = 'in_progress'
ORDER BY h.waktu_mulai DESC;
```

### 2. Inspect Mappings:
```sql
-- View actual mapping data
SELECT 
  id,
  soal_order::json,
  option_mappings::json
FROM hasil_ujian_peserta
WHERE id = '[hasil_id]';
```

### 3. Browser DevTools:
```javascript
// Check localStorage
console.log('Jawaban:', localStorage.getItem('ujian_[jadwalId]_jawaban'))

// Check state (di React DevTools)
// Look for: jawaban, soalList, hasilId
```

### 4. Network Tab (F12):
```
Look for:
- POST /api/ujian/[jadwalId]/start
  Response: { soal: [...], existingAnswers: {...}, ... }
  
- POST /api/ujian/[jadwalId]/save-progress
  Request: { jawaban: {...} }
  
Verify: Response soal order sama setiap kali
```

---

## Common Issues & Solutions

### Issue 1: Soal masih berubah saat refresh

**Possible Causes:**
1. soal_order tidak tersimpan di database
2. Backend tidak load soal_order
3. Migration belum dijalankan

**Debug:**
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hasil_ujian_peserta'
  AND column_name IN ('soal_order', 'option_mappings');

-- Should return 2 rows
```

**Solution:**
```bash
# Re-run migration
node push-shuffle-fix.js
```

---

### Issue 2: Opsi masih berubah saat refresh

**Possible Causes:**
1. option_mappings tidak tersimpan
2. Mapping tidak di-apply saat load
3. acakOpsi = false tapi masih shuffle

**Debug:**
```
Check browser console:
[SHUFFLE] Loading saved shuffle order from database

Check database:
SELECT option_mappings FROM hasil_ujian_peserta WHERE id = '...'

Expected: JSON object dengan mapping
Actual: null atau empty → ❌ MASALAH
```

---

### Issue 3: Grading salah

**Possible Causes:**
1. Submit endpoint tidak convert answer
2. Mapping tidak cocok dengan jawaban

**Debug:**
```
Check server logs saat submit:
[GRADING] Has option mappings: false  ← ❌ Harusnya true

[GRADING] {
  pesertaAnswer: 'A',
  convertedAnswer: 'A',  ← ❌ Harusnya di-convert
  correctAnswer: 'C',
  isCorrect: false
}
```

**Solution:**
Re-check submit endpoint, pastikan:
```typescript
const optionMappings = hasil.optionMappings 
  ? JSON.parse(hasil.optionMappings) 
  : {};
```

---

## Success Criteria

✅ **PASS jika:**
1. Urutan soal konsisten setelah refresh 5x
2. Urutan opsi konsisten setelah refresh 5x
3. Jawaban tetap ter-check setelah refresh
4. Grading benar (100% jika jawab semua benar)
5. Server logs show "Loading saved shuffle order"
6. Database has soal_order & option_mappings

❌ **FAIL jika:**
1. Urutan berubah saat refresh
2. Opsi "Ayam" jadi "Bebek"
3. Jawaban ter-uncheck atau pindah opsi
4. Grading salah meskipun jawab benar
5. Server logs show "Creating new shuffle order" saat refresh

---

## Production Testing Checklist

Setelah deploy ke Vercel:

- [ ] Test Case 1: Fresh start → Refresh → Konsisten
- [ ] Test Case 2: Console logs correct
- [ ] Test Case 3: Grading accurate
- [ ] Test Case 4: Old exams still work
- [ ] Test Case 5: Stress test 10x refresh
- [ ] Database inspection: soal_order exists
- [ ] Vercel logs: No errors
- [ ] Multiple students: No conflicts

---

**Good Luck Testing! 🧪**
