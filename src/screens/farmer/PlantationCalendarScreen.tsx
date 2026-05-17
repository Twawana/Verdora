import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { Button, Card, ScreenWrapper } from '../../components/ui';
import { EventFormModal, type EventFormValues } from '../../components/calendar/EventFormModal';
import { PlantingEventCard } from '../../components/calendar/PlantingEventCard';
import { useAuth } from '../../context/AuthContext';
import { trackFarmingRecord } from '../../services/analytics/dataCollectionService';
import {
  createPlantingEvent,
  deletePlantingEvent,
  listPlantingEvents,
  updatePlantingEvent,
} from '../../services/api/plantationCalendarService';
import { toApiError } from '../../services/api/errors';
import type { PlantingEvent } from '../../types';
import { colors, spacing, typography } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

export function PlantationCalendarScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlantingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlantingEvent | null>(null);

  const loadEvents = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await listPlantingEvents(user.id);
      setEvents(data);
    } catch (err) {
      Alert.alert('Error', toApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openAdd = () => {
    setEditingEvent(null);
    setModalVisible(true);
  };

  const nav = useNavigation<any>();

  const openLibrary = () => nav.navigate('CropLibrary');

  const openEdit = (event: PlantingEvent) => {
    setEditingEvent(event);
    setModalVisible(true);
  };

  const handleSave = async (values: EventFormValues) => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        cropName: values.cropName.trim(),
        plantDate: values.plantDate.trim(),
        harvestDate: values.harvestDate.trim() || undefined,
        fieldName: values.fieldName.trim() || undefined,
        notes: values.notes.trim() || undefined,
      };

      let saved: PlantingEvent;
      if (editingEvent) {
        saved = await updatePlantingEvent(user.id, editingEvent.id, payload);
      } else {
        saved = await createPlantingEvent(user.id, payload);
      }

      await trackFarmingRecord(user, saved);

      setModalVisible(false);
      await loadEvents(true);
    } catch (err) {
      Alert.alert('Error', toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (event: PlantingEvent) => {
    Alert.alert('Delete event', `Remove ${event.cropName} from your calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!user) return;
            await deletePlantingEvent(user.id, event.id);
            await loadEvents(true);
          } catch (err) {
            Alert.alert('Error', toApiError(err).message);
          }
        },
      },
    ]);
  };

  return (
    <>
      <ScreenWrapper
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvents(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <ScreenHeader
          title="Plantation Calendar"
          subtitle="Your real planting & harvest schedule"
        />

        <Button title="+ Add planting event" onPress={openAdd} fullWidth />
        <Button title="Browse crop library" onPress={openLibrary} fullWidth style={{ marginTop: 8 }} />

        <Text style={styles.sectionTitle}>
          Upcoming & scheduled ({events.length})
        </Text>

        {loading && events.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : events.length === 0 ? (
          <Card variant="highlight">
            <Text style={styles.empty}>
              No events yet. Tap “Add planting event” to schedule your first crop.
            </Text>
          </Card>
        ) : (
          events.map((event) => (
            <PlantingEventCard
              key={event.id}
              event={event}
              onPress={() => openEdit(event)}
              onDelete={() => handleDelete(event)}
            />
          ))
        )}

        <Card style={styles.hintCard}>
          <Text style={styles.hintTitle}>📦 Custom dataset</Text>
          <Text style={styles.hintText}>
            This calendar is structured for easy integration with regional planting datasets via{' '}
            <Text style={styles.hintCode}>importCalendarDataset()</Text> when your backend is ready.
          </Text>
        </Card>
      </ScreenWrapper>

      <EventFormModal
        visible={modalVisible}
        event={editingEvent}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.bodySmall, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, marginVertical: spacing.md },
  loader: { marginVertical: spacing.xl },
  empty: { ...typography.bodySmall, textAlign: 'center' },
  hintCard: { marginTop: spacing.lg, backgroundColor: colors.surfaceAlt },
  hintTitle: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  hintText: { ...typography.caption, lineHeight: 18 },
  hintCode: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11 },
});
