import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, peserta, bankSoal, mataPelajaran, activityLog } from '@/db/schema';
import { eq, sql, or, inArray, and } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('[Monitoring API] Fetching active exams...');
    
    // Get all ongoing exams
    // - Untuk Google Form: tampilkan 'mulai', 'in_progress', 'submitted'
    // - Untuk Manual/Regular: tampilkan hanya 'in_progress' (keep original behavior)
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
          sourceType: bankSoal.sourceType,
          waktuMulai: hasilUjianPeserta.waktuMulai,
          status: hasilUjianPeserta.status,
          sessionId: hasilUjianPeserta.sessionId,
          ipAddress: hasilUjianPeserta.ipAddress,
          jawaban: hasilUjianPeserta.jawaban,
          durasiUjian: jadwalUjian.durasi,
        })
        .from(hasilUjianPeserta)
        .innerJoin(peserta, eq(hasilUjianPeserta.pesertaId, peserta.id))
        .innerJoin(jadwalUjian, eq(hasilUjianPeserta.jadwalUjianId, jadwalUjian.id))
        .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
        .leftJoin(mataPelajaran, eq(bankSoal.matpelId, mataPelajaran.id))
        .where(
          or(
            // Google Form: tampilkan hanya mulai, in_progress (jangan submitted)
            and(
              eq(bankSoal.sourceType, 'GOOGLE_FORM'),
              inArray(hasilUjianPeserta.status, ['mulai', 'in_progress'])
            ),
            // Manual: hanya in_progress (original behavior)
            and(
              eq(bankSoal.sourceType, 'MANUAL'),
              eq(hasilUjianPeserta.status, 'in_progress')
            )
          )
        );
      
      console.log(`[Monitoring API] Found ${activeExams.length} active exams`);
    } catch (queryError) {
      console.error('[Monitoring API] Database query error:', queryError);
      // Return empty array instead of throwing error
      console.log('[Monitoring API] Returning empty array due to query error');
      return NextResponse.json([]);
    }
    
    // If no active exams, return empty array
    if (!activeExams || activeExams.length === 0) {
      console.log('[Monitoring API] No active exams found');
      return NextResponse.json([]);
    }

    // Get ALL activity counts in a single query (optimized)
    const examIds = activeExams.map(e => e.id);
    let allActivities: Array<{
      hasilUjianId: string;
      activityType: string;
      totalCount: number;
    }> = [];
    
    try {
      console.log('[Monitoring API] Fetching all activities in batch...');
      allActivities = await db
        .select({
          hasilUjianId: activityLog.hasilUjianId,
          activityType: activityLog.activityType,
          totalCount: sql<number>`SUM(${activityLog.count})`.as('total_count'),
        })
        .from(activityLog)
        .groupBy(activityLog.hasilUjianId, activityLog.activityType);
      
      console.log(`[Monitoring API] Fetched ${allActivities.length} activity records`);
    } catch (activityError) {
      console.error('[Monitoring API] Error fetching all activities:', activityError);
      // Continue without activities if error
    }

    // Group activities by exam ID for fast lookup
    const activitiesMap = new Map<string, Array<{ activityType: string; totalCount: number }>>();
    allActivities.forEach(act => {
      if (!activitiesMap.has(act.hasilUjianId)) {
        activitiesMap.set(act.hasilUjianId, []);
      }
      activitiesMap.get(act.hasilUjianId)!.push({
        activityType: act.activityType,
        totalCount: act.totalCount,
      });
    });

    // Process all exams with pre-fetched activities
    const examsWithActivity = activeExams.map((exam, index) => {
        try {
          console.log(`[Monitoring API] Processing exam ${index + 1}/${activeExams.length}`);
          
          // Get activities from map (no DB query needed)
          const activities = activitiesMap.get(exam.id) || [];

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

          // Get exam duration (total duration in minutes)
          const duration = exam.durasiUjian || 0;

          // Calculate elapsed time in minutes
          const elapsedMinutes = exam.waktuMulai
            ? Math.floor((Date.now() - new Date(exam.waktuMulai).getTime()) / 1000 / 60)
            : 0;

          // Aggregate activity counts
          const activityCounts: Record<string, number> = {};
          activities.forEach((act) => {
            activityCounts[act.activityType] = Number(act.totalCount) || 0;
          });

          // Calculate risk level based on ALL suspicious activities
          const tabBlur = activityCounts.TAB_BLUR || 0;
          const devTools = activityCounts.ATTEMPTED_DEVTOOLS || 0;
          const screenshot = activityCounts.SCREENSHOT_ATTEMPT || 0;
          const rightClick = activityCounts.RIGHT_CLICK || 0;
          const copyAttempt = activityCounts.COPY_ATTEMPT || 0;
          const pasteAttempt = activityCounts.PASTE_ATTEMPT || 0;
          const sessionViolation = activityCounts.SESSION_VIOLATION || 0;
          const exitFullscreen = activityCounts.EXIT_FULLSCREEN || 0;
          
          // Weight different activities differently
          const totalSuspicious = 
            tabBlur + 
            (devTools * 2) + // DevTools is more serious
            screenshot + 
            (rightClick * 0.3) + // Right click less serious
            (copyAttempt * 0.5) + 
            (pasteAttempt * 0.5) +
            (sessionViolation * 3) + // Session violation is very serious
            (exitFullscreen * 0.5);

          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          if (totalSuspicious >= 5) riskLevel = 'high';
          else if (totalSuspicious >= 3) riskLevel = 'medium';

          return {
            id: exam.id,
            pesertaId: exam.pesertaId,
            pesertaName: exam.pesertaName,
            pesertaNoUjian: exam.pesertaNoUjian,
            jadwalId: exam.jadwalId,
            namaUjian: exam.namaUjian,
            bankSoalKode: exam.bankSoalKode || '-',
            mataPelajaran: exam.mataPelajaranName || '-',
            sourceType: exam.sourceType || 'MANUAL',
            waktuMulai: exam.waktuMulai,
            status: exam.status,
            ipAddress: exam.ipAddress || '-',
            progress,
            duration,
            elapsedMinutes,
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
            jadwalId: exam.jadwalId,
            namaUjian: exam.namaUjian,
            bankSoalKode: '-',
            mataPelajaran: '-',
            sourceType: exam.sourceType || 'MANUAL',
            waktuMulai: exam.waktuMulai,
            status: exam.status,
            ipAddress: '-',
            progress: 0,
            duration: 0,
            elapsedMinutes: 0,
            activityCounts: {},
            totalSuspicious: 0,
            riskLevel: 'low' as const,
          };
        }
      });
    
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
