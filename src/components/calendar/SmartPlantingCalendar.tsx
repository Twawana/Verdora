import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { assessPlantingMonth, monthNameToIndex } from '../../services/api/cropLibraryService';
import { colors, spacing, typography } from '../../constants/theme';

export function SmartPlantingCalendar({ crop }: { crop: any }) {
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];

  return (
    <View style={styles.grid}>
      {months.map((m, i) => {
        const idx = i + 1;
        const status = crop ? assessPlantingMonth(crop, idx) : 'avoid';
        const bg = status === 'ideal' ? colors.surfaceAlt : status === 'caution' ? '#FFF3CD' : colors.surface;
        const border = status === 'ideal' ? { borderColor: colors.primary, borderWidth: 1 } : {};
        return (
          <View key={m} style={[styles.cell, { backgroundColor: bg }, border]}>
            <Text style={styles.cellText}>{m}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.sm },
  cell: { width: '25%', padding: spacing.xs, alignItems: 'center', justifyContent: 'center' },
  cellText: { ...typography.caption },
});
