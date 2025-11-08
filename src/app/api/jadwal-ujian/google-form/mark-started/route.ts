import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, jadwalUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { jadwalId, pesertaId } = await request.json();

    if (!jadwalId || !pesertaId) {
      return NextResponse.json(
        { error: 'jadwalId dan pesertaId diperlukan' },
        { status: 400 }
      );
    }

    // Validate peserta is registered for this exam
    const [pesertaRegistered] = await db
      .select({ id: jadwalUjianPeserta.id })
      .from(jadwalUjianPeserta)
      .where(
        and(
          eq(jadwalUjianPeserta.jadwalUjianId, jadwalId),
          eq(jadwalUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!pesertaRegistered) {
      return NextResponse.json(
        { error: 'Peserta tidak terdaftar untuk ujian ini' },
        { status: 403 }
      );
    }

    // Get jadwal info
    const [jadwal] = await db
      .select({ durasi: jadwalUjian.durasi })
      .from(jadwalUjian)
      .where(eq(jadwalUjian.id, jadwalId))
      .limit(1);

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Check if hasil ujian exists
    const [existingHasil] = await db
      .select({ 
        id: hasilUjianPeserta.id, 
        status: hasilUjianPeserta.status,
        waktuMulai: hasilUjianPeserta.waktuMulai 
      })
      .from(hasilUjianPeserta)
      .where(
        and(
          eq(hasilUjianPeserta.jadwalUjianId, jadwalId),
          eq(hasilUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!existingHasil) {
      // Create new entry with status 'mulai'
      const [newHasil] = await db
        .insert(hasilUjianPeserta)
        .values({
          jadwalUjianId: jadwalId,
          pesertaId,
          waktuMulai: now,
          waktuSelesai: null,
          jawaban: '{}',
          status: 'mulai',
          skor: null,
          skorMaksimal: null,
        })
        .returning();

      console.log('[API] Google Form started - new entry created:', {
        pesertaId,
        jadwalId,
        status: 'mulai',
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Ujian Google Form dimulai',
        hasil: newHasil,
      });
    } else {
      // If already submitted, don't update
      if (existingHasil.status === 'submitted') {
        return NextResponse.json({
          success: true,
          message: 'Ujian sudah pernah disubmit',
          alreadySubmitted: true,
          hasil: {
            id: existingHasil.id,
            status: existingHasil.status,
          },
        });
      }

      // Update to 'mulai' if not already in started or submitted state
      if (existingHasil.status !== 'mulai' && existingHasil.status !== 'in_progress') {
        const [updatedHasil] = await db
          .update(hasilUjianPeserta)
          .set({
            status: 'mulai',
            waktuMulai: existingHasil.waktuMulai || now, // Keep original waktuMulai
          })
          .where(
            and(
              eq(hasilUjianPeserta.jadwalUjianId, jadwalId),
              eq(hasilUjianPeserta.pesertaId, pesertaId)
            )
          )
          .returning();

        console.log('[API] Google Form started - entry updated:', {
          pesertaId,
          jadwalId,
          status: 'mulai',
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'Ujian Google Form dimulai',
          hasil: updatedHasil,
        });
      }

      // Already in 'mulai' or 'in_progress' state
      return NextResponse.json({
        success: true,
        message: 'Ujian Google Form sudah dimulai',
        hasil: {
          id: existingHasil.id,
          status: existingHasil.status,
        },
      });
    }
  } catch (error) {
    console.error('Error marking Google Form as started:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat permulaan ujian' },
      { status: 500 }
    );
  }
}
