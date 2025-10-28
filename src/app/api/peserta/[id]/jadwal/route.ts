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
    
    console.log('[API] Fetching jadwal for peserta:', pesertaId);

    let jadwalList;
    try {
      jadwalList = await db
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
          bankSoalKode: bankSoal.kodeBankSoal,
        })
        .from(jadwalUjianPeserta)
        .innerJoin(jadwalUjian, eq(jadwalUjianPeserta.jadwalUjianId, jadwalUjian.id))
        .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
        .where(eq(jadwalUjianPeserta.pesertaId, pesertaId))
        .orderBy(desc(jadwalUjian.tanggalUjian));
      
      console.log('[API] Found', jadwalList.length, 'jadwal');
    } catch (queryError) {
      console.error('[API] Database query error:', queryError);
      throw queryError;
    }

    // Check status untuk setiap jadwal
    const jadwalWithStatus = await Promise.all(
      jadwalList.map(async (jadwal, index) => {
        try {
          console.log(`[API] Checking status for jadwal ${index + 1}:`, jadwal.id);
          
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
            id: jadwal.id,
            namaUjian: jadwal.namaUjian,
            bankSoalId: jadwal.bankSoalId,
            tanggalUjian: jadwal.tanggalUjian,
            jamMulai: jadwal.jamMulai,
            durasi: jadwal.durasi,
            minimumPengerjaan: jadwal.minimumPengerjaan,
            acakSoal: jadwal.acakSoal,
            acakOpsi: jadwal.acakOpsi,
            tampilkanNilai: jadwal.tampilkanNilai,
            bankSoal: jadwal.bankSoalKode ? {
              kodeBankSoal: jadwal.bankSoalKode,
            } : null,
            sudahDikerjakan: hasil?.status === 'submitted',
            hasilUjian: hasil || null,
          };
        } catch (mapError) {
          console.error(`[API] Error processing jadwal ${index + 1}:`, mapError);
          // Return jadwal tanpa status jika error
          return {
            id: jadwal.id,
            namaUjian: jadwal.namaUjian,
            bankSoalId: jadwal.bankSoalId,
            tanggalUjian: jadwal.tanggalUjian,
            jamMulai: jadwal.jamMulai,
            durasi: jadwal.durasi,
            minimumPengerjaan: jadwal.minimumPengerjaan,
            acakSoal: jadwal.acakSoal,
            acakOpsi: jadwal.acakOpsi,
            tampilkanNilai: jadwal.tampilkanNilai,
            bankSoal: jadwal.bankSoalKode ? {
              kodeBankSoal: jadwal.bankSoalKode,
            } : null,
            sudahDikerjakan: false,
            hasilUjian: null,
          };
        }
      })
    );

    console.log('[API] Returning', jadwalWithStatus.length, 'jadwal with status');
    return NextResponse.json(jadwalWithStatus);
  } catch (error) {
    console.error('[API] Error fetching jadwal peserta:', error);
    console.error('[API] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Gagal mengambil data jadwal ujian',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
