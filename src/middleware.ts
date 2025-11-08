import { NextRequest, NextResponse } from 'next/server';

interface CachedSettings {
  isEnabled: boolean;
  allowedBrowserPattern: string;
  timestamp: number;
}

let cachedSettings: CachedSettings | null = null;

async function getExamBrowserSettings(
  request: NextRequest
): Promise<CachedSettings> {
  // Check if cache is still valid (3 seconds for faster updates)
  if (cachedSettings && Date.now() - cachedSettings.timestamp < 3000) {
    return cachedSettings;
  }

  try {
    // Use request origin for API call
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get('x-forwarded-proto') === 'https'
        ? `https://${request.headers.get('x-forwarded-host')}`
        : `http://${request.headers.get('host')}`;

    const response = await fetch(`${baseUrl}/api/exam-browser-settings`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const settings = await response.json();
      cachedSettings = {
        isEnabled: settings.isEnabled === true,
        allowedBrowserPattern: settings.allowedBrowserPattern || 'cbt-',
        timestamp: Date.now(),
      };
      return cachedSettings;
    }

    return {
      isEnabled: false,
      allowedBrowserPattern: 'cbt-',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching exam browser settings in middleware:', error);
    return {
      isEnabled: false,
      allowedBrowserPattern: 'cbt-',
      timestamp: Date.now(),
    };
  }
}

function isExamBrowser(userAgent: string, pattern: string): boolean {
  if (!userAgent || !pattern) return false;
  return userAgent.toLowerCase().includes(pattern.toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check for home and login pages
  if (pathname === '/' || pathname === '/login') {
    const settings = await getExamBrowserSettings(request);

    // If exam browser is enabled
    if (settings.isEnabled) {
      // Check if request is from exam browser
      const userAgent = request.headers.get('user-agent') || '';
      const isFromExamBrowser = isExamBrowser(userAgent, settings.allowedBrowserPattern);

      console.log('[Middleware] Exam Browser Check:', {
        pathname,
        isEnabled: settings.isEnabled,
        userAgent,
        pattern: settings.allowedBrowserPattern,
        isFromExamBrowser,
      });

      // If NOT from exam browser, redirect to blocked page
      if (!isFromExamBrowser) {
        return NextResponse.redirect(new URL('/exam-browser-required', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
