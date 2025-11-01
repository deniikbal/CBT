import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, peserta, kelas, hasilUjianPeserta, bankSoal } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all jadwal ujian
    let jadwalList;
    try {
      const rawJadwal = await db.select().from(jadwalUjian);
      
      // Now enrich with kelas and bank soal data
      jadwalList = await Promise.all(
        rawJadwal.map(async (j) => {
          let kelasName = 'Semua Kelas';
          let bankSoalKode = null;
          
          if (j.kelasId) {
            const kelasData = await db
              .select()
              .from(kelas)
              .where(eq(kelas.id, j.kelasId))
              .limit(1);
            if (kelasData.length > 0) kelasName = kelasData[0].name;
          }
          
          if (j.bankSoalId) {
            const bankData = await db
              .select()
              .from(bankSoal)
              .where(eq(bankSoal.id, j.bankSoalId))
              .limit(1);
            if (bankData.length > 0) bankSoalKode = bankData[0].kodeBankSoal;
          }
          
          return {
            id: j.id,
            namaUjian: j.namaUjian,
            tanggalUjian: j.tanggalUjian,
            waktuMulai: j.waktuMulai,
            durasi: j.durasi,
            kelasId: j.kelasId,
            kelasName,
            bankSoalKode,
            isActive: j.isActive,
          };
        })
      );
    } catch (queryError) {
      throw new Error(`Database query failed: ${queryError instanceof Error ? queryError.message : String(queryError)}`);
    }

    // For each jadwal, get students who haven't taken the exam
    const results = await Promise.all(
      jadwalList.map(async (jadwal) => {
        // Get all students in the class
        let studentsInClass;
        if (jadwal.kelasId) {
          studentsInClass = await db
            .select({
              id: peserta.id,
              name: peserta.name,
              noUjian: peserta.noUjian,
              kelasId: peserta.kelasId,
              kelasName: kelas.name,
              isActive: peserta.isActive,
            })
            .from(peserta)
            .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
            .where(eq(peserta.kelasId, jadwal.kelasId));
        } else {
          // If no class specified, get all students
          studentsInClass = await db
            .select({
              id: peserta.id,
              name: peserta.name,
              noUjian: peserta.noUjian,
              kelasId: peserta.kelasId,
              kelasName: kelas.name,
              isActive: peserta.isActive,
            })
            .from(peserta)
            .leftJoin(kelas, eq(peserta.kelasId, kelas.id));
        }

        // Get students who have taken the exam (any status)
        const studentsWhoTookExam = await db
          .select({
            pesertaId: hasilUjianPeserta.pesertaId,
          })
          .from(hasilUjianPeserta)
          .where(eq(hasilUjianPeserta.jadwalUjianId, jadwal.id));

        const tookExamIds = new Set(studentsWhoTookExam.map(s => s.pesertaId));

        // Filter students who haven't taken the exam
        const studentsNotTaken = studentsInClass.filter(
          student => !tookExamIds.has(student.id)
        );

        return {
          jadwal: {
            id: jadwal.id,
            namaUjian: jadwal.namaUjian,
            tanggalUjian: jadwal.tanggalUjian,
            waktuMulai: jadwal.waktuMulai,
            durasi: jadwal.durasi,
            kelasId: jadwal.kelasId,
            kelasName: jadwal.kelasName || 'Semua Kelas',
            bankSoalKode: jadwal.bankSoalKode,
            isActive: jadwal.isActive,
          },
          totalPeserta: studentsInClass.length,
          belumUjian: studentsNotTaken.length,
          sudahUjian: tookExamIds.size,
          pesertaBelumUjian: studentsNotTaken,
        };
      })
    );

    // Sort by tanggalUjian desc
    const sorted = results.sort((a, b) => {
      const dateA = new Date(a.jadwal.tanggalUjian);
      const dateB = new Date(b.jadwal.tanggalUjian);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
