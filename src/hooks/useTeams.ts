import { useState, useEffect, useCallback, useRef } from 'react';
import { FileWatcher } from '../core/watcher.js';
import { loadAllTeams } from '../core/teamParser.js';
import type { Team } from '../core/types.js';

export function useTeams(): { teams: Team[]; loading: boolean } {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const watcherRef = useRef<FileWatcher | null>(null);

  const refresh = useCallback(async () => {
    const result = await loadAllTeams();
    setTeams(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    const watcher = new FileWatcher();
    watcherRef.current = watcher;

    watcher.onUpdate(() => {
      void refresh();
    });

    watcher.watchTeams();

    const timer = setTimeout(() => {
      void refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      void watcher.close();
    };
  }, [refresh]);

  return { teams, loading };
}
