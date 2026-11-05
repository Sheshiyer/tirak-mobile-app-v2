export const normalizeBookingLocale = (language?: string): 'en-US' | 'th-TH' => (
  language?.toLowerCase().startsWith('th') ? 'th-TH' : 'en-US'
);

// The availability API returns calendar dates and wall times in Thailand.
export const bookingTimeInThailand = (date: string, time: string): Date => (
  new Date(`${date.slice(0, 10)}T${time}:00+07:00`)
);

export const bookingDateInThailand = (now = new Date()): string => (
  new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
);

export const formatBookingTotal = (amount: number, language?: string): string => (
  `฿${Math.max(0, amount).toLocaleString(normalizeBookingLocale(language), {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`
);

export const formatBookingDate = (date: string, language?: string): string => (
  new Date(`${date}T12:00:00`).toLocaleDateString(normalizeBookingLocale(language), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
);

export const formatBookingTime = (time: string, language?: string): string => (
  new Date(`2000-01-01T${time}`).toLocaleTimeString(normalizeBookingLocale(language), {
    hour: 'numeric',
    minute: '2-digit',
  })
);
