# 🚀 Cara Start Development Server dengan Fix Baru

## IMPORTANT: Restart Server Setelah Pull/Update Code

Setiap kali ada perubahan kode (terutama backend API), **WAJIB restart dev server** agar code baru dijalankan!

---

## 1. Stop Server Lama

### Option A: Ctrl+C di Terminal
```bash
# Jika dev server masih running di terminal
# Tekan Ctrl+C untuk stop
```

### Option B: Kill Process
```bash
cd /home/deniikbal/Documents/project/CBT

# Kill semua proses tsx server
pkill -f "tsx server.ts"

# Atau kill berdasarkan port
lsof -ti:3000 | xargs kill -9
```

---

## 2. Start Server Baru

```bash
cd /home/deniikbal/Documents/project/CBT

# Start dengan npm
npm run dev

# Atau langsung dengan nodemon
nodemon --exec "npx tsx server.ts" --watch server.ts --watch src --ext ts,tsx,js,jsx 2>&1 | tee dev.log
```

**Output yang diharapkan:**
```
> Ready on http://localhost:3000
> Network: Available on all network interfaces (0.0.0.0:3000)
> Socket.IO server running at ws://localhost:3000/api/socketio
```

---

## 3. Verify Fix Berjalan

### A. Check Browser Console

Buka ujian yang sedang aktif dan refresh:

**First time (ujian baru):**
```
[SHUFFLE] Creating new shuffle order
```

**Setelah refresh:**
```
[SHUFFLE] Loading saved shuffle order from database  ← ✅ Harus muncul ini!
```

**Jika masih muncul ini saat refresh:**
```
[SHUFFLE] Creating new shuffle order  ← ❌ Server belum restart!
```

### B. Check Server Terminal

Saat API dipanggil, harus ada log:
```
[SHUFFLE] Creating new shuffle order   (First load)
[SHUFFLE] Loading saved shuffle order from database   (Refresh)
```

### C. Check Database

```bash
node verify-fix.js
```

Harus show:
```
Has soal_order: ✅
Has option_mappings: ✅
```

---

## 4. Testing Checklist

Setelah server restart:

### Test 1: Ujian Lama (Pre-fix)
```
1. Buka ujian yang sudah dimulai sebelum fix
2. Refresh halaman
3. Backend akan auto-create soal_order
4. Refresh lagi → Harus konsisten sekarang ✅
```

### Test 2: Ujian Baru
```
1. Start ujian baru (acak soal & opsi ON)
2. Jawab soal 1 → Pilih A
3. CATAT isi opsi A (misal: "Jakarta")
4. Refresh halaman
5. VERIFY: Opsi A masih "Jakarta" ✅
6. VERIFY: Radio button A masih ter-check ✅
7. Refresh 3x lagi → Semua konsisten ✅
```

---

## Troubleshooting

### Issue: Port 3000 sudah dipakai

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill process yang pakai port 3000
lsof -ti:3000 | xargs kill -9

# Coba start lagi
npm run dev
```

---

### Issue: "Module not found" Error

**Error:**
```
Cannot find module '@/...'
```

**Solution:**
```bash
# Re-install dependencies
npm install

# Clear cache
rm -rf .next
rm -rf node_modules/.cache

# Start lagi
npm run dev
```

---

### Issue: Changes tidak apply

**Problem:** Edit code tapi tidak ada perubahan di browser

**Solution:**
1. **Hard Refresh Browser:** Ctrl+Shift+R (Windows/Linux) atau Cmd+Shift+R (Mac)
2. **Clear Browser Cache**
3. **Restart Dev Server:**
   ```bash
   # Stop (Ctrl+C)
   # Start
   npm run dev
   ```

---

### Issue: Database connection error

**Error:**
```
Error: connect ETIMEDOUT
```

**Solution:**
1. Check `.env` file ada dan valid
2. Check `DATABASE_URL` correct
3. Test connection:
   ```bash
   node verify-fix.js
   ```

---

## Production Deployment

Untuk deploy ke production (Vercel):

```bash
# 1. Commit changes
git add .
git commit -m "Your message"

# 2. Push to main
git push origin main

# 3. Vercel auto-deploy (2-5 min)

# 4. Verify production
# - Open: https://cbt-ecru.vercel.app
# - Start ujian
# - Refresh 3x
# - Verify consistent
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Dev | `npm run dev` |
| Stop Dev | `Ctrl+C` or `pkill -f "tsx server.ts"` |
| Check Port | `lsof -i:3000` |
| Kill Port | `lsof -ti:3000 \| xargs kill -9` |
| Verify Fix | `node verify-fix.js` |
| Check DB | `npm run db:studio` |
| View Logs | `tail -f dev.log` |

---

**Remember:** Always restart server after code changes! 🔄
