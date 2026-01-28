
export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'SALES';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  price: string;
  features: string[];
  color: string;
}

export interface StoredSubmission {
  id: string;
  formType: 'profile' | 'renewal' | 'service';
  data: any;
  timestamp: string;
  synced: boolean;
  signature?: string;
  photos?: string[];
}

export interface FormSubmission {
  formType: 'profile' | 'renewal' | 'service';
  data: any;
  timestamp: string;
  signature: string;
  photos?: string[];
}
