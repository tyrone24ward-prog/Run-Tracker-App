import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS,
  HISTORY_DAYS,
  type DailyTotal,
  type HistoryMap,
  type Settings,
} from '../types';
import { lastNDateKeys, localDateKey } from './format';

const SETTINGS_KEY = 'runtracker:settings:v1';
const HISTORY_KEY = 'runtracker:history:v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      weightKg: Number(parsed.weightKg) || DEFAULT_SETTINGS.weightKg,
      heightCm: Number(parsed.heightCm) || DEFAULT_SETTINGS.heightCm,
      units: parsed.units === 'metric' ? 'metric' : 'imperial',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function pruneHistory(history: HistoryMap, days = HISTORY_DAYS): HistoryMap {
  const keep = new Set(lastNDateKeys(days));
  const next: HistoryMap = {};
  for (const [key, value] of Object.entries(history)) {
    if (keep.has(key)) next[key] = value;
  }
  return next;
}

export async function loadHistory(): Promise<HistoryMap> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    return pruneHistory(JSON.parse(raw) as HistoryMap);
  } catch {
    return {};
  }
}

export async function saveHistory(history: HistoryMap): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(pruneHistory(history)));
}

export function emptyDay(date = localDateKey()): DailyTotal {
  return {
    date,
    steps: 0,
    distanceMeters: 0,
    durationMs: 0,
    calories: 0,
  };
}

export function mergeDay(base: DailyTotal | undefined, delta: Partial<DailyTotal>): DailyTotal {
  const date = delta.date ?? base?.date ?? localDateKey();
  return {
    date,
    steps: (base?.steps ?? 0) + (delta.steps ?? 0),
    distanceMeters: (base?.distanceMeters ?? 0) + (delta.distanceMeters ?? 0),
    durationMs: (base?.durationMs ?? 0) + (delta.durationMs ?? 0),
    calories: (base?.calories ?? 0) + (delta.calories ?? 0),
  };
}

export interface HistoryStats {
  keys: string[];
  records: DailyTotal[];
  totals: {
    steps: number;
    distanceMeters: number;
    durationMs: number;
    calories: number;
  };
  avgSteps: number;
  avgDistanceMeters: number;
  avgSpeedMps: number;
  avgCalories: number;
  avgDurationMs: number;
}

export function averagesFor(history: HistoryMap, days = HISTORY_DAYS): HistoryStats {
  const keys = lastNDateKeys(days);
  const records = keys.map((key) => history[key] ?? emptyDay(key));
  const n = records.length || 1;
  const totals = records.reduce(
    (acc, day) => {
      acc.steps += day.steps;
      acc.distanceMeters += day.distanceMeters;
      acc.durationMs += day.durationMs;
      acc.calories += day.calories;
      return acc;
    },
    { steps: 0, distanceMeters: 0, durationMs: 0, calories: 0 },
  );
  const avgSpeedMps =
    totals.durationMs > 0 ? totals.distanceMeters / (totals.durationMs / 1000) : 0;
  return {
    keys,
    records,
    totals,
    avgSteps: totals.steps / n,
    avgDistanceMeters: totals.distanceMeters / n,
    avgSpeedMps,
    avgCalories: totals.calories / n,
    avgDurationMs: totals.durationMs / n,
  };
}
