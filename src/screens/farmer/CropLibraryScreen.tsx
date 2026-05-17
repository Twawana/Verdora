import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { ScreenWrapper, Card, Input } from '../../components/ui';
import { listCrops, searchCrops } from '../../services/api/cropLibraryService';
import { colors, spacing, typography } from '../../constants/theme';
import type { CropEntry } from '../../services/api/cropLibraryService';
import { useNavigation } from '@react-navigation/native';

export function CropLibraryScreen() {
  const [items, setItems] = useState<CropEntry[]>([]);
  const [query, setQuery] = useState('');
  const nav = useNavigation<any>();

  useEffect(() => {
    (async () => setItems(await listCrops()))();
  }, []);

  async function doSearch(q: string) {
    setQuery(q);
    setItems(await searchCrops(q));
  }

  return (
    <ScreenWrapper>
      <ScreenHeader title="Crop Library" subtitle="Browse crops and planting guidance" />

      <Input placeholder="Search crops" value={query} onChangeText={doSearch} />

      <FlatList
        data={items}
        keyExtractor={(i) => i.crop_name}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => nav.navigate('CropDetail', { cropName: item.crop_name })}>
            <Card style={styles.card}>
              <Text style={styles.title}>{item.crop_name}</Text>
              <Text style={styles.meta}>Best months: {item.planting_window.join(', ')}</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.xs },
  title: { ...typography.h3, color: colors.primaryDark },
  meta: { ...typography.caption, marginTop: spacing.xs },
});
