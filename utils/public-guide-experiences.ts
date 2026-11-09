import type { BookingService } from '@/types/booking';

export interface PublicGuideExperience {
  id: string;
  name: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
  category: string;
}

function serviceDurationMinutes(service: any): number | null {
  if (typeof service.durationMinutes === 'number' && Number.isFinite(service.durationMinutes) && service.durationMinutes > 0) return service.durationMinutes;
  // Core public detail represents duration as e.g. "0.5 hours".
  const hours = typeof service.duration === 'string' ? /^([0-9]+(?:\.[0-9]+)?)\s+hours?$/i.exec(service.duration.trim()) : null;
  if (!hours) return null;
  const minutes = Number(hours[1]) * 60;
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

/** Adapts both public detail shapes without inventing a service or duration. */
export function normalizePublicGuideExperiences(data: any): PublicGuideExperience[] {
  const source = Array.isArray(data?.experiences) && data.experiences.length ? data.experiences : Array.isArray(data?.services) ? data.services : [];
  return source.flatMap((service: any) => {
    if (!service || typeof service.id !== 'string' || !service.id.trim()) return [];
    const title = typeof service.title === 'string' && service.title.trim() ? service.title : service.name;
    const durationMinutes = serviceDurationMinutes(service);
    if (typeof title !== 'string' || !title.trim() || durationMinutes === null || typeof service.price !== 'number' || !Number.isFinite(service.price) || service.price < 0) return [];
    return [{
      id: service.id, name: title, title, description: typeof service.description === 'string' ? service.description : '',
      durationMinutes, price: service.price,
      // The current Core public service endpoint omits currency; its settlement currency is THB.
      currency: service.currency || data.currency || 'THB',
      category: typeof service.category === 'string' ? service.category : '',
    }];
  });
}

export function publicExperienceToBookingService(experience: PublicGuideExperience): BookingService {
  return { id: experience.id, name: experience.title, description: experience.description, price: experience.price, currency: experience.currency, duration: experience.durationMinutes / 60, category: experience.category };
}
