import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, mataPelajaran, peserta, kelas } from '@/db/schema';
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

    // Get peserta list for this jadwal with kelas info
    const pesertaList = await db
      .select({
        id: peserta.id,
        name: peserta.name,
        noUjian: peserta.noUjian,
        password: peserta.password,
        kelasId: peserta.kelasId,
        kelasName: kelas.name,
      })
      .from(jadwalUjianPeserta)
      .innerJoin(peserta, eq(jadwalUjianPeserta.pesertaId, peserta.id))
      .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
      .where(eq(jadwalUjianPeserta.jadwalUjianId, jadwalId));

    if (pesertaList.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada peserta untuk jadwal ini' },
        { status: 404 }
      );
    }

    // Sort peserta by name (A-Z)
    pesertaList.sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 6;
    const cardWidth = (pageWidth - margin * 3) / 2; // 2 cards per row
    const cardHeight = 40; // height per card - reduced for 6 rows

    // Format tanggal ujian
    const tanggal = new Date(jadwal.tanggalUjian);
    const formattedDate = tanggal.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const jamMulai = jadwal.jamMulai;
    const tahun = new Date().getFullYear();

    // Draw card function - styled for better appearance
    const drawCard = (xPos: number, yPos: number, p: typeof pesertaList[0]) => {
      // Outer border
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(xPos, yPos, cardWidth, cardHeight);

      let y = yPos + 1.5;

      // === HEADER SECTION ===
      // Title - centered with margin top
      doc.setFont(undefined, 'bold');
      doc.setFontSize(7);
      doc.text('KARTU UJIAN PESERTA', xPos + cardWidth / 2, y, { align: 'center' });
      y += 2.5;

      // Exam name (Nama Ujian) - centered
      doc.setFont(undefined, 'bold');
      doc.setFontSize(6);
      const ujianNameLines = doc.splitTextToSize(jadwal.namaUjian, cardWidth - 4);
      doc.text(ujianNameLines, xPos + cardWidth / 2, y, { align: 'center' });
      y += ujianNameLines.length * 1.8 + 1;

      // === DIVIDER LINE ===
      doc.setDrawColor(100);
      doc.line(xPos + 1.5, y, xPos + cardWidth - 1.5, y);
      y += 1.5;

      // === PESERTA INFO SECTION ===
      doc.setFont(undefined, 'normal');
      doc.setFontSize(5.5);
      
      // No Ujian
      doc.setFont(undefined, 'bold');
      doc.text('No Ujian:', xPos + 2, y);
      doc.setFont(undefined, 'normal');
      doc.text(p.noUjian, xPos + 15, y);
      y += 2;

      // Nama
      doc.setFont(undefined, 'bold');
      doc.text('Nama:', xPos + 2, y);
      doc.setFont(undefined, 'normal');
      const nameLines = doc.splitTextToSize(p.name, cardWidth - 20);
      doc.text(nameLines, xPos + 15, y);
      y += nameLines.length * 1.8;

      // Kelas
      doc.setFont(undefined, 'bold');
      doc.text('Kelas:', xPos + 2, y);
      doc.setFont(undefined, 'normal');
      doc.text(p.kelasName || '-', xPos + 15, y);
      y += 2;

      // Password
      doc.setFont(undefined, 'bold');
      doc.text('Password:', xPos + 2, y);
      doc.setFont(undefined, 'normal');
      doc.text(p.password, xPos + 15, y);

      y += 2;

      // === JADWAL SECTION ===
      // Jadwal header - styled box
      doc.setFillColor(200, 200, 200);
      doc.rect(xPos + 1.5, y - 0.5, cardWidth - 3, 2, 'F');
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      
      const colWidth = (cardWidth - 3) / 4;
      doc.text('Tanggal', xPos + 2, y, { align: 'center', maxWidth: colWidth - 0.5 });
      doc.text('Waktu', xPos + 2 + colWidth, y, { align: 'center', maxWidth: colWidth - 0.5 });
      doc.text('Ujian', xPos + 2 + colWidth * 2, y, { align: 'center', maxWidth: colWidth - 0.5 });
      doc.text('Sesi', xPos + 2 + colWidth * 3, y, { align: 'center', maxWidth: colWidth - 0.5 });

      y += 2;

      // Jadwal data - with border
      doc.setDrawColor(150);
      doc.rect(xPos + 1.5, y - 1.5, cardWidth - 3, 2.2);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      
      doc.text(formattedDate, xPos + 2, y, { align: 'center', maxWidth: colWidth - 0.5 });
      doc.text(jamMulai, xPos + 2 + colWidth, y, { align: 'center', maxWidth: colWidth - 0.5 });
      const ujianLines = doc.splitTextToSize(jadwal.namaUjian, colWidth - 1);
      doc.text(ujianLines[0] || jadwal.namaUjian.substring(0, 5), xPos + 2 + colWidth * 2, y, { align: 'center', maxWidth: colWidth - 0.5 });
      doc.text('1', xPos + 2 + colWidth * 3, y, { align: 'center', maxWidth: colWidth - 0.5 });
    };

    // Generate cards - 12 per page (6 rows x 2 columns)
    let cardCount = 0;

    pesertaList.forEach((p) => {
      const cardsPerPage = 12; // 6 rows x 2 columns

      if (cardCount > 0 && cardCount % cardsPerPage === 0) {
        doc.addPage();
      }

      const positionInPage = cardCount % cardsPerPage;
      const col = positionInPage % 2;
      const row = Math.floor(positionInPage / 2);

      const xPos = margin + col * (cardWidth + margin);
      const yPos = margin + row * (cardHeight + margin);

      drawCard(xPos, yPos, p);
      cardCount++;
    });

    // Footer
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, pageHeight - 3, { align: 'center' });

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
