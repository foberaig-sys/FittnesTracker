import type { Weekday } from './types';

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayOf(d: Date): Weekday {
  return ((d.getDay() + 6) % 7) as Weekday;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date = new Date(), offsetWeeks = 0): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(r, -weekdayOf(r) + offsetWeeks * 7);
}

export function formatLong(key: string): string {
  const d = parseKey(key);
  return `${WEEKDAYS[weekdayOf(d)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(key: string): string {
  const d = parseKey(key);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

export function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${start.getDate()}.–${end.getDate()}. ${MONTHS[end.getMonth()]}`
    : `${start.getDate()}. ${MONTHS[start.getMonth()]} – ${end.getDate()}. ${MONTHS[end.getMonth()]}`;
}

export function formatDuration(ms: number, withSeconds = true): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (!withSeconds) return h > 0 ? `${h} h ${m} min` : `${m} min`;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Kurzform für Kacheln, z. B. "2h 04m" oder "45m". */
export function formatDurationCompact(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Späte Session?';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Hey Champion';
  if (h < 22) return 'Guten Abend';
  return 'Noch fit?';
}
