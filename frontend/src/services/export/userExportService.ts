import { Platform } from 'react-native';
import type { UserActivityProfile } from '../../types/analytics';
import { getUserActivityProfile } from '../admin/userActivityService';
import type { AdminExportFormat, AdminExportResponse } from '../api/types';
import { saveAnalyticsJson } from './downloadReport';
import { saveAnalyticsPdf } from './pdfReport';
import { buildUserActivityPdfHtml } from './pdfReportBuilder';

export type UserActivityExport = UserActivityProfile & {
  exportedAt: string;
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) || 'farmer';
}

export async function buildUserActivityExport(userId: string): Promise<UserActivityExport | null> {
  const profile = await getUserActivityProfile(userId);
  if (!profile) return null;
  return { ...profile, exportedAt: new Date().toISOString() };
}

export async function exportUserActivityReport(
  userId: string,
  format: AdminExportFormat = 'json',
): Promise<AdminExportResponse> {
  const payload = await buildUserActivityExport(userId);
  if (!payload) throw new Error('Farmer not found');

  const slug = slugify(payload.user.name || payload.user.email);
  const dateStamp = payload.exportedAt.slice(0, 10);
  const recordCount =
    payload.stats.scanCount +
    payload.stats.farmingCount +
    payload.stats.chatCount +
    payload.stats.environmentCount;

  if (format === 'pdf') {
    const filename = `verdora_farmer_${slug}_${dateStamp}.pdf`;
    const html = buildUserActivityPdfHtml(payload);
    const savedTo = await saveAnalyticsPdf(filename, html);
    return {
      filename,
      format: 'pdf',
      recordCount,
      generatedAt: payload.exportedAt,
      downloadUrl: Platform.OS === 'web' ? filename : savedTo,
    };
  }

  const filename = `verdora_farmer_${slug}_${dateStamp}.json`;
  const savedTo = await saveAnalyticsJson(filename, payload);
  return {
    filename,
    format: 'json',
    recordCount,
    generatedAt: payload.exportedAt,
    downloadUrl: Platform.OS === 'web' ? filename : savedTo,
  };
}
