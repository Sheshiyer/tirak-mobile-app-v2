export const normalizeBookingLocale = (language?: string): 'en-US' | 'th-TH' => (
  language?.toLowerCase().startsWith('th') ? 'th-TH' : 'en-US'
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
