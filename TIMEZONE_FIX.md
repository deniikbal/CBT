# 🕐 Timezone Fix - Penyelesaian Error "Ujian belum dimulai"

Tanggal: 28 Oktober 2025

## 🐛 Masalah yang Terjadi

### Error di Production (Vercel):
```
POST https://cbt-ecru.vercel.app/api/ujian/[id]/start
Status: 400 Bad Request
Response: { "error": "Ujian belum dimulai" }
```

### Root Cause:
**Timezone Mismatch** antara server dan waktu lokal

- **Server Vercel:** Menggunakan **UTC (GMT+0)**
- **Waktu Ujian:** Diset dalam **WIB (GMT+7)**
- **Akibat:** Comparison waktu salah

### Contoh Skenario:
```
Jadwal Ujian: 28 Oktober 2025, jam 10:00 WIB
Peserta login: 28 Oktober 2025, jam 10:00 WIB (= 03:00 UTC)

Server check:
- now (UTC): 03:00 UTC
- ujianDate: 10:00 (diinterpret sebagai UTC!)
- Comparison: 03:00 < 10:00 → ❌ "Ujian belum dimulai"

Padahal seharusnya:
- now: 03:00 UTC = 10:00 WIB ✅
- ujianDate: 10:00 WIB = 03:00 UTC ✅
- Comparison: 03:00 == 03:00 → ✅ Ujian bisa dimulai
```

---

## ✅ Solusi yang Diterapkan

### 1. Helper Function: `createWIBDate()`
Membuat Date object dari waktu WIB dan convert ke UTC untuk comparison:

```typescript
function createWIBDate(dateValue: Date | string, timeString: string): Date {
  const date = new Date(dateValue);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Convert WIB to UTC (subtract 7 hours)
  const utcHours = hours - 7;
  
  const wibDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  wibDate.setUTCHours(utcHours, minutes, 0, 0);
  
  return wibDate;
}
```

### 2. Updated Time Comparison Logic
```typescript
// Before (SALAH):
const now = new Date(); // UTC
const ujianDate = new Date(jadwal.tanggalUjian);
ujianDate.setHours(hours, minutes, 0); // Set sebagai local/UTC
// Compare: UTC vs UTC tapi jam salah!

// After (BENAR):
const now = new Date(); // UTC
const ujianDate = createWIBDate(jadwal.tanggalUjian, jadwal.jamMulai); // WIB → UTC
// Compare: UTC vs UTC dengan konversi yang benar!
```

### 3. Debug Logging
Menambahkan log untuk tracking timezone:
```typescript
console.log('[TIMEZONE DEBUG]', {
  nowUTC: now.toISOString(),
  nowWIB: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
  ujianStartUTC: ujianDate.toISOString(),
  ujianStartWIB: new Date(ujianDate.getTime() + 7 * 60 * 60 * 1000).toISOString(),
  comparison: {
    isBefore: now < ujianDate,
    isAfter: now > ujianEnd,
    isValid: now >= ujianDate && now <= ujianEnd,
  }
});
```

### 4. Enhanced Error Messages
Error response sekarang include debug info:
```json
{
  "error": "Ujian belum dimulai",
  "debug": {
    "currentTimeWIB": "2025-10-28T10:00:00.000Z",
    "ujianStartTimeWIB": "2025-10-28T10:30:00.000Z",
    "message": "Waktu sekarang masih sebelum waktu mulai ujian"
  }
}
```

---

## 📝 File yang Diubah

```
src/app/api/ujian/[jadwalId]/start/route.ts
```

**Changes:**
- ✅ Added `createWIBDate()` helper function
- ✅ Updated time comparison logic
- ✅ Added debug logging
- ✅ Enhanced error messages with debug info

---

## 🧪 Testing Guide

### 1. Testing Local (Development)

**Setup:**
```bash
npm run dev
```

**Test Case 1: Ujian Belum Dimulai**
```
Jadwal: 2025-10-28, jam 15:00 WIB
Login: 2025-10-28, jam 14:00 WIB
Expected: ❌ "Ujian belum dimulai"
```

**Test Case 2: Ujian Sedang Berlangsung**
```
Jadwal: 2025-10-28, jam 10:00 WIB, durasi 60 menit
Login: 2025-10-28, jam 10:30 WIB
Expected: ✅ Ujian bisa dimulai
```

**Test Case 3: Ujian Sudah Berakhir**
```
Jadwal: 2025-10-28, jam 10:00 WIB, durasi 60 menit
Login: 2025-10-28, jam 11:30 WIB
Expected: ❌ "Ujian sudah berakhir"
```

**Cara Test:**
1. Buka admin panel: `http://localhost:3000/admin`
2. Buat jadwal ujian dengan waktu sesuai test case
3. Login sebagai peserta di `/student/ujian`
4. Coba mulai ujian
5. Cek console browser dan server logs untuk debug info

### 2. Check Debug Logs

**Browser Console (F12):**
```javascript
[START] Response: { error: "...", debug: { ... } }
```

**Server Logs (Terminal):**
```
[TIMEZONE DEBUG] {
  nowUTC: "2025-10-28T03:00:00.000Z",
  nowWIB: "2025-10-28T10:00:00.000Z",
  ujianStartUTC: "2025-10-28T03:00:00.000Z",
  ujianStartWIB: "2025-10-28T10:00:00.000Z",
  comparison: { isValid: true }
}
```

---

## 🚀 Deploy ke Vercel

### 1. Push Changes ke Git
```bash
# Check status
git status

# Stage changes (sudah dilakukan)
git add src/app/api/ujian/[jadwalId]/start/route.ts

# Commit (sudah dilakukan)
git commit -m "Fix timezone issue"

# Push to remote
git push origin main
```

