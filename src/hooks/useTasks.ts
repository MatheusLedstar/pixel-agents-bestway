import { useState, useEffect, useCallback, useRef } from 'react';
import { FileWatcher } from '../core/watcher.js';
import { loadTeamTasks } from '../core/taskParser.js';
import type { Task } from '../core/types.js';

export function useTasks(teamName: string | null): { tasks: Task[]; loading: boolean } {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const watcherRef = useRef<FileWatcher | null>(null);

  const refresh = useCallback(async () => {
    if (!teamName) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const result = await loadTeamTasks(teamName);
    setTasks(result);
    setLoading(false);
  }, [teamName]);

  useEffect(() => {
    setLoading(true);

    if (!teamName) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const watcher = new FileWatcher();
    watcherRef.current = watcher;

    watcher.onUpdate(() => {
      void refresh();
    });

    watcher.watchTasks(teamName);

    const timer = setTimeout(() => {
      void refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      void watcher.close();
    };
  }, [teamName, refresh]);

  return { tasks, loading };
}
