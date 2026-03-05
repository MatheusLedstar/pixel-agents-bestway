import { useState, useEffect, useCallback, useRef } from 'react';
import { FileWatcher } from '../core/watcher.js';
import { loadAllTeams } from '../core/teamParser.js';
import { loadAllTeamsTasks } from '../core/taskParser.js';
import { loadAllTeamsMessages } from '../core/inboxParser.js';
import type { Team, Task, Message } from '../core/types.js';

interface GlobalData {
  teams: Team[];
  allTasks: Map<string, Task[]>;
  allMessages: Map<string, Message[]>;
  loading: boolean;
}

export function useGlobalData(): GlobalData {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<Map<string, Task[]>>(new Map());
  const [allMessages, setAllMessages] = useState<Map<string, Message[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const watcherRef = useRef<FileWatcher | null>(null);
  const teamNamesRef = useRef<string[]>([]);

  const refreshAll = useCallback(async () => {
    try {
      const loadedTeams = await loadAllTeams();
      setTeams(loadedTeams);

      const names = loadedTeams.map((t) => t.name);
      teamNamesRef.current = names;

      const [tasksMap, msgsMap] = await Promise.all([
        loadAllTeamsTasks(names),
        loadAllTeamsMessages(names),
      ]);

      setAllTasks(tasksMap);
      setAllMessages(msgsMap);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const watcher = new FileWatcher();
    watcherRef.current = watcher;

    watcher.onUpdate(() => {
      void refreshAll();
    });

    watcher.watchAll();

    // Initial load
    void refreshAll();

    // Fallback polling every 3s
    const interval = setInterval(() => {
      void refreshAll();
    }, 3000);

    return () => {
      clearInterval(interval);
      void watcher.close();
    };
  }, [refreshAll]);

  return { teams, allTasks, allMessages, loading };
}
