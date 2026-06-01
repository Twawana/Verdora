import type { AdminDashboardInsights, ChatQuestionRecord, UserActivityProfile } from '../../types/analytics';

export type AnalyticsPdfData = AdminDashboardInsights & {
  exportedAt: string;
  source: 'cloud' | 'local' | 'mixed';
  chatQuestions: ChatQuestionRecord[];
};

function escapeHtml(value: unknown): string {
  const text = String(value ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return `<p class="empty">No records</p>`;
  }
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function section(title: string, content: string): string {
  return `<section class="block"><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

/** Build print-ready HTML for PDF export */
export function buildAnalyticsPdfHtml(data: AnalyticsPdfData): string {
  const { summary, users, cropScans, farmingData, environmentLogs, chatQuestions } = data;
  const farmers = users.filter((u) => u.role === 'farmer');

  const summaryTable = table(
    ['Metric', 'Count'],
    [
      ['Total users', String(summary.totalUsers)],
      ['Farmers', String(summary.totalFarmers)],
      ['Crop scans', String(summary.totalScans)],
      ['Farming records', String(summary.totalFarmingRecords)],
      ['Chat questions', String(summary.totalChatQuestions)],
      ['Weather logs', String(summary.totalEnvironmentLogs)],
    ],
  );

  const farmersTable = table(
    ['Name', 'Email', 'Location', 'Type', 'Farm size', 'Consent', 'Crops'],
    farmers.map((u) => [
      u.name,
      u.email,
      u.location ?? '—',
      u.farmerType ?? '—',
      u.farmSize ?? '—',
      u.dataConsent ? 'Yes' : 'No',
      (u.cropsPlanted ?? []).join(', ') || '—',
    ]),
  );

  const scansTable = table(
    ['Farmer', 'Crop', 'Disease', 'Confidence', 'Location', 'Date', 'Treatment'],
    cropScans.map((s) => [
      s.userName,
      s.cropType,
      s.disease ?? 'Healthy',
      `${Math.round(s.confidence * 100)}%`,
      s.location,
      fmtDate(s.timestamp),
      s.treatment,
    ]),
  );

  const farmingTable = table(
    ['Crop', 'Location', 'Plant date', 'Harvest', 'Field', 'Soil', 'Updated'],
    farmingData.map((r) => [
      r.cropName,
      r.location,
      r.plantDate,
      r.harvestDate ?? '—',
      r.fieldName ?? '—',
      r.soilType ?? '—',
      fmtDate(r.updatedAt),
    ]),
  );

  const weatherTable = table(
    ['Location', 'Temp (°C)', 'Humidity', 'Condition', 'Date'],
    environmentLogs.map((e) => [
      e.location,
      String(e.temperature),
      `${e.humidity}%`,
      e.condition,
      fmtDate(e.timestamp),
    ]),
  );

  const chatTable = table(
    ['Location', 'Question', 'Assistant reply', 'Date'],
    chatQuestions.map((c) => [
      c.location,
      c.question,
      c.aiResponse ?? '—',
      fmtDate(c.timestamp),
    ]),
  );

  const outbreaksTable = table(
    ['Disease', 'Cases', 'Locations', 'Crops affected'],
    data.diseaseOutbreaks.map((o) => [
      o.disease,
      String(o.count),
      o.locations.join(', '),
      o.cropsAffected.join(', '),
    ]),
  );

  const chatInsightsTable = table(
    ['Topic', 'Questions', 'Sample question', 'Regions'],
    data.chatInsights.map((i) => [
      i.topic,
      String(i.questionCount),
      i.sampleQuestion,
      i.locations.join(', '),
    ]),
  );

  const envSummaryTable = table(
    ['Avg temperature', 'Avg humidity', 'Top conditions'],
    [
      [
        `${data.environmentSummary.avgTemperature}°C`,
        `${data.environmentSummary.avgHumidity}%`,
        data.environmentSummary.topConditions
          .map((c) => `${c.condition} (${c.count})`)
          .join(', ') || '—',
      ],
    ],
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Verdora Analytics Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1b4332;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 28px 32px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 6px;
      color: #2d6a4f;
    }
    .meta {
      color: #52796f;
      margin-bottom: 24px;
      font-size: 10px;
    }
    h2 {
      font-size: 14px;
      color: #2d6a4f;
      border-bottom: 2px solid #95d5b2;
      padding-bottom: 4px;
      margin: 0 0 10px;
    }
    .block { margin-bottom: 22px; page-break-inside: avoid; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10px;
    }
    th {
      background: #2d6a4f;
      color: #fff;
      text-align: left;
      padding: 7px 8px;
      font-weight: 600;
    }
    td {
      border: 1px solid #d8f3dc;
      padding: 6px 8px;
      vertical-align: top;
      word-break: break-word;
    }
    tr:nth-child(even) td { background: #f8fdf9; }
    .empty {
      font-style: italic;
      color: #52796f;
      margin: 0;
    }
    @media print {
      body { padding: 16px; }
      .block { page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Verdora Analytics Report</h1>
  <p class="meta">
    Generated ${escapeHtml(fmtDate(data.exportedAt))} · Source: ${escapeHtml(data.source)} ·
    Consented farmer data only
  </p>

  ${section('Summary', summaryTable)}
  ${section(`Farmers (${farmers.length})`, farmersTable)}
  ${section('Environment summary', envSummaryTable)}
  ${section(`Crop scans (${cropScans.length})`, scansTable)}
  ${section(`Plantation calendar (${farmingData.length})`, farmingTable)}
  ${section(`Weather logs (${environmentLogs.length})`, weatherTable)}
  ${section(`Chat history (${chatQuestions.length})`, chatTable)}
  ${section('Disease outbreaks', outbreaksTable)}
  ${section('Chat topic insights', chatInsightsTable)}
</body>
</html>`;
}

export type UserActivityPdfData = UserActivityProfile & { exportedAt: string };

/** Build PDF HTML for a single farmer's activity */
export function buildUserActivityPdfHtml(data: UserActivityPdfData): string {
  const { user, scans, farmingRecords, environmentLogs, chatQuestions, stats } = data;

  const profileTable = table(
    ['Field', 'Value'],
    [
      ['Name', user.name],
      ['Email', user.email],
      ['Location', user.location ?? '—'],
      ['Region', user.region ?? '—'],
      ['Village', user.village ?? '—'],
      ['Farmer type', user.farmerType ?? '—'],
      ['Farm size', user.farmSize ?? '—'],
      ['Soil type', user.soilType ?? '—'],
      ['Methods', user.farmingMethods?.join(', ') || '—'],
      ['Crops', user.cropsPlanted?.join(', ') || 'None'],
      ['Data consent', user.dataConsent ? 'Yes' : 'No'],
      ['Joined', fmtDate(user.createdAt)],
    ],
  );

  const statsTable = table(
    ['Scans', 'Calendar', 'Chat', 'Weather'],
    [[String(stats.scanCount), String(stats.farmingCount), String(stats.chatCount), String(stats.environmentCount)]],
  );

  const scansTable = table(
    ['Crop', 'Disease', 'Confidence', 'Date', 'Treatment'],
    scans.map((s) => [
      s.cropType,
      s.disease ?? 'Healthy',
      `${Math.round(s.confidence * 100)}%`,
      fmtDate(s.timestamp),
      s.treatment,
    ]),
  );

  const farmingTable = table(
    ['Crop', 'Plant date', 'Harvest', 'Field', 'Soil'],
    farmingRecords.map((r) => [
      r.cropName,
      r.plantDate,
      r.harvestDate ?? '—',
      r.fieldName ?? '—',
      r.soilType ?? '—',
    ]),
  );

  const weatherTable = table(
    ['Condition', 'Temp', 'Humidity', 'Location', 'Date'],
    environmentLogs.map((e) => [
      e.condition,
      `${e.temperature}°C`,
      `${e.humidity}%`,
      e.location,
      fmtDate(e.timestamp),
    ]),
  );

  const chatTable = table(
    ['Question', 'Reply', 'Date'],
    chatQuestions.map((c) => [c.question, c.aiResponse ?? '—', fmtDate(c.timestamp)]),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Verdora Farmer Report — ${escapeHtml(user.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1b4332;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 28px 32px;
    }
    h1 { font-size: 22px; margin: 0 0 6px; color: #2d6a4f; }
    .meta { color: #52796f; margin-bottom: 24px; font-size: 10px; }
    h2 {
      font-size: 14px;
      color: #2d6a4f;
      border-bottom: 2px solid #95d5b2;
      padding-bottom: 4px;
      margin: 0 0 10px;
    }
    .block { margin-bottom: 22px; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
    th { background: #2d6a4f; color: #fff; text-align: left; padding: 7px 8px; font-weight: 600; }
    td { border: 1px solid #d8f3dc; padding: 6px 8px; vertical-align: top; word-break: break-word; }
    tr:nth-child(even) td { background: #f8fdf9; }
    .empty { font-style: italic; color: #52796f; margin: 0; }
    @media print { body { padding: 16px; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Farmer Activity Report</h1>
  <p class="meta">
    ${escapeHtml(user.name)} · ${escapeHtml(user.email)} ·
    Generated ${escapeHtml(fmtDate(data.exportedAt))}
  </p>

  ${section('Activity summary', statsTable)}
  ${section('Profile', profileTable)}
  ${section(`Crop scans (${scans.length})`, scansTable)}
  ${section(`Plantation calendar (${farmingRecords.length})`, farmingTable)}
  ${section(`Weather checks (${environmentLogs.length})`, weatherTable)}
  ${section(`Chat history (${chatQuestions.length})`, chatTable)}
</body>
</html>`;
}
