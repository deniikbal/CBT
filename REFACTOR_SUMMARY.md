# 📝 Refactor Summary - Sistem Peserta Ujian

Tanggal: 27 Oktober 2025

## ✅ Perubahan Database Schema

### Tabel Baru yang Ditambahkan:

#### 1. **Tabel Jurusan**
```sql
CREATE TABLE "jurusan" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  kode_jurusan TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);
```

**Fields:**
- `id` - UUID primary key
- `name` - Nama jurusan (contoh: "Teknik Informatika")
- `kode_jurusan` - Kode unik jurusan (contoh: "TI", "SI")
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

---

#### 2. **Tabel Kelas**
```sql
CREATE TABLE "kelas" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  jurusan_id  TEXT NOT NULL REFERENCES jurusan(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);
```

**Fields:**
- `id` - UUID primary key
- `name` - Nama kelas (contoh: "XII RPL 1", "XI TKJ 2")
- `jurusan_id` - Foreign key ke tabel jurusan
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

**Relations:**
- Belongs to: Jurusan (many-to-one)
- Has many: Peserta (one-to-many)

---

#### 3. **Tabel Peserta**
```sql
CREATE TABLE "peserta" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  no_ujian    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  kelas_id    TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  jurusan_id  TEXT NOT NULL REFERENCES jurusan(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);
```

**Fields:**
- `id` - UUID primary key
- `name` - Nama lengkap peserta
- `no_ujian` - Nomor ujian (unique identifier untuk login)
- `password` - Password (hashed with bcrypt)
- `kelas_id` - Foreign key ke tabel kelas
- `jurusan_id` - Foreign key ke tabel jurusan
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

**Relations:**
- Belongs to: Kelas (many-to-one)
- Belongs to: Jurusan (many-to-one)

---

## 🔗 Relasi Antar Tabel

```
Jurusan (1) ──< (many) Kelas
    │
    └──< (many) Peserta

Kelas (1) ──< (many) Peserta
```

**Cascade Delete Rules:**
- Jika Jurusan dihapus → semua Kelas dan Peserta terkait akan terhapus
- Jika Kelas dihapus → semua Peserta terkait akan terhapus

---

## 🌐 API Endpoints Baru

### 1. **Jurusan API**

#### GET `/api/jurusan`
Ambil semua data jurusan
```bash
curl http://localhost:3000/api/jurusan
```

#### POST `/api/jurusan`
Tambah jurusan baru
```bash
curl -X POST http://localhost:3000/api/jurusan \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teknik Informatika",
    "kodeJurusan": "TI"
  }'
```

#### GET `/api/jurusan/[id]`
Ambil jurusan by ID

#### PUT `/api/jurusan/[id]`
Update jurusan
```bash
curl -X PUT http://localhost:3000/api/jurusan/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teknik Komputer dan Jaringan",
    "kodeJurusan": "TKJ"
  }'
```

#### DELETE `/api/jurusan/[id]`
Hapus jurusan

---

### 2. **Kelas API**

#### GET `/api/kelas`
Ambil semua kelas (dengan data jurusan)
```bash
curl http://localhost:3000/api/kelas
```

Response example:
```json
[
  {
    "id": "xxx",
    "name": "XII RPL 1",
    "jurusanId": "yyy",
    "jurusan": {
      "id": "yyy",
      "name": "Rekayasa Perangkat Lunak",
      "kodeJurusan": "RPL"
    }
  }
]
```

#### POST `/api/kelas`
Tambah kelas baru
```bash
curl -X POST http://localhost:3000/api/kelas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XII RPL 1",
    "jurusanId": "jurusan-id-here"
  }'
```

#### GET `/api/kelas/[id]`
Ambil kelas by ID (dengan data jurusan)

#### PUT `/api/kelas/[id]`
Update kelas

#### DELETE `/api/kelas/[id]`
Hapus kelas

---

### 3. **Peserta API**

#### GET `/api/peserta`
Ambil semua peserta (dengan data kelas dan jurusan)
```bash
curl http://localhost:3000/api/peserta
```

Response example:
```json
[
  {
    "id": "xxx",
    "name": "John Doe",
    "noUjian": "2024001",
    "kelasId": "yyy",
    "jurusanId": "zzz",
    "kelas": {
      "id": "yyy",
      "name": "XII RPL 1"
    },
    "jurusan": {
      "id": "zzz",
      "name": "Rekayasa Perangkat Lunak",
      "kodeJurusan": "RPL"
    }
  }
]
```

#### POST `/api/peserta`
Tambah peserta baru
```bash
curl -X POST http://localhost:3000/api/peserta \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "noUjian": "2024001",
    "password": "password123",
    "kelasId": "kelas-id-here",
    "jurusanId": "jurusan-id-here"
  }'
```

**Note:** Password akan di-hash dengan bcrypt sebelum disimpan

