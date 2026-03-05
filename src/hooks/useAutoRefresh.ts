import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs = 1000): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);
}
