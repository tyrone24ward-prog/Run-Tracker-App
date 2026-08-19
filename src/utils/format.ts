import type { UnitSystem } from '../types';

export function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export function formatClock(ms: number, withMs = false): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safe % 1000) / 100);
  const core =
    hours > 0
      ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
      : `${pad2(minutes)}:${pad2(seconds)}`;
  return withMs ? `${core}.${tenths}` : core;
}

export function metersToMiles(m: number): number {
  return m / 1609.344;
}

export function metersToKm(m: number): number {
  return m / 1000;
}

export function mpsToMph(mps: number): number {
  return mps * 2.23693629;
}

export function mpsToKmh(mps: number): number {
  return mps * 3.6;
}

export function formatDistance(meters: number, units: UnitSystem, digits = 2): string {
  if (units === 'imperial') {
    const miles = metersToMiles(meters);
    if (miles < 0.1) {
      const feet = meters * 3.28084;
      return `${Math.round(feet)} ft`;
    }
    return `${miles.toFixed(digits)} mi`;
  }
  const km = metersToKm(meters);
  if (km < 0.1) {
    return `${Math.round(meters)} m`;
  }
  return `${km.toFixed(digits)} km`;
}

export function formatDistanceValue(meters: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return metersToMiles(meters).toFixed(2);
  }
  return metersToKm(meters).toFixed(2);
}

export function distanceUnitLabel(units: UnitSystem): string {
  return units === 'imperial' ? 'mi' : 'km';
}

export function speedUnitLabel(units: UnitSystem): string {
  return units === 'imperial' ? 'mph' : 'km/h';
}

export function formatSpeed(mps: number, units: UnitSystem): string {
  if (!Number.isFinite(mps) || mps < 0.2) return '—';
  const value = units === 'imperial' ? mpsToMph(mps) : mpsToKmh(mps);
  return value.toFixed(1);
}

export function formatPace(mps: number, units: UnitSystem): string {
  if (!Number.isFinite(mps) || mps < 0.4) return '—';
  const secondsPerUnit =
    units === 'imperial' ? 1609.344 / mps : 1000 / mps;
  if (secondsPerUnit > 60 * 60) return '—';
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.round(secondsPerUnit % 60);
  const suffix = units === 'imperial' ? '/mi' : '/km';
  return `${minutes}:${pad2(seconds)}${suffix}`;
}

export function formatSteps(steps: number): string {
  return Math.round(steps).toLocaleString();
}

export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)}`;
}

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

export function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function lastNDateKeys(n: number, from = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(from);
    d.setDate(from.getDate() - i);
    keys.push(localDateKey(d));
  }
  return keys;
}
