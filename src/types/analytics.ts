import type { FarmerType, User } from './index';

/** Crop scan record for admin analytics & outbreak tracking */
export interface CropScanRecord {
  id: string;
  userId: string;
  userName: string;
  location: string;
  imageUri?: string;
  cropType: string;
  disease: string | null;
  confidence: number;
  treatment: string;
  timestamp: string;
}

/** Farming activity from calendar & profile */
export interface FarmingDataRecord {
  id: string;
  userId: string;
  location: string;
  cropName: string;
  plantDate: string;
  harvestDate?: string;
  soilType?: string;
  farmingMethods?: string[];
  fieldName?: string;
  updatedAt: string;
}

/** Weather snapshot logged per user session */
export interface EnvironmentLogRecord {
  id: string;
  userId: string;
  location: string;
  temperature: number;
  humidity: number;
  condition: string;
  rainfallMm?: number;
  timestamp: string;
}

/** Farmer question from chatbot — market signal data */
export interface ChatQuestionRecord {
  id: string;
  userId: string;
  location: string;
  question: string;
  timestamp: string;
}

/** Extended user profile for segmentation */
export interface UserProfileRecord extends User {
  createdAt: string;
  farmSize?: string;
  farmerType?: FarmerType;
  soilType?: string;
  farmingMethods?: string[];
}

export interface DiseaseOutbreakInsight {
  disease: string;
  count: number;
  locations: string[];
  cropsAffected: string[];
}

export interface ChatInsight {
  topic: string;
  questionCount: number;
  sampleQuestion: string;
  locations: string[];
}

export interface LocationSegment {
  location: string;
  userCount: number;
  farmerTypes: Record<string, number>;
}

/** Aggregated admin dashboard payload */
export interface AdminDashboardInsights {
  summary: {
    totalUsers: number;
    totalFarmers: number;
    totalScans: number;
    totalFarmingRecords: number;
    totalChatQuestions: number;
    totalEnvironmentLogs: number;
  };
  users: UserProfileRecord[];
  segments: {
    byFarmerType: Record<string, number>;
    byLocation: LocationSegment[];
  };
  farmingData: FarmingDataRecord[];
  cropScans: CropScanRecord[];
  diseaseOutbreaks: DiseaseOutbreakInsight[];
  environmentLogs: EnvironmentLogRecord[];
  environmentSummary: {
    avgTemperature: number;
    avgHumidity: number;
    topConditions: { condition: string; count: number }[];
  };
  chatInsights: ChatInsight[];
}
