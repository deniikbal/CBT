# 🚀 Cara Akses Admin Panel dengan Sidebar

## ⚠️ PENTING!

**Admin panel dengan sidebar hanya muncul di route `/admin`**

Jangan akses route root `/` karena masih menggunakan layout lama!

---

## 📝 Langkah-langkah:

### 1. Stop semua process yang berjalan
```bash
pkill -9 -f "node.*3000"
pkill -9 -f "tsx.*server"
```

### 2. Start development server
```bash
cd /home/deniikbal/Documents/project/CBT
npm run dev
```

### 3. Akses Admin Panel
```
http://localhost:3000/admin
```

**JANGAN akses:** `http://localhost:3000` (ini masih layout lama)

---

## 🎯 URL yang Tersedia:

### ✅ Dengan Sidebar (ADMIN PANEL):

```
✅ http://localhost:3000/admin
   → Dashboard dengan sidebar

✅ http://localhost:3000/admin/data-master/jurusan
   → Halaman Jurusan dengan sidebar

✅ http://localhost:3000/admin/data-master/kelas
   → Halaman Kelas dengan sidebar

✅ http://localhost:3000/admin/data-master/mata-pelajaran
   → Halaman Mata Pelajaran dengan sidebar

✅ http://localhost:3000/admin/data-master/peserta
   → Halaman Peserta dengan sidebar

✅ http://localhost:3000/admin/persiapan/bank-soal
   → Halaman Bank Soal dengan sidebar
```

### ❌ Tanpa Sidebar (Layout Lama):

```
❌ http://localhost:3000
   → Ini masih layout lama (page.tsx di root)
```

---

## 🎨 Fitur Sidebar

Sidebar akan muncul dengan:

### Menu Utama:
- 📊 **Dashboard** → `/admin`

### Data Master (Expandable):
- 🎓 **Jurusan** → `/admin/data-master/jurusan`
- 🏫 **Kelas** → `/admin/data-master/kelas`  
- 📚 **Mata Pelajaran** → `/admin/data-master/mata-pelajaran`
- 👥 **Peserta** → `/admin/data-master/peserta`

### Persiapan (Expandable):
- 📖 **Bank Soal** → `/admin/persiapan/bank-soal`

### Footer:
- ⚙️ **Pengaturan**
- 🚪 **Keluar**

---

## 🔍 Troubleshooting

### Problem: Sidebar tidak muncul
**Solusi:** Pastikan URL dimulai dengan `/admin`
```
✅ http://localhost:3000/admin
❌ http://localhost:3000
```

### Problem: Port 3000 sudah digunakan
**Solusi:**
```bash
# Kill semua process di port 3000
lsof -ti:3000 | xargs kill -9

# Atau restart
pkill -9 -f "node"
pkill -9 -f "tsx"

# Lalu start lagi
npm run dev
```

### Problem: Error saat compile
**Solusi:**
```bash
# Clean and rebuild
rm -rf .next
npm run dev
```

---

## 📸 Screenshot Guide

### Sidebar akan tampil seperti ini:

```
┌─────────────────────┐
│   CBT Admin         │
│   Computer Based    │
│   Test              │
├─────────────────────┤
│ 📊 Dashboard        │
│                     │
│ 📂 Data Master ▼    │
│   🎓 Jurusan        │
│   🏫 Kelas          │
│   📚 Mata Pelajaran │
│   👥 Peserta        │
│                     │
│ 📝 Persiapan ▼      │
│   📖 Bank Soal      │
│                     │
├─────────────────────┤
│ ⚙️ Pengaturan       │
│ 🚪 Keluar           │
└─────────────────────┘
```

Active page akan di-highlight dengan **warna biru**!

---

## ✅ Testing Checklist

Setelah start server, test URL ini satu per satu:

- [ ] `/admin` - Dashboard tampil dengan sidebar
- [ ] `/admin/data-master/jurusan` - Sidebar muncul, menu Jurusan active (biru)
- [ ] `/admin/data-master/kelas` - Sidebar muncul, menu Kelas active (biru)
- [ ] `/admin/data-master/mata-pelajaran` - Sidebar muncul, menu Mata Pelajaran active (biru)
- [ ] `/admin/data-master/peserta` - Sidebar muncul, menu Peserta active (biru)
- [ ] `/admin/persiapan/bank-soal` - Sidebar muncul, menu Bank Soal active (biru)
- [ ] Klik menu Data Master - expand/collapse bekerja
- [ ] Klik menu Persiapan - expand/collapse bekerja

---

## 🎯 Next: Update Root Route

Jika ingin homepage redirect ke admin:

Edit `/src/app/page.tsx`:
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/admin')
  }, [router])

  return <div>Redirecting...</div>
}
```

Atau buat login page di root dan admin panel di `/admin`.

---

**Semua route dengan `/admin` prefix sudah menggunakan sidebar!** ✅
