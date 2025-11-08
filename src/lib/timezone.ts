// Timezone utility untuk WIB (+7)
export const WIB_OFFSET = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

export function getWIBDate(date: Date): Date {
  // Convert UTC date to WIB
  const utcDate = new Date(date);
  return new Date(utcDate.getTime() + WIB_OFFSET);
}

export function getUTCFromWIB(date: Date): Date {
  // Convert WIB date back to UTC
  return new Date(date.getTime() - WIB_OFFSET);
}

export function getCurrentWIBTime(): Date {
  const now = new Date();
  return getWIBDate(now);
}

export function parseWIBDateTime(dateString: string, timeString: string): Date {
  // Parse date (YYYY-MM-DD) and time (HH:mm) and return as UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create date in WIB timezone
  const wibDate = new Date(year, month - 1, day, hours, minutes, 0);
  
  // Convert to UTC
  return getUTCFromWIB(wibDate);
}
