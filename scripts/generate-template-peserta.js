const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Data template dengan contoh
const templateData = [
  {
    'Nama Lengkap': 'Ahmad Syahrul',
    'No Ujian': '2024001',
    'Password': 'password123',
    'Kode Kelas': 'X RPL 1',
    'Kode Jurusan': 'RPL'
  },
  {
    'Nama Lengkap': 'Siti Nurhaliza',
    'No Ujian': '2024002',
    'Password': 'password123',
    'Kode Kelas': 'X RPL 1',
    'Kode Jurusan': 'RPL'
  },
  {
    'Nama Lengkap': 'Budi Santoso',
    'No Ujian': '2024003',
    'Password': 'password123',
    'Kode Kelas': 'XI TKJ 1',
    'Kode Jurusan': 'TKJ'
  }
];

// Create worksheet
const ws = XLSX.utils.json_to_sheet(templateData);

// Set column widths
ws['!cols'] = [
  { wch: 25 }, // Nama Lengkap
  { wch: 15 }, // No Ujian
  { wch: 15 }, // Password
  { wch: 15 }, // Kode Kelas
  { wch: 15 }  // Kode Jurusan
];

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Peserta');

// Create templates directory if not exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const filePath = path.join(templatesDir, 'template-peserta.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Template Excel Peserta berhasil dibuat di: ${filePath}`);
