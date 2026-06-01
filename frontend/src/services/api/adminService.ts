import { env } from '../../config/env';
import type { AdminDashboardInsights } from '../../types/analytics';
import type { User } from '../../types';
import { getAdminDashboardInsights } from '../analytics/dataCollectionService';
import { exportFullAnalyticsReport } from '../export/analyticsExportService';
import { exportUserActivityReport } from '../export/userExportService';
import { mockDelay } from '../mocks/mockUtils';
import { API_ENDPOINTS } from './endpoints';
import { apiGet } from './client';
import type { AdminExportFormat, AdminExportResponse, AdminUsersResponse } from './types';

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

/** Export complete analytics — JSON or PDF (downloads on web, share sheet on mobile) */
export async function exportUserReport(
  format: AdminExportFormat = 'json',
): Promise<AdminExportResponse> {
  if (env.useMockApi) {
    await mockDelay(400);
  }
  return exportFullAnalyticsReport(format);
}

/** Export a single farmer's activity — JSON or PDF */
export async function exportFarmerReport(
  userId: string,
  format: AdminExportFormat = 'json',
): Promise<AdminExportResponse> {
  if (env.useMockApi) {
    await mockDelay(400);
  }
  return exportUserActivityReport(userId, format);
}
