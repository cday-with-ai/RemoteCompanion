import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import type { ConnectionMode } from '../types';
import { detectConnectionMode } from '../services/connection';

const RECHECK_INTERVAL = 30_000;

export function useConnection() {
  const [mode, setMode] = useState<ConnectionMode>('offline');
  const [isChecking, setIsChecking] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recheckConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const detected = await detectConnectionMode();
      setMode(detected);
    } catch {
      setMode('offline');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    recheckConnection();

    intervalRef.current = setInterval(recheckConnection, RECHECK_INTERVAL);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        recheckConnection();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [recheckConnection]);

  return { mode, isChecking, recheckConnection };
}
