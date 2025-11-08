import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { examBrowserSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cache, cacheKeys } from '@/lib/cache';

// GET global exam browser settings
export async function GET() {
  try {
    // Check cache first
    const cachedSettings = cache.get(cacheKeys.examSettings)
    if (cachedSettings) {
      console.log('[CACHE HIT] Exam browser settings')
      return NextResponse.json(cachedSettings)
    }

    let settings = await db
      .select()
      .from(examBrowserSettings)
      .limit(1);

    if (settings.length === 0) {
      // Create default global settings if not exists
      const [newSettings] = await db
        .insert(examBrowserSettings)
        .values({
          isEnabled: false,
          allowedBrowserPattern: 'cbt-',
          maxViolations: 5,
          allowMultipleSessions: false,
          blockDevtools: true,
          blockScreenshot: true,
          blockRightClick: true,
          blockCopyPaste: true,
          requireFullscreen: true,
        })
        .returning();
      
      // Cache new settings for 10 minutes (aggressive)
      cache.set(cacheKeys.examSettings, newSettings, 600)
      return NextResponse.json(newSettings, { status: 201 });
    }

    // Cache existing settings for 10 minutes (aggressive)
    cache.set(cacheKeys.examSettings, settings[0], 600)
    return NextResponse.json(settings[0]);
  } catch (error: any) {
    console.error('Error fetching exam browser settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT update global settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, createdAt, updatedAt, ...updateData } = body;

    // Get the global settings (should only be one record)
    let [globalSettings] = await db
      .select()
      .from(examBrowserSettings)
      .limit(1);

    if (!globalSettings) {
      // Create default if doesn't exist
      [globalSettings] = await db
        .insert(examBrowserSettings)
        .values({
          isEnabled: false,
          allowedBrowserPattern: 'cbt-',
          maxViolations: 5,
          allowMultipleSessions: false,
          blockDevtools: true,
          blockScreenshot: true,
          blockRightClick: true,
          blockCopyPaste: true,
          requireFullscreen: true,
        })
        .returning();
    }

    const [updated] = await db
      .update(examBrowserSettings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(examBrowserSettings.id, globalSettings.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Invalidate cache after update
    cache.invalidate(cacheKeys.examSettings)
    console.log('[CACHE INVALIDATED] Exam browser settings')

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating exam browser settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
