import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, mataPelajaran, peserta, kelas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { KartuUjianPDF } from '@/components/pdf/KartuUjianPDF';

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

    // Generate PDF using React PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(KartuUjianPDF, {
        pesertaList: pesertaList.map((p) => ({
          id: p.id,
          name: p.name,
          noUjian: p.noUjian,
          password: p.password,
          kelasName: p.kelasName,
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
