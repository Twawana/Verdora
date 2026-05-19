import type { PlantingEvent } from '../../types';
import { API_ENDPOINTS } from './endpoints';
import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type {
  CreatePlantingEventRequest,
  PlantingEventListResponse,
  UpdatePlantingEventRequest,
} from './types';

// ——— Public API ———

export async function listPlantingEvents(
  userId: string,
): Promise<PlantingEventListResponse> {
  return apiGet<PlantingEventListResponse>(API_ENDPOINTS.calendar.events, {
    params: { userId },
  });
}


export async function createPlantingEvent(
  userId: string,
  payload: CreatePlantingEventRequest,
): Promise<PlantingEvent> {
  return apiPost<PlantingEvent>(API_ENDPOINTS.calendar.events, { ...payload, userId });
}

export async function updatePlantingEvent(
  userId: string,
  id: string,
  payload: UpdatePlantingEventRequest,
): Promise<PlantingEvent> {
  return apiPut<PlantingEvent>(API_ENDPOINTS.calendar.eventById(id), payload);
}

export async function deletePlantingEvent(userId: string, id: string): Promise<void> {
  return apiDelete<void>(API_ENDPOINTS.calendar.eventById(id));
}

export async function importCalendarDataset(
  userId: string,
  events: PlantingEvent[],
): Promise<PlantingEventListResponse> {
  return apiPost<PlantingEventListResponse>(API_ENDPOINTS.calendar.dataset, { userId, events });
}
