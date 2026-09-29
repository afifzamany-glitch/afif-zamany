/**
 * Asia/Jakarta Timezone utilities for Grand Tjokro Yogyakarta Breakfast Management
 */

// Allows simulated testing of hours if needed
let simulatedTimeOverride: string | null = null;
let simulatedDateOverride: string | null = null;

export function setSimulatedTime(timeStr: string | null) {
  simulatedTimeOverride = timeStr;
}

export function setSimulatedDate(dateStr: string | null) {
  simulatedDateOverride = dateStr;
}

export function getSimulatedTime() {
  return simulatedTimeOverride;
}

export function getSimulatedDate() {
  return simulatedDateOverride;
}

/**
 * Returns the current date in Asia/Jakarta timezone (YYYY-MM-DD)
 */
export function getJakartaDate(): string {
  if (simulatedDateOverride) {
    return simulatedDateOverride;
  }
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA outputs YYYY-MM-DD
}

/**
 * Returns current time in Asia/Jakarta timezone (HH:mm)
 */
export function getJakartaTime(): string {
  if (simulatedTimeOverride) {
    return simulatedTimeOverride;
  }
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

/**
 * Returns formatted date string like "29 September 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns formatted Indonesian/English date
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return `${day} ${months[month - 1]} ${year}`;
}

/**
 * Generates an array of dates from checkIn to checkOut
 * taking allowCheckoutDay into account
 */
export function calculateEntitledDates(checkIn: string, checkOut: string, allowCheckoutDay: boolean): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  // If allowCheckoutDay is false, breakfast is not allowed on checkout day
  // (e.g. check-in 29 Sep, check-out 1 Oct -> 29 Sep, 30 Sep)
  // If true -> 29 Sep, 30 Sep, 1 Oct
  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${d}`;

    if (dStr === checkOut && !allowCheckoutDay) {
      break;
    }
    dates.push(dStr);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Checks if a given time (HH:mm) is within the breakfast window
 */
export function checkBreakfastTimeWindow(
  timeStr: string,
  startStr: string,
  endStr: string
): { isWithin: boolean; reason?: 'BEFORE' | 'AFTER' } {
  const [currH, currM] = timeStr.split(':').map(Number);
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  const currMinutes = currH * 60 + currM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currMinutes < startMinutes) {
    return { isWithin: false, reason: 'BEFORE' };
  }
  if (currMinutes > endMinutes) {
    return { isWithin: false, reason: 'AFTER' };
  }
  return { isWithin: true };
}
