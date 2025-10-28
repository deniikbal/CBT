import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, peserta, bankSoal, mataPelajaran, activityLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all ongoing exams (status = in_progress)
    const activeExams = await db
      .select({
        id: hasilUjianPeserta.id,
        pesertaId: hasilUjianPeserta.pesertaId,
        pesertaName: peserta.name,
        pesertaNoUjian: peserta.noUjian,
        jadwalId: hasilUjianPeserta.jadwalUjianId,
        namaUjian: jadwalUjian.namaUjian,
        bankSoalKode: bankSoal.kodeBankSoal,
        mataPelajaran: mataPelajaran.name,
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

    // Get activity counts for each exam
    const examsWithActivity = await Promise.all(
      activeExams.map(async (exam) => {
        // Count activities by type
        const activities = await db
          .select({
            activityType: activityLog.activityType,
            totalCount: sql<number>`SUM(${activityLog.count})`.as('total_count'),
          })
          .from(activityLog)
          .where(eq(activityLog.hasilUjianId, exam.id))
          .groupBy(activityLog.activityType);

        // Parse jawaban to get progress
        let progress = 0;
        try {
          const jawabanObj = JSON.parse(exam.jawaban);
          progress = Object.keys(jawabanObj).length;
        } catch (e) {
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
          ...exam,
          progress,
          duration,
          activityCounts,
          totalSuspicious,
          riskLevel,
        };
      })
    );

    // Sort by risk level (high first) then by suspicious activities
    const sorted = examsWithActivity.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return b.totalSuspicious - a.totalSuspicious;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching active exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active exams' },
      { status: 500 }
    );
  }
}
