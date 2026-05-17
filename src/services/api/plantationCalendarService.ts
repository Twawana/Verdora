import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../../config/env';
import type { PlantingEvent } from '../../types';
import { mockDelay, mockId } from '../mocks/mockUtils';
import { API_ENDPOINTS } from './endpoints';
import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type {
  CreatePlantingEventRequest,
  PlantingEventListResponse,
  UpdatePlantingEventRequest,
} from './types';

function calendarKey(userId: string) {
  return `@verdora_calendar_${userId}`;
}

async function loadUserEvents(userId: string): Promise<PlantingEvent[]> {
  const stored = await AsyncStorage.getItem(calendarKey(userId));
  return stored ? (JSON.parse(stored) as PlantingEvent[]) : [];
}

async function saveUserEvents(userId: string, events: PlantingEvent[]): Promise<void> {
  await AsyncStorage.setItem(calendarKey(userId), JSON.stringify(events));
}

async function mockListEvents(userId: string): Promise<PlantingEventListResponse> {
  await mockDelay(400);
  const events = await loadUserEvents(userId);
  return [...events].sort((a, b) => a.plantDate.localeCompare(b.plantDate));
}

async function mockCreateEvent(
  userId: string,
  payload: CreatePlantingEventRequest,
): Promise<PlantingEvent> {
  await mockDelay(500);
  const event: PlantingEvent = { ...payload, id: mockId('event') };
  const events = await loadUserEvents(userId);
  await saveUserEvents(userId, [...events, event]);
  return event;
}

async function mockUpdateEvent(
  userId: string,
  id: string,
  payload: UpdatePlantingEventRequest,
): Promise<PlantingEvent> {
  await mockDelay(500);
  const events = await loadUserEvents(userId);
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Event not found');
  events[index] = { ...events[index], ...payload };
  await saveUserEvents(userId, events);
  return events[index];
}

async function mockDeleteEvent(userId: string, id: string): Promise<void> {
  await mockDelay(400);
  const events = (await loadUserEvents(userId)).filter((e) => e.id !== id);
  await saveUserEvents(userId, events);
}

export async function listPlantingEvents(userId: string): Promise<PlantingEventListResponse> {
  if (env.useMockApi) return mockListEvents(userId);
  return apiGet<PlantingEventListResponse>(API_ENDPOINTS.calendar.events, {
    params: { userId },
  });
}

export async function createPlantingEvent(
  userId: string,
  payload: CreatePlantingEventRequest,
): Promise<PlantingEvent> {
  if (env.useMockApi) return mockCreateEvent(userId, payload);
  return apiPost<PlantingEvent>(API_ENDPOINTS.calendar.events, { ...payload, userId });
}

export async function updatePlantingEvent(
  userId: string,
  id: string,
  payload: UpdatePlantingEventRequest,
): Promise<PlantingEvent> {
  if (env.useMockApi) return mockUpdateEvent(userId, id, payload);
  return apiPut<PlantingEvent>(API_ENDPOINTS.calendar.eventById(id), payload);
}

export async function deletePlantingEvent(userId: string, id: string): Promise<void> {
  if (env.useMockApi) return mockDeleteEvent(userId, id);
  return apiDelete<void>(API_ENDPOINTS.calendar.eventById(id));
}

export async function importCalendarDataset(
  userId: string,
  events: PlantingEvent[],
): Promise<PlantingEventListResponse> {
  if (env.useMockApi) {
    await mockDelay(800);
    const withIds = events.map((e) => ({ ...e, id: e.id || mockId('event') }));
    await saveUserEvents(userId, withIds);
    return withIds;
  }
  return apiPost<PlantingEventListResponse>(API_ENDPOINTS.calendar.dataset, { userId, events });
}
