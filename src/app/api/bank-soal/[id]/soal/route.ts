import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { soalBank, bankSoal } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET all soal for a bank soal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankSoalId } = await params;

    const soalList = await db
      .select()
      .from(soalBank)
      .where(eq(soalBank.bankSoalId, bankSoalId))
      .orderBy(soalBank.nomorSoal);

    return NextResponse.json(soalList);
  } catch (error) {
    console.error('Error fetching soal:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data soal' },
      { status: 500 }
    );
  }
}

// POST create new soal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bankSoalId } = await params;
    const body = await request.json();

    const {
      nomorSoal,
      soal,
      pilihanA,
      pilihanB,
      pilihanC,
      pilihanD,
      pilihanE,
      jawabanBenar,
      pembahasan
    } = body;

    // Validate required fields
    if (!soal || !pilihanA || !pilihanB || !pilihanC || !pilihanD || !jawabanBenar) {
      return NextResponse.json(
        { error: 'Soal dan pilihan A-D harus diisi' },
        { status: 400 }
      );
    }

    // Get next nomor soal if not provided
    let finalNomorSoal = nomorSoal;
    if (!finalNomorSoal) {
      const lastSoal = await db
        .select()
        .from(soalBank)
        .where(eq(soalBank.bankSoalId, bankSoalId))
        .orderBy(desc(soalBank.nomorSoal))
        .limit(1);

      finalNomorSoal = lastSoal.length > 0 ? lastSoal[0].nomorSoal + 1 : 1;
    }

    const newSoal = await db.insert(soalBank).values({
      bankSoalId,
      nomorSoal: finalNomorSoal,
      soal,
      pilihanA,
      pilihanB,
      pilihanC,
      pilihanD,
      pilihanE: pilihanE || null,
      jawabanBenar,
      pembahasan: pembahasan || null,
    }).returning();

    return NextResponse.json(newSoal[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating soal:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat soal' },
      { status: 500 }
    );
  }
}
