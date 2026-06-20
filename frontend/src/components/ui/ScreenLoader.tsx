import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { ScreenWrapper } from './ScreenWrapper';

interface ScreenLoaderProps {
  /** Optional header shown above the spinner (e.g. ScreenHeader). */
  header?: React.ReactNode;
  size?: 'small' | 'large';
  label?: string;
}

/** Full-screen centered loading state with optional header. */
export function ScreenLoader({ header, size = 'large', label }: ScreenLoaderProps) {
  return (
    <ScreenWrapper scrollable={false}>
      {header}
      <View style={styles.center}>
        <ActivityIndicator size={size} color={colors.primary} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  label: { ...typography.caption, marginTop: spacing.sm },
});
