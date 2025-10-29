const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Data template dengan contoh
const templateData = [
  {
    'Nama Kelas': 'X RPL 1',
    'Kode Jurusan': 'RPL',
    'Wali Kelas': 'Pak Budi'
  },
  {
    'Nama Kelas': 'X RPL 2',
    'Kode Jurusan': 'RPL',
    'Wali Kelas': 'Bu Ani'
  },
  {
    'Nama Kelas': 'XI TKJ 1',
    'Kode Jurusan': 'TKJ',
    'Wali Kelas': 'Pak Joko'
  }
];

// Create worksheet
const ws = XLSX.utils.json_to_sheet(templateData);

// Set column widths
ws['!cols'] = [
  { wch: 20 }, // Nama Kelas
  { wch: 15 }, // Kode Jurusan
  { wch: 20 }  // Wali Kelas
];

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Kelas');

// Create templates directory if not exists
const templatesDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write file
const filePath = path.join(templatesDir, 'template-kelas.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Template Excel berhasil dibuat di: ${filePath}`);
