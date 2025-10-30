import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, bankSoal, mataPelajaran } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jadwalId } = await params;

    // Get jadwal with related data
    const [jadwal] = await db
      .select({
        id: jadwalUjian.id,
        namaUjian: jadwalUjian.namaUjian,
        tanggalUjian: jadwalUjian.tanggalUjian,
        jamMulai: jadwalUjian.jamMulai,
        durasi: jadwalUjian.durasi,
        bankSoalKode: bankSoal.kodeBankSoal,
        matpelName: mataPelajaran.name,
      })
      .from(jadwalUjian)
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .leftJoin(mataPelajaran, eq(bankSoal.matpelId, mataPelajaran.id))
      .where(eq(jadwalUjian.id, jadwalId))
      .limit(1);

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    // Set response headers
    const filename = `Kartu-Ujian-${jadwal.namaUjian.replace(/\s+/g, '-')}.pdf`;
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Format tanggal
    const tanggal = new Date(jadwal.tanggalUjian);
    const formattedDate = tanggal.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('KARTU UJIAN', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Sistem Ujian Berbasis Komputer (CBT)', { align: 'center' });
    doc.moveTo(40, doc.y + 5).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Content
    doc.fontSize(10).font('Helvetica');

    const addField = (label: string, value: string) => {
      doc.font('Helvetica-Bold').text(label, { width: 140 });
      doc.moveUp();
      doc.font('Helvetica').text(value, 160, doc.y, { width: 350 });
      doc.moveDown();
    };

    addField('Nama Ujian:', jadwal.namaUjian);
    addField('Mata Pelajaran:', jadwal.matpelName || '-');
    addField('Kode Bank Soal:', jadwal.bankSoalKode || '-');
    addField('Tanggal:', formattedDate);
    addField('Jam Mulai:', jadwal.jamMulai);
    addField('Durasi:', `${jadwal.durasi} menit`);

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Petunjuk
    doc.fontSize(11).font('Helvetica-Bold').text('PETUNJUK MENGERJAKAN:', { underline: true });
    doc.fontSize(9).font('Helvetica');
    doc.list([
      'Pastikan Anda login dengan akun yang sesuai sebelum mengerjakan ujian',
      'Bacalah setiap soal dengan teliti sebelum menjawab',
      'Waktu yang disediakan adalah durasi ujian yang telah ditentukan',
      'Jangan meninggalkan ujian sebelum waktu berakhir kecuali telah selesai',
      'Jawaban Anda akan otomatis tersimpan saat Anda memilih opsi jawaban',
      'Pastikan koneksi internet stabil selama mengerjakan ujian',
      'Dilarang menggunakan alat komunikasi atau mencari bantuan dari pihak lain',
    ]);

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Tanda tangan
    doc.fontSize(10).font('Helvetica');
    doc.text('Pengawas Ujian:', 80, doc.y);
    doc.text('Peserta Ujian:', 350, doc.y - 25);

    const signatureY = doc.y + 40;
    doc.moveTo(60, signatureY).lineTo(150, signatureY).stroke();
    doc.moveTo(330, signatureY).lineTo(420, signatureY).stroke();

    doc.fontSize(8).text('(...........................)', 70, signatureY + 5);
    doc.text('(...........................)', 340, signatureY + 5);

    // Footer
    doc.fontSize(7).text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

    // Send PDF
    const responseStream = new ReadableStream({
      start(controller) {
        doc.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        doc.on('end', () => {
          controller.close();
        });
        doc.end();
      },
    });

    return new NextResponse(responseStream, {
      headers,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Gagal menggenerate kartu ujian PDF' },
      { status: 500 }
    );
  }
}
