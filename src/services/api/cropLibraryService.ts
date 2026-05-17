import AsyncStorage from '@react-native-async-storage/async-storage';
import dataset from '../../data/plantationDataset.json';
import type { WeatherData } from '../../types';

export interface CropEntry {
  crop_name: string;
  planting_window: string[];
  maturity_days?: number;
  spacing?: string;
  water_requirement?: string;
  temperature_range?: string;
  yield_estimate?: string;
}

const LIB_KEY = '@verdora_crop_library_v1';

export async function loadLocalLibrary(): Promise<CropEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(LIB_KEY);
    if (stored) return JSON.parse(stored) as CropEntry[];
  } catch (e) {
    // ignore and fallback
  }
  // default bundle
  return dataset as CropEntry[];
}

export async function saveLocalLibrary(entries: CropEntry[]): Promise<void> {
  await AsyncStorage.setItem(LIB_KEY, JSON.stringify(entries));
}

export async function listCrops(): Promise<CropEntry[]> {
  return loadLocalLibrary();
}

export async function getCropByName(name: string): Promise<CropEntry | null> {
  const list = await loadLocalLibrary();
  return list.find((c) => c.crop_name.toLowerCase() === name.toLowerCase()) ?? null;
}

export async function searchCrops(q: string): Promise<CropEntry[]> {
  const list = await loadLocalLibrary();
  const term = q.trim().toLowerCase();
  if (!term) return list;
  return list.filter((c) => c.crop_name.toLowerCase().includes(term));
}

export function monthNameToIndex(month: string): number {
  const m = month.trim().toLowerCase();
  const names = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  return names.indexOf(m) + 1; // 1-based, - if not found returns 0
}

export function assessPlantingMonth(crop: CropEntry, monthIndex: number): 'ideal' | 'caution' | 'avoid' {
  const months = crop.planting_window.map((m) => monthNameToIndex(m));
  if (months.includes(monthIndex)) return 'ideal';
  // near-month window = caution when adjacent
  for (const m of months) {
    if (Math.abs(m - monthIndex) === 1) return 'caution';
  }
  return 'avoid';
}

export function recommendByWeather(crop: CropEntry, weather?: WeatherData) {
  if (!weather) return { text: 'No weather data available', score: 0 };
  const temp = weather.temperature;
  let parts = crop.temperature_range?.split('-').map((p) => Number(p)) ?? [];
  if (parts.length !== 2) parts = [];

  if (parts.length === 2) {
    const [min, max] = parts;
    if (temp >= min && temp <= max) {
      return { text: `Temperature ${temp}°C is within preferred ${crop.temperature_range}°C`, score: 1 };
    }
    if (temp < min) return { text: `Cooler than ideal (${temp}°C) — expect slower germination`, score: 0.5 };
    return { text: `Warmer than ideal (${temp}°C) — consider irrigation and shade`, score: 0.5 };
  }

  return { text: `Weather: ${weather.condition}, ${temp}°C`, score: 0.5 };
}
