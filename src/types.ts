export type UnitSystem = 'imperial' | 'metric';

export type TabId = 'home' | 'run' | 'stats' | 'timers' | 'profile';

export type RunStatus = 'idle' | 'running' | 'paused';

export type TimerMode = 'countdown' | 'stopwatch' | 'tabata';

export interface Settings {
  weightKg: number;
  heightCm: number;
  units: UnitSystem;
}

export interface DailyTotal {
  date: string;
  steps: number;
  distanceMeters: number;
  durationMs: number;
  calories: number;
}

export type HistoryMap = Record<string, DailyTotal>;

export interface RunSnapshot {
  status: RunStatus;
  elapsedMs: number;
  distanceMeters: number;
  steps: number;
  calories: number;
  currentSpeedMps: number;
  gpsReady: boolean;
  gpsAccuracy: number | null;
  permissionError: string | null;
  usingStepEstimate: boolean;
}

export interface Lap {
  index: number;
  splitMs: number;
  totalMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  weightKg: 70,
  heightCm: 170,
  units: 'imperial',
};

export const HISTORY_DAYS = 14;
