import { useState, useEffect, useCallback, useRef } from 'react';
import { unlink, readdir as readdirAsync } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { FileWatcher } from '../core/watcher.js';
import { loadAllTeams } from '../core/teamParser.js';
import { loadAllTeamsTasks } from '../core/taskParser.js';
import { loadAllTeamsMessages } from '../core/inboxParser.js';
import { loadAllTeamsSessions } from '../core/sessionParser.js';
import { registerTeam } from '../core/crossTeamParser.js';
import type { Team, Task, Message, TeamTokens, TeamCard } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import { SPINNER_FRAMES } from '../utils/icons.js';

const CROSS_TEAM_REGISTRY_DIR = join(homedir(), '.claude', 'cross-team', 'registry');

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

export function useGlobalData(filterTeam?: string): GlobalData {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<Map<string, Task[]>>(new Map());
  const [allMessages, setAllMessages] = useState<Map<string, Message[]>>(new Map());
  const [allTokens, setAllTokens] = useState<Map<string, TeamTokens>>(new Map());
  const [allSessions, setAllSessions] = useState<Map<string, TeamSessionData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const watcherRef = useRef<FileWatcher | null>(null);
  const lastRegistryUpdate = useRef(0);

  const refreshAll = useCallback(async () => {
    try {
      let loadedTeams = await loadAllTeams();
      if (filterTeam) {
        loadedTeams = loadedTeams.filter((t) => t.name === filterTeam);
      }

      const names = loadedTeams.map((t) => t.name);

      const [tasksMap, msgsMap, sessionsMap] = await Promise.all([
        loadAllTeamsTasks(names),
        loadAllTeamsMessages(names),
        loadAllTeamsSessions(names),
      ]);

      // Refine team status using loaded tasks data
      for (const team of loadedTeams) {
        const teamTasks = tasksMap.get(team.name) ?? [];
        if (teamTasks.length > 0) {
          const hasInProgress = teamTasks.some((t) => t.status === 'in_progress');
          if (hasInProgress && team.status !== 'active') {
            team.status = 'active';
          }
        }
      }

      setTeams(loadedTeams);
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

      // Auto-register teams in cross-team registry (throttled to every 30s - W3)
      // Also clean up stale registry entries
      const now = Date.now();
      if (now - lastRegistryUpdate.current > 30_000) {
        lastRegistryUpdate.current = now;
        for (const team of loadedTeams) {
          const teamTasks = tasksMap.get(team.name) ?? [];
          const lead = team.members.find((m) => m.name.includes('lead')) ?? team.members[0];
          const card: TeamCard = {
            teamName: team.name,
            description: team.description,
            leadAgent: lead?.name ?? '',
            memberCount: team.members.length,
            tasksSummary: {
              pending: teamTasks.filter((t) => t.status === 'pending').length,
              in_progress: teamTasks.filter((t) => t.status === 'in_progress').length,
              completed: teamTasks.filter((t) => t.status === 'completed').length,
            },
            status: team.status === 'completed' ? 'completed' : team.status === 'idle' ? 'idle' : 'active',
            registeredAt: team.createdAt ?? Date.now(),
            lastHeartbeat: Date.now(),
          };
          registerTeam(card).catch(() => {});
        }

        // Cleanup: try to remove registry files for stale teams
        // (stale teams are already filtered out by loadAllTeams, so we clean the registry too)
        try {
          if (existsSync(CROSS_TEAM_REGISTRY_DIR)) {
            const registryFiles = await readdirAsync(CROSS_TEAM_REGISTRY_DIR);
            const activeTeamNames = new Set(loadedTeams.map((t) => t.name));
            for (const file of registryFiles) {
              if (!file.endsWith('.json')) continue;
              const teamName = file.replace('.json', '');
              if (!activeTeamNames.has(teamName)) {
                const filePath = join(CROSS_TEAM_REGISTRY_DIR, file);
                await unlink(filePath).catch(() => {});
              }
            }
          }
        } catch {
          // Cleanup is best-effort
        }
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [filterTeam]);

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

    // Global animation timer (200ms = ~5fps, smooth without flickering)
    const spinnerInterval = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % 256);
    }, 200);

    return () => {
      clearInterval(dataInterval);
      clearInterval(spinnerInterval);
      void watcher.close();
    };
  }, [refreshAll]);

  return { teams, allTasks, allMessages, allTokens, allSessions, loading, spinnerFrame };
}
