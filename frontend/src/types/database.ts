/**
 * Supabase table row types — mirrors supabase/schema.sql
 * All tables link records via user_id for analytics queries.
 */

export type DbUserRole = 'farmer' | 'admin';
export type DbFarmerType = 'small-scale' | 'commercial';

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: DbUserRole;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  farm_size: string | null;
  farmer_type: DbFarmerType | null;
  crop_preferences: string[];
  soil_type: string | null;
  farming_methods: string[];
  data_consent: boolean;
  data_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCrop {
  id: string;
  user_id: string;
  crop_name: string;
  plant_date: string;
  harvest_date: string | null;
  location: string | null;
  field_name: string | null;
  soil_type: string | null;
  farming_methods: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScan {
  id: string;
  user_id: string;
  image_url: string | null;
  crop_type: string;
  disease: string | null;
  confidence: number;
  treatment: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  scanned_at: string;
}

export interface DbWeatherLog {
  id: string;
  user_id: string;
  location: string;
  temperature: number;
  humidity: number;
  condition: string;
  recommendation_shown: string | null;
  rainfall_mm: number | null;
  logged_at: string;
}

export interface DbChatLog {
  id: string;
  user_id: string;
  location: string | null;
  question: string;
  ai_response: string | null;
  asked_at: string;
}

/** Payloads for inserting new records */
export type InsertDbUser = Omit<DbUser, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type InsertDbCrop = Omit<DbCrop, 'created_at' | 'updated_at'>;
export type InsertDbScan = Omit<DbScan, 'scanned_at'> & { scanned_at?: string };
export type InsertDbWeatherLog = Omit<DbWeatherLog, 'logged_at'> & { logged_at?: string };
export type InsertDbChatLog = Omit<DbChatLog, 'asked_at'> & { asked_at?: string };
