export interface ScheduleSlot { start: string; end: string; available: boolean; price?: number }
export function bookingDurationMinutes(hours: number): number {
  const minutes = Math.round(hours * 60);
  if (!Number.isFinite(hours) || Math.abs(hours * 60 - minutes) > 0.000001 || minutes < 30 || minutes > 1439) throw new Error('Choose a service duration between 30 and 1439 whole minutes');
  return minutes;
}
const minutesOf = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? Number(time.slice(0,2))*60+Number(time.slice(3)) : NaN;
const clock = (minutes: number) => `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
/** Every minute must be covered by available intervals; explicit blocked intervals win. */
export function buildBookableTimeSlots(slots: ScheduleSlot[], durationHours: number): ScheduleSlot[] {
  let duration: number;
  try { duration = bookingDurationMinutes(durationHours); } catch { return []; }
  const valid = slots.map(slot => ({ ...slot, from: minutesOf(slot.start), to: minutesOf(slot.end) }))
    .filter(slot => Number.isFinite(slot.from) && Number.isFinite(slot.to) && slot.to > slot.from)
    .sort((a,b) => a.from-b.from);
  const available = valid.filter(slot => slot.available === true);
  const blocked = valid.filter(slot => !slot.available);
  const seen = new Set<number>();
  return available.flatMap(slot => {
    if (seen.has(slot.from)) return [];
    seen.add(slot.from);
    const end = slot.from+duration;
    if (end >= 1440 || blocked.some(other => other.from < end && other.to > slot.from)) return [];
    let coveredUntil = slot.from;
    for (const interval of available) {
      if (interval.to <= coveredUntil) continue;
      if (interval.from > coveredUntil) break;
      coveredUntil = Math.max(coveredUntil, interval.to);
      if (coveredUntil >= end) return [{ start: slot.start, end: clock(end), available: true, ...(slot.price === undefined ? {} : { price: slot.price }) }];
    }
    return [];
  });
}
