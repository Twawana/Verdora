import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';

interface NavCardProps {
  emoji: string;
  title: string;
  description: string;
  badge?: string | number;
  onPress: () => void;
}

export function NavCard({ emoji, title, description, badge, onPress }: NavCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge !== undefined && badge !== 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  pressed: { opacity: 0.92 },
  emoji: { fontSize: 28, marginRight: spacing.md },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { ...typography.h3, fontSize: 16, color: colors.primaryDark },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  description: { ...typography.caption, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: spacing.sm },
});
