import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/api/authService';
import { updateFarmerProfile } from '../services/analytics/dataCollectionService';
import { toApiError } from '../services/api/errors';
import type { FarmerType, User } from '../types';
import type { RegisterRequest } from '../services/api/types';

const AUTH_STORAGE_KEY = '@verdora_auth_user';

export interface RegisterProfileInput {
  name?: string;
  email: string;
  password: string;
  location: string;
  farmSize?: string;
  farmerType?: FarmerType;
  analyticsConsent?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (profile: RegisterProfileInput) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) setUser(JSON.parse(stored) as User);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistUser = async (u: User) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user: loggedInUser } = await apiLogin({ email, password });
      await persistUser(loggedInUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: toApiError(error).message };
    }
  }, []);

  const register = useCallback(async (profile: RegisterProfileInput) => {
    try {
      const payload: RegisterRequest = {
        name: profile.name,
        email: profile.email,
        password: profile.password,
        location: profile.location,
        farmSize: profile.farmSize,
        farmerType: profile.farmerType,
      };
      const { user: newUser } = await apiRegister(payload);
      await persistUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: toApiError(error).message };
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      await updateFarmerProfile(user.id, updates);
      await persistUser(updated);
    },
    [user],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, isLoading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
