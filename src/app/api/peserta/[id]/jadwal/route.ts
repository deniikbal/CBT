import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, kelas, hasilUjianPeserta } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET jadwal ujian for specific peserta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pesertaId } = await params;

    const jadwalList = await db
      .select({
        id: jadwalUjian.id,
        namaUjian: jadwalUjian.namaUjian,
        bankSoalId: jadwalUjian.bankSoalId,
        tanggalUjian: jadwalUjian.tanggalUjian,
        jamMulai: jadwalUjian.jamMulai,
        durasi: jadwalUjian.durasi,
        minimumPengerjaan: jadwalUjian.minimumPengerjaan,
        acakSoal: jadwalUjian.acakSoal,
        acakOpsi: jadwalUjian.acakOpsi,
        tampilkanNilai: jadwalUjian.tampilkanNilai,
        bankSoal: {
          id: bankSoal.id,
          kodeBankSoal: bankSoal.kodeBankSoal,
        },
      })
      .from(jadwalUjianPeserta)
      .innerJoin(jadwalUjian, eq(jadwalUjianPeserta.jadwalUjianId, jadwalUjian.id))
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .where(eq(jadwalUjianPeserta.pesertaId, pesertaId))
      .orderBy(desc(jadwalUjian.tanggalUjian));

    // Check status untuk setiap jadwal
    const jadwalWithStatus = await Promise.all(
      jadwalList.map(async (jadwal) => {
        const [hasil] = await db
          .select({
            id: hasilUjianPeserta.id,
            status: hasilUjianPeserta.status,
            skor: hasilUjianPeserta.skor,
            skorMaksimal: hasilUjianPeserta.skorMaksimal,
            waktuSelesai: hasilUjianPeserta.waktuSelesai,
          })
          .from(hasilUjianPeserta)
          .where(
            and(
              eq(hasilUjianPeserta.jadwalUjianId, jadwal.id),
              eq(hasilUjianPeserta.pesertaId, pesertaId)
            )
          )
          .limit(1);

        return {
          ...jadwal,
          sudahDikerjakan: hasil?.status === 'submitted',
          hasilUjian: hasil || null,
        };
      })
    );

    return NextResponse.json(jadwalWithStatus);
  } catch (error) {
    console.error('Error fetching jadwal peserta:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data jadwal ujian' },
      { status: 500 }
    );
  }
}
