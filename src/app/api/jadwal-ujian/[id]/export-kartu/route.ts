import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, bankSoal, mataPelajaran } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { jsPDF } from 'jspdf';

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

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Format tanggal
    const tanggal = new Date(jadwal.tanggalUjian);
    const formattedDate = tanggal.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('KARTU UJIAN', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Sistem Ujian Berbasis Komputer (CBT)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Line separator
    doc.setDrawColor(0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Content - Detail Ujian
    const drawField = (label: string, value: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text(label, margin, yPosition);
      
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(value, pageWidth - margin * 2 - 60);
      doc.text(lines, margin + 60, yPosition);
      
      yPosition += Math.max(6, lines.length * 5);
    };

    drawField('Nama Ujian:', jadwal.namaUjian);
    drawField('Mata Pelajaran:', jadwal.matpelName || '-');
    drawField('Kode Bank Soal:', jadwal.bankSoalKode || '-');
    drawField('Tanggal:', formattedDate);
    drawField('Jam Mulai:', jadwal.jamMulai);
    drawField('Durasi:', `${jadwal.durasi} menit`);

    yPosition += 4;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Petunjuk Mengerjakan
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('PETUNJUK MENGERJAKAN:', margin, yPosition);
    yPosition += 7;

    const instructions = [
      '1. Pastikan Anda login dengan akun yang sesuai sebelum mengerjakan ujian',
      '2. Bacalah setiap soal dengan teliti sebelum menjawab',
      '3. Waktu yang disediakan adalah durasi ujian yang telah ditentukan',
      '4. Jangan meninggalkan ujian sebelum waktu berakhir kecuali telah selesai',
      '5. Jawaban Anda akan otomatis tersimpan saat Anda memilih opsi jawaban',
      '6. Pastikan koneksi internet stabil selama mengerjakan ujian',
      '7. Dilarang menggunakan alat komunikasi atau mencari bantuan dari pihak lain',
    ];

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    instructions.forEach((instruction) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      const lines = doc.splitTextToSize(instruction, pageWidth - margin * 2 - 5);
      doc.text(lines, margin + 2, yPosition);
      yPosition += lines.length * 5 + 1;
    });

    yPosition += 4;
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Tanda Tangan
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('Pengawas Ujian:', margin, yPosition);
    doc.text('Peserta Ujian:', pageWidth / 2 + 10, yPosition);

    yPosition += 28;
    // Lines for signature
    doc.line(margin, yPosition, margin + 40, yPosition);
    doc.line(pageWidth / 2 + 10, yPosition, pageWidth / 2 + 50, yPosition);

    doc.setFontSize(8);
    doc.text('(...........................)', margin + 3, yPosition + 3);
    doc.text('(...........................)', pageWidth / 2 + 13, yPosition + 3);

    // Footer
    doc.setFontSize(7);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `Kartu-Ujian-${jadwal.namaUjian.replace(/\s+/g, '-')}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Gagal menggenerate kartu ujian PDF' },
      { status: 500 }
    );
  }
}
