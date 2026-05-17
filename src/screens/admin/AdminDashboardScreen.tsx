import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, ScreenWrapper, Button } from '../../components/ui';
import { AdminTabBar, type AdminTab } from '../../components/admin/AdminTabBar';
import { useAuth } from '../../context/AuthContext';
import { exportUserReport, getAdminDashboard } from '../../services/api/adminService';
import { toApiError } from '../../services/api/errors';
import type { AdminDashboardInsights } from '../../types/analytics';
import { colors, spacing, typography } from '../../constants/theme';

export function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<AdminDashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const insights = await getAdminDashboard();
      setData(insights);
    } catch (err) {
      Alert.alert('Error', toApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const report = await exportUserReport();
      Alert.alert(
        'Analytics export ready',
        `${report.filename}\n${report.recordCount} total records\nFormat: ${report.format.toUpperCase()}`,
      );
    } catch (err) {
      Alert.alert('Export failed', toApiError(err).message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <ScreenWrapper scrollable={false}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </ScreenWrapper>
    );
  }

  if (!data) return null;

  const farmers = data.users.filter((u) => u.role === 'farmer');
  const consentedFarmers = farmers.filter((u) => u.analyticsConsent).length;
  const optedOutFarmers = farmers.length - consentedFarmers;

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Data Intelligence</Text>
          <Text style={styles.subtitle}>Verdora admin — collected farmer insights</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logout}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <AdminTabBar active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          {data.summary.totalFarmers === 0 ? (
            <Card variant="highlight" style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No data collected yet</Text>
              <Text style={styles.emptyBody}>
                Farmers must register, add calendar events, scan crops, use weather, and chat.
                Data appears here in real time as they use the app.
              </Text>
            </Card>
          ) : null}
          <View style={styles.statGrid}>
            <StatBox label="Farmers" value={data.summary.totalFarmers} />
            <StatBox label="Crop scans" value={data.summary.totalScans} />
            <StatBox label="Farming records" value={data.summary.totalFarmingRecords} />
            <StatBox label="Chat questions" value={data.summary.totalChatQuestions} />
            <StatBox label="Consented farmers" value={consentedFarmers} />
            <StatBox label="Opted-out farmers" value={optedOutFarmers} />
          </View>
          <Card variant="highlight">
            <Text style={styles.cardTitle}>💰 Core value data</Text>
            <Text style={styles.cardBody}>
              Verdora collects user profiles, farming schedules, AI crop scans, weather logs, and
              chatbot questions — the dataset companies pay for.
            </Text>
          </Card>
          {data.diseaseOutbreaks[0] ? (
            <Card style={styles.alertCard}>
              <Text style={styles.alertTitle}>⚠️ Trending disease</Text>
              <Text style={styles.alertBody}>
                {data.diseaseOutbreaks[0].disease} — {data.diseaseOutbreaks[0].count} cases in{' '}
                {data.diseaseOutbreaks[0].locations.join(', ')}
              </Text>
            </Card>
          ) : null}
          {data.chatInsights[0] ? (
            <Card>
              <Text style={styles.cardTitle}>👀 Top market signal (chat)</Text>
              <Text style={styles.cardBody}>
                “{data.chatInsights[0].sampleQuestion}” — {data.chatInsights[0].questionCount}{' '}
                similar questions
              </Text>
            </Card>
          ) : null}
        </>
      )}

      {tab === 'users' && (
        <>
          <Text style={styles.section}>Segmentation by farmer type</Text>
          <View style={styles.statGrid}>
            {Object.entries(data.segments.byFarmerType).map(([type, count]) => (
              <StatBox key={type} label={type} value={count} />
            ))}
          </View>
          <Text style={styles.section}>By location</Text>
          {data.segments.byLocation.map((seg) => (
            <Card key={seg.location} style={styles.itemCard}>
              <Text style={styles.itemTitle}>📍 {seg.location}</Text>
              <Text style={styles.itemMeta}>{seg.userCount} farmers</Text>
              <Text style={styles.itemMeta}>
                {Object.entries(seg.farmerTypes)
                  .map(([t, c]) => `${t}: ${c}`)
                  .join(' · ')}
              </Text>
            </Card>
          ))}
          <Text style={styles.section}>User profiles ({farmers.length})</Text>
          {farmers.map((u) => (
            <Card key={u.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{u.name || 'Unnamed'}</Text>
              <Text style={styles.itemMeta}>{u.email}</Text>
              <Text style={styles.itemMeta}>📍 {u.location}</Text>
              <Text style={styles.itemMeta}>
                {u.farmerType ?? '—'} · {u.farmSize ?? 'Farm size N/A'}
              </Text>
              <Text style={styles.itemMeta}>
                Soil: {u.soilType ?? '—'} · Methods: {u.farmingMethods?.join(', ') || '—'}
              </Text>
              <Text style={styles.itemMeta}>Crops: {u.cropsPlanted?.join(', ') || 'None'}</Text>
            </Card>
          ))}
        </>
      )}

      {tab === 'farming' && (
        <>
          <Text style={styles.section}>Farming data ({data.farmingData.length})</Text>
          <Text style={styles.hint}>Plantation dates, harvest dates, soil & methods</Text>
          {data.farmingData.map((r) => (
            <Card key={`${r.userId}-${r.id}`} style={styles.itemCard}>
              <Text style={styles.itemTitle}>🌾 {r.cropName}</Text>
              <Text style={styles.itemMeta}>📍 {r.location}</Text>
              <Text style={styles.itemMeta}>
                Plant: {r.plantDate}
                {r.harvestDate ? ` → Harvest: ${r.harvestDate}` : ''}
              </Text>
              <Text style={styles.itemMeta}>Soil: {r.soilType ?? '—'}</Text>
              <Text style={styles.itemMeta}>
                Methods: {r.farmingMethods?.join(', ') || '—'}
              </Text>
              {r.fieldName ? <Text style={styles.itemMeta}>Field: {r.fieldName}</Text> : null}
            </Card>
          ))}
        </>
      )}

      {tab === 'scans' && (
        <>
          <Text style={styles.section}>Disease outbreaks</Text>
          {data.diseaseOutbreaks.length === 0 ? (
            <Card><Text style={styles.itemMeta}>No diseases detected yet</Text></Card>
          ) : (
            data.diseaseOutbreaks.map((o) => (
              <Card key={o.disease} style={styles.itemCard}>
                <Text style={styles.itemTitle}>🦠 {o.disease}</Text>
                <Text style={styles.itemMeta}>{o.count} detections</Text>
                <Text style={styles.itemMeta}>Locations: {o.locations.join(', ')}</Text>
                <Text style={styles.itemMeta}>Crops: {o.cropsAffected.join(', ')}</Text>
              </Card>
            ))
          )}
          <Text style={styles.section}>Recent crop scans</Text>
          {data.cropScans.map((s) => (
            <Card key={s.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                {s.cropType} — {s.disease ?? 'Healthy'}
              </Text>
              <Text style={styles.itemMeta}>
                {s.userName} · {s.location}
              </Text>
              <Text style={styles.itemMeta}>
                {Math.round(s.confidence * 100)}% confidence ·{' '}
                {new Date(s.timestamp).toLocaleString()}
              </Text>
            </Card>
          ))}
        </>
      )}

      {tab === 'environment' && (
        <>
          <View style={styles.statGrid}>
            <StatBox label="Avg temp" value={`${data.environmentSummary.avgTemperature}°C`} />
            <StatBox label="Avg humidity" value={`${data.environmentSummary.avgHumidity}%`} />
            <StatBox label="Logs" value={data.summary.totalEnvironmentLogs} />
          </View>
          <Text style={styles.section}>Common conditions</Text>
          {data.environmentSummary.topConditions.map((c) => (
            <Card key={c.condition} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{c.condition}</Text>
              <Text style={styles.itemMeta}>{c.count} readings</Text>
            </Card>
          ))}
          <Text style={styles.section}>Recent environmental logs</Text>
          {data.environmentLogs.map((e) => (
            <Card key={e.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{e.location}</Text>
              <Text style={styles.itemMeta}>
                {e.temperature}°C · {e.humidity}% humidity · {e.condition}
              </Text>
              <Text style={styles.itemMeta}>{new Date(e.timestamp).toLocaleString()}</Text>
            </Card>
          ))}
        </>
      )}

      {tab === 'chat' && (
        <>
          <Card variant="highlight">
            <Text style={styles.cardTitle}>Hidden gold — market signals</Text>
            <Text style={styles.cardBody}>
              Clustered farmer questions reveal knowledge gaps and product opportunities.
            </Text>
          </Card>
          <Text style={styles.section}>Topic insights</Text>
          {data.chatInsights.map((insight) => (
            <Card key={insight.topic} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{insight.topic}</Text>
              <Text style={styles.itemMeta}>{insight.questionCount} questions</Text>
              <Text style={styles.itemMeta} numberOfLines={2}>
                Example: “{insight.sampleQuestion}”
              </Text>
              <Text style={styles.itemMeta}>Regions: {insight.locations.join(', ')}</Text>
            </Card>
          ))}
        </>
      )}

      <Button
        title="Export full analytics (JSON)"
        variant="outline"
        onPress={handleExport}
        loading={exporting}
        fullWidth
      />
    </ScreenWrapper>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.caption },
  logout: { ...typography.bodySmall, color: colors.secondaryDark },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backText: { ...typography.bodySmall, color: colors.primary },
  logoutButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { ...typography.caption, marginTop: 4, textAlign: 'center' },
  section: { ...typography.h3, marginTop: spacing.md, marginBottom: spacing.sm },
  hint: { ...typography.caption, marginBottom: spacing.md },
  itemCard: { marginBottom: spacing.sm },
  itemTitle: { ...typography.h3, fontSize: 15, color: colors.primaryDark },
  itemMeta: { ...typography.caption, marginTop: 4 },
  cardTitle: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  cardBody: { ...typography.bodySmall, lineHeight: 20 },
  alertCard: { backgroundColor: '#FFF8E7', marginBottom: spacing.md },
  alertTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.secondaryDark },
  alertBody: { ...typography.bodySmall, marginTop: spacing.xs },
  emptyCard: { marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, fontSize: 16, marginBottom: spacing.sm },
  emptyBody: { ...typography.bodySmall, lineHeight: 20 },
});
