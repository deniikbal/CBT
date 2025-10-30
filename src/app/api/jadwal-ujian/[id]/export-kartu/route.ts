import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, mataPelajaran, peserta } from '@/db/schema';
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

    // Get peserta list for this jadwal
    const pesertaList = await db
      .select({
        id: peserta.id,
        name: peserta.name,
        noUjian: peserta.noUjian,
        password: peserta.password,
      })
      .from(jadwalUjianPeserta)
      .innerJoin(peserta, eq(jadwalUjianPeserta.pesertaId, peserta.id))
      .where(eq(jadwalUjianPeserta.jadwalUjianId, jadwalId));

    if (pesertaList.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada peserta untuk jadwal ini' },
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
    const margin = 8;
    const cardWidth = (pageWidth - margin * 3) / 2; // 2 cards per row
    const cardHeight = 120; // height per card

    // Format tanggal ujian
    const tanggal = new Date(jadwal.tanggalUjian);
    const formattedDate = tanggal.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const jamMulai = jadwal.jamMulai;
    const tahun = new Date().getFullYear();

    // Draw card function
    const drawCard = (xPos: number, yPos: number, p: typeof pesertaList[0]) => {
      // Border
      doc.setDrawColor(0);
      doc.rect(xPos, yPos, cardWidth, cardHeight);

      let y = yPos + 2;

      // Title
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text('KARTU UJIAN PESERTA', xPos + 2, y);
      doc.text(`TAHUN ${tahun}`, xPos + 2, y + 3);

      // Photo placeholder
      doc.setDrawColor(150);
      doc.rect(xPos + cardWidth - 22, yPos + 2, 20, 22);
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.text('Foto', xPos + cardWidth - 17, yPos + 15, { align: 'center' });

      y += 8;

      // "Kartu Ujian" label
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Kartu Ujian', xPos + 2, y);

      y += 6;

      // Peserta info
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.text('No Ujian', xPos + 2, y);
      doc.text(`: ${p.noUjian}`, xPos + 22, y);

      y += 3;
      doc.text('Nama Peserta', xPos + 2, y);
      const nameLines = doc.splitTextToSize(`: ${p.name}`, cardWidth - 24);
      doc.text(nameLines, xPos + 22, y);

      y += 3;
      doc.text('Password', xPos + 2, y);
      doc.text(`: ${p.password}`, xPos + 22, y);

      y += 5;

      // Table headers
      doc.setFont(undefined, 'bold');
      doc.setFontSize(6);
      const colWidth = (cardWidth - 4) / 4;
      
      doc.text('Tanggal', xPos + 2, y);
      doc.text('Waktu', xPos + 2 + colWidth, y);
      doc.text('Ujian', xPos + 2 + colWidth * 2, y);
      doc.text('Sesi', xPos + 2 + colWidth * 3, y);

      // Table line
      doc.setDrawColor(0);
      doc.line(xPos + 2, y + 0.5, xPos + cardWidth - 2, y + 0.5);

      y += 3;

      // Table data
      doc.setFont(undefined, 'normal');
      doc.setFontSize(6);
      doc.text(formattedDate, xPos + 2, y);
      doc.text(jamMulai, xPos + 2 + colWidth, y);
      const ujianLines = doc.splitTextToSize(jadwal.namaUjian, colWidth - 1);
      doc.text(ujianLines, xPos + 2 + colWidth * 2, y);
      doc.text('1', xPos + 2 + colWidth * 3, y);
    };

    // Generate cards - 2 per page, vertical layout
    let cardCount = 0;
    let currentPage = 0;

    pesertaList.forEach((p) => {
      const cardsPerPage = 4; // 2 columns x 2 rows

      if (cardCount > 0 && cardCount % cardsPerPage === 0) {
        doc.addPage();
        currentPage++;
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
