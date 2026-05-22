export interface BookingService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  duration: number;
  category: string;
  customizations?: {
    groupSize?: number;
    addOns?: string[];
    specialRequirements?: string[];
  };
} 
