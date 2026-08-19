import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Lap } from '../src/types';

export function useCountdown() {
  const [durationMs, setDurationMs] = useState(10 * 60 * 1000);
  const [remainingMs, setRemainingMs] = useState(10 * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
        endAtRef.current = null;
        navigator.vibrate?.([400, 150, 400, 150, 700]);
      }
    }, 80);
    return () => window.clearInterval(id);
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
    setRemainingMs(Math.max(0, (endAtRef.current ?? Date.now()) - Date.now()));
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

  return { durationMs, remainingMs, running, done, start, pause, reset, setDuration };
}

export function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const accRef = useRef(0);
  const lastLapRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;
      setElapsedMs(accRef.current + (Date.now() - startedAt));
    }, 50);
    return () => window.clearInterval(id);
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
    setLaps((prev) => [{ index: prev.length + 1, splitMs: split, totalMs: total }, ...prev]);
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

export type TabataPhase = 'idle' | 'prepare' | 'work' | 'rest' | 'done';
export interface TabataConfig {
  workSec: number;
  restSec: number;
  rounds: number;
  prepareSec: number;
}

export function useTabata() {
  const [config, setConfig] = useState<TabataConfig>({
    workSec: 20,
    restSec: 10,
    rounds: 8,
    prepareSec: 5,
  });
  const [phase, setPhase] = useState<TabataPhase>('idle');
  const [round, setRound] = useState(1);
  const [remainingMs, setRemainingMs] = useState(5000);
  const [paused, setPaused] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const phaseRef = useRef<TabataPhase>('idle');
  const roundRef = useRef(1);
  const configRef = useRef(config);
  configRef.current = config;
  phaseRef.current = phase;
  roundRef.current = round;

  const running = !paused && (phase === 'prepare' || phase === 'work' || phase === 'rest');
  const phaseDuration = useMemo(() => {
    if (phase === 'prepare') return config.prepareSec * 1000;
    if (phase === 'work') return config.workSec * 1000;
    if (phase === 'rest') return config.restSec * 1000;
    return 0;
  }, [config, phase]);

  const advance = useCallback(() => {
    const current = phaseRef.current;
    const cfg = configRef.current;
    if (current === 'prepare') {
      phaseRef.current = 'work';
      roundRef.current = 1;
      setPhase('work');
      setRound(1);
      setRemainingMs(cfg.workSec * 1000);
      endAtRef.current = Date.now() + cfg.workSec * 1000;
      navigator.vibrate?.(250);
      return;
    }
    if (current === 'work') {
      if (roundRef.current >= cfg.rounds) {
        phaseRef.current = 'done';
        endAtRef.current = null;
        setPhase('done');
        setRemainingMs(0);
        navigator.vibrate?.([500, 120, 500, 120, 800]);
        return;
      }
      phaseRef.current = 'rest';
      setPhase('rest');
      setRemainingMs(cfg.restSec * 1000);
      endAtRef.current = Date.now() + cfg.restSec * 1000;
      navigator.vibrate?.(180);
      return;
    }
    if (current === 'rest') {
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      phaseRef.current = 'work';
      setRound(nextRound);
      setPhase('work');
      setRemainingMs(cfg.workSec * 1000);
      endAtRef.current = Date.now() + cfg.workSec * 1000;
      navigator.vibrate?.(250);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) advance();
    }, 80);
    return () => window.clearInterval(id);
  }, [advance, running]);

  const start = useCallback(() => {
    if (paused && (phase === 'prepare' || phase === 'work' || phase === 'rest')) {
      setPaused(false);
      endAtRef.current = Date.now() + remainingMs;
      return;
    }
    phaseRef.current = 'prepare';
    roundRef.current = 1;
    setPaused(false);
    setPhase('prepare');
    setRound(1);
    setRemainingMs(configRef.current.prepareSec * 1000);
    endAtRef.current = Date.now() + configRef.current.prepareSec * 1000;
  }, [paused, phase, remainingMs]);

  const pause = useCallback(() => {
    if (!running) return;
    setRemainingMs(Math.max(0, (endAtRef.current ?? Date.now()) - Date.now()));
    endAtRef.current = null;
    setPaused(true);
  }, [running]);

  const reset = useCallback(() => {
    endAtRef.current = null;
    phaseRef.current = 'idle';
    roundRef.current = 1;
    setPaused(false);
    setPhase('idle');
    setRound(1);
    setRemainingMs(config.prepareSec * 1000);
  }, [config.prepareSec]);

  const updateConfig = useCallback((patch: Partial<TabataConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      if (phaseRef.current === 'idle' || phaseRef.current === 'done') {
        setRemainingMs(next.prepareSec * 1000);
      }
      return next;
    });
  }, []);

  return { config, phase, round, remainingMs, phaseDuration, running, paused, start, pause, reset, updateConfig };
}
