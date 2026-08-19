import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lap } from '../types';

export function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const accRef = useRef(0);
  const lastLapRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;
      setElapsedMs(accRef.current + (Date.now() - startedAt));
    }, 50);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (!running) return;
    accRef.current = elapsedMs;
    startedAtRef.current = null;
    setRunning(false);
  }, [elapsedMs, running]);

  const lap = useCallback(() => {
    const total = elapsedMs;
    const split = total - lastLapRef.current;
    lastLapRef.current = total;
    setLaps((prev) => [
      { index: prev.length + 1, splitMs: split, totalMs: total },
      ...prev,
    ]);
  }, [elapsedMs]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    accRef.current = 0;
    lastLapRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
    setRunning(false);
  }, []);

  return { elapsedMs, running, laps, start, pause, lap, reset };
}
