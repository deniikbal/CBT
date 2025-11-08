import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySubmissionToken } from '@/lib/submission-token';

// GET - Verify token dan record submission
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token diperlukan' },
        { status: 400 }
      );
    }

    // Verify token
    const tokenData = verifySubmissionToken(token);

    if (!tokenData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token tidak valid atau telah kadaluarsa',
          expired: true,
        },
        { status: 403 }
      );
    }

    const { pesertaId, jadwalId } = tokenData;

    // Check if hasil ujian already exists
    const [existingHasil] = await db
      .select({ id: hasilUjianPeserta.id, status: hasilUjianPeserta.status })
      .from(hasilUjianPeserta)
      .where(
        and(
          eq(hasilUjianPeserta.jadwalUjianId, jadwalId),
          eq(hasilUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!existingHasil) {
      // Create new entry if not exists
      const [jadwal] = await db
        .select({ durasi: jadwalUjian.durasi })
        .from(jadwalUjian)
        .where(eq(jadwalUjian.id, jadwalId))
        .limit(1);

      if (!jadwal) {
        return NextResponse.json(
          { success: false, error: 'Jadwal ujian tidak ditemukan' },
          { status: 404 }
        );
      }

      const now = new Date();

      const [newHasil] = await db
        .insert(hasilUjianPeserta)
        .values({
          jadwalUjianId: jadwalId,
          pesertaId,
          waktuMulai: now,
          waktuSelesai: now,
          jawaban: '{}', // Empty for Google Form submissions
          status: 'submitted',
          skor: null,
          skorMaksimal: null,
        })
        .returning();

      console.log('[API] Google Form submission recorded:', {
        pesertaId,
        jadwalId,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Ujian berhasil dicatat',
        hasil: newHasil,
      });
    } else {
      // Already submitted
      return NextResponse.json({
        success: true,
        message: 'Ujian sudah pernah dicatat',
        alreadySubmitted: true,
        hasil: {
          id: existingHasil.id,
          status: existingHasil.status,
        },
      });
    }
  } catch (error) {
    console.error('Error confirming Google Form submission:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat submission' },
      { status: 500 }
    );
  }
}
