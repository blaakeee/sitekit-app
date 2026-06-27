import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { getQueueStatus, type QueueStatus } from '../services/queueService';

export function useQueueStatus(pollIntervalMs = 5000) {
  const [status, setStatus] = useState<QueueStatus>({ pending: 0, processing: 0, failed: 0 });

  const refresh = useCallback(async () => {
    try {
      setStatus(await getQueueStatus());
    } catch {
      // AsyncStorage read failed — keep last known state
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, pollIntervalMs);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [refresh, pollIntervalMs]);

  return { ...status, refresh };
}
