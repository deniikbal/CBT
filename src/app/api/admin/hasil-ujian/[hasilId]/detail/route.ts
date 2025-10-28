import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, soalBank } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { hasilId: string } }
) {
  try {
    const hasilId = params.hasilId;
    console.log('[Hasil Detail API] Fetching jawaban untuk:', hasilId);

    // Get hasil ujian with jawaban
    const hasil = await db
      .select({
        id: hasilUjianPeserta.id,
        jadwalUjianId: hasilUjianPeserta.jadwalUjianId,
        jawaban: hasilUjianPeserta.jawaban,
      })
      .from(hasilUjianPeserta)
      .where(eq(hasilUjianPeserta.id, hasilId))
      .limit(1);

    if (!hasil || hasil.length === 0) {
      console.error('[Hasil Detail API] Hasil tidak ditemukan:', hasilId);
      return NextResponse.json(
        { error: 'Hasil ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Hasil Detail API] Hasil ditemukan, jadwalUjianId:', hasil[0].jadwalUjianId);

    const jawabanRaw = hasil[0].jawaban;
    console.log('[Hasil Detail API] Raw jawaban dari DB:', jawabanRaw);
    console.log('[Hasil Detail API] Raw jawaban type:', typeof jawabanRaw);
    
    let jawabanSiswa: Record<number, string> = {};

    if (jawabanRaw) {
      try {
        jawabanSiswa = typeof jawabanRaw === 'string' 
          ? JSON.parse(jawabanRaw) 
          : jawabanRaw;
        console.log('[Hasil Detail API] Parsed jawaban:', jawabanSiswa);
        console.log('[Hasil Detail API] Total jawaban:', Object.keys(jawabanSiswa).length);
      } catch (e) {
        console.error('[Hasil Detail API] Error parsing jawaban:', e);
        console.error('[Hasil Detail API] Failed jawaban raw:', jawabanRaw);
        jawabanSiswa = {};
      }
    } else {
      console.warn('[Hasil Detail API] Jawaban kosong/null dari DB');
    }

    // Get jadwal ujian to get bankSoalId
    const jadwalUjianData = await db
      .select({
        bankSoalId: jadwalUjian.bankSoalId,
      })
      .from(jadwalUjian)
      .where(eq(jadwalUjian.id, hasil[0].jadwalUjianId))
      .limit(1);

    if (!jadwalUjianData || jadwalUjianData.length === 0) {
      console.error('[Hasil Detail API] Jadwal ujian tidak ditemukan');
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    const bankSoalId = jadwalUjianData[0].bankSoalId;
    console.log('[Hasil Detail API] Getting soal untuk bankSoalId:', bankSoalId);

    if (!bankSoalId) {
      console.error('[Hasil Detail API] bankSoalId tidak ada');
      return NextResponse.json(
        { error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get all soal for this exam, ordered by nomorSoal
    let soalList = [];
    try {
      soalList = await db
        .select({
          id: soalBank.id,
          nomorSoal: soalBank.nomorSoal,
          soal: soalBank.soal,
          pilihanA: soalBank.pilihanA,
          pilihanB: soalBank.pilihanB,
          pilihanC: soalBank.pilihanC,
          pilihanD: soalBank.pilihanD,
          pilihanE: soalBank.pilihanE,
          jawabanBenar: soalBank.jawabanBenar,
          pembahasan: soalBank.pembahasan,
        })
        .from(soalBank)
        .where(eq(soalBank.bankSoalId, bankSoalId));
      
      console.log('[Hasil Detail API] Query executed, found', soalList.length, 'soal');
    } catch (queryError) {
      console.error('[Hasil Detail API] Error querying soal:', queryError);
      return NextResponse.json(
        { error: 'Error fetching soal', details: queryError instanceof Error ? queryError.message : String(queryError) },
        { status: 500 }
      );
    }

    if (soalList.length === 0) {
      console.warn('[Hasil Detail API] Tidak ada soal untuk bankSoalId:', bankSoalId);
      return NextResponse.json([]);
    }

    console.log('[Hasil Detail API] Found', soalList.length, 'soal');

    // Combine soal with jawaban siswa
    const detail = soalList.map((s) => {
      const soalId = s.id;
      const nomorSoal = s.nomorSoal;
      const jawabanBenar = s.jawabanBenar;
      // Jawaban disimpan dengan soal ID sebagai key, bukan nomorSoal!
      const jawabanSiswaAns = jawabanSiswa[soalId] || '';
      const benar = jawabanBenar === jawabanSiswaAns && jawabanSiswaAns !== '';

      // Debug per soal
      if (nomorSoal <= 3) {
        console.log(`[Hasil Detail API] Soal ${nomorSoal} (ID: ${soalId}): jawaban siswa = "${jawabanSiswaAns}", benar = "${jawabanBenar}", match = ${benar}`);
      }

      return {
        nomorSoal,
        soal: s.soal,
        pilihanA: s.pilihanA,
        pilihanB: s.pilihanB,
        pilihanC: s.pilihanC,
        pilihanD: s.pilihanD,
        pilihanE: s.pilihanE || null,
        jawabanBenar,
        jawabanSiswa: jawabanSiswaAns,
        pembahasan: s.pembahasan || '',
        benar,
      };
    }).sort((a, b) => a.nomorSoal - b.nomorSoal);

    console.log(`[Hasil Detail API] Returning ${detail.length} soal dengan ${Object.keys(jawabanSiswa).length} jawaban siswa`);
    return NextResponse.json(detail);
  } catch (error) {
    console.error('[Hasil Detail API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch jawaban detail',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
