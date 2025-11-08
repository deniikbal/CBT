import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, kelas, peserta } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { parseLocalWIBDateTime } from '@/lib/timezone';

// GET all jadwal ujian
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const createdById = searchParams.get('createdById')

    let query = db
      .select({
        id: jadwalUjian.id,
        namaUjian: jadwalUjian.namaUjian,
        bankSoalId: jadwalUjian.bankSoalId,
        createdBy: jadwalUjian.createdBy,
        kelasId: jadwalUjian.kelasId,
        tanggalUjian: jadwalUjian.tanggalUjian,
        jamMulai: jadwalUjian.jamMulai,
        durasi: jadwalUjian.durasi,
        minimumPengerjaan: jadwalUjian.minimumPengerjaan,
        acakSoal: jadwalUjian.acakSoal,
        acakOpsi: jadwalUjian.acakOpsi,
        tampilkanNilai: jadwalUjian.tampilkanNilai,
        resetPelanggaranOnEnable: jadwalUjian.resetPelanggaranOnEnable,
        autoSubmitOnViolation: jadwalUjian.autoSubmitOnViolation,
        isActive: jadwalUjian.isActive,
        createdAt: jadwalUjian.createdAt,
        bankSoal: {
          id: bankSoal.id,
          kodeBankSoal: bankSoal.kodeBankSoal,
        },
        kelas: {
          id: kelas.id,
          name: kelas.name,
        },
      })
      .from(jadwalUjian)
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .leftJoin(kelas, eq(jadwalUjian.kelasId, kelas.id))

    // Filter by createdBy if provided
    if (createdById) {
      query = query.where(eq(jadwalUjian.createdBy, createdById))
    }

    const jadwalList = await query.orderBy(desc(jadwalUjian.createdAt))

    // Detect kelas from peserta for each jadwal
    const jadwalWithKelas = await Promise.all(
      jadwalList.map(async (jadwal) => {
        // Get all peserta for this jadwal
        const pesertaList = await db
          .select({
            kelasId: peserta.kelasId,
            kelasName: kelas.name,
          })
          .from(jadwalUjianPeserta)
          .innerJoin(peserta, eq(jadwalUjianPeserta.pesertaId, peserta.id))
          .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
          .where(eq(jadwalUjianPeserta.jadwalUjianId, jadwal.id))

        // Detect kelas
        if (pesertaList.length === 0) {
          // No peserta
          return { ...jadwal, kelas: null }
        }

        // Get unique kelas
        const uniqueKelas = [...new Set(pesertaList.map(p => p.kelasId).filter(Boolean))]
        
        if (uniqueKelas.length === 1) {
          // All peserta from same kelas
          const kelasInfo = pesertaList.find(p => p.kelasId === uniqueKelas[0])
          return {
            ...jadwal,
            kelas: kelasInfo?.kelasName ? {
              id: uniqueKelas[0],
              name: kelasInfo.kelasName
            } : null
          }
        } else if (uniqueKelas.length > 1) {
          // Mixed kelas
          return {
            ...jadwal,
            kelas: {
              id: 'mixed',
              name: 'Semua Kelas'
            }
          }
        } else {
          // No kelas info
          return { ...jadwal, kelas: null }
        }
      })
    )

    return NextResponse.json(jadwalWithKelas);
  } catch (error) {
    console.error('Error fetching jadwal ujian:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data jadwal ujian' },
      { status: 500 }
    );
  }
}

// POST create new jadwal ujian
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      namaUjian,
      bankSoalId,
      pesertaIds,
      tanggalUjian,
      jamMulai,
      durasi,
      minimumPengerjaan,
      acakSoal,
      acakOpsi,
      tampilkanNilai,
      resetPelanggaranOnEnable,
      autoSubmitOnViolation,
      isActive,
      createdBy,
    } = body;

    // Validate required fields
    if (!namaUjian || !bankSoalId || !tanggalUjian || !jamMulai || !durasi || !createdBy) {
      return NextResponse.json(
        { error: 'Nama ujian, bank soal, tanggal, jam mulai, durasi, dan userId harus diisi' },
        { status: 400 }
      );
    }

    if (!pesertaIds || pesertaIds.length === 0) {
      return NextResponse.json(
        { error: 'Minimal harus ada 1 peserta' },
        { status: 400 }
      );
    }

    // Check if bank soal exists
    const [bankSoalExists] = await db
      .select()
      .from(bankSoal)
      .where(eq(bankSoal.id, bankSoalId))
      .limit(1);

    if (!bankSoalExists) {
      return NextResponse.json(
        { error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      );
    }

    // Parse tanggalUjian sebagai WIB (convert dari YYYY-MM-DD ke UTC)
    // jamMulai adalah HH:mm dalam WIB
    const ujianDateUTC = parseLocalWIBDateTime(tanggalUjian, jamMulai.split(':')[0] + ':00');
    
    // Create jadwal ujian
    const [newJadwal] = await db
      .insert(jadwalUjian)
      .values({
        namaUjian,
        bankSoalId,
        createdBy,
        kelasId: null,
        tanggalUjian: ujianDateUTC,
        jamMulai,
        durasi,
        minimumPengerjaan: minimumPengerjaan || null,
        acakSoal: acakSoal || false,
        acakOpsi: acakOpsi || false,
        tampilkanNilai: tampilkanNilai !== false,
        resetPelanggaranOnEnable: resetPelanggaranOnEnable !== false,
        autoSubmitOnViolation: autoSubmitOnViolation || false,
        isActive: isActive !== false,
      })
      .returning();

    // Insert peserta
    const pesertaValues = pesertaIds.map((pesertaId: string) => ({
      jadwalUjianId: newJadwal.id,
      pesertaId,
    }));

    await db.insert(jadwalUjianPeserta).values(pesertaValues);

    return NextResponse.json(newJadwal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating jadwal ujian:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat jadwal ujian' },
      { status: 500 }
    );
  }
}
