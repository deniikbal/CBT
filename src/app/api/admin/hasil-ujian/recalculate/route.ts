import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, soalBank } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * POST /api/admin/hasil-ujian/recalculate
 * 
 * Recalculate nilai berdasarkan kunci jawaban terbaru dari soalBank
 * 
 * Body:
 * - hasilIds: string[] - Array of hasil ID to recalculate
 * - updateSnapshot: boolean - Whether to update snapshot with new kunci jawaban
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hasilIds, updateSnapshot = false } = body;

    if (!hasilIds || !Array.isArray(hasilIds) || hasilIds.length === 0) {
      return NextResponse.json(
        { error: 'hasilIds array diperlukan' },
        { status: 400 }
      );
    }

    console.log('[RECALCULATE] Starting recalculation for', hasilIds.length, 'hasil');
    console.log('[RECALCULATE] Update snapshot:', updateSnapshot);

    // Get all hasil ujian
    const hasilList = await db
      .select({
        id: hasilUjianPeserta.id,
        jadwalUjianId: hasilUjianPeserta.jadwalUjianId,
        pesertaId: hasilUjianPeserta.pesertaId,
        jawaban: hasilUjianPeserta.jawaban,
        optionMappings: hasilUjianPeserta.optionMappings,
        kunciJawabanSnapshot: hasilUjianPeserta.kunciJawabanSnapshot,
        status: hasilUjianPeserta.status,
      })
      .from(hasilUjianPeserta)
      .where(inArray(hasilUjianPeserta.id, hasilIds));

    if (hasilList.length === 0) {
      return NextResponse.json(
        { error: 'Hasil ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Group by jadwalUjianId to minimize database queries
    const jadwalMap = new Map<string, typeof hasilList>();
    hasilList.forEach((hasil) => {
      const existing = jadwalMap.get(hasil.jadwalUjianId) || [];
      jadwalMap.set(hasil.jadwalUjianId, [...existing, hasil]);
    });

    const results = [];

    // Process each jadwal group
    for (const [jadwalId, hasilGroup] of jadwalMap.entries()) {
      console.log('[RECALCULATE] Processing jadwalId:', jadwalId, 'with', hasilGroup.length, 'hasil');

      // Get jadwal info
      const [jadwal] = await db
        .select()
        .from(jadwalUjian)
        .where(eq(jadwalUjian.id, jadwalId))
        .limit(1);

      if (!jadwal) {
        console.error('[RECALCULATE] Jadwal not found:', jadwalId);
        continue;
      }

      // Get latest kunci jawaban from soalBank
      const soalList = await db
        .select({
          id: soalBank.id,
          jawabanBenar: soalBank.jawabanBenar,
        })
        .from(soalBank)
        .where(eq(soalBank.bankSoalId, jadwal.bankSoalId));

      // Create new kunci jawaban map
      const newKunciJawaban: Record<string, string> = {};
      soalList.forEach((soal) => {
        newKunciJawaban[soal.id] = soal.jawabanBenar;
      });

      console.log('[RECALCULATE] Loaded', soalList.length, 'kunci jawaban from soalBank');

      // Recalculate each hasil
      for (const hasil of hasilGroup) {
        try {
          // Parse jawaban
          const jawaban = hasil.jawaban ? JSON.parse(hasil.jawaban) : {};
          
          // Parse option mappings
          const optionMappings = hasil.optionMappings 
            ? JSON.parse(hasil.optionMappings) 
            : {};

          // Calculate new score
          let benar = 0;
          const totalSoal = soalList.length;

          Object.keys(newKunciJawaban).forEach((soalId) => {
            const jawabanPeserta = jawaban[soalId];
            const kunciJawaban = newKunciJawaban[soalId];
            
            if (!jawabanPeserta) {
              return;
            }

            // If options were shuffled, convert answer back to original key
            let originalAnswer = jawabanPeserta;
            if (optionMappings[soalId] && jadwal.acakOpsi) {
              const mapping = optionMappings[soalId];
              originalAnswer = mapping[jawabanPeserta] || jawabanPeserta;
            }

            if (originalAnswer === kunciJawaban) {
              benar++;
            }
          });

          const skor = benar;
          const skorMaksimal = totalSoal;

          // Prepare update data
          const updateData: any = {
            skor,
            skorMaksimal,
            updatedAt: new Date(),
          };

          // Update snapshot if requested
          if (updateSnapshot) {
            updateData.kunciJawabanSnapshot = JSON.stringify(newKunciJawaban);
          }

          // Update database
          await db
            .update(hasilUjianPeserta)
            .set(updateData)
            .where(eq(hasilUjianPeserta.id, hasil.id));

          const oldNilai = hasil.kunciJawabanSnapshot ? 
            Math.round((hasil.jawaban ? Object.keys(JSON.parse(hasil.jawaban)).length : 0) / totalSoal * 100) : 0;
          const newNilai = Math.round((skor / skorMaksimal) * 100);

          results.push({
            hasilId: hasil.id,
            pesertaId: hasil.pesertaId,
            oldSkor: 'N/A', // We don't have old skor easily accessible
            newSkor: skor,
            skorMaksimal,
            oldNilai: 'N/A',
            newNilai,
            snapshotUpdated: updateSnapshot,
          });

          console.log('[RECALCULATE] Updated', hasil.id, '- New score:', skor, '/', skorMaksimal);
        } catch (error) {
          console.error('[RECALCULATE] Error processing hasil:', hasil.id, error);
          results.push({
            hasilId: hasil.id,
            pesertaId: hasil.pesertaId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    console.log('[RECALCULATE] Completed. Processed', results.length, 'hasil');

    return NextResponse.json({
      message: 'Recalculation completed',
      totalProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error('[RECALCULATE] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to recalculate',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
