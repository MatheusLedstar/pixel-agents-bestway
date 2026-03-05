import { useState, useEffect, useCallback, useRef } from 'react';
import { loadCrossTeamData } from '../core/crossTeamParser.js';
import type { CrossTeamData } from '../core/types.js';

const EMPTY: CrossTeamData = {
  registry: [],
  messages: [],
  activeCall: null,
  loading: true,
};

export function useCrossTeamData(): { crossTeam: CrossTeamData; refreshCrossTeam: () => void } {
  const [crossTeam, setCrossTeam] = useState<CrossTeamData>(EMPTY);
  const mountedRef = useRef(true);

  const refreshCrossTeam = useCallback(async () => {
    try {
      const data = await loadCrossTeamData();
      if (mountedRef.current) {
        setCrossTeam(data);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refreshCrossTeam();

    // Poll every 3s (same interval as useGlobalData)
    const interval = setInterval(() => {
      void refreshCrossTeam();
    }, 3000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refreshCrossTeam]);

  return { crossTeam, refreshCrossTeam };
}
