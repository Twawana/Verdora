import { supabase } from '../supabaseClient';
import type { AdminDashboardInsights } from '../../types/analytics';
import type { User } from '../../types';
import type { AdminExportResponse, AdminUsersResponse } from './types';

export async function getAdminDashboard(): Promise<AdminDashboardInsights> {
  const [
    { data: users, error: usersError },
    { data: cropScans, error: scansError },
    { data: farmingRecords, error: farmingError },
    { data: chatLogs, error: chatError },
    { data: envLogs, error: envError },
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('crop_scans').select('*').order('scanned_at', { ascending: false }),
    supabase.from('farming_events').select('*'),
    supabase.from('chat_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('environmental_logs').select('*').order('recorded_at', { ascending: false }),
  ]);

  if (usersError) console.warn('Failed to fetch users:', usersError);
  if (scansError) console.warn('Failed to fetch crop scans:', scansError);
  if (farmingError) console.warn('Failed to fetch farming records:', farmingError);
  if (chatError) console.warn('Failed to fetch chat logs:', chatError);
  if (envError) console.warn('Failed to fetch env logs:', envError);

  const allUsers = (users ?? []) as any[];
  const allScans = (cropScans ?? []) as any[];
  const allFarming = (farmingRecords ?? []) as any[];
  const allChat = (chatLogs ?? []) as any[];
  const allEnv = (envLogs ?? []) as any[];

  const farmers = allUsers.filter((u) => u.role === 'farmer');

  // Farmer type breakdown
  const byFarmerType: Record<string, number> = {};
  for (const f of farmers) {
    const key = f.farmer_type ?? 'unspecified';
    byFarmerType[key] = (byFarmerType[key] ?? 0) + 1;
  }

  // Location segments
  const locationMap = new Map<string, { userCount: number; farmerTypes: Record<string, number> }>();
  for (const u of farmers) {
    const loc = u.location ?? 'Unknown';
    const seg = locationMap.get(loc) ?? { userCount: 0, farmerTypes: {} };
    seg.userCount += 1;
    const ft = u.farmer_type ?? 'unspecified';
    seg.farmerTypes[ft] = (seg.farmerTypes[ft] ?? 0) + 1;
    locationMap.set(loc, seg);
  }
  const byLocation = Array.from(locationMap.entries())
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => b.userCount - a.userCount);

  // Disease outbreaks
  const diseaseMap = new Map<string, { count: number; locations: string[]; cropsAffected: string[] }>();
  for (const scan of allScans) {
    if (!scan.disease) continue;
    if (!diseaseMap.has(scan.disease)) {
      diseaseMap.set(scan.disease, { count: 0, locations: [], cropsAffected: [] });
    }
    const entry = diseaseMap.get(scan.disease)!;
    entry.count += 1;
    if (scan.location && !entry.locations.includes(scan.location)) entry.locations.push(scan.location);
    if (scan.crop_type && !entry.cropsAffected.includes(scan.crop_type)) entry.cropsAffected.push(scan.crop_type);
  }
  const diseaseOutbreaks = Array.from(diseaseMap.entries())
    .map(([disease, data]) => ({ disease, ...data }))
    .sort((a, b) => b.count - a.count);

  // Chat insights
  const chatTopicMap = new Map<string, { questionCount: number; sampleQuestion: string; locations: string[] }>();
  for (const q of allChat) {
    const topic = extractChatTopic(q.question ?? '');
    if (!chatTopicMap.has(topic)) {
      chatTopicMap.set(topic, { questionCount: 0, sampleQuestion: q.question, locations: [] });
    }
    const entry = chatTopicMap.get(topic)!;
    entry.questionCount += 1;
    if (q.region && !entry.locations.includes(q.region)) entry.locations.push(q.region);
  }
  const chatInsights = Array.from(chatTopicMap.entries())
    .map(([topic, data]) => ({ topic, ...data }))
    .sort((a, b) => b.questionCount - a.questionCount);

  // Environment summary
  const avgTemperature = allEnv.length > 0
    ? Math.round(allEnv.reduce((s: number, e: any) => s + (e.temperature ?? 0), 0) / allEnv.length)
    : 0;
  const avgHumidity = allEnv.length > 0
    ? Math.round(allEnv.reduce((s: number, e: any) => s + (e.humidity ?? 0), 0) / allEnv.length)
    : 0;
  const conditionMap = new Map<string, number>();
  for (const log of allEnv) {
    if (log.condition) conditionMap.set(log.condition, (conditionMap.get(log.condition) ?? 0) + 1);
  }
  const topConditions = Array.from(conditionMap.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    summary: {
      totalUsers: allUsers.length,
      totalFarmers: farmers.length,
      totalScans: allScans.length,
      totalFarmingRecords: allFarming.length,
      totalChatQuestions: allChat.length,
      totalEnvironmentLogs: allEnv.length,
    },
    users: allUsers,
    segments: { byFarmerType, byLocation },
    farmingData: allFarming,
    cropScans: allScans.slice(0, 50),
    diseaseOutbreaks,
    environmentLogs: allEnv.slice(0, 30),
    environmentSummary: { avgTemperature, avgHumidity, topConditions },
    chatInsights,
  };
}

export async function listUsers(): Promise<AdminUsersResponse> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as any;
}

export async function getUserById(id: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as any;
}

export async function exportUserReport(): Promise<AdminExportResponse> {
  const insights = await getAdminDashboard();
  const recordCount =
    insights.summary.totalScans +
    insights.summary.totalFarmingRecords +
    insights.summary.totalChatQuestions +
    insights.summary.totalEnvironmentLogs;
  return {
    filename: `verdora_analytics_${new Date().toISOString().slice(0, 10)}.json`,
    format: 'json',
    recordCount,
    generatedAt: new Date().toISOString(),
  };
}

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