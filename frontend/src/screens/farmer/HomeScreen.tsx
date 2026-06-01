import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavCard } from '../../components/navigation/NavCard';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { Card, ScreenWrapper } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getFarmerSummary, type FarmerSummary } from '../../services/data/farmerDataService';
import { colors, spacing, typography } from '../../constants/theme';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<FarmerTabParamList, 'Home'>,
  NativeStackScreenProps<FarmerStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<FarmerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getFarmerSummary(user);
    setSummary(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const parentNav = navigation.getParent();

  return (
    <ScreenWrapper>
      <ScreenHeader
        title={`Hello, ${user?.name?.split(' ')[0] ?? 'Farmer'}`}
        subtitle={user?.location ? user.location : 'Set your location in Profile'}
        rightAction={{ label: 'Logout', onPress: logout }}
      />

      <Pressable onPress={() => navigation.navigate('Profile')} style={styles.profileLink}>
        <Text style={styles.profileLinkText}>Edit profile & privacy settings</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : summary ? (
        <Card variant="highlight" style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your farm data</Text>
          <View style={styles.statsRow}>
            <StatPill label="Scans" value={summary.scanCount} />
            <StatPill label="Calendar" value={summary.calendarEventCount} />
            <StatPill label="Questions" value={summary.chatQuestionCount} />
          </View>
          {summary.crops.length > 0 ? (
            <Text style={styles.crops}>Growing: {summary.crops.join(', ')}</Text>
          ) : (
            <Text style={styles.cropsMuted}>Add crops in Calendar to unlock scan & weather insights</Text>
          )}
        </Card>
      ) : null}

      <Text style={styles.section}>Navigate</Text>
      <NavCard
        emoji="📷"
        title="Crop Scanner"
        description="Scan or upload — diagnosis uses your registered crops"
        badge={summary?.scanCount}
        onPress={() => navigation.navigate('Scanner')}
      />
      <NavCard
        emoji="📅"
        title="Plantation Calendar"
        description="Your planting & harvest schedule"
        badge={summary?.calendarEventCount}
        onPress={() => navigation.navigate('Calendar')}
      />
      <NavCard
        emoji="🌦️"
        title="Weather"
        description={`Forecasts for ${user?.location?.split(',')[0] ?? 'your area'}`}
        onPress={() => navigation.navigate('Weather')}
      />
      <NavCard
        emoji="🤖"
        title="Farming Assistant"
        description="Ask questions — answers use your real farm data"
        badge={summary?.chatQuestionCount}
        onPress={() => navigation.navigate('Chat')}
      />

      {summary && summary.recentScans.length > 0 ? (
        <>
          <Text style={styles.section}>Latest scan</Text>
          <Pressable
            onPress={() =>
              parentNav?.navigate('DiagnosisResults', { result: summary.recentScans[0] })
            }
          >
            <Card>
              <Text style={styles.scanCrop}>{summary.recentScans[0].cropName}</Text>
              <Text style={styles.scanMeta}>
                {summary.recentScans[0].disease ?? 'Healthy'} · Tap for details
              </Text>
            </Card>
          </Pressable>
        </>
      ) : null}
    </ScreenWrapper>
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

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.lg },
  profileLink: { marginBottom: spacing.md },
  profileLinkText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  statsCard: { marginBottom: spacing.md },
  statsTitle: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
  },
  pillValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  pillLabel: { ...typography.caption },
  crops: { ...typography.bodySmall, marginTop: spacing.md },
  cropsMuted: { ...typography.caption, marginTop: spacing.md, fontStyle: 'italic' },
  section: { ...typography.h3, marginTop: spacing.md, marginBottom: spacing.sm },
  scanCrop: { ...typography.h3, fontSize: 16, color: colors.primary },
  scanMeta: { ...typography.caption, marginTop: 4 },
});