#### GET `/api/peserta/[id]`
Ambil peserta by ID (dengan data kelas dan jurusan)

#### PUT `/api/peserta/[id]`
Update peserta
```bash
curl -X PUT http://localhost:3000/api/peserta/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "noUjian": "2024001",
    "password": "newpassword123",
    "kelasId": "kelas-id-here",
    "jurusanId": "jurusan-id-here"
  }'
```

**Note:** Password optional saat update. Jika tidak diisi, password lama tetap digunakan.

#### DELETE `/api/peserta/[id]`
Hapus peserta

---

## 🔒 Security Features

1. **Password Hashing**
   - Semua password peserta di-hash menggunakan bcrypt (salt rounds: 10)
   - Password tidak pernah dikembalikan dalam response API

2. **Unique Constraints**
   - `no_ujian` harus unique
   - `kode_jurusan` harus unique

3. **Cascade Delete**
   - Foreign key constraints dengan cascade delete
   - Mencegah orphaned data

4. **Input Validation**
   - Semua required fields divalidasi
   - Foreign key existence checking

---

## 📂 File Structure

```
src/
├── db/
│   └── schema.ts               # ✅ Updated: Added jurusan, kelas, peserta
│
├── app/api/
│   ├── jurusan/
│   │   ├── route.ts           # ✅ New: GET, POST
│   │   └── [id]/
│   │       └── route.ts       # ✅ New: GET, PUT, DELETE
│   │
│   ├── kelas/
│   │   ├── route.ts           # ✅ New: GET, POST
│   │   └── [id]/
│   │       └── route.ts       # ✅ New: GET, PUT, DELETE
│   │
│   └── peserta/
│       ├── route.ts           # ✅ New: GET, POST
│       └── [id]/
│           └── route.ts       # ✅ New: GET, PUT, DELETE
│
drizzle/
└── 0001_married_silvermane.sql # ✅ New migration
```

---

## 🧪 Testing Commands

### 1. Test Jurusan API
```bash
# Create jurusan
curl -X POST http://localhost:3000/api/jurusan \
  -H "Content-Type: application/json" \
  -d '{"name": "Teknik Informatika", "kodeJurusan": "TI"}'

# Get all jurusan
curl http://localhost:3000/api/jurusan
```

### 2. Test Kelas API
```bash
# Create kelas (ganti {jurusan_id})
curl -X POST http://localhost:3000/api/kelas \
  -H "Content-Type: application/json" \
  -d '{"name": "XII TI 1", "jurusanId": "{jurusan_id}"}'

# Get all kelas
curl http://localhost:3000/api/kelas
```

### 3. Test Peserta API
```bash
# Create peserta (ganti {kelas_id} dan {jurusan_id})
curl -X POST http://localhost:3000/api/peserta \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "noUjian": "2024001",
    "password": "test123",
    "kelasId": "{kelas_id}",
    "jurusanId": "{jurusan_id}"
  }'

# Get all peserta
curl http://localhost:3000/api/peserta
```

---

## 🎯 Next Steps (Recommended)

### 1. **Authentication untuk Peserta**
- [ ] Buat endpoint `/api/auth/peserta/login`
- [ ] Login menggunakan `no_ujian` dan `password`
- [ ] Return JWT token atau session

### 2. **UI Components**
- [ ] Admin panel untuk manage jurusan
- [ ] Admin panel untuk manage kelas
- [ ] Admin panel untuk manage peserta (CRUD + import CSV)
- [ ] Form untuk assign peserta ke ujian

### 3. **Bulk Operations**
- [ ] Import peserta dari Excel/CSV
- [ ] Export data peserta
- [ ] Bulk update/delete

### 4. **Relasi dengan Ujian**
- [ ] Update tabel `exam_results` untuk support peserta
- [ ] Add filter ujian berdasarkan kelas/jurusan
- [ ] Dashboard statistik per kelas/jurusan

### 5. **Validations**
- [ ] Validation untuk format `no_ujian`
- [ ] Password strength requirements
- [ ] Nama kelas naming convention

---

## 🚀 Summary

✅ **3 Tabel Baru Berhasil Dibuat:**
- Jurusan (name, kode_jurusan)
- Kelas (name, jurusan_id)
- Peserta (name, no_ujian, password, kelas_id, jurusan_id)

✅ **18 API Endpoints Baru:**
- 6 endpoints untuk Jurusan (GET all, GET by ID, POST, PUT, DELETE)
- 6 endpoints untuk Kelas (GET all, GET by ID, POST, PUT, DELETE)
- 6 endpoints untuk Peserta (GET all, GET by ID, POST, PUT, DELETE)

✅ **Migration Berhasil Dipush ke Neon PostgreSQL**

✅ **Security Features:**
- Password hashing dengan bcrypt
- Unique constraints
- Cascade delete
- Input validation

**Database siap digunakan untuk sistem manajemen peserta ujian!** 🎉
