import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta, jadwalUjian, jadwalUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Confirm submission (simple, tanpa token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const { pesertaId } = await request.json();

    if (!pesertaId || !jadwalId) {
      return NextResponse.json(
        { error: 'pesertaId dan jadwalId diperlukan' },
        { status: 400 }
      );
    }

    // Verify peserta is assigned to this jadwal
    const [pesertaExists] = await db
      .select({ id: jadwalUjianPeserta.id })
      .from(jadwalUjianPeserta)
      .where(
        and(
          eq(jadwalUjianPeserta.jadwalUjianId, jadwalId),
          eq(jadwalUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!pesertaExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Peserta tidak terdaftar untuk ujian ini',
        },
        { status: 403 }
      );
    }

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
      const now = new Date();

      const [newHasil] = await db
        .insert(hasilUjianPeserta)
        .values({
          jadwalUjianId: jadwalId,
          pesertaId,
          waktuMulai: now,
          waktuSelesai: now,
          jawaban: '{}',
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
