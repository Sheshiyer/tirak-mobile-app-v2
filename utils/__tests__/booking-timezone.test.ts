import { bookingDateTimeToInstant, calendarUtcDate } from '../booking-timezone';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
it('uses the Thailand Core timezone for calendar and countdown instants', () => {
  const start = bookingDateTimeToInstant('2026-10-26', '09:00');
  const end = bookingDateTimeToInstant('2026-10-26T00:00:00Z', '09:30:00');
  expect(start.toISOString()).toBe('2026-10-26T02:00:00.000Z');
  expect(calendarUtcDate(start)).toBe('20261026T020000Z');
  expect(end.getTime() - start.getTime()).toBe(30 * 60 * 1000);
  expect(start.getTime() - new Date('2026-10-26T01:00:00Z').getTime()).toBe(60 * 60 * 1000);
});
it('preserves declared booking timezone and rejects invalid or nonexistent dates', () => {
  expect(bookingDateTimeToInstant('2026-10-26', '09:00', 'Asia/Kolkata').toISOString()).toBe('2026-10-26T03:30:00.000Z');
  for (const [date, time, zone] of [['2026-02-30', '09:00', 'Asia/Bangkok'], ['2026-10-26', '25:00', 'Asia/Bangkok'], ['2026-10-26', '09:00', 'unknown/zone'], ['2026-03-08', '02:30', 'America/New_York']]) {
    expect(() => bookingDateTimeToInstant(date, time, zone)).toThrow();
  }
});
it.each(['Asia/Kolkata', 'Asia/Bangkok', 'America/New_York', 'UTC'])('actual process TZ=%s does not change the Core09:00 booking calendar value', zone => {
  const source = readFileSync(join(__dirname, '../booking-timezone.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const script = `${compiled}\nconsole.log(exports.calendarUtcDate(exports.bookingDateTimeToInstant('2026-10-26', '09:00')));`;
  expect(execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TZ: zone }, encoding: 'utf8' }).trim()).toBe('20261026T020000Z');
});
