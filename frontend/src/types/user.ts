/** User roles supported by Verdora */
export type UserRole = 'farmer' | 'admin';

export type FarmerType = 'small-scale' | 'commercial';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Critical for regional insights & segmentation */
  location?: string;
  region?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  cropsPlanted?: string[];
  cropPreferences?: string[];
  farmSize?: string;
  farmerType?: FarmerType;
  soilType?: string;
  farmingMethods?: string[];
  /** GDPR-style consent for farming & usage data collection */
  dataConsent?: boolean;
  dataConsentAt?: string;
  createdAt?: string;
}
