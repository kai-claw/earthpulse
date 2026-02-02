import { useState, useEffect, useCallback, useRef } from 'react';
import { AUTO_REFRESH_MS } from '../utils/constants';

export interface AutoRefreshState {
  /** Seconds until next auto-refresh */
  secondsUntilRefresh: number;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Trigger a manual refresh */
  manualRefresh: () => void;
  /** Number of auto-refreshes since mount */
  refreshCount: number;
  /** Time of last successful refresh */
  lastRefreshTime: Date;
}

export function useAutoRefresh(fetchData: () => Promise<void>): AutoRefreshState {
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(Math.floor(AUTO_REFRESH_MS / 1000));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const lastRefreshTs = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      setRefreshCount(c => c + 1);
      setLastRefreshTime(new Date());
      lastRefreshTs.current = Date.now();
    } finally {
      setIsRefreshing(false);
      setSecondsUntilRefresh(Math.floor(AUTO_REFRESH_MS / 1000));
    }
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastRefreshTs.current;
      const remaining = Math.max(0, Math.floor((AUTO_REFRESH_MS - elapsed) / 1000));
      setSecondsUntilRefresh(remaining);

      if (remaining <= 0) {
        doRefresh();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [doRefresh]);

  const manualRefresh = useCallback(() => {
    doRefresh();
  }, [doRefresh]);

  return {
    secondsUntilRefresh,
    isRefreshing,
    manualRefresh,
    refreshCount,
    lastRefreshTime,
  };
}
