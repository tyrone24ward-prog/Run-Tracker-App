import { useCallback, useEffect, useMemo, useState } from 'react';
import { HISTORY_DAYS, type DailyTotal, type HistoryMap } from '../types';
import { localDateKey } from '../utils/format';
import {
  averagesFor,
  loadHistory,
  mergeDay,
  pruneHistory,
  saveHistory,
} from '../utils/storage';

export function useHistory() {
  const [history, setHistory] = useState<HistoryMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadHistory().then((loaded) => {
      if (mounted) {
        setHistory(loaded);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((next: HistoryMap) => {
    const pruned = pruneHistory(next);
    setHistory(pruned);
    void saveHistory(pruned);
  }, []);

  const addDelta = useCallback(
    (delta: Partial<DailyTotal> & { date?: string }) => {
      const date = delta.date ?? localDateKey();
      setHistory((prev) => {
        const next = pruneHistory({
          ...prev,
          [date]: mergeDay(prev[date], { ...delta, date }),
        });
        void saveHistory(next);
        return next;
      });
    },
    [],
  );

  const stats = useMemo(() => averagesFor(history, HISTORY_DAYS), [history]);

  return { history, ready, addDelta, persist, stats };
}
