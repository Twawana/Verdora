import { Platform } from 'react-native';
import type { AdminDashboardInsights, ChatQuestionRecord } from '../../types/analytics';
import { getAdminDashboardInsights, loadFullAnalyticsDatabase } from '../analytics/dataCollectionService';
import { getCloudAdminInsights } from '../supabase/analyticsRepository';
import { isSupabaseConfigured } from '../supabase/client';
import type { AdminExportFormat, AdminExportResponse } from '../api/types';
import { saveAnalyticsJson } from './downloadReport';
import { saveAnalyticsPdf } from './pdfReport';
import { buildAnalyticsPdfHtml } from './pdfReportBuilder';

export interface FullAnalyticsExport extends AdminDashboardInsights {
  exportedAt: string;
  source: 'cloud' | 'local' | 'mixed';
  chatQuestions: ChatQuestionRecord[];
}

function countExportRecords(payload: FullAnalyticsExport): number {
  return (
    payload.summary.totalScans +
    payload.summary.totalFarmingRecords +
    payload.summary.totalChatQuestions +
    payload.summary.totalEnvironmentLogs +
    payload.users.length
  );
}

/** Build export payload with every record (no dashboard preview limits). */
export async function buildFullAnalyticsExport(): Promise<FullAnalyticsExport> {
  const localDb = await loadFullAnalyticsDatabase();
  let source: FullAnalyticsExport['source'] = 'local';
  let insights: AdminDashboardInsights;

  try {
    const cloud = await getCloudAdminInsights();
    if (cloud && cloud.summary.totalUsers > 0) {
      insights = cloud;
      source = isSupabaseConfigured() ? 'cloud' : 'local';
    } else {
      insights = await getAdminDashboardInsights();
    }
  } catch {
    insights = await getAdminDashboardInsights();
  }

  const useLocalScans = localDb.cropScans.length > insights.cropScans.length;
  const useLocalFarming = localDb.farmingRecords.length > insights.farmingData.length;
  const useLocalEnv = localDb.environmentLogs.length > insights.environmentLogs.length;

  if (useLocalScans || useLocalFarming || useLocalEnv) {
    source = source === 'cloud' ? 'mixed' : 'local';
  }

  return {
    ...insights,
    cropScans: useLocalScans ? localDb.cropScans : insights.cropScans,
    farmingData: useLocalFarming ? localDb.farmingRecords : insights.farmingData,
    environmentLogs: useLocalEnv ? localDb.environmentLogs : insights.environmentLogs,
    chatQuestions: localDb.chatQuestions,
    exportedAt: new Date().toISOString(),
    source,
  };
}

export async function exportFullAnalyticsReport(
  format: AdminExportFormat = 'json',
): Promise<AdminExportResponse> {
  const payload = await buildFullAnalyticsExport();
  const dateStamp = payload.exportedAt.slice(0, 10);
  const recordCount = countExportRecords(payload);

  if (format === 'pdf') {
    const filename = `verdora_analytics_${dateStamp}.pdf`;
    const html = buildAnalyticsPdfHtml(payload);
    const savedTo = await saveAnalyticsPdf(filename, html);
    return {
      filename,
      format: 'pdf',
      recordCount,
      generatedAt: payload.exportedAt,
      downloadUrl: Platform.OS === 'web' ? filename : savedTo,
    };
  }

  const filename = `verdora_analytics_${dateStamp}.json`;
  const savedTo = await saveAnalyticsJson(filename, payload);
  return {
    filename,
    format: 'json',
    recordCount,
    generatedAt: payload.exportedAt,
    downloadUrl: Platform.OS === 'web' ? filename : savedTo,
  };
}
