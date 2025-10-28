import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, peserta, bankSoal, mataPelajaran, activityLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('[Monitoring API] Fetching active exams...');
    
    // Get all ongoing exams (status = in_progress)
    let activeExams;
    try {
      activeExams = await db
        .select({
          id: hasilUjianPeserta.id,
          pesertaId: hasilUjianPeserta.pesertaId,
          pesertaName: peserta.name,
          pesertaNoUjian: peserta.noUjian,
          jadwalId: hasilUjianPeserta.jadwalUjianId,
          namaUjian: jadwalUjian.namaUjian,
          bankSoalKode: bankSoal.kodeBankSoal,
          mataPelajaranName: mataPelajaran.name,
          waktuMulai: hasilUjianPeserta.waktuMulai,
          status: hasilUjianPeserta.status,
          sessionId: hasilUjianPeserta.sessionId,
          ipAddress: hasilUjianPeserta.ipAddress,
          jawaban: hasilUjianPeserta.jawaban,
        })
        .from(hasilUjianPeserta)
        .innerJoin(peserta, eq(hasilUjianPeserta.pesertaId, peserta.id))
        .innerJoin(jadwalUjian, eq(hasilUjianPeserta.jadwalUjianId, jadwalUjian.id))
        .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
        .leftJoin(mataPelajaran, eq(bankSoal.matpelId, mataPelajaran.id))
        .where(eq(hasilUjianPeserta.status, 'in_progress'));
      
      console.log(`[Monitoring API] Found ${activeExams.length} active exams`);
    } catch (queryError) {
      console.error('[Monitoring API] Database query error:', queryError);
      throw queryError;
    }

    // Get activity counts for each exam
    const examsWithActivity = await Promise.all(
      activeExams.map(async (exam, index) => {
        try {
          console.log(`[Monitoring API] Processing exam ${index + 1}/${activeExams.length}`);
          
          // Count activities by type
          let activities = [];
          try {
            activities = await db
              .select({
                activityType: activityLog.activityType,
                totalCount: sql<number>`SUM(${activityLog.count})`.as('total_count'),
              })
              .from(activityLog)
              .where(eq(activityLog.hasilUjianId, exam.id))
              .groupBy(activityLog.activityType);
          } catch (activityError) {
            console.error(`[Monitoring API] Error fetching activities for exam ${exam.id}:`, activityError);
            // Continue without activities if error
          }

          // Parse jawaban to get progress
          let progress = 0;
          try {
            if (exam.jawaban) {
              const jawabanObj = typeof exam.jawaban === 'string' 
                ? JSON.parse(exam.jawaban) 
                : exam.jawaban;
              progress = Object.keys(jawabanObj).length;
            }
          } catch (e) {
            console.error(`[Monitoring API] Error parsing jawaban for exam ${exam.id}:`, e);
            progress = 0;
          }

          // Calculate duration
          const duration = exam.waktuMulai
            ? Math.floor((Date.now() - new Date(exam.waktuMulai).getTime()) / 1000 / 60)
            : 0;

          // Aggregate activity counts
          const activityCounts: Record<string, number> = {};
          activities.forEach((act) => {
            activityCounts[act.activityType] = Number(act.totalCount) || 0;
          });

          // Calculate risk level
          const blurCount = activityCounts.TAB_BLUR || 0;
          const devToolsCount = activityCounts.ATTEMPTED_DEVTOOLS || 0;
          const totalSuspicious = blurCount + devToolsCount;

          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          if (totalSuspicious >= 5) riskLevel = 'high';
          else if (totalSuspicious >= 3) riskLevel = 'medium';

          return {
            id: exam.id,
            pesertaId: exam.pesertaId,
            pesertaName: exam.pesertaName,
            pesertaNoUjian: exam.pesertaNoUjian,
            namaUjian: exam.namaUjian,
            bankSoalKode: exam.bankSoalKode || '-',
            mataPelajaran: exam.mataPelajaranName || '-',
            waktuMulai: exam.waktuMulai,
            status: exam.status,
            ipAddress: exam.ipAddress || '-',
            progress,
            duration,
            activityCounts,
            totalSuspicious,
            riskLevel,
          };
        } catch (examError) {
          console.error(`[Monitoring API] Error processing exam ${exam.id}:`, examError);
          // Return minimal data if error
          return {
            id: exam.id,
            pesertaId: exam.pesertaId,
            pesertaName: exam.pesertaName,
            pesertaNoUjian: exam.pesertaNoUjian,
            namaUjian: exam.namaUjian,
            bankSoalKode: '-',
            mataPelajaran: '-',
            waktuMulai: exam.waktuMulai,
            status: exam.status,
            ipAddress: '-',
            progress: 0,
            duration: 0,
            activityCounts: {},
            totalSuspicious: 0,
            riskLevel: 'low' as const,
          };
        }
      })
    );
    
    console.log('[Monitoring API] Successfully processed all exams');

    // Sort by risk level (high first) then by suspicious activities
    const sorted = examsWithActivity.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return b.totalSuspicious - a.totalSuspicious;
    });

    console.log('[Monitoring API] Returning', sorted.length, 'exams');
    return NextResponse.json(sorted);
  } catch (error) {
    console.error('[Monitoring API] Error fetching active exams:', error);
    console.error('[Monitoring API] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Monitoring API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch active exams',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
