import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface InlineLoaderProps {
  size?: 'small' | 'large';
  style?: ViewStyle;
}

/** Centered spinner for section-level loading inside a screen. */
export function InlineLoader({ size = 'small', style }: InlineLoaderProps) {
  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
