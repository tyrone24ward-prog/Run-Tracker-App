import { useCallback, useEffect, useRef, useState } from 'react';
import type { DailyTotal, RunSnapshot, RunStatus, Settings } from '../src/types';
import { caloriesForInterval } from '../src/utils/calories';
import { haversineMeters, isUsefulFix, strideLengthMeters } from '../src/utils/geo';

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
  usingStepEstimate: true,
};

interface Options {
  settings: Settings;
  onCommit: (delta: Partial<DailyTotal>) => void;
}

export function useRunTracker({ settings, onCommit }: Options) {
  const [snapshot, setSnapshot] = useState<RunSnapshot>(emptySnapshot);
  const statusRef = useRef<RunStatus>('idle');
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const lastCoordRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(
    null,
  );
  const lastTickRef = useRef(0);
  const lastFlushAtRef = useRef(0);
  const lastCommitRef = useRef({
    distanceMeters: 0,
    steps: 0,
    calories: 0,
    elapsedMs: 0,
  });
  const valuesRef = useRef({
    distanceMeters: 0,
    steps: 0,
    calories: 0,
    elapsedMs: 0,
    currentSpeedMps: 0,
  });
  const settingsRef = useRef(settings);
  const onCommitRef = useRef(onCommit);
  settingsRef.current = settings;
  onCommitRef.current = onCommit;

  const flushCommit = useCallback((force = false) => {
    const values = valuesRef.current;
    const prev = lastCommitRef.current;
    const delta = {
      distanceMeters: values.distanceMeters - prev.distanceMeters,
      steps: values.steps - prev.steps,
      calories: values.calories - prev.calories,
      durationMs: values.elapsedMs - prev.elapsedMs,
    };
    const hasWork =
      delta.distanceMeters > 0.5 ||
      delta.steps > 0 ||
      delta.calories > 0.2 ||
      delta.durationMs > 1000;
    if (!hasWork && !force) return;
    lastCommitRef.current = {
      distanceMeters: values.distanceMeters,
      steps: values.steps,
      calories: values.calories,
      elapsedMs: values.elapsedMs,
    };
    onCommitRef.current(delta);
  }, []);

  const stopSensors = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    void wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  const tickElapsed = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const now = Date.now();
    const dt = now - lastTickRef.current;
    lastTickRef.current = now;
    valuesRef.current.elapsedMs += dt;
    valuesRef.current.calories += caloriesForInterval(
      settingsRef.current.weightKg,
      valuesRef.current.currentSpeedMps,
      dt,
    );
    const stride = strideLengthMeters(settingsRef.current.heightCm);
    valuesRef.current.steps = Math.max(
      valuesRef.current.steps,
      Math.round(valuesRef.current.distanceMeters / Math.max(0.4, stride)),
    );
    setSnapshot((prev) => ({
      ...prev,
      elapsedMs: valuesRef.current.elapsedMs,
      calories: valuesRef.current.calories,
      steps: valuesRef.current.steps,
      currentSpeedMps: valuesRef.current.currentSpeedMps,
    }));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (statusRef.current !== 'running') return;
      tickElapsed();
      if (Date.now() - lastFlushAtRef.current >= 10_000) {
        lastFlushAtRef.current = Date.now();
        flushCommit();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [flushCommit, tickElapsed]);

  const startSensors = useCallback(() => {
    if (!navigator.geolocation) {
      setSnapshot((prev) => ({
        ...prev,
        permissionError: 'This browser cannot use GPS. Try Chrome or Safari on your phone.',
      }));
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (statusRef.current !== 'running') return;
        const coord = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: pos.timestamp,
        };
        const accuracy = pos.coords.accuracy ?? null;
        const last = lastCoordRef.current;
        if (last) {
          const distance = haversineMeters(last, coord);
          const dtMs = Math.max(1, coord.timestamp - last.timestamp);
          if (isUsefulFix({ accuracy, distanceMeters: distance, dtMs })) {
            valuesRef.current.distanceMeters += distance;
            valuesRef.current.currentSpeedMps =
              pos.coords.speed != null && pos.coords.speed >= 0
                ? pos.coords.speed
                : distance / (dtMs / 1000);
          }
        }
        lastCoordRef.current = coord;
        setSnapshot((prev) => ({
          ...prev,
          gpsReady: true,
          gpsAccuracy: accuracy,
          permissionError: null,
          distanceMeters: valuesRef.current.distanceMeters,
          currentSpeedMps: valuesRef.current.currentSpeedMps,
        }));
      },
      (err) => {
        setSnapshot((prev) => ({
          ...prev,
          permissionError:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied. Enable it in the browser site settings.'
              : 'Waiting for GPS. Keep this page open and step outside if needed.',
        }));
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    }).wakeLock;
    void wakeLock
      ?.request('screen')
      .then((lock) => {
        wakeLockRef.current = lock;
      })
      .catch(() => undefined);
  }, []);

  const start = useCallback(async () => {
    if (statusRef.current === 'running') return;
    if (statusRef.current === 'idle') {
      valuesRef.current = {
        distanceMeters: 0,
        steps: 0,
        calories: 0,
        elapsedMs: 0,
        currentSpeedMps: 0,
      };
      lastCommitRef.current = {
        distanceMeters: 0,
        steps: 0,
        calories: 0,
        elapsedMs: 0,
      };
      lastCoordRef.current = null;
    }
    lastTickRef.current = Date.now();
    lastFlushAtRef.current = Date.now();
    statusRef.current = 'running';
    setSnapshot((prev) => ({ ...prev, status: 'running' }));
    startSensors();
  }, [startSensors]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    tickElapsed();
    statusRef.current = 'paused';
    stopSensors();
    valuesRef.current.currentSpeedMps = 0;
    setSnapshot((prev) => ({ ...prev, status: 'paused', currentSpeedMps: 0 }));
    flushCommit(true);
  }, [flushCommit, stopSensors, tickElapsed]);

  const stop = useCallback(() => {
    if (statusRef.current === 'idle') return;
    if (statusRef.current === 'running') tickElapsed();
    const values = valuesRef.current;
    const worthSaving =
      values.elapsedMs >= 1000 || values.distanceMeters >= 1 || values.steps >= 1;
    statusRef.current = 'idle';
    stopSensors();
    if (worthSaving) flushCommit(true);
    setSnapshot({ ...emptySnapshot });
    valuesRef.current = {
      distanceMeters: 0,
      steps: 0,
      calories: 0,
      elapsedMs: 0,
      currentSpeedMps: 0,
    };
    lastCoordRef.current = null;
  }, [flushCommit, stopSensors, tickElapsed]);

  useEffect(() => () => stopSensors(), [stopSensors]);

  return { snapshot, start, pause, stop };
}