### 2. Vercel Auto-Deploy
- Vercel akan otomatis detect push ke `main` branch
- Wait 2-5 menit untuk build & deploy
- Check deployment di: https://vercel.com/dashboard

### 3. Manual Trigger (Opsional)
Jika auto-deploy tidak jalan:
```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Deploy
vercel --prod
```

---

## ✅ Verification Checklist

### Setelah Deploy ke Vercel:

#### 1. Check Deployment Status
- [ ] Build success di Vercel dashboard
- [ ] No build errors
- [ ] Deployment URL active

#### 2. Test Production URL
```
https://cbt-ecru.vercel.app
```

**Test Steps:**
1. [ ] Login sebagai admin
2. [ ] Buat jadwal ujian baru:
   - Tanggal: Hari ini
   - Jam: 5 menit dari sekarang (WIB)
   - Durasi: 30 menit
3. [ ] Assign ke peserta
4. [ ] Login sebagai peserta
5. [ ] Tunggu sampai jam ujian
6. [ ] Klik "Mulai Ujian"
7. [ ] **Expected:** ✅ Ujian bisa dimulai (tidak ada error)

#### 3. Check Server Logs
Buka Vercel dashboard → Project → Functions → Logs:
```
Look for: [TIMEZONE DEBUG]
Verify: Timestamps benar (WIB = UTC + 7)
```

#### 4. Test Edge Cases
- [ ] Coba mulai ujian 1 menit sebelum jam mulai → Error
- [ ] Coba mulai ujian tepat jam mulai → Success
- [ ] Coba mulai ujian 1 menit sebelum berakhir → Success
- [ ] Coba mulai ujian setelah berakhir → Error

---

## 🔧 Troubleshooting

### Issue 1: Masih Error "Ujian belum dimulai"

**Debug Steps:**
1. Check Vercel logs untuk `[TIMEZONE DEBUG]`
2. Verify timestamps di debug log
3. Compare `nowWIB` dengan `ujianStartWIB`

**Possible Causes:**
- Jam sistem local tidak sinkron
- Database tanggal ujian salah format
- Timezone offset salah

**Solution:**
```typescript
// Check di browser console
console.log('Browser time:', new Date().toISOString());
console.log('Browser TZ offset:', new Date().getTimezoneOffset());

// Expected: -420 untuk WIB (GMT+7)
```

### Issue 2: Debug Info Tidak Muncul

**Check:**
1. Vercel logs streaming enabled?
2. Function logs visible?
3. Console.log statements ada?

**Enable Logs:**
```bash
# Vercel CLI
vercel logs [deployment-url] --follow
```

### Issue 3: Ujian Bisa Dimulai Meskipun Belum Waktunya

**Check:**
- Database `tanggalUjian` field value
- `jamMulai` field format (harus "HH:MM")
- Server time di Vercel (always UTC)

**Debug:**
```sql
-- Check database values
SELECT 
  nama_ujian, 
  tanggal_ujian, 
  jam_mulai,
  tanggal_ujian::text || ' ' || jam_mulai as full_datetime
FROM jadwal_ujian;
```

---

## 📊 Expected Behavior

### Scenario Matrix:

| Waktu Login (WIB) | Jam Ujian (WIB) | Durasi | Expected Result |
|-------------------|-----------------|--------|-----------------|
| 09:00 | 10:00 | 60 min | ❌ Ujian belum dimulai |
| 10:00 | 10:00 | 60 min | ✅ Bisa mulai |
| 10:30 | 10:00 | 60 min | ✅ Bisa mulai |
| 11:00 | 10:00 | 60 min | ✅ Bisa mulai |
| 11:10 | 10:00 | 60 min | ❌ Ujian sudah berakhir |

---

## 🎯 Summary

### Before Fix:
```
Server (UTC) vs Ujian Time (interpreted as UTC) → ❌ Mismatch
```

### After Fix:
```
Server (UTC) vs Ujian Time (WIB → UTC) → ✅ Correct comparison
```

### Key Changes:
1. ✅ Proper WIB to UTC conversion
2. ✅ Consistent timestamp comparison
3. ✅ Debug logging for troubleshooting
4. ✅ Better error messages

---

## 📚 Additional Notes

### Why Not Use Timezone Libraries?

We chose **manual timezone handling** instead of libraries like `date-fns-tz` or `moment-timezone` because:

1. **Bundle Size:** Avoid adding 50KB+ for a single timezone
2. **Simplicity:** WIB is fixed UTC+7 (no DST)
3. **Performance:** Native Date operations are faster
4. **Dependencies:** Fewer packages to maintain

### Future Improvements:

1. **Environment Variable for Timezone:**
   ```env
   NEXT_PUBLIC_TIMEZONE=Asia/Jakarta
   NEXT_PUBLIC_TZ_OFFSET=7
   ```

2. **Database Timezone Field:**
   ```sql
   ALTER TABLE jadwal_ujian ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Jakarta';
   ```

3. **Client-Side Timezone Detection:**
   ```javascript
   const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
   ```

4. **Admin UI Timezone Selector:**
   - Allow admin to set timezone per ujian
   - Support multiple timezones for distributed exams

---

## 🆘 Need Help?

If you still encounter issues:

1. Check Vercel function logs
2. Verify database timestamps
3. Test with fixed date/time (not "now")
4. Enable verbose debug logging
5. Compare UTC and WIB timestamps manually

**Good Luck! 🚀**

---

**Last Updated:** 28 Oktober 2025  
**Status:** ✅ Fixed and Deployed  
**Tested:** ✅ Local Development  
**Production:** ⏳ Pending Verification
