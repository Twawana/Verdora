import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Input } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../constants/theme';

/** Optional farm details — collected for admin analytics */
export function FarmProfileCard() {
  const { user, updateProfile } = useAuth();
  const [soilType, setSoilType] = useState(user?.soilType ?? '');
  const [methods, setMethods] = useState(user?.farmingMethods?.join(', ') ?? '');
  const [analyticsConsent, setAnalyticsConsent] = useState(user?.analyticsConsent ?? false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(!user?.soilType);

  if (!user || user.role !== 'farmer') return null;

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      soilType: soilType.trim() || undefined,
      farmingMethods: methods
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    });
    setSaving(false);
    setExpanded(false);
  };

  const handleToggleConsent = async (enabled: boolean) => {
    setAnalyticsConsent(enabled);
    await updateProfile({ analyticsConsent: enabled });
  };

  return (
    <Card variant="highlight" style={styles.card}>
      <Text style={styles.title}>🌱 Farm profile (optional)</Text>
      <Text style={styles.subtitle}>
        Soil type & farming methods help Verdora improve regional insights
      </Text>
      <View style={styles.consentRow}>
        <Text style={styles.consentLabel}>Allow aggregated data collection</Text>
        <Switch
          value={analyticsConsent}
          onValueChange={handleToggleConsent}
          thumbColor={analyticsConsent ? '#0F766E' : '#F1F5F9'}
        />
      </View>
      <Text style={styles.consentNote}>
        Data is used only for anonymized agricultural intelligence and reporting.
        No personal data is sold.
      </Text>

      {expanded ? (
        <>
          <Input
            label="Soil type"
            value={soilType}
            onChangeText={setSoilType}
            placeholder="e.g. Loamy, Clay, Sandy"
          />
          <Input
            label="Farming methods (comma-separated)"
            value={methods}
            onChangeText={setMethods}
            placeholder="Organic, Irrigation, Crop rotation"
          />
          <View style={styles.row}>
            <Button title="Save" onPress={handleSave} loading={saving} style={styles.btn} />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setExpanded(false)}
              style={styles.btn}
            />
          </View>
        </>
      ) : (
        <View>
          <Text style={styles.saved}>
            Soil: {user.soilType ?? 'Not set'} · Methods:{' '}
            {user.farmingMethods?.join(', ') || 'Not set'}
          </Text>
          <Button title="Update farm details" variant="outline" onPress={() => setExpanded(true)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { ...typography.h3, fontSize: 16, color: colors.primaryDark },
  subtitle: { ...typography.caption, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  consentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  consentLabel: { ...typography.bodySmall, flex: 1, marginRight: spacing.sm },
  consentNote: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  btn: { flex: 1 },
  saved: { ...typography.bodySmall, marginBottom: spacing.sm },
});
