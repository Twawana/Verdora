import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AdminDashboardInsights,
  ChatInsight,
  ChatQuestionRecord,
  CropScanRecord,
  DiseaseOutbreakInsight,
  EnvironmentLogRecord,
  FarmingDataRecord,
  LocationSegment,
  UserProfileRecord,
} from '../../types/analytics';
import type { DiagnosisResult, PlantingEvent, User, WeatherData } from '../../types';
import { mockId } from '../mocks/mockUtils';

const ANALYTICS_DB_KEY = '@verdora_analytics_db';

interface AnalyticsDatabase {
  users: UserProfileRecord[];
  cropScans: CropScanRecord[];
  farmingRecords: FarmingDataRecord[];
  environmentLogs: EnvironmentLogRecord[];
  chatQuestions: ChatQuestionRecord[];
}

// Structured analytics collections are designed for cloud backends such as Firebase or Supabase.
// When connected to a real backend, these records map to:
// - users
// - scans
// - crops
// - chat_logs
// - weather_logs
// Each payload is linked by userId for aggregation, trend analysis, and consent-aware reporting.
async function loadDb(): Promise<AnalyticsDatabase> {
  const raw = await AsyncStorage.getItem(ANALYTICS_DB_KEY);
  if (raw) return JSON.parse(raw) as AnalyticsDatabase;
  return {
    users: [],
    cropScans: [],
    farmingRecords: [],
    environmentLogs: [],
    chatQuestions: [],
  };
}

async function saveDb(db: AnalyticsDatabase): Promise<void> {
  await AsyncStorage.setItem(ANALYTICS_DB_KEY, JSON.stringify(db));
}

// ——— Track events (called from app features) ———

function shouldCollectAnalytics(user?: User | null): boolean {
  return !!user && user.role !== 'admin' && user.analyticsConsent === true;
}

export async function trackUserProfile(user: User): Promise<void> {
  if (user.role === 'admin') return;
  const db = await loadDb();
  const record: UserProfileRecord = {
    ...user,
    analyticsConsent: user.analyticsConsent ?? false,
    createdAt: user.createdAt ?? new Date().toISOString(),
  };
  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) db.users[idx] = { ...db.users[idx], ...record };
  else db.users.push(record);
  await saveDb(db);
}

export async function trackCropScan(
  user: User,
  diagnosis: DiagnosisResult,
): Promise<void> {
  if (!shouldCollectAnalytics(user)) return;
  const db = await loadDb();
  db.cropScans.unshift({
    id: diagnosis.id,
    userId: user.id,
    userName: user.name,
    location: user.location ?? 'Unknown',
    imageUri: diagnosis.imageUri,
    cropType: diagnosis.cropName,
    disease: diagnosis.disease,
    confidence: diagnosis.confidence,
    treatment: diagnosis.treatment,
    timestamp: diagnosis.scannedAt,
  });
  await saveDb(db);
  await syncUserCrops(user.id, diagnosis.cropName);
}

async function syncUserCrops(userId: string, cropName: string): Promise<void> {
  const db = await loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  const crops = new Set([...(user.cropsPlanted ?? []), cropName]);
  user.cropsPlanted = Array.from(crops);
  await saveDb(db);
}

export async function trackFarmingRecord(
  user: User,
  event: PlantingEvent,
  extras?: { soilType?: string; farmingMethods?: string[] },
): Promise<void> {
  if (!shouldCollectAnalytics(user)) return;
  const db = await loadDb();
  const existing = db.farmingRecords.findIndex(
    (r) => r.userId === user.id && r.id === event.id,
  );
  const record: FarmingDataRecord = {
    id: event.id,
    userId: user.id,
    location: user.location ?? 'Unknown',
    cropName: event.cropName,
    plantDate: event.plantDate,
    harvestDate: event.harvestDate,
    soilType: extras?.soilType ?? user.soilType,
    farmingMethods: extras?.farmingMethods ?? user.farmingMethods,
    fieldName: event.fieldName,
    updatedAt: new Date().toISOString(),
  };
  if (existing >= 0) db.farmingRecords[existing] = record;
  else db.farmingRecords.push(record);
  await saveDb(db);
  await syncUserCrops(user.id, event.cropName);
}

export async function trackEnvironment(
  user: User,
  weather: WeatherData,
): Promise<void> {
  if (!shouldCollectAnalytics(user)) return;
  const db = await loadDb();
  db.environmentLogs.unshift({
    id: mockId('env'),
    userId: user.id,
    location: weather.location,
    temperature: weather.temperature,
    humidity: weather.humidity,
    condition: weather.condition,
    timestamp: new Date().toISOString(),
  });
  // Keep last 200 logs
  db.environmentLogs = db.environmentLogs.slice(0, 200);
  await saveDb(db);
}

export async function trackChatQuestion(user: User, question: string): Promise<void> {
  if (!shouldCollectAnalytics(user)) return;
  const db = await loadDb();
  db.chatQuestions.unshift({
    id: mockId('chat'),
    userId: user.id,
    location: user.location ?? 'Unknown',
    question: question.trim(),
    timestamp: new Date().toISOString(),
  });
  db.chatQuestions = db.chatQuestions.slice(0, 500);
  await saveDb(db);
}

export async function getUserCropScans(userId: string): Promise<CropScanRecord[]> {
  const db = await loadDb();
  return db.cropScans.filter((s) => s.userId === userId);
}

