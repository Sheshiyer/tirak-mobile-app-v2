export const normalizeBookingLocale = (language?: string): 'en-US' | 'th-TH' => (
  language?.toLowerCase().startsWith('th') ? 'th-TH' : 'en-US'
);

export const formatBookingTotal = (amount: number, language?: string): string => (
  `฿${Math.max(0, amount).toLocaleString(normalizeBookingLocale(language), {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`
);

export const formatBookingDate = (
  date: string,
  language?: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
): string => (
  // Keep the Thailand calendar date in any viewer timezone.
  new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString(normalizeBookingLocale(language), {
    ...options,
    timeZone: 'UTC',
  })
);

export const formatBookingTime = (time: string, language?: string): string => (
  new Date(`2000-01-01T${time}`).toLocaleTimeString(normalizeBookingLocale(language), {
    hour: 'numeric',
    minute: '2-digit',
  })
);
