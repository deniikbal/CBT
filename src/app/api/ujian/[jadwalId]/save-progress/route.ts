import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Save progress (auto-save jawaban tanpa submit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const { pesertaId, hasilId, jawaban } = await request.json();

    if (!pesertaId || !hasilId || !jawaban) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Update jawaban (tanpa mengubah status)
    const [updated] = await db
      .update(hasilUjianPeserta)
      .set({
        jawaban: JSON.stringify(jawaban),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hasilUjianPeserta.id, hasilId),
          eq(hasilUjianPeserta.pesertaId, pesertaId),
          eq(hasilUjianPeserta.jadwalUjianId, jadwalId),
          eq(hasilUjianPeserta.status, 'in_progress')
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Progress tidak dapat disimpan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Progress berhasil disimpan',
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan progress' },
      { status: 500 }
    );
  }
}
