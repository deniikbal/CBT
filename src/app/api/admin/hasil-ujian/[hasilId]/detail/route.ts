import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, soalBank } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hasilId: string }> }
) {
  try {
    const { hasilId } = await params;

    // Get hasil ujian with jawaban and optionMappings
    const hasil = await db
      .select({
        id: hasilUjianPeserta.id,
        jadwalUjianId: hasilUjianPeserta.jadwalUjianId,
        jawaban: hasilUjianPeserta.jawaban,
        optionMappings: hasilUjianPeserta.optionMappings,
      })
      .from(hasilUjianPeserta)
      .where(eq(hasilUjianPeserta.id, hasilId))
      .limit(1);

    if (!hasil || hasil.length === 0) {
      return NextResponse.json(
        { error: 'Hasil ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    const jawabanRaw = hasil[0].jawaban;
    
    let jawabanSiswa: Record<number, string> = {};

    if (jawabanRaw) {
      try {
        jawabanSiswa = typeof jawabanRaw === 'string' 
          ? JSON.parse(jawabanRaw) 
          : jawabanRaw;
      } catch (e) {
        jawabanSiswa = {};
      }
    }

    // Parse optionMappings
    const optionMappingsRaw = hasil[0].optionMappings;
    let optionMappings: Record<string, Record<string, string>> = {};
    
    if (optionMappingsRaw) {
      try {
        optionMappings = typeof optionMappingsRaw === 'string'
          ? JSON.parse(optionMappingsRaw)
          : optionMappingsRaw;
      } catch (e) {
        optionMappings = {};
      }
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
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    const bankSoalId = jadwalUjianData[0].bankSoalId;

    if (!bankSoalId) {
      return NextResponse.json(
        { error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get all soal for this exam, ordered by nomorSoal
    let soalList: {
      id: string;
      nomorSoal: number;
      soal: string;
      pilihanA: string;
      pilihanB: string;
      pilihanC: string;
      pilihanD: string;
      pilihanE: string | null;
      jawabanBenar: 'A' | 'B' | 'C' | 'D' | 'E';
    }[] = [];
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
        })
        .from(soalBank)
        .where(eq(soalBank.bankSoalId, bankSoalId));
    } catch (queryError) {
      return NextResponse.json(
        { error: 'Error fetching soal', details: queryError instanceof Error ? queryError.message : String(queryError) },
        { status: 500 }
      );
    }

    if (soalList.length === 0) {
      return NextResponse.json([]);
    }

    // Combine soal with jawaban siswa
    const detail = soalList.map((s) => {
      const soalId = s.id;
      const nomorSoal = s.nomorSoal;
      const jawabanBenar = s.jawabanBenar;
      // Jawaban disimpan dengan soal ID sebagai key, bukan nomorSoal!
      const jawabanSiswaAns = jawabanSiswa[soalId] || '';
      
      // Convert answer back to original key if options were shuffled
      let originalAnswer = jawabanSiswaAns;
      if (jawabanSiswaAns && optionMappings[soalId]) {
        const mapping = optionMappings[soalId];
        // mapping is { newKey: originalKey }
        // jawabanSiswaAns is newKey, we need originalKey
        originalAnswer = mapping[jawabanSiswaAns] || jawabanSiswaAns;
      }
      
      const benar = jawabanBenar === originalAnswer && originalAnswer !== '';

      return {
        nomorSoal,
        soal: s.soal,
        pilihanA: s.pilihanA,
        pilihanB: s.pilihanB,
        pilihanC: s.pilihanC,
        pilihanD: s.pilihanD,
        pilihanE: s.pilihanE || null,
        jawabanBenar,
        jawabanSiswa: originalAnswer, // Return converted answer, not the shuffled one
        benar,
      };
    }).sort((a, b) => a.nomorSoal - b.nomorSoal);

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch jawaban detail',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
