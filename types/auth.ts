export type UserRole = 'customer' | 'companion' | 'supplier' | undefined;

export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserRole;
  avatar?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  phone?: string;
  dateOfBirth?: string;
  verified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}