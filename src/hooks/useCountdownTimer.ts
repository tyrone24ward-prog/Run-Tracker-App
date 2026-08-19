import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

export function useCountdownTimer() {
  const [durationMs, setDurationMs] = useState(10 * 60 * 1000);
  const [remainingMs, setRemainingMs] = useState(10 * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
        endAtRef.current = null;
        Vibration.vibrate([0, 400, 150, 400, 150, 700]);
      }
    }, 80);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    const base = remainingMs <= 0 ? durationMs : remainingMs;
    if (base <= 0) return;
    setDone(false);
    setRemainingMs(base);
    endAtRef.current = Date.now() + base;
    setRunning(true);
  }, [durationMs, remainingMs]);

  const pause = useCallback(() => {
    if (!running) return;
    const left = Math.max(0, (endAtRef.current ?? Date.now()) - Date.now());
    setRemainingMs(left);
    endAtRef.current = null;
    setRunning(false);
  }, [running]);

  const reset = useCallback(() => {
    endAtRef.current = null;
    setRunning(false);
    setDone(false);
    setRemainingMs(durationMs);
  }, [durationMs]);

  const setDuration = useCallback((ms: number) => {
    const next = Math.max(1000, ms);
    setDurationMs(next);
    setDone(false);
    if (!running) setRemainingMs(next);
  }, [running]);

  return {
    durationMs,
    remainingMs,
    running,
    done,
    start,
    pause,
    reset,
    setDuration,
  };
}
