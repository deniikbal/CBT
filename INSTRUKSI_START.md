# 🚀 Cara Start Admin Panel

## Langkah 1: Bersihkan Process

Jalankan script ini untuk membersihkan semua process:

```bash
pkill -9 -f "nodemon"
pkill -9 -f "tsx"  
pkill -9 -f "node.*CBT"
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

## Langkah 2: Clear Cache

```bash
cd /home/deniikbal/Documents/project/CBT
rm -rf .next
```

## Langkah 3: Start Server

**GUNAKAN SCRIPT INI:**

```bash
cd /home/deniikbal/Documents/project/CBT
./start-admin.sh
```

**ATAU manual:**

```bash
cd /home/deniikbal/Documents/project/CBT
npm run dev
```

## Langkah 4: Tunggu Compile

Tunggu sampai muncul:
```
> Ready on http://127.0.0.1:3000
> Socket.IO server running at ws://127.0.0.1:3000/api/socketio
```

## Langkah 5: Buka Browser

```
http://localhost:3000/admin
```

---

## ⚠️ PENTING!

1. **JANGAN jalankan npm run dev lebih dari 1x**
2. **JANGAN akses root** `/` (gunakan `/admin`)
3. **Tunggu compile** selesai sebelum refresh

---

## 🔍 Jika Ada Masalah

### Port sudah digunakan:
```bash
lsof -ti:3000 | xargs kill -9
```

### Compile error:
```bash
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### Page tidak load:
- Tunggu 30-60 detik untuk first compile
- Refresh browser
- Check console untuk error

---

## ✅ Indikator Berhasil

Setelah buka `http://localhost:3000/admin`, Anda akan lihat:

✅ Sidebar hitam (slate-900) di kiri  
✅ Menu "CBT Admin" di header sidebar  
✅ Menu Dashboard, Data Master, Persiapan  
✅ Content area di kanan (abu-abu terang)

Jika tidak muncul → tunggu compile selesai → refresh
