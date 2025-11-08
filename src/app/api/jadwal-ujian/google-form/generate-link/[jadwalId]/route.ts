import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, bankSoal } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSubmissionToken } from '@/lib/submission-token';

// GET - Generate Google Form link dengan auto-redirect
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jadwalId: string }> }
) {
  try {
    const { jadwalId } = await params;
    const { searchParams } = new URL(request.url);
    const pesertaId = searchParams.get('pesertaId');

    if (!pesertaId) {
      return NextResponse.json(
        { error: 'pesertaId diperlukan' },
        { status: 400 }
      );
    }

    // Get jadwal dan bank soal
    const [jadwal] = await db
      .select({
        id: jadwalUjian.id,
        googleFormUrl: bankSoal.googleFormUrl,
      })
      .from(jadwalUjian)
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .where(eq(jadwalUjian.id, jadwalId))
      .limit(1);

    if (!jadwal || !jadwal.googleFormUrl) {
      return NextResponse.json(
        { error: 'Google Form tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate submission token
    const token = generateSubmissionToken(pesertaId, jadwalId);

    // Build redirect URL (confirmation page)
    const confirmationUrl = `/student/google-form/${jadwalId}/confirm?token=${token}`;
    const redirectUrl = `${request.headers.get('origin') || 'http://localhost:3000'}${confirmationUrl}`;

    // Build Google Form URL with redirect
    // Google Form punya parameter uriTitle untuk redirect setelah submit
    // Format: https://forms.google.com/gviz/forms/d/[FORM_ID]/responses?usp=form_submit_redirect&entry.0=[redirect_url]
    // Tapi lebih simpel, kita gunakan embedded form atau URL encode
    
    // Alternatif: append redirect parameter ke form URL
    // Google Form redirect format: https://docs.google.com/forms/d/[ID]/viewform?usp=pp_url&entry.redirect_url=[url]
    
    const googleFormUrlWithRedirect = `${jadwal.googleFormUrl}${
      jadwal.googleFormUrl.includes('?') ? '&' : '?'
    }usp=pp_url`;

    return NextResponse.json({
      success: true,
      googleFormUrl: jadwal.googleFormUrl,
      googleFormUrlWithRedirect,
      token,
      confirmationUrl,
      redirectUrl,
      // Instruksi untuk embedding di form
      instructions: {
        title: 'Setup Google Form untuk Auto-Redirect',
        steps: [
          '1. Buka Google Form settings (gear icon)',
          '2. Pilih "Presentation" tab',
          '3. Enable "Show confirmation message"',
          `4. Atau di form description, tambahkan link: ${redirectUrl}`,
          '5. Alternatif: Manual copy redirect URL di halaman ini',
        ],
      },
    });
  } catch (error) {
    console.error('Error generating Google Form link:', error);
    return NextResponse.json(
      { error: 'Gagal generate Google Form link' },
      { status: 500 }
    );
  }
}
