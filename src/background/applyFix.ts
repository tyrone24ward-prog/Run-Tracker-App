import { caloriesForInterval } from '../utils/calories';
import { haversineMeters, isUsefulFix, strideLengthMeters } from '../utils/geo';
import type { ActiveRun } from './session';

export interface LocationFix {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number | null;
  speed: number | null;
}

export function applyLocationFix(run: ActiveRun, fix: LocationFix): ActiveRun {
  const next: ActiveRun = {
    ...run,
    gpsReady: true,
    gpsAccuracy: fix.accuracy,
  };

  if (run.lastLat != null && run.lastLon != null && run.lastTimestamp != null) {
    const distance = haversineMeters(
      { latitude: run.lastLat, longitude: run.lastLon },
      { latitude: fix.latitude, longitude: fix.longitude },
    );
    const dtMs = Math.max(1, fix.timestamp - run.lastTimestamp);
    if (isUsefulFix({ accuracy: fix.accuracy, distanceMeters: distance, dtMs })) {
      next.distanceMeters = run.distanceMeters + distance;
      next.currentSpeedMps =
        fix.speed != null && fix.speed >= 0 ? fix.speed : distance / (dtMs / 1000);
      next.calories =
        run.calories +
        caloriesForInterval(run.weightKg, next.currentSpeedMps, dtMs);
      if (next.usingStepEstimate) {
        const stride = strideLengthMeters(run.heightCm);
        next.steps = Math.max(next.steps, Math.round(next.distanceMeters / Math.max(0.4, stride)));
      }
    }
  }

  next.lastLat = fix.latitude;
  next.lastLon = fix.longitude;
  next.lastTimestamp = fix.timestamp;
  return next;
}
