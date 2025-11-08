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

      return NextResponse.json({
        success: true,
        message: 'Ujian Google Form berhasil dicatat sebagai submitted',
        hasil: newHasil,
      });
    } else {
      // Update existing - only if not already submitted
      if (existingHasil.status === 'submitted') {
        return NextResponse.json({
          success: true,
          message: 'Ujian sudah pernah dicatat sebagai submitted',
          alreadySubmitted: true,
        });
      }

      // Update to submitted
      const [updatedHasil] = await db
        .update(hasilUjianPeserta)
        .set({
          status: 'submitted',
          waktuSelesai: now,
        })
        .where(
          and(
            eq(hasilUjianPeserta.jadwalUjianId, jadwalId),
            eq(hasilUjianPeserta.pesertaId, pesertaId)
          )
        )
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Ujian Google Form berhasil diperbarui menjadi submitted',
        hasil: updatedHasil,
      });
    }
  } catch (error) {
    console.error('Error marking Google Form as submitted:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat submission' },
      { status: 500 }
    );
  }
}
