import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSettings().then((loaded) => {
      if (mounted) {
        setSettings(loaded);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update, ready };
}
