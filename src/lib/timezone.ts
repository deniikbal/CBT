/**
 * Timezone utilities untuk WIB (UTC+7)
 * 
 * Strategi:
 * - Database stores semua timestamp dalam UTC
 * - Client-side comparison menggunakan WIB time
 * - API validation menggunakan UTC time
 */

const WIB_OFFSET_HOURS = 7;

/**
 * Get current server time dan convert to WIB
 * Gunakan ini untuk client-side countdown
 */
export function getCurrentWIBTime(): Date {
  const now = new Date();
  // Add WIB offset (UTC+7)
  return new Date(now.getTime() + WIB_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Parse local date string (YYYY-MM-DD) dan time (HH:mm) sebagai WIB
 * Return UTC Date untuk di-compare dengan database timestamp
 * 
 * @param dateStr Format YYYY-MM-DD (contoh: 2024-11-08)
 * @param timeStr Format HH:mm (contoh: 14:30)
 * @returns UTC Date object
 */
export function parseLocalWIBDateTime(dateStr: string, timeStr: string): Date {
  try {
    // Parse components
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    if (!year || !month || !day || hours === undefined || minutes === undefined) {
      throw new Error('Invalid date/time format');
    }

    // Create UTC date
    // Formula: WIB time = UTC time + 7 hours
    // So: UTC time = WIB time - 7 hours
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours - WIB_OFFSET_HOURS, minutes, 0));

    return utcDate;
  } catch (error) {
    console.error('Error parsing local WIB datetime:', error);
    return new Date();
  }
}

/**
 * Format tanggal untuk display ke user (dalam format WIB)
 */
export function formatWIBDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const wibDate = new Date(d.getTime() + WIB_OFFSET_HOURS * 60 * 60 * 1000);
    
    // Format: DD/MM/YYYY HH:mm
    const day = String(wibDate.getUTCDate()).padStart(2, '0');
    const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
    const year = wibDate.getUTCFullYear();
    const hours = String(wibDate.getUTCHours()).padStart(2, '0');
    const mins = String(wibDate.getUTCMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch (error) {
    console.error('Error formatting WIB date:', error);
    return '';
  }
}

/**
 * Get time difference dalam menit
 */
export function getMinutesDiff(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (60 * 1000));
}

/**
 * Extract WIB date string (YYYY-MM-DD) dari UTC timestamp
 * Berguna untuk extract date dari tanggalUjian di DB saat retrieving
 */
export function extractWIBDateStr(utcDate: Date | string): string {
  try {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    // Convert UTC ke WIB
    const wibDate = new Date(date.getTime() + WIB_OFFSET_HOURS * 60 * 60 * 1000);
    
    const year = wibDate.getUTCFullYear();
    const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(wibDate.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error extracting WIB date:', error);
    return '';
  }
}
