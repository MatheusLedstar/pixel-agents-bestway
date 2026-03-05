import { useState, useEffect, useCallback, useRef } from 'react';
import { FileWatcher } from '../core/watcher.js';
import { loadAllTeams } from '../core/teamParser.js';
import { loadAllTeamsTasks } from '../core/taskParser.js';
import { loadAllTeamsMessages } from '../core/inboxParser.js';
import { loadAllTeamsSessions } from '../core/sessionParser.js';
import type { Team, Task, Message, TeamTokens } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import { SPINNER_FRAMES } from '../utils/icons.js';

// Fallback estimation when JSONL not available
const TOKENS_PER_MESSAGE: Record<string, number> = {
  'claude-opus-4-6': 8000,
  'claude-sonnet-4-6': 5000,
  'claude-haiku-4-5': 2000,
  opus: 8000,
  sonnet: 5000,
  haiku: 2000,
};

function estimateTeamTokens(team: Team, messages: Message[]): TeamTokens {
  let total = 0;
  for (const member of team.members) {
    const model = member.model ?? 'opus';
    const tokensPerMsg = TOKENS_PER_MESSAGE[model] ?? 6000;
    const agentMsgs = messages.filter((m) => m.from === member.name).length;
    total += agentMsgs * tokensPerMsg;
  }
  return {
    inputTokens: total,
    outputTokens: 0,
    cacheReadTokens: 0,
    totalTokens: total,
    isReal: false,
  };
}

function sessionToTokens(session: TeamSessionData): TeamTokens {
  return {
    inputTokens: session.totalTokens.inputTokens,
    outputTokens: session.totalTokens.outputTokens,
    cacheReadTokens: session.totalTokens.cacheReadTokens,
    totalTokens: session.totalTokens.totalTokens,
    isReal: true,
  };
}

interface GlobalData {
  teams: Team[];
  allTasks: Map<string, Task[]>;
  allMessages: Map<string, Message[]>;
  allTokens: Map<string, TeamTokens>;
  allSessions: Map<string, TeamSessionData>;
  loading: boolean;
  spinnerFrame: number;
}

export function useGlobalData(): GlobalData {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<Map<string, Task[]>>(new Map());
  const [allMessages, setAllMessages] = useState<Map<string, Message[]>>(new Map());
  const [allTokens, setAllTokens] = useState<Map<string, TeamTokens>>(new Map());
  const [allSessions, setAllSessions] = useState<Map<string, TeamSessionData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const watcherRef = useRef<FileWatcher | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const loadedTeams = await loadAllTeams();
      setTeams(loadedTeams);

      const names = loadedTeams.map((t) => t.name);

      const [tasksMap, msgsMap, sessionsMap] = await Promise.all([
        loadAllTeamsTasks(names),
        loadAllTeamsMessages(names),
        loadAllTeamsSessions(names),
      ]);

      setAllTasks(tasksMap);
      setAllMessages(msgsMap);
      setAllSessions(sessionsMap);

      // Tokens: use real JSONL data when available, fall back to estimation
      const tokensMap = new Map<string, TeamTokens>();
      for (const team of loadedTeams) {
        const session = sessionsMap.get(team.name);
        if (session && session.totalTokens.totalTokens > 0) {
          tokensMap.set(team.name, sessionToTokens(session));
        } else {
          const msgs = msgsMap.get(team.name) ?? [];
          tokensMap.set(team.name, estimateTeamTokens(team, msgs));
        }
      }
      setAllTokens(tokensMap);

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
    void refreshAll();

    // Fallback polling every 3s
    const dataInterval = setInterval(() => {
      void refreshAll();
    }, 3000);

    // Single global spinner timer (150ms = smooth but fewer re-renders)
    const spinnerInterval = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 150);

    return () => {
      clearInterval(dataInterval);
      clearInterval(spinnerInterval);
      void watcher.close();
    };
  }, [refreshAll]);

  return { teams, allTasks, allMessages, allTokens, allSessions, loading, spinnerFrame };
}
