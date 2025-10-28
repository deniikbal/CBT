import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, peserta, bankSoal, kelas, soal } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('[Hasil Ujian API] Fetching completed exams...');
    
    // Get all submitted/completed exams
    const submittedExams = await db
      .select({
        id: hasilUjianPeserta.id,
        pesertaId: hasilUjianPeserta.pesertaId,
        pesertaName: peserta.name,
        pesertaNoUjian: peserta.noUjian,
        kelasId: peserta.kelasId,
        kelasName: kelas.name,
        jadwalId: hasilUjianPeserta.jadwalUjianId,
        namaUjian: jadwalUjian.namaUjian,
        bankSoalId: jadwalUjian.bankSoalId,
        bankSoalKode: bankSoal.kodeBankSoal,
        waktuMulai: hasilUjianPeserta.waktuMulai,
        waktuSelesai: hasilUjianPeserta.waktuSelesai,
        skor: hasilUjianPeserta.skor,
        skorMaksimal: hasilUjianPeserta.skorMaksimal,
        jawaban: hasilUjianPeserta.jawaban,
        status: hasilUjianPeserta.status,
      })
      .from(hasilUjianPeserta)
      .innerJoin(peserta, eq(hasilUjianPeserta.pesertaId, peserta.id))
      .innerJoin(jadwalUjian, eq(hasilUjianPeserta.jadwalUjianId, jadwalUjian.id))
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .leftJoin(kelas, eq(peserta.kelasId, kelas.id));
    
    console.log(`[Hasil Ujian API] Found ${submittedExams.length} exams total (filtering now)`);

    // Process results
    const results = submittedExams.map(exam => {
      // Calculate duration
      let durasi = 0;
      if (exam.waktuMulai && exam.waktuSelesai) {
        const start = new Date(exam.waktuMulai);
        const end = new Date(exam.waktuSelesai);
        durasi = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
      }

      // Parse jawaban to calculate benar/salah/kosong
      let jawabanObj: Record<number, string> = {};
      if (exam.jawaban) {
        try {
          jawabanObj = typeof exam.jawaban === 'string' 
            ? JSON.parse(exam.jawaban) 
            : exam.jawaban;
        } catch (e) {
          console.error('Error parsing jawaban:', e);
        }
      }

      // Calculate nilai from skor and skorMaksimal
      let nilai = 0;
      if (exam.skorMaksimal && exam.skorMaksimal > 0) {
        nilai = Math.round((exam.skor || 0) / exam.skorMaksimal * 100);
      }

      return {
        id: exam.id,
        pesertaId: exam.pesertaId,
        pesertaName: exam.pesertaName,
        pesertaNoUjian: exam.pesertaNoUjian,
        kelasId: exam.kelasId,
        kelasName: exam.kelasName || '-',
        namaUjian: exam.namaUjian,
        bankSoalId: exam.bankSoalId,
        bankSoalKode: exam.bankSoalKode || '-',
        waktuMulai: exam.waktuMulai,
        waktuSelesai: exam.waktuSelesai,
        durasi,
        nilai,
        totalSoal: exam.skorMaksimal || 0,
        benar: exam.skor || 0,
        salah: (exam.skorMaksimal || 0) - (exam.skor || 0),
        kosong: Object.keys(jawabanObj).length > 0 ? Math.max(0, (exam.skorMaksimal || 0) - Object.keys(jawabanObj).length) : 0,
        status: exam.status,
      };
    });

    // Filter only submitted exams
    const submitted = results.filter(r => r.status === 'submitted');
    console.log(`[Hasil Ujian API] Filtered to ${submitted.length} submitted exams`);

    // Sort by waktuSelesai desc (newest first)
    const sorted = submitted.sort((a, b) => {
      if (!a.waktuSelesai) return 1;
      if (!b.waktuSelesai) return -1;
      return new Date(b.waktuSelesai).getTime() - new Date(a.waktuSelesai).getTime();
    });

    console.log('[Hasil Ujian API] Returning', sorted.length, 'results');
    console.log('[Hasil Ujian API] First result:', sorted[0] || 'none');
    return NextResponse.json(sorted);
  } catch (error) {
    console.error('[Hasil Ujian API] Error fetching results:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch exam results',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
