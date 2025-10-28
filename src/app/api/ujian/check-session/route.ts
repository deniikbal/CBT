import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hasilUjianId, sessionId } = body;

    if (!hasilUjianId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current session from database
    const hasil = await db.query.hasilUjianPeserta.findFirst({
      where: eq(hasilUjianPeserta.id, hasilUjianId),
    });

    if (!hasil) {
      return NextResponse.json(
        { error: 'Exam result not found' },
        { status: 404 }
      );
    }

    // Check if session matches
    const isValid = hasil.sessionId === sessionId;

    return NextResponse.json({ 
      isValid,
      currentSessionId: hasil.sessionId 
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}
