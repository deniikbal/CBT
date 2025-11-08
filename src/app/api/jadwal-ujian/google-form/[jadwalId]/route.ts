import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, bankSoal, jadwalUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { parseLocalWIBDateTime, extractWIBDateStr } from '@/lib/timezone';

// GET Google Form URL dengan access control
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const { searchParams } = new URL(request.url);
    const pesertaId = searchParams.get('pesertaId');

    if (!pesertaId) {
      return NextResponse.json(
        { error: 'pesertaId diperlukan' },
        { status: 400 }
      );
    }

    // Get jadwal ujian dengan bank soal
    const [jadwal] = await db
      .select({
        id: jadwalUjian.id,
        namaUjian: jadwalUjian.namaUjian,
        tanggalUjian: jadwalUjian.tanggalUjian,
        jamMulai: jadwalUjian.jamMulai,
        durasi: jadwalUjian.durasi,
        isActive: jadwalUjian.isActive,
        bankSoalId: jadwalUjian.bankSoalId,
        sourceType: bankSoal.sourceType,
        googleFormUrl: bankSoal.googleFormUrl,
      })
      .from(jadwalUjian)
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .where(eq(jadwalUjian.id, jadwalId))
      .limit(1);

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if jadwal is active
    if (!jadwal.isActive) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak aktif' },
        { status: 403 }
      );
    }

    // Check if it's a Google Form
    if (jadwal.sourceType !== 'GOOGLE_FORM' || !jadwal.googleFormUrl) {
      return NextResponse.json(
        { error: 'Jadwal ini tidak menggunakan Google Form' },
        { status: 400 }
      );
    }

    // Verify peserta is assigned to this jadwal
    const [pesertaAssignment] = await db
      .select({ id: jadwalUjianPeserta.id })
      .from(jadwalUjianPeserta)
      .where(
        and(
          eq(jadwalUjianPeserta.jadwalUjianId, jadwalId),
          eq(jadwalUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!pesertaAssignment) {
      return NextResponse.json(
        { error: 'Peserta tidak terdaftar untuk ujian ini' },
        { status: 403 }
      );
    }

    // Check time window
    const now = new Date();
    
    // Extract WIB date dari tanggalUjian (UTC timestamp)
    const dateStr = extractWIBDateStr(jadwal.tanggalUjian);
    
    // Parse sebagai WIB untuk conversion ke UTC
    const ujianDate = parseLocalWIBDateTime(dateStr, jadwal.jamMulai);
    const endTime = new Date(ujianDate.getTime() + jadwal.durasi * 60 * 1000);

    // Allow access 5 minutes before start time
    const allowedStartTime = new Date(ujianDate.getTime() - 5 * 60 * 1000);

    console.log('[API] Time check:', {
      now: now.toISOString(),
      allowedStartTime: allowedStartTime.toISOString(),
      ujianDate: ujianDate.toISOString(),
      endTime: endTime.toISOString(),
      dateStr,
      jamMulai: jadwal.jamMulai,
      durasi: jadwal.durasi,
      nowVsAllowed: now >= allowedStartTime ? 'OK' : 'TOO EARLY',
      nowVsEnd: now <= endTime ? 'OK' : 'TOO LATE',
    });

    if (now < allowedStartTime) {
      const minutesUntilStart = Math.ceil((allowedStartTime.getTime() - now.getTime()) / (60 * 1000));
      return NextResponse.json(
        {
          error: 'Ujian belum dimulai',
          minutesUntilStart,
          startTime: ujianDate.toISOString(),
        },
        { status: 403 }
      );
    }

    if (now > endTime) {
      return NextResponse.json(
        {
          error: 'Waktu ujian telah berakhir',
          endTime: endTime.toISOString(),
        },
        { status: 403 }
      );
    }

    // All checks passed, return the Google Form URL
    return NextResponse.json({
      success: true,
      url: jadwal.googleFormUrl,
      namaUjian: jadwal.namaUjian,
      tanggalUjian: jadwal.tanggalUjian,
      jamMulai: jadwal.jamMulai,
      durasi: jadwal.durasi,
      remainingTime: Math.ceil((endTime.getTime() - now.getTime()) / (60 * 1000)),
    });
  } catch (error) {
    console.error('Error fetching Google Form URL:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil link Google Form' },
      { status: 500 }
    );
  }
}
