import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activityLog } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hasilUjianId, pesertaId, activityType, count, metadata } = body;

    if (!hasilUjianId || !pesertaId || !activityType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert activity log
    const newLog = await db.insert(activityLog).values({
      hasilUjianId,
      pesertaId,
      activityType,
      count: count || 1,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }).returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
