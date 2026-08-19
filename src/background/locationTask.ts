import * as TaskManager from 'expo-task-manager';
import type * as Location from 'expo-location';
import { applyLocationFix } from './applyFix';
import { loadActiveRun, saveActiveRun, LOCATION_TASK } from './session';

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locations?.length) return;

  const run = await loadActiveRun();
  if (!run || run.status !== 'running') return;

  let next = run;
  for (const loc of locations) {
    next = applyLocationFix(next, {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: loc.timestamp,
      accuracy: loc.coords.accuracy ?? null,
      speed: loc.coords.speed ?? null,
    });
  }
  await saveActiveRun(next);
});
