import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUserDetailScreen } from '../screens/admin/AdminUserDetailScreen';
import { colors } from '../constants/theme';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="UserDetail" component={AdminUserDetailScreen} />
    </Stack.Navigator>
  );
}
