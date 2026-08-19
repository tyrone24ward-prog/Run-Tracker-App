import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Vibration } from 'react-native';

export type TabataPhase = 'idle' | 'prepare' | 'work' | 'rest' | 'done';

export interface TabataConfig {
  workSec: number;
  restSec: number;
  rounds: number;
  prepareSec: number;
}

const DEFAULT_CONFIG: TabataConfig = {
  workSec: 20,
  restSec: 10,
  rounds: 8,
  prepareSec: 5,
};

export function useTabata() {
  const [config, setConfig] = useState<TabataConfig>(DEFAULT_CONFIG);
  const [phase, setPhase] = useState<TabataPhase>('idle');
  const [round, setRound] = useState(1);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_CONFIG.prepareSec * 1000);
  const [paused, setPaused] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const phaseRef = useRef<TabataPhase>('idle');
  const roundRef = useRef(1);
  const configRef = useRef(config);

  configRef.current = config;
  phaseRef.current = phase;
  roundRef.current = round;

  const running =
    !paused && (phase === 'prepare' || phase === 'work' || phase === 'rest');

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
      Vibration.vibrate(250);
      return;
    }
    if (current === 'work') {
      if (roundRef.current >= cfg.rounds) {
        phaseRef.current = 'done';
        endAtRef.current = null;
        setPhase('done');
        setRemainingMs(0);
        Vibration.vibrate([0, 500, 120, 500, 120, 800]);
        return;
      }
      phaseRef.current = 'rest';
      setPhase('rest');
      setRemainingMs(cfg.restSec * 1000);
      endAtRef.current = Date.now() + cfg.restSec * 1000;
      Vibration.vibrate(180);
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
      Vibration.vibrate(250);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) advance();
    }, 80);
    return () => clearInterval(id);
  }, [advance, running]);

  const start = useCallback(() => {
    const cfg = configRef.current;
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
    setRemainingMs(cfg.prepareSec * 1000);
    endAtRef.current = Date.now() + cfg.prepareSec * 1000;
  }, [paused, phase, remainingMs]);

  const pause = useCallback(() => {
    if (!running) return;
    const left = Math.max(0, (endAtRef.current ?? Date.now()) - Date.now());
    endAtRef.current = null;
    setRemainingMs(left);
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

  return {
    config,
    phase,
    round,
    remainingMs,
    phaseDuration,
    running,
    paused,
    start,
    pause,
    reset,
    updateConfig,
  };
}
