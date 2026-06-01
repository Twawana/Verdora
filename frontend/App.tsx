import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DiagnosisProvider } from './src/context/DiagnosisContext';
import { PrivacyProvider } from './src/context/PrivacyContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <AuthProvider>
          <PrivacyProvider>
            <DiagnosisProvider>
              <RootNavigator />
              <StatusBar style="dark" />
            </DiagnosisProvider>
          </PrivacyProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
