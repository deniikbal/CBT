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
    const { pesertaId, jawaban, hasilId } = await request.json();

    if (!pesertaId || !jawaban || !hasilId) {
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

    // Check minimum time
    const now = new Date();
    const waktuMulai = new Date(hasil.waktuMulai);
    const durasiPengerjaan = Math.floor((now.getTime() - waktuMulai.getTime()) / 60000); // in minutes

    if (jadwal.minimumPengerjaan && durasiPengerjaan < jadwal.minimumPengerjaan) {
      return NextResponse.json(
        { error: `Anda harus mengerjakan minimal ${jadwal.minimumPengerjaan} menit` },
        { status: 400 }
      );
    }

    // Get all soal for grading
    const soalList = await db
      .select()
      .from(soalBank)
      .where(eq(soalBank.bankSoalId, jadwal.bankSoalId));

    // Calculate score
    let benar = 0;
    const totalSoal = soalList.length;

    soalList.forEach((soal) => {
      const jawabanPeserta = jawaban[soal.id];
      if (jawabanPeserta === soal.jawabanBenar) {
        benar++;
      }
    });

    const skor = benar;
    const skorMaksimal = totalSoal;

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
