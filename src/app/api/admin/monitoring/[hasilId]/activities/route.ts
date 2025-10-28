import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activityLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hasilId: string }> }
) {
  try {
    const { hasilId } = await params;

    // Get activity logs for this exam result
    const activities = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.hasilUjianId, hasilId))
      .orderBy(desc(activityLog.timestamp))
      .limit(100);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
