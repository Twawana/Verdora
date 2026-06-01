import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollBottomPadding } from '../../hooks/useScrollBottomPadding';
import { colors, spacing } from '../../constants/theme';

interface ScreenWrapperProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Lift content when the software keyboard opens */
  keyboardAvoiding?: boolean;
  /** Center content vertically when it fits (login/register) */
  centerContent?: boolean;
}

/** Consistent safe-area layout for all screens */
export function ScreenWrapper({
  children,
  scrollable = true,
  padded = true,
  refreshControl,
  keyboardAvoiding = false,
  centerContent = false,
  style,
  ...rest
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const bottomPad = scrollBottomPadding + spacing.lg;

  const contentStyle = [
    padded && styles.padded,
    { paddingBottom: bottomPad },
    centerContent && styles.centerContent,
    style,
  ];

  const scrollBody = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  );

  const staticBody = (
    <View style={[styles.flex, contentStyle]} {...rest}>
      {children}
    </View>
  );

  const body = scrollable ? scrollBody : staticBody;

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.md },
  centerContent: { flexGrow: 1, justifyContent: 'center' },
});
