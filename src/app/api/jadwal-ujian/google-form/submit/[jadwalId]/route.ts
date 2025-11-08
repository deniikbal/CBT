import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, bankSoal, jadwalUjianPeserta, hasilUjianPeserta } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateSubmissionToken, verifySubmissionToken } from '@/lib/submission-token';

// POST - Generate submission token untuk peserta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const { pesertaId } = await request.json();

    if (!pesertaId) {
      return NextResponse.json(
        { error: 'pesertaId diperlukan' },
        { status: 400 }
      );
    }

    // Verify peserta is assigned to this jadwal
    const [pesertaAssignment] = await db
      .select({ id: jadwalUjianPeserta.id })
      .from(jadwalUjianPeserta)
      .where(
        and(
          eq(jadwalUjianPeserta.jadwalUjianId, jadwalId),
          eq(jadwalUjianPeserta.pesertaId, pesertaId)
        )
      )
      .limit(1);

    if (!pesertaAssignment) {
      return NextResponse.json(
        { error: 'Peserta tidak terdaftar untuk ujian ini' },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateSubmissionToken(pesertaId, jadwalId);

    return NextResponse.json({
      success: true,
      token,
      confirmationUrl: `/student/google-form/${jadwalId}/confirm?token=${token}`,
    });
  } catch (error) {
    console.error('Error generating submission token:', error);
    return NextResponse.json(
      { error: 'Gagal generate token submission' },
      { status: 500 }
    );
  }
}