export async function getUserFarmingRecords(userId: string): Promise<FarmingDataRecord[]> {
  const db = await loadDb();
  return db.farmingRecords.filter((r) => r.userId === userId);
}

export async function getUserChatQuestions(userId: string) {
  const db = await loadDb();
  return db.chatQuestions.filter((q) => q.userId === userId);
}

export async function getLastEnvironmentLog(userId: string): Promise<EnvironmentLogRecord | null> {
  const db = await loadDb();
  return db.environmentLogs.find((e) => e.userId === userId) ?? null;
}

export async function updateFarmerProfile(
  userId: string,
  updates: Partial<Pick<User, 'soilType' | 'farmingMethods' | 'farmSize' | 'farmerType' | 'location' | 'analyticsConsent'>>,
): Promise<void> {
  const db = await loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    Object.assign(user, updates);
    await saveDb(db);
  }
}

// ——— Aggregation for admin ———

function extractChatTopic(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('yellow') || q.includes('wilting')) return 'Crop discoloration / health';
  if (q.includes('maize') || q.includes('corn')) return 'Maize / corn issues';
  if (q.includes('rice')) return 'Rice cultivation';
  if (q.includes('tomato') || q.includes('blight')) return 'Tomato diseases';
  if (q.includes('fertiliz') || q.includes('nutrient')) return 'Fertilizer & nutrients';
  if (q.includes('pest') || q.includes('insect')) return 'Pest management';
  if (q.includes('weather') || q.includes('rain')) return 'Weather & planting timing';
  if (q.includes('plant') || q.includes('when')) return 'Planting schedules';
  return 'General farming advice';
}

function aggregateDiseaseOutbreaks(scans: CropScanRecord[]): DiseaseOutbreakInsight[] {
  const map = new Map<string, DiseaseOutbreakInsight>();
  for (const scan of scans) {
    if (!scan.disease) continue;
    const key = scan.disease;
    const entry = map.get(key) ?? {
      disease: key,
      count: 0,
      locations: [],
      cropsAffected: [],
    };
    entry.count += 1;
    if (!entry.locations.includes(scan.location)) entry.locations.push(scan.location);
    if (!entry.cropsAffected.includes(scan.cropType)) entry.cropsAffected.push(scan.cropType);
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function aggregateChatInsights(questions: ChatQuestionRecord[]): ChatInsight[] {
  const map = new Map<string, ChatInsight>();
  for (const q of questions) {
    const topic = extractChatTopic(q.question);
    const entry = map.get(topic) ?? {
      topic,
      questionCount: 0,
      sampleQuestion: q.question,
      locations: [],
    };
    entry.questionCount += 1;
    if (!entry.locations.includes(q.location)) entry.locations.push(q.location);
    map.set(topic, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.questionCount - a.questionCount);
}

function aggregateLocationSegments(users: UserProfileRecord[]): LocationSegment[] {
  const map = new Map<string, LocationSegment>();
  for (const user of users) {
    const loc = user.location ?? 'Unknown';
    const seg = map.get(loc) ?? { location: loc, userCount: 0, farmerTypes: {} };
    seg.userCount += 1;
    const ft = user.farmerType ?? 'unspecified';
    seg.farmerTypes[ft] = (seg.farmerTypes[ft] ?? 0) + 1;
    map.set(loc, seg);
  }
  return Array.from(map.values()).sort((a, b) => b.userCount - a.userCount);
}

export async function getAdminDashboardInsights(): Promise<AdminDashboardInsights> {
  const db = await loadDb();
  const farmers = db.users.filter((u) => u.role === 'farmer');

  const byFarmerType: Record<string, number> = {};
  for (const f of farmers) {
    const key = f.farmerType ?? 'unspecified';
    byFarmerType[key] = (byFarmerType[key] ?? 0) + 1;
  }

  const envLogs = db.environmentLogs;
  const avgTemperature =
    envLogs.length > 0
      ? Math.round(envLogs.reduce((s, e) => s + e.temperature, 0) / envLogs.length)
      : 0;
  const avgHumidity =
    envLogs.length > 0
      ? Math.round(envLogs.reduce((s, e) => s + e.humidity, 0) / envLogs.length)
      : 0;

  const conditionMap = new Map<string, number>();
  for (const log of envLogs) {
    conditionMap.set(log.condition, (conditionMap.get(log.condition) ?? 0) + 1);
  }
  const topConditions = Array.from(conditionMap.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    summary: {
      totalUsers: db.users.length,
      totalFarmers: farmers.length,
      totalScans: db.cropScans.length,
      totalFarmingRecords: db.farmingRecords.length,
      totalChatQuestions: db.chatQuestions.length,
      totalEnvironmentLogs: envLogs.length,
    },
    users: db.users,
    segments: {
      byFarmerType,
      byLocation: aggregateLocationSegments(farmers),
    },
    farmingData: db.farmingRecords,
    cropScans: db.cropScans.slice(0, 50),
    diseaseOutbreaks: aggregateDiseaseOutbreaks(db.cropScans),
    environmentLogs: envLogs.slice(0, 30),
    environmentSummary: { avgTemperature, avgHumidity, topConditions },
    chatInsights: aggregateChatInsights(db.chatQuestions),
  };
}

