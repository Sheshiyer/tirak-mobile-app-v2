import type { Experience } from '@/services/api/companion/experience';
import type { BookingService } from '@/stores/booking-store';

// Convert Experience to BookingService
export const experienceToBookingService = (experience: Experience): BookingService => ({
  id: experience.id,
  name: experience.title,
  description: experience.description || '',
  price: experience.price,
  currency: experience.currency,
  duration: experience.durationMinutes / 60, // Preserve fractional hours; the API receives exact whole minutes
  category: experience.keywords[0] || 'Experience', // Use first keyword as category
  customizations: {
    groupSize: 1,
    addOns: [],
    specialRequirements: [],
  },
});
