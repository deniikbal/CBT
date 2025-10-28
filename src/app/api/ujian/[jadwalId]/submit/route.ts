import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, soalBank, hasilUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Submit ujian
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const body = await request.json();
    const { pesertaId, jawaban, hasilId } = body;

    console.log('Submit request:', { jadwalId, pesertaId, hasilId, jawabanCount: Object.keys(jawaban || {}).length });

    if (!pesertaId || !jawaban || !hasilId) {
      console.error('Data tidak lengkap:', { pesertaId, jawaban: !!jawaban, hasilId });
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
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
          eq(hasilUjianPeserta.pesertaId, pesertaId),
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
      console.log('Ujian sudah disubmit sebelumnya');
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

    // Check minimum time (only if ujian time not expired yet)
    const now = new Date();
    const waktuMulai = new Date(hasil.waktuMulai);
    const waktuBerakhir = new Date(waktuMulai.getTime() + jadwal.durasi * 60000);
    const durasiPengerjaan = Math.floor((now.getTime() - waktuMulai.getTime()) / 60000); // in minutes
    const ujianExpired = now > waktuBerakhir;

    console.log('Durasi pengerjaan:', { 
      durasiPengerjaan, 
      minimumPengerjaan: jadwal.minimumPengerjaan,
      ujianExpired,
      waktuBerakhir: waktuBerakhir.toISOString(),
      now: now.toISOString()
    });

    // Only check minimum time if ujian is NOT expired
    // If expired, allow submit regardless of minimum time
    if (!ujianExpired && jadwal.minimumPengerjaan && durasiPengerjaan < jadwal.minimumPengerjaan) {
      console.log('Durasi kurang dari minimum (dan ujian belum expired)');
      return NextResponse.json(
        { error: `Anda harus mengerjakan minimal ${jadwal.minimumPengerjaan} menit` },
        { status: 400 }
      );
    }
    
    if (ujianExpired) {
      console.log('Ujian sudah expired, mengabaikan validasi minimum waktu');
    }

    // Get all soal for grading
    const soalList = await db
      .select()
      .from(soalBank)
      .where(eq(soalBank.bankSoalId, jadwal.bankSoalId));

    // Get option mappings if options were shuffled
    const optionMappings = hasil.optionMappings 
      ? JSON.parse(hasil.optionMappings) 
      : {};

    // Calculate score
    let benar = 0;
    const totalSoal = soalList.length;

    console.log('[GRADING] Starting grading process');
    console.log('[GRADING] Has option mappings:', Object.keys(optionMappings).length > 0);

    soalList.forEach((soal) => {
      const jawabanPeserta = jawaban[soal.id];
      
      if (!jawabanPeserta) {
        // No answer - incorrect
        return;
      }

      // If options were shuffled, convert answer back to original key
      let originalAnswer = jawabanPeserta;
      if (optionMappings[soal.id] && jadwal.acakOpsi) {
        const mapping = optionMappings[soal.id];
        // mapping is { newKey: originalKey }
        // jawabanPeserta is newKey, we need originalKey
        originalAnswer = mapping[jawabanPeserta] || jawabanPeserta;
        console.log('[GRADING]', {
          soalId: soal.id.substring(0, 8),
          pesertaAnswer: jawabanPeserta,
          convertedAnswer: originalAnswer,
          correctAnswer: soal.jawabanBenar,
          isCorrect: originalAnswer === soal.jawabanBenar
        });
      }

      if (originalAnswer === soal.jawabanBenar) {
        benar++;
      }
    });

    const skor = benar;
    const skorMaksimal = totalSoal;

    console.log('[GRADING] Result:', { benar, total: totalSoal, skor, skorMaksimal });

    // Update hasil ujian
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

    return NextResponse.json({
      message: 'Ujian berhasil disubmit',
      skor,
      skorMaksimal,
      persentase: Math.round((skor / skorMaksimal) * 100),
      tampilkanNilai: jadwal.tampilkanNilai,
    });
  } catch (error) {
    console.error('Error submitting ujian:', error);
    return NextResponse.json(
      { error: 'Gagal submit ujian' },
      { status: 500 }
    );
  }
}
