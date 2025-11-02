import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, mataPelajaran, peserta, kelas } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { KartuUjianPDF } from '@/components/pdf/KartuUjianPDF';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jadwalId } = await params;
    const { searchParams } = new URL(request.url);
    const filterKelasId = searchParams.get('kelasId'); // Get kelasId from query params

    // Get jadwal with related data
    const [jadwal] = await db
      .select({
        id: jadwalUjian.id,
        namaUjian: jadwalUjian.namaUjian,
        tanggalUjian: jadwalUjian.tanggalUjian,
        jamMulai: jadwalUjian.jamMulai,
        durasi: jadwalUjian.durasi,
        kelasId: jadwalUjian.kelasId,
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
    let whereConditions: any[] = [eq(jadwalUjianPeserta.jadwalUjianId, jadwalId)];
    
    // If user selected specific kelas in filter, apply that filter
    if (filterKelasId && filterKelasId !== 'all') {
      whereConditions.push(eq(peserta.kelasId, filterKelasId));
    }
    // Otherwise, if jadwal has specific kelas, filter by that kelas
    else if (jadwal.kelasId) {
      whereConditions.push(eq(peserta.kelasId, jadwal.kelasId));
    }

    const pesertaList = await db
      .select({
        id: peserta.id,
        name: peserta.name,
        noUjian: peserta.noUjian,
        password: peserta.unhashedPassword,
        kelasId: peserta.kelasId,
        kelasName: kelas.name,
      })
      .from(jadwalUjianPeserta)
      .innerJoin(peserta, eq(jadwalUjianPeserta.pesertaId, peserta.id))
      .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
      .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]);

    if (pesertaList.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada peserta untuk jadwal ini' },
        { status: 404 }
      );
    }

    // Group peserta by kelas
    const groupedByKelas = pesertaList.reduce(
      (acc, p) => {
        const kelasKey = p.kelasName || 'Tanpa Kelas';
        if (!acc[kelasKey]) {
          acc[kelasKey] = [];
        }
        acc[kelasKey].push(p);
        return acc;
      },
      {} as Record<string, typeof pesertaList>
    );

    // Natural sort for kelas names (X1, X2, X3... not X1, X10, X11)
    const naturalSort = (a: string, b: string) => {
      const aStr = a.replace(/\d+/g, (match) => match.padStart(10, '0'));
      const bStr = b.replace(/\d+/g, (match) => match.padStart(10, '0'));
      return aStr.localeCompare(bStr, 'id-ID');
    };

    // Create array of kelas with their peserta, sorted by kelas name (natural sort)
    const pesertaByKelas = Object.keys(groupedByKelas)
      .sort(naturalSort)
      .map((kelasName) => ({
        kelasName,
        peserta: groupedByKelas[kelasName].sort((a, b) =>
          a.name.localeCompare(b.name, 'id-ID')
        ),
      }));

    // Generate PDF using React PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(KartuUjianPDF, {
        pesertaByKelas: pesertaByKelas.map((group) => ({
          kelasName: group.kelasName,
          peserta: group.peserta.map((p) => ({
            id: p.id,
            name: p.name,
            noUjian: p.noUjian,
            password: p.password,
            kelasName: p.kelasName,
          })),
        })),
        examData: {
          namaUjian: jadwal.namaUjian,
          tanggalUjian: jadwal.tanggalUjian,
          jamMulai: jadwal.jamMulai,
          durasi: jadwal.durasi,
          matpelName: jadwal.matpelName,
        },
      })
    );
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
