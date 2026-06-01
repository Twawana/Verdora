import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { Button, Card, ScreenWrapper } from '../../components/ui';
import { exportFarmerReport } from '../../services/api/adminService';
import { getUserActivityProfile } from '../../services/admin/userActivityService';
import { toApiError } from '../../services/api/errors';
import type { UserActivityProfile } from '../../types/analytics';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import type { AdminStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'UserDetail'>;

export function AdminUserDetailScreen({ route }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<UserActivityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'json' | 'pdf' | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const data = await getUserActivityProfile(userId);
        if (!data) {
          setError('Farmer not found');
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async (format: 'json' | 'pdf') => {
    setExportingFormat(format);
    try {
      const report = await exportFarmerReport(userId, format);
      const formatLabel = format === 'pdf' ? 'PDF report' : 'JSON file';
      Alert.alert(
        'Export complete',
        Platform.OS === 'web'
          ? `${report.filename} downloaded (${report.recordCount} records, ${formatLabel})`
          : `${report.filename}\n${report.recordCount} records (${formatLabel})\nSaved — use the share sheet to save or send the file.`,
      );
    } catch (err) {
      Alert.alert('Export failed', toApiError(err).message);
    } finally {
      setExportingFormat(null);
    }
  };

  if (loading && !profile) {
    return (
      <ScreenWrapper scrollable={false}>
        <ScreenHeader title="Farmer activity" showBack />
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </ScreenWrapper>
    );
  }

  if (error || !profile) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Farmer activity" showBack />
        <Card variant="highlight">
          <Text style={styles.error}>{error || 'No data available'}</Text>
        </Card>
      </ScreenWrapper>
    );
  }

  const { user, scans, farmingRecords, environmentLogs, chatQuestions, stats } = profile;

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
      }
    >
      <ScreenHeader
        title={user.name || 'Farmer'}
        subtitle={`${user.email} · ${user.location ?? 'No location'}`}
        showBack
      />

      <Card variant="highlight" style={styles.consentCard}>
        <Text style={styles.consentTitle}>
          {user.dataConsent ? 'Data collection consented' : 'No data consent on file'}
        </Text>
        <Text style={styles.consentBody}>
          {user.dataConsent
            ? 'This farmer opted in — all activity below was collected with their permission.'
            : 'Limited profile data only. Activity may be incomplete.'}
        </Text>
      </Card>

      <View style={styles.statGrid}>
        <StatPill label="Scans" value={stats.scanCount} />
        <StatPill label="Calendar" value={stats.farmingCount} />
        <StatPill label="Chat" value={stats.chatCount} />
        <StatPill label="Weather" value={stats.environmentCount} />
      </View>

      <Text style={styles.sectionTitle}>Export this farmer</Text>
      <View style={styles.exportRow}>
        <Button
          title="Export PDF"
          variant="primary"
          onPress={() => handleExport('pdf')}
          loading={exportingFormat === 'pdf'}
          disabled={exportingFormat !== null && exportingFormat !== 'pdf'}
          style={styles.exportBtn}
        />
        <Button
          title="Export JSON"
          variant="outline"
          onPress={() => handleExport('json')}
          loading={exportingFormat === 'json'}
          disabled={exportingFormat !== null && exportingFormat !== 'json'}
          style={styles.exportBtn}
        />
      </View>

      <Section title="Profile">
        <Card>
          <Meta label="Farmer type" value={user.farmerType ?? '—'} />
          <Meta label="Farm size" value={user.farmSize ?? '—'} />
          <Meta label="Region" value={user.region ?? '—'} />
          <Meta label="Village" value={user.village ?? '—'} />
          <Meta label="Soil type" value={user.soilType ?? '—'} />
          <Meta label="Methods" value={user.farmingMethods?.join(', ') || '—'} />
          <Meta label="Crops" value={user.cropsPlanted?.join(', ') || 'None'} />
          <Meta label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
        </Card>
      </Section>

      <Section title={`Crop scans (${scans.length})`}>
        {scans.length === 0 ? (
          <EmptyHint text="No crop scans recorded yet." />
        ) : (
          scans.map((s) => (
            <Card key={s.id} style={styles.itemCard}>
              {s.imageUri ? (
                <Image source={{ uri: s.imageUri }} style={styles.scanImage} />
              ) : null}
              <Text style={styles.itemTitle}>
                {s.cropType} — {s.disease ?? 'Healthy'}
              </Text>
              <Text style={styles.itemMeta}>
                {Math.round(s.confidence * 100)}% confidence · {new Date(s.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.itemBody}>{s.treatment}</Text>
            </Card>
          ))
        )}
      </Section>

      <Section title={`Plantation calendar (${farmingRecords.length})`}>
        {farmingRecords.length === 0 ? (
          <EmptyHint text="No planting events recorded." />
        ) : (
          farmingRecords.map((r) => (
            <Card key={r.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{r.cropName}</Text>
              <Text style={styles.itemMeta}>
                Plant {r.plantDate}
                {r.harvestDate ? ` → Harvest ${r.harvestDate}` : ''}
              </Text>
              {r.fieldName ? <Text style={styles.itemMeta}>Field: {r.fieldName}</Text> : null}
              {r.soilType ? <Text style={styles.itemMeta}>Soil: {r.soilType}</Text> : null}
            </Card>
          ))
        )}
      </Section>

      <Section title={`Weather checks (${environmentLogs.length})`}>
        {environmentLogs.length === 0 ? (
          <EmptyHint text="No weather logs recorded." />
        ) : (
          environmentLogs.map((e) => (
            <Card key={e.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{e.condition}</Text>
              <Text style={styles.itemMeta}>
                {e.temperature}°C · {e.humidity}% humidity · {e.location}
              </Text>
              <Text style={styles.itemMeta}>{new Date(e.timestamp).toLocaleString()}</Text>
            </Card>
          ))
        )}
      </Section>

      <Section title={`Chat history (${chatQuestions.length})`}>
        {chatQuestions.length === 0 ? (
          <EmptyHint text="No chat questions recorded." />
        ) : (
          chatQuestions.map((c) => (
            <Card key={c.id} style={styles.itemCard}>
              <Text style={styles.chatLabel}>Farmer asked</Text>
              <Text style={styles.chatQuestion}>{c.question}</Text>
              {c.aiResponse ? (
                <>
                  <Text style={styles.chatLabel}>Assistant replied</Text>
                  <Text style={styles.chatAnswer}>{c.aiResponse}</Text>
                </>
              ) : null}
              <Text style={styles.itemMeta}>{new Date(c.timestamp).toLocaleString()}</Text>
            </Card>
          ))
        )}
      </Section>
    </ScreenWrapper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <Card variant="highlight">
      <Text style={styles.empty}>{text}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  error: { ...typography.bodySmall, color: colors.error },
  consentCard: { marginBottom: spacing.md },
  consentTitle: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  consentBody: { ...typography.caption, lineHeight: 18 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  exportRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  exportBtn: { flex: 1 },
  pill: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  pillLabel: { ...typography.caption },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  itemCard: { marginBottom: spacing.sm },
  itemTitle: { ...typography.h3, fontSize: 15, color: colors.primaryDark },
  itemMeta: { ...typography.caption, marginTop: 4 },
  itemBody: { ...typography.bodySmall, marginTop: spacing.sm, lineHeight: 20 },
  scanImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  chatLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
  chatQuestion: { ...typography.bodySmall, fontWeight: '600', marginTop: 4, lineHeight: 20 },
  chatAnswer: { ...typography.bodySmall, marginTop: 4, lineHeight: 20, color: colors.textSecondary },
  metaRow: { ...typography.bodySmall, marginBottom: spacing.xs },
  metaLabel: { fontWeight: '700', color: colors.primaryDark },
  empty: { ...typography.bodySmall, textAlign: 'center', fontStyle: 'italic' },
});
