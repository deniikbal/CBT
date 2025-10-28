import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasilUjianPeserta } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hasilUjianId, sessionId, ipAddress } = body;

    if (!hasilUjianId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update session ID and IP
    await db.update(hasilUjianPeserta)
      .set({ 
        sessionId,
        ipAddress: ipAddress || null,
        updatedAt: new Date()
      })
      .where(eq(hasilUjianPeserta.id, hasilUjianId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
