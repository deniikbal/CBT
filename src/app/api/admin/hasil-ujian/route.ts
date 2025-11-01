import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, peserta, bankSoal, kelas } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
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
      let jumlahJawaban = 0;
      if (exam.jawaban) {
        try {
          jawabanObj = typeof exam.jawaban === 'string' 
            ? JSON.parse(exam.jawaban) 
            : exam.jawaban;
          jumlahJawaban = Object.keys(jawabanObj).length;
        } catch (e) {
          // Silent error
        }
      }

      // Calculate nilai from skor and skorMaksimal
      let nilai = 0;
      if (exam.skorMaksimal && exam.skorMaksimal > 0) {
        nilai = Math.round((exam.skor || 0) / exam.skorMaksimal * 100);
      }

      const totalSoal = exam.skorMaksimal || 0;
      const benar = exam.skor || 0;
      const kosong = Math.max(0, totalSoal - jumlahJawaban);
      const salah = totalSoal - benar - kosong;

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
        totalSoal,
        benar,
        salah,
        kosong,
        status: exam.status,
      };
    });

    // Filter only submitted exams
    const submitted = results.filter(r => r.status === 'submitted');

    // Sort by waktuSelesai desc (newest first)
    const sorted = submitted.sort((a, b) => {
      if (!a.waktuSelesai) return 1;
      if (!b.waktuSelesai) return -1;
      return new Date(b.waktuSelesai).getTime() - new Date(a.waktuSelesai).getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch exam results',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
