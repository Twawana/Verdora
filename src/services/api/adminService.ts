import { env } from '../../config/env';
import type { AdminDashboardInsights } from '../../types/analytics';
import type { User } from '../../types';
import { getAdminDashboardInsights } from '../analytics/dataCollectionService';
import { mockDelay } from '../mocks/mockUtils';
import { API_ENDPOINTS } from './endpoints';
import { apiGet, apiPost } from './client';
import type { AdminExportResponse, AdminUsersResponse } from './types';

async function mockExportReport(): Promise<AdminExportResponse> {
  const insights = await getAdminDashboardInsights();
  const recordCount =
    insights.summary.totalScans +
    insights.summary.totalFarmingRecords +
    insights.summary.totalChatQuestions +
    insights.summary.totalEnvironmentLogs;

  await mockDelay(1000);
  return {
    filename: `verdora_analytics_${new Date().toISOString().slice(0, 10)}.json`,
    format: 'json',
    recordCount,
    generatedAt: new Date().toISOString(),
  };
}

/** Admin dashboard — only real data collected from app usage */
export async function getAdminDashboard(): Promise<AdminDashboardInsights> {
  if (env.useMockApi) {
    await mockDelay(400);
    return getAdminDashboardInsights();
  }
  try {
    return await apiGet<AdminDashboardInsights>(API_ENDPOINTS.admin.dashboard);
  } catch {
    return getAdminDashboardInsights();
  }
}

export async function listUsers(): Promise<AdminUsersResponse> {
  const dashboard = await getAdminDashboard();
  return dashboard.users;
}

export async function getUserById(id: string): Promise<User> {
  const dashboard = await getAdminDashboard();
  const user = dashboard.users.find((u) => u.id === id);
  if (!user) throw new Error('User not found');
  return user;
}

export async function exportUserReport(): Promise<AdminExportResponse> {
  if (env.useMockApi) return mockExportReport();
  return apiPost<AdminExportResponse>(API_ENDPOINTS.admin.exportReport);
}
