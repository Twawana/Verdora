import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_BASE_HEIGHT = 56;

/** Bottom inset for scroll content — tab bar when inside tabs, safe area otherwise. */
export function useScrollBottomPadding(): number {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  let parent = navigation.getParent();
  while (parent) {
    const state = parent.getState();
    if (state?.type === 'tab') {
      return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 0);
    }
    parent = parent.getParent();
  }

  return insets.bottom;
}
