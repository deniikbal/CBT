import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, soalBank, bankSoal, hasilUjianPeserta, jadwalUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper to create Date object from WIB timezone
// Input: date and time in WIB, Output: Date object with UTC timestamp
function createWIBDate(dateValue: Date | string, timeString: string): Date {
  // Parse date
  const date = new Date(dateValue);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Get date components (these come from the database as UTC but represent local date)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Create the datetime in WIB timezone
  // WIB is GMT+7, so to get UTC time we subtract 7 hours
  // Example: 10:00 WIB = 03:00 UTC
  const utcHours = hours - 7;
  
  // Handle day rollover if needed
  const wibDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  wibDate.setUTCHours(utcHours, minutes, 0, 0);
  
  return wibDate;
}

// Helper to get current timestamp in WIB
function getNowWIB(): Date {
  return new Date();
}

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to shuffle options
function shuffleOptions(soal: any, acakOpsi: boolean) {
  if (!acakOpsi) return soal;

  const options = [
    { key: 'A', value: soal.pilihanA },
    { key: 'B', value: soal.pilihanB },
    { key: 'C', value: soal.pilihanC },
    { key: 'D', value: soal.pilihanD },
  ];

  if (soal.pilihanE) {
    options.push({ key: 'E', value: soal.pilihanE });
  }

  const shuffled = shuffleArray(options);
  
  // Create mapping of old keys to new keys
  const keyMapping: Record<string, string> = {};
  shuffled.forEach((opt, idx) => {
    const newKey = String.fromCharCode(65 + idx); // A, B, C, D, E
    keyMapping[opt.key] = newKey;
  });

  // Update correct answer key
  const newJawabanBenar = keyMapping[soal.jawabanBenar];

  return {
    ...soal,
    pilihanA: shuffled[0].value,
    pilihanB: shuffled[1].value,
    pilihanC: shuffled[2].value,
    pilihanD: shuffled[3].value,
    pilihanE: shuffled[4]?.value || null,
    jawabanBenar: newJawabanBenar,
    originalJawabanBenar: soal.jawabanBenar, // Keep original for grading
  };
}

// POST - Start ujian
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const { pesertaId } = await request.json();

    if (!pesertaId) {
      return NextResponse.json(
        { error: 'Peserta ID diperlukan' },
        { status: 400 }
      );
    }

    // Get jadwal ujian
    const [jadwal] = await db
      .select()
      .from(jadwalUjian)
      .where(eq(jadwalUjian.id, jadwalId))
      .limit(1);

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if peserta is registered for this ujian
    const [registration] = await db
      .select()
      .from(jadwalUjianPeserta)
      .where(
        and(
          eq(jadwalUjianPeserta.jadwalUjianId, jadwalId),
          eq(jadwalUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!registration) {
      return NextResponse.json(
        { error: 'Anda tidak terdaftar untuk ujian ini' },
        { status: 403 }
      );
    }

    // Check if already started or submitted
    // All time comparisons use UTC timestamps internally
    const now = getNowWIB();
    
    // Create ujian start time in WIB (which converts to UTC for storage)
    const ujianDate = createWIBDate(jadwal.tanggalUjian, jadwal.jamMulai);
    
    // Calculate end time
    const ujianEnd = new Date(ujianDate.getTime() + jadwal.durasi * 60 * 1000);

    // Debug logging
    console.log('[TIMEZONE DEBUG]', {
      nowUTC: now.toISOString(),
      nowWIB: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      ujianStartUTC: ujianDate.toISOString(),
      ujianStartWIB: new Date(ujianDate.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      ujianEndUTC: ujianEnd.toISOString(),
      ujianEndWIB: new Date(ujianEnd.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      comparison: {
        isBefore: now < ujianDate,
        isAfter: now > ujianEnd,
        isValid: now >= ujianDate && now <= ujianEnd,
      }
    });

    // Check if already started
    const [existingHasil] = await db
      .select()
      .from(hasilUjianPeserta)
      .where(
        and(
          eq(hasilUjianPeserta.jadwalUjianId, jadwalId),
          eq(hasilUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    // If already submitted, cannot start again
    if (existingHasil && existingHasil.status === 'submitted') {
      return NextResponse.json(
        { error: 'Anda sudah menyelesaikan ujian ini' },
        { status: 400 }
      );
    }

    // If not started yet, check if ujian time is valid
    if (!existingHasil) {
      const nowWIBDisplay = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const ujianStartWIBDisplay = new Date(ujianDate.getTime() + 7 * 60 * 60 * 1000);
      const ujianEndWIBDisplay = new Date(ujianEnd.getTime() + 7 * 60 * 60 * 1000);
      
      if (now < ujianDate) {
        return NextResponse.json(
          { 
            error: 'Ujian belum dimulai',
            debug: {
              currentTimeWIB: nowWIBDisplay.toISOString(),
              ujianStartTimeWIB: ujianStartWIBDisplay.toISOString(),
              message: 'Waktu sekarang masih sebelum waktu mulai ujian'
            }
          },
          { status: 400 }
        );
      }
      
      if (now > ujianEnd) {
        return NextResponse.json(
          { 
            error: 'Ujian sudah berakhir',
            debug: {
              currentTimeWIB: nowWIBDisplay.toISOString(),
              ujianEndTimeWIB: ujianEndWIBDisplay.toISOString(),
              message: 'Waktu sekarang sudah melewati waktu selesai ujian'
            }
          },
          { status: 400 }
        );
      }
    }
    
    // If already started (existingHasil exists), allow access even if time expired
    // This allows students to submit their answers after time runs out

    // Get soal from bank soal
    const soalList = await db
      .select()
      .from(soalBank)
      .where(eq(soalBank.bankSoalId, jadwal.bankSoalId))
      .orderBy(soalBank.nomorSoal);

    if (soalList.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada soal tersedia' },
        { status: 400 }
      );
    }

    // Acak soal jika perlu
    let processedSoal = jadwal.acakSoal ? shuffleArray(soalList) : soalList;

    // Acak opsi jika perlu
    processedSoal = processedSoal.map((soal, index) => {
      const shuffled = shuffleOptions(soal, jadwal.acakOpsi);
      return {
        ...shuffled,
        nomorSoal: index + 1, // Re-number after shuffle
        pembahasan: undefined, // Hide pembahasan during exam
      };
    });

    // Create or update hasil ujian
    let hasilId = existingHasil?.id;
    
    if (!existingHasil) {
      const [newHasil] = await db
        .insert(hasilUjianPeserta)
        .values({
          jadwalUjianId: jadwalId,
          pesertaId,
          waktuMulai: now,
          jawaban: JSON.stringify({}),
          status: 'in_progress',
        })
        .returning();
      
      hasilId = newHasil.id;
    }

    return NextResponse.json({
      hasilId,
      jadwal: {
        id: jadwal.id,
        namaUjian: jadwal.namaUjian,
        durasi: jadwal.durasi,
        minimumPengerjaan: jadwal.minimumPengerjaan,
        acakSoal: jadwal.acakSoal,
        acakOpsi: jadwal.acakOpsi,
        tampilkanNilai: jadwal.tampilkanNilai,
        waktuMulai: existingHasil?.waktuMulai || now,
      },
      soal: processedSoal,
      existingAnswers: existingHasil?.jawaban || null,
    });
  } catch (error) {
    console.error('Error starting ujian:', error);
    return NextResponse.json(
      { error: 'Gagal memulai ujian' },
      { status: 500 }
    );
  }
}
