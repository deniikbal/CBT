import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, bankSoal } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET riwayat ujian for specific peserta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pesertaId } = await params;

    const riwayatList = await db
      .select({
        id: hasilUjianPeserta.id,
        jadwalUjianId: hasilUjianPeserta.jadwalUjianId,
        waktuMulai: hasilUjianPeserta.waktuMulai,
        waktuSelesai: hasilUjianPeserta.waktuSelesai,
        skor: hasilUjianPeserta.skor,
        skorMaksimal: hasilUjianPeserta.skorMaksimal,
        status: hasilUjianPeserta.status,
        jadwalUjian: {
          id: jadwalUjian.id,
          namaUjian: jadwalUjian.namaUjian,
          tanggalUjian: jadwalUjian.tanggalUjian,
          durasi: jadwalUjian.durasi,
          tampilkanNilai: jadwalUjian.tampilkanNilai,
        },
        bankSoal: {
          id: bankSoal.id,
          kodeBankSoal: bankSoal.kodeBankSoal,
        },
      })
      .from(hasilUjianPeserta)
      .innerJoin(jadwalUjian, eq(hasilUjianPeserta.jadwalUjianId, jadwalUjian.id))
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .where(eq(hasilUjianPeserta.pesertaId, pesertaId))
      .orderBy(desc(hasilUjianPeserta.waktuSelesai));

    // Filter hanya yang sudah submitted
    const submittedOnly = riwayatList.filter(r => r.status === 'submitted');

    // Calculate waktu pengerjaan
    const riwayatWithDuration = submittedOnly.map((riwayat) => {
      let waktuPengerjaan = 0;
      
      if (riwayat.waktuMulai && riwayat.waktuSelesai) {
        const start = new Date(riwayat.waktuMulai);
        const end = new Date(riwayat.waktuSelesai);
        waktuPengerjaan = Math.floor((end.getTime() - start.getTime()) / 60000); // in minutes
      }

      const persentase = riwayat.skor && riwayat.skorMaksimal
        ? Math.round((riwayat.skor / riwayat.skorMaksimal) * 100)
        : 0;

      return {
        id: riwayat.id,
        namaUjian: riwayat.jadwalUjian?.namaUjian || 'Ujian',
        bankSoal: riwayat.bankSoal?.kodeBankSoal || '-',
        tanggalUjian: riwayat.jadwalUjian?.tanggalUjian || riwayat.waktuSelesai,
        waktuPengerjaan,
        nilaiDiperoleh: riwayat.skor || 0,
        nilaiMaksimal: riwayat.skorMaksimal || 0,
        persentase,
        tampilkanNilai: riwayat.jadwalUjian?.tampilkanNilai || false,
        status: riwayat.status,
      };
    });

    return NextResponse.json(riwayatWithDuration);
  } catch (error) {
    console.error('Error fetching riwayat:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat ujian' },
      { status: 500 }
    );
  }
}
