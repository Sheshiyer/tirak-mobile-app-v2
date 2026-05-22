export interface Companion {
  id: string;
  name: string;
  age: number;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  services: string[];
  languages: string[];
  verified: boolean;
  online: boolean;
  category: string;
  bio?: string;
  gallery?: string[];
  availability?: {
    date: string;
    timeSlots: string[];
  }[];
}

export interface SearchFilters {
  category: string;
  location: string;
  priceRange: [number, number];
  onlineOnly: boolean;
  verifiedOnly: boolean;
  languages?: string[];
  rating?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface CompanionData {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  languages: string[];
  about?: string;
  specialties?: string[];
  reviews?: number; // Number of reviews
}