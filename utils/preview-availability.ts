export interface PreviewTimeSlot {
  start: string;
  end: string;
  available: boolean;
  price?: number;
}

export interface PreviewDayAvailability {
  date: string;
  day: number;
  weekday: string;
  available: boolean;
  slots: PreviewTimeSlot[];
}

const DEMO_GUIDE_TIME_SLOTS: PreviewTimeSlot[] = [
  { start: '09:00', end: '12:00', available: true },
  { start: '14:00', end: '17:00', available: true },
  { start: '18:00', end: '20:00', available: true },
];

export const buildPreviewAvailability = (
  days: number,
  isAvailable: (index: number) => boolean,
  slots: PreviewTimeSlot[] = []
): PreviewDayAvailability[] =>
  Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const available = isAvailable(i);

    return {
      date: date.toISOString().split('T')[0],
      day: date.getDate(),
      weekday: date.toLocaleDateString('en', { weekday: 'short' }),
      available,
      slots: available ? slots : [],
    };
  });

export const getDemoGuideAvailability = (days = 10): PreviewDayAvailability[] =>
  buildPreviewAvailability(days, () => true, DEMO_GUIDE_TIME_SLOTS);
