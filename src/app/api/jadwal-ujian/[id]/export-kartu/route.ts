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

    // Draw card function - compact for 6 rows per page
    const drawCard = (xPos: number, yPos: number, p: typeof pesertaList[0]) => {
      // Border
      doc.setDrawColor(0);
      doc.rect(xPos, yPos, cardWidth, cardHeight);

      let y = yPos + 2;

      // Title (compact)
      doc.setFont(undefined, 'bold');
      doc.setFontSize(7);
      doc.text('KARTU UJIAN PESERTA', xPos + 2, y);

      // Photo placeholder - smaller
      doc.setDrawColor(150);
      const photoSize = 14;
      doc.rect(xPos + cardWidth - photoSize - 2, yPos + 2, photoSize, photoSize);

      y += 3;

      // Peserta info - compact
      doc.setFont(undefined, 'normal');
      doc.setFontSize(6);
      
      doc.text(`No Ujian: ${p.noUjian}`, xPos + 2, y);
      y += 2.5;
      
      const nameLines = doc.splitTextToSize(`Nama: ${p.name}`, cardWidth - 20);
      doc.text(nameLines, xPos + 2, y);
      y += nameLines.length * 2;
      
      doc.text(`Password: ${p.password}`, xPos + 2, y);

      y += 2.5;

      // Table headers - very compact
      doc.setFont(undefined, 'bold');
      doc.setFontSize(5);
      const colWidth = (cardWidth - 4) / 4;
      
      doc.text('Tgl', xPos + 2, y);
      doc.text('Waktu', xPos + 2 + colWidth, y);
      doc.text('Ujian', xPos + 2 + colWidth * 2, y);
      doc.text('S', xPos + 2 + colWidth * 3, y);

      // Table line
      doc.setDrawColor(0);
      doc.line(xPos + 2, y + 0.3, xPos + cardWidth - 2, y + 0.3);

      y += 2;

      // Table data
      doc.setFont(undefined, 'normal');
      doc.setFontSize(5);
      doc.text(formattedDate, xPos + 2, y);
      doc.text(jamMulai, xPos + 2 + colWidth, y);
      const ujianLines = doc.splitTextToSize(jadwal.namaUjian, colWidth - 1);
      doc.text(ujianLines, xPos + 2 + colWidth * 2, y);
      doc.text('1', xPos + 2 + colWidth * 3, y);
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
