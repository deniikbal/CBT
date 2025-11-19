import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, soalBank, hasilUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hasilId, jadwalId } = body;

    console.log('[Force Submit] Admin forcing submit:', { hasilId, jadwalId });

    if (!hasilId || !jadwalId) {
      return NextResponse.json(
        { error: 'hasilId dan jadwalId diperlukan' },
        { status: 400 }
      );
    }

    // Get hasil ujian
    const [hasil] = await db
      .select()
      .from(hasilUjianPeserta)
      .where(
        and(
          eq(hasilUjianPeserta.id, hasilId),
          eq(hasilUjianPeserta.jadwalUjianId, jadwalId)
        )
      )
      .limit(1);

    if (!hasil) {
      return NextResponse.json(
        { error: 'Hasil ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    if (hasil.status === 'submitted') {
      return NextResponse.json(
        { error: 'Ujian sudah disubmit sebelumnya' },
        { status: 400 }
      );
    }

    // Get jadwal info
    const [jadwal] = await db
      .select()
      .from(jadwalUjian)
      .where(eq(jadwalUjian.id, jadwalId))
      .limit(1);

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get current jawaban from database
    let jawaban: Record<string, string> = {};
    if (hasil.jawaban) {
      try {
        jawaban = typeof hasil.jawaban === 'string' 
          ? JSON.parse(hasil.jawaban) 
          : hasil.jawaban;
      } catch (e) {
        console.error('[Force Submit] Error parsing jawaban:', e);
        jawaban = {};
      }
    }

    // Get snapshot kunci jawaban (prioritize snapshot, fallback to soalBank if not exist)
    let kunciJawabanSnapshot: Record<string, string> = {};
    let useSnapshot = false;
    
    if (hasil.kunciJawabanSnapshot) {
      kunciJawabanSnapshot = JSON.parse(hasil.kunciJawabanSnapshot);
      useSnapshot = true;
      console.log('[Force Submit] Using snapshot kunci jawaban');
    } else {
      // Fallback: get current kunci jawaban from soalBank (for backward compatibility)
      console.log('[Force Submit] No snapshot found, falling back to current soalBank');
      const soalList = await db
        .select()
        .from(soalBank)
        .where(eq(soalBank.bankSoalId, jadwal.bankSoalId));
      
      soalList.forEach((soal) => {
        kunciJawabanSnapshot[soal.id] = soal.jawabanBenar;
      });
    }

    // Get option mappings if options were shuffled
    const optionMappings = hasil.optionMappings 
      ? JSON.parse(hasil.optionMappings) 
      : {};

    // Calculate score using snapshot
    let benar = 0;
    const totalSoal = Object.keys(kunciJawabanSnapshot).length;

    console.log('[Force Submit] Starting grading process');
    console.log('[Force Submit] Using snapshot:', useSnapshot);
    console.log('[Force Submit] Has option mappings:', Object.keys(optionMappings).length > 0);
    console.log('[Force Submit] Total soal:', totalSoal);
    console.log('[Force Submit] Jawaban count:', Object.keys(jawaban).length);

    Object.keys(kunciJawabanSnapshot).forEach((soalId) => {
      const jawabanPeserta = jawaban[soalId];
      const kunciJawaban = kunciJawabanSnapshot[soalId];
      
      if (!jawabanPeserta) {
        // No answer - incorrect
        return;
      }

      // If options were shuffled, convert answer back to original key
      let originalAnswer = jawabanPeserta;
      if (optionMappings[soalId] && jadwal.acakOpsi) {
        const mapping = optionMappings[soalId];
        // mapping is { newKey: originalKey }
        // jawabanPeserta is newKey, we need originalKey
        originalAnswer = mapping[jawabanPeserta] || jawabanPeserta;
      }

      if (originalAnswer === kunciJawaban) {
        benar++;
      }
    });

    const skor = benar;
    const skorMaksimal = totalSoal;
    const now = new Date();

    console.log('[Force Submit] Result:', { benar, total: totalSoal, skor, skorMaksimal });

    // Update hasil ujian (dengan menyimpan jawaban yang ada)
    await db
      .update(hasilUjianPeserta)
      .set({
        waktuSelesai: now,
        jawaban: JSON.stringify(jawaban),
        skor,
        skorMaksimal,
        status: 'submitted',
        updatedAt: now,
      })
      .where(eq(hasilUjianPeserta.id, hasilId));

    console.log('[Force Submit] Successfully force submitted exam:', { hasilId, skor, skorMaksimal });

    return NextResponse.json({
      message: 'Ujian berhasil diforce submit oleh admin',
      skor,
      skorMaksimal,
      persentase: Math.round((skor / skorMaksimal) * 100),
      tampilkanNilai: jadwal.tampilkanNilai,
    });
  } catch (error) {
    console.error('[Force Submit] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal force submit ujian';
    return NextResponse.json(
      { 
        error: 'Terjadi kesalahan saat force submit ujian',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
