/** Core experience schedules are Thailand local time unless the booking declares another zone. */
export const CORE_BOOKING_TIME_ZONE = 'Asia/Bangkok';

export function bookingCalendarDate(instant: Date, timeZone = CORE_BOOKING_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function bookingDateTimeToInstant(date: string, time: string, timeZone = CORE_BOOKING_TIME_ZONE): Date {
  const day = /^(\d{4})-(\d{2})-(\d{2})(?=T|$)/.exec(date);
  const clock = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!day || !clock) throw new Error('Invalid booking date or time');
  const [year, month, dayOfMonth] = day.slice(1).map(Number);
  const [hour, minute, second = 0] = clock.slice(1).map(value => Number(value || 0));
  if (month < 1 || month > 12 || dayOfMonth < 1 || dayOfMonth > 31 || hour > 23 || minute > 59 || second > 59) throw new Error('Invalid booking date or time');
  const wall = Date.UTC(year, month - 1, dayOfMonth, hour, minute, second);
  const check = new Date(wall);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== dayOfMonth) throw new Error('Invalid booking date');
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const localParts = (instant: number) => Object.fromEntries(formatter.formatToParts(new Date(instant)).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const p = localParts(instant);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const adjustment = wall - represented;
    instant += adjustment;
    if (!adjustment) break;
  }
  const p = localParts(instant);
  if (p.year !== year || p.month !== month || p.day !== dayOfMonth || p.hour !== hour || p.minute !== minute || p.second !== second) throw new Error('Booking time is not valid in its timezone');
  return new Date(instant);
}
export function calendarUtcDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
