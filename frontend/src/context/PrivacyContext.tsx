import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIVACY_STORAGE_KEY } from '../constants/privacy';
import { updateUserConsent } from '../services/supabase/repositories/usersRepository';
import { isSupabaseConfigured } from '../services/supabase/client';
import { useAuth } from './AuthContext';

interface PrivacyContextValue {
  hasConsent: boolean;
  isLoading: boolean;
  setConsent: (value: boolean) => Promise<void>;
  canCollectData: boolean;
  isCloudSyncEnabled: boolean;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

function consentKey(userId: string) {
  return `${PRIVACY_STORAGE_KEY}_${userId}`;
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile } = useAuth();
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        setHasConsent(false);
        setIsLoading(false);
        return;
      }
      try {
        const stored = await AsyncStorage.getItem(consentKey(user.id));
        if (stored !== null) {
          setHasConsent(stored === 'true');
        } else {
          setHasConsent(user.dataConsent ?? false);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.id, user?.dataConsent]);

  const setConsent = useCallback(
    async (value: boolean) => {
      if (!user) return;
      setHasConsent(value);
      await AsyncStorage.setItem(consentKey(user.id), value ? 'true' : 'false');
      await updateProfile({
        dataConsent: value,
        dataConsentAt: value ? new Date().toISOString() : undefined,
      });
      await updateUserConsent(user.id, value);
    },
    [user, updateProfile],
  );

  const canCollectData = hasConsent && user?.role === 'farmer';

  const value = useMemo(
    () => ({
      hasConsent,
      isLoading,
      setConsent,
      canCollectData,
      isCloudSyncEnabled: isSupabaseConfigured(),
    }),
    [hasConsent, isLoading, setConsent, canCollectData],
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider');
  return ctx;
}
