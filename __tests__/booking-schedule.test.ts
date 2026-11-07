import { bookingDurationMinutes, buildBookableTimeSlots } from '@/utils/booking-schedule';
const slot = (start:string,end:string,available=true) => ({start,end,available});
test('90 and 100 minute services retain their exact duration through fractional hours', () => {
  expect(bookingDurationMinutes(90/60)).toBe(90);
  expect(bookingDurationMinutes(100/60)).toBe(100);
  expect(buildBookableTimeSlots([slot('09:00','12:00')],1.5)).toEqual([slot('09:00','10:30')]);
});
test('availability cannot span a reserved interval, even inside an overlapping broad available block', () => {
  expect(buildBookableTimeSlots([slot('09:00','09:30'),slot('09:30','10:00',false),slot('10:00','12:00')],1.5)).toEqual([slot('10:00','11:30')]);
  expect(buildBookableTimeSlots([slot('09:00','12:00'),slot('09:30','10:00',false)],1.5)).toEqual([]);
});
test('contiguous half hour intervals support a complete 90 minute service', () => {
  expect(buildBookableTimeSlots([slot('09:15','09:45'),slot('09:45','10:15'),slot('10:15','10:45')],1.5)).toEqual([slot('09:15','10:45')]);
});
test('missing intervals and invalid durations fail closed', () => {
  expect(buildBookableTimeSlots([slot('09:00','09:30'),slot('10:00','11:00')],1.5)).toEqual([]);
  expect(buildBookableTimeSlots([slot('23:00','23:59')],1.5)).toEqual([]);
  for (const hours of [0,0.499,24,NaN,Infinity]) expect(()=>bookingDurationMinutes(hours)).toThrow();
});
