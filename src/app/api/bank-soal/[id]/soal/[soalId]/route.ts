import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { soalBank } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET single soal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; soalId: string }> }
) {
  try {
    const { soalId } = await params;
    const soal = await db
      .select()
      .from(soalBank)
      .where(eq(soalBank.id, soalId))
      .limit(1);

    if (soal.length === 0) {
      return NextResponse.json(
        { error: 'Soal tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(soal[0]);
  } catch (error) {
    console.error('Error fetching soal:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data soal' },
      { status: 500 }
    );
  }
}

// PUT update soal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; soalId: string }> }
) {
  try {
    const { soalId } = await params;
    const body = await request.json();

    const {
      nomorSoal,
      soal,
      pilihanA,
      pilihanB,
      pilihanC,
      pilihanD,
      pilihanE,
      jawabanBenar
    } = body;

    // Validate required fields
    if (!soal || !pilihanA || !pilihanB || !pilihanC || !pilihanD || !jawabanBenar) {
      return NextResponse.json(
        { error: 'Soal dan pilihan A-D harus diisi' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(soalBank)
      .set({
        nomorSoal,
        soal,
        pilihanA,
        pilihanB,
        pilihanC,
        pilihanD,
        pilihanE: pilihanE || null,
        jawabanBenar,
        updatedAt: new Date(),
      })
      .where(eq(soalBank.id, soalId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Soal tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating soal:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate soal' },
      { status: 500 }
    );
  }
}

// DELETE soal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; soalId: string }> }
) {
  try {
    const { soalId } = await params;
    const deleted = await db
      .delete(soalBank)
      .where(eq(soalBank.id, soalId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Soal tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Soal berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting soal:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus soal' },
      { status: 500 }
    );
  }
}
