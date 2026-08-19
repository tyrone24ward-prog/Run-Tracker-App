import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK = 'run-tracker-location';
const SESSION_KEY = 'runtracker:active-run:v1';

export interface ActiveRun {
  status: 'running' | 'paused';
  startedAt: number;
  runningSince: number;
  elapsedBeforePause: number;
  distanceMeters: number;
  steps: number;
  calories: number;
  currentSpeedMps: number;
  gpsAccuracy: number | null;
  gpsReady: boolean;
  lastLat: number | null;
  lastLon: number | null;
  lastTimestamp: number | null;
  weightKg: number;
  heightCm: number;
  usingStepEstimate: boolean;
}

export function wallElapsedMs(run: ActiveRun, now = Date.now()): number {
  if (run.status === 'running') {
    return run.elapsedBeforePause + (now - run.runningSince);
  }
  return run.elapsedBeforePause;
}

export async function loadActiveRun(): Promise<ActiveRun | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveRun;
  } catch {
    return null;
  }
}

export async function saveActiveRun(run: ActiveRun | null): Promise<void> {
  if (!run) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(run));
}

export function createActiveRun(weightKg: number, heightCm: number): ActiveRun {
  const now = Date.now();
  return {
    status: 'running',
    startedAt: now,
    runningSince: now,
    elapsedBeforePause: 0,
    distanceMeters: 0,
    steps: 0,
    calories: 0,
    currentSpeedMps: 0,
    gpsAccuracy: null,
    gpsReady: false,
    lastLat: null,
    lastLon: null,
    lastTimestamp: null,
    weightKg,
    heightCm,
    usingStepEstimate: true,
  };
}
