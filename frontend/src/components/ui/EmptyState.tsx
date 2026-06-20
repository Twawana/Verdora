import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: EmptyStateAction;
  /** default = highlight card; muted = plain card; error = error styling */
  variant?: 'default' | 'muted' | 'error';
  style?: ViewStyle;
}

/** Consistent empty, hint, and error presentation. */
export function EmptyState({
  title,
  message,
  action,
  variant = 'default',
  style,
}: EmptyStateProps) {
  const cardVariant = variant === 'muted' ? 'default' : 'highlight';
  const messageStyle =
    variant === 'error'
      ? styles.errorMessage
      : variant === 'muted'
        ? styles.mutedMessage
        : styles.message;

  return (
    <Card variant={cardVariant} style={style}>
      <View style={styles.content}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={messageStyle}>{message}</Text>
        {action ? (
          <Button title={action.label} onPress={action.onPress} variant="outline" style={styles.action} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3, fontSize: 16, color: colors.primary, textAlign: 'center' },
  message: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
  mutedMessage: { ...typography.bodySmall, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  errorMessage: { ...typography.bodySmall, textAlign: 'center', color: colors.error, lineHeight: 20 },
  action: { marginTop: spacing.xs, alignSelf: 'stretch' },
});
