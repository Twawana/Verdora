import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input, ScreenWrapper } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import type { FarmerType } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const FARMER_TYPES: { value: FarmerType; label: string }[] = [
  { value: 'small-scale', label: 'Small-scale' },
  { value: 'commercial', label: 'Commercial' },
];

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [farmerType, setFarmerType] = useState<FarmerType>('small-scale');
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !location.trim()) {
      setError('Email, password, and location are required');
      return;
    }
    setLoading(true);
    const result = await register({
      name: name || undefined,
      email,
      password,
      location: location.trim(),
      farmSize: farmSize.trim() || undefined,
      farmerType,
      analyticsConsent,
    });
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Registration failed');
  };

  return (
    <ScreenWrapper padded>
      <Text style={styles.title}>Join Verdora</Text>
      <Text style={styles.subtitle}>Help us personalize insights for your region</Text>

      <Input label="Full name (optional)" value={name} onChangeText={setName} placeholder="Maria Santos" />
      <Input
        label="Email *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input label="Password *" value={password} onChangeText={setPassword} secureTextEntry />
      <Input
        label="Location *"
        value={location}
        onChangeText={setLocation}
        placeholder="Province, Country — e.g. Laguna, Philippines"
      />
      <Input
        label="Farm size (optional)"
        value={farmSize}
        onChangeText={setFarmSize}
        placeholder="e.g. 2 hectares"
      />

      <Text style={styles.fieldLabel}>Type of farmer</Text>
      <View style={styles.typeRow}>
        {FARMER_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.typeChip, farmerType === t.value && styles.typeChipActive]}
            onPress={() => setFarmerType(t.value)}
          >
            <Text style={[styles.typeText, farmerType === t.value && styles.typeTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.consentRow}>
        <Text style={styles.consentLabel}>Allow farming data collection</Text>
        <Switch value={analyticsConsent} onValueChange={setAnalyticsConsent} thumbColor={analyticsConsent ? '#0F766E' : '#F1F5F9'} />
      </View>
      <Text style={styles.consentNote}>
        This app collects farming and usage data to improve services and generate agricultural insights.
        Only aggregated, anonymized analytics are used. No personal data is sold.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Register" onPress={handleRegister} loading={loading} fullWidth />
      <Button title="Back to Login" variant="ghost" onPress={() => navigation.goBack()} fullWidth />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.primary, marginTop: spacing.lg },
  subtitle: { ...typography.bodySmall, marginBottom: spacing.lg },
  fieldLabel: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  typeText: { ...typography.bodySmall, color: colors.textSecondary },
  typeTextActive: { color: colors.primary, fontWeight: '700' },
  error: { ...typography.bodySmall, color: colors.error, marginBottom: spacing.md },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
  },
  consentLabel: { ...typography.bodySmall, flex: 1, marginRight: spacing.sm },
  consentNote: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
});
