import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

export function ScreenHeader({ title, subtitle, showBack, rightAction }: ScreenHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack && navigation.canGoBack() ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} hitSlop={8}>
            <Text style={styles.rightAction}>{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  backBtn: { minWidth: 72 },
  backPlaceholder: { minWidth: 72 },
  backText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  rightAction: { ...typography.bodySmall, color: colors.secondaryDark, fontWeight: '600' },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.bodySmall, marginTop: spacing.xs },
});
