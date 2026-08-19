import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Pedometer } from 'expo-sensors';
import type { DailyTotal, RunSnapshot, Settings } from '../types';
import {
  LOCATION_TASK,
  createActiveRun,
  loadActiveRun,
  saveActiveRun,
  wallElapsedMs,
  type ActiveRun,
} from '../background/session';

interface Options {
  settings: Settings;
  onCommit: (delta: Partial<DailyTotal>) => void;
}

const emptySnapshot: RunSnapshot = {
  status: 'idle',
  elapsedMs: 0,
  distanceMeters: 0,
  steps: 0,
  calories: 0,
  currentSpeedMps: 0,
  gpsReady: false,
  gpsAccuracy: null,
  permissionError: null,
  usingStepEstimate: false,
};

function snapshotFromRun(run: ActiveRun | null): RunSnapshot {
  if (!run) return emptySnapshot;
  return {
    status: run.status,
    elapsedMs: wallElapsedMs(run),
    distanceMeters: run.distanceMeters,
    steps: run.steps,
    calories: run.calories,
    currentSpeedMps: run.status === 'running' ? run.currentSpeedMps : 0,
    gpsReady: run.gpsReady,
    gpsAccuracy: run.gpsAccuracy,
    permissionError: null,
    usingStepEstimate: run.usingStepEstimate,
  };
}

export function useRunTracker({ settings, onCommit }: Options) {
  const [snapshot, setSnapshot] = useState<RunSnapshot>(emptySnapshot);
  const runRef = useRef<ActiveRun | null>(null);
  const lastCommitRef = useRef({
    distanceMeters: 0,
    steps: 0,
    calories: 0,
    elapsedMs: 0,
  });
  const settingsRef = useRef(settings);
  const onCommitRef = useRef(onCommit);
  settingsRef.current = settings;
  onCommitRef.current = onCommit;

  const publish = useCallback((run: ActiveRun | null) => {
    runRef.current = run;
    setSnapshot(snapshotFromRun(run));
  }, []);

  const flushCommit = useCallback(
    (run: ActiveRun | null, force = false) => {
      if (!run) return;
      const elapsedMs = wallElapsedMs(run);
      const prev = lastCommitRef.current;
      const delta = {
        distanceMeters: run.distanceMeters - prev.distanceMeters,
        steps: run.steps - prev.steps,
        calories: run.calories - prev.calories,
        durationMs: elapsedMs - prev.elapsedMs,
      };
      const hasWork =
        delta.distanceMeters > 0.5 ||
        delta.steps > 0 ||
        delta.calories > 0.2 ||
        delta.durationMs > 1000;
      if (!hasWork && !force) return;
      lastCommitRef.current = {
        distanceMeters: run.distanceMeters,
        steps: run.steps,
        calories: run.calories,
        elapsedMs,
      };
      onCommitRef.current(delta);
    },
    [],
  );

  const refreshFromDisk = useCallback(async () => {
    const stored = await loadActiveRun();
    if (!stored) return;
    if (stored.usingStepEstimate === false && stored.status === 'running') {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (available) {
          const result = await Pedometer.getStepCountAsync(
            new Date(stored.startedAt),
            new Date(),
          );
          stored.steps = Math.max(stored.steps, result.steps);
          await saveActiveRun(stored);
        }
      } catch {
        /* Android may not support getStepCountAsync */
      }
    }
    publish(stored);
  }, [publish]);

  useEffect(() => {
    void loadActiveRun().then((stored) => {
      if (stored) {
        lastCommitRef.current = {
          distanceMeters: stored.distanceMeters,
          steps: stored.steps,
          calories: stored.calories,
          elapsedMs: wallElapsedMs(stored),
        };
        publish(stored);
      }
    });
  }, [publish]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshFromDisk();
    });
    return () => sub.remove();
  }, [refreshFromDisk]);

  useEffect(() => {
    const tick = setInterval(() => {
      const run = runRef.current;
      if (run) setSnapshot(snapshotFromRun(run));
    }, 250);
    const sync = setInterval(() => {
      const run = runRef.current;
      if (!run || run.status !== 'running') return;
      void loadActiveRun().then((stored) => {
        if (!stored) return;
        publish(stored);
        flushCommit(stored);
      });
    }, 2000);
    return () => {
      clearInterval(tick);
      clearInterval(sync);
    };
  }, [flushCommit, publish]);

  const stopBackground = useCallback(async () => {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (started) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  }, []);

  const startBackground = useCallback(async () => {
    const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (already) return;
    const defined = TaskManager.isTaskDefined(LOCATION_TASK);
    if (!defined) {
      throw new Error('Background location task is not defined');
    }
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 2,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Fitness,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Run Tracker is recording',
        notificationBody: 'Your run keeps tracking if the phone locks or you open another app.',
        notificationColor: '#C8F542',
      },
    });
  }, []);

  const start = useCallback(async () => {
    const existing = runRef.current;
    if (existing?.status === 'running') return;

    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      setSnapshot((prev) => ({
        ...prev,
        permissionError: 'Location permission is needed to measure distance and speed.',
      }));
      return;
    }

    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      Alert.alert(
        'Background location is off',
        'To keep tracking when the phone locks or you open YouTube, set location to Allow all the time in Settings.',
      );
    }

    let run = existing;
    if (!run || run.status !== 'paused') {
      run = createActiveRun(settingsRef.current.weightKg, settingsRef.current.heightCm);
      lastCommitRef.current = {
        distanceMeters: 0,
        steps: 0,
        calories: 0,
        elapsedMs: 0,
      };
      try {
        const pedometerAvailable = await Pedometer.isAvailableAsync();
        run.usingStepEstimate = !pedometerAvailable;
      } catch {
        run.usingStepEstimate = true;
      }
    } else {
      run = {
        ...run,
        status: 'running',
        runningSince: Date.now(),
        weightKg: settingsRef.current.weightKg,
        heightCm: settingsRef.current.heightCm,
      };
    }

    await saveActiveRun(run);
    publish(run);
    try {
      await startBackground();
    } catch {
      setSnapshot((prev) => ({
        ...prev,
        permissionError:
          'Background tracking needs the installed Run Tracker app, not the browser or Expo Go.',
      }));
    }
  }, [publish, startBackground]);

  const pause = useCallback(async () => {
    const run = runRef.current;
    if (!run || run.status !== 'running') return;
    const stored = (await loadActiveRun()) ?? run;
    const paused: ActiveRun = {
      ...stored,
      status: 'paused',
      elapsedBeforePause: wallElapsedMs(stored),
      currentSpeedMps: 0,
    };
    await stopBackground();
    await saveActiveRun(paused);
    publish(paused);
    flushCommit(paused, true);
  }, [flushCommit, publish, stopBackground]);

  const stop = useCallback(async () => {
    const run = (await loadActiveRun()) ?? runRef.current;
    await stopBackground();
    if (run) {
      const elapsedMs = wallElapsedMs(run);
      const worthSaving =
        elapsedMs >= 1000 || run.distanceMeters >= 1 || run.steps >= 1;
      if (worthSaving) flushCommit(run, true);
    }
    await saveActiveRun(null);
    runRef.current = null;
    lastCommitRef.current = {
      distanceMeters: 0,
      steps: 0,
      calories: 0,
      elapsedMs: 0,
    };
    setSnapshot({ ...emptySnapshot });
  }, [flushCommit, stopBackground]);

  return { snapshot, start, pause, stop };
}
