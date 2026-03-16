import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TEAMS_DIR, TASKS_DIR } from './watcher.js';
import type { Team, Agent, TeamStatus, TeamFreshness } from './types.js';

// Thresholds for team lifecycle detection
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;     // 5 min
const COMPLETED_GRACE_MS = 5 * 60 * 1000;   // 5 min
const STALE_AGE_MS = 15 * 60 * 1000;        // 15 min

export async function parseTeamConfig(filePath: string): Promise<Team | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    const members: Agent[] = Array.isArray(data.members)
      ? data.members.map((m: Record<string, unknown>) => ({
          agentId: String(m.agentId ?? m.agent_id ?? ''),
          name: String(m.name ?? ''),
          agentType: String(m.agentType ?? m.agent_type ?? 'unknown'),
          model: m.model != null ? String(m.model) : undefined,
          color: m.color != null ? String(m.color) : undefined,
          isActive: typeof m.isActive === 'boolean' ? m.isActive : undefined,
        }))
      : [];

    return {
      name: String(data.name ?? ''),
      description: data.description != null ? String(data.description) : undefined,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
      leadAgentId: data.leadAgentId != null ? String(data.leadAgentId) : undefined,
      members,
    };
  } catch {
    return null;
  }
}

/**
 * Get the most recent mtime from a list of files in a directory.
 * Returns 0 if the directory doesn't exist or has no matching files.
 */
async function getLatestMtimeInDir(dirPath: string, ext = '.json'): Promise<number> {
  if (!existsSync(dirPath)) return 0;
  try {
    const entries = await readdir(dirPath);
    let latest = 0;
    for (const entry of entries) {
      if (!entry.endsWith(ext)) continue;
      try {
        const stats = await stat(join(dirPath, entry));
        if (stats.mtimeMs > latest) latest = stats.mtimeMs;
      } catch {
        // skip unreadable files
      }
    }
    return latest;
  } catch {
    return 0;
  }
}

/**
 * Compute freshness of a team by checking MULTIPLE signals:
 * - config.json mtime
 * - latest inbox message file mtime
 * - task statuses (in_progress vs completed)
 */
export async function getTeamFreshness(teamName: string): Promise<TeamFreshness> {
  // Signal 1: config.json mtime
  let configMtime = 0;
  try {
    const configPath = join(TEAMS_DIR, teamName, 'config.json');
    const stats = await stat(configPath);
    configMtime = stats.mtimeMs;
  } catch {
    // config not accessible
  }

  // Signal 2: latest inbox file mtime
  const inboxDir = join(TEAMS_DIR, teamName, 'inboxes');
  const inboxMtime = await getLatestMtimeInDir(inboxDir);

  // Signal 3: task statuses
  const tasksDir = join(TASKS_DIR, teamName);
  let hasActiveTasks = false;
  let allTasksCompleted = true;
  let totalTasks = 0;
  let tasksMtime = 0;

  if (existsSync(tasksDir)) {
    try {
      const entries = await readdir(tasksDir);
      for (const entry of entries) {
        if (!entry.endsWith('.json') || entry.startsWith('.')) continue;
        const taskPath = join(tasksDir, entry);
        try {
          const stats = await stat(taskPath);
          if (stats.mtimeMs > tasksMtime) tasksMtime = stats.mtimeMs;

          const raw = await readFile(taskPath, 'utf-8');
          const data = JSON.parse(raw);
          totalTasks++;
          if (data.status === 'in_progress') {
            hasActiveTasks = true;
            allTasksCompleted = false;
          } else if (data.status !== 'completed') {
            allTasksCompleted = false;
          }
        } catch {
          // skip unreadable task files
        }
      }
    } catch {
      // tasks dir unreadable
    }
  }

  // If there are zero tasks, allTasksCompleted should be false (nothing to complete)
  if (totalTasks === 0) allTasksCompleted = false;

  const latestActivityMs = Math.max(configMtime, inboxMtime, tasksMtime);

  return {
    latestActivityMs,
    hasActiveTasks,
    allTasksCompleted,
    totalTasks,
  };
}

/**
 * Determine the lifecycle status of a team based on multiple freshness signals.
 *
 * Priority:
 * 1. If there are tasks in_progress -> 'active'
 * 2. If latest activity within ACTIVE_WINDOW -> 'active'
 * 3. If all tasks completed AND past COMPLETED_GRACE -> 'completed'
 * 4. If latest activity older than STALE_AGE -> 'stale'
 * 5. Otherwise -> 'idle'
 */
export function getTeamStatus(freshness: TeamFreshness): TeamStatus {
  const now = Date.now();
  const age = now - freshness.latestActivityMs;

  // Active tasks always mean the team is active
  if (freshness.hasActiveTasks) return 'active';

  // Recent activity within the active window
  if (age < ACTIVE_WINDOW_MS) return 'active';

  // All tasks done and past grace period -> completed
  if (freshness.allTasksCompleted && freshness.totalTasks > 0 && age > COMPLETED_GRACE_MS) {
    return 'completed';
  }

  // No activity for a long time -> stale
  if (age > STALE_AGE_MS) return 'stale';

  return 'idle';
}

export async function loadAllTeams(): Promise<Team[]> {
  if (!existsSync(TEAMS_DIR)) return [];

  try {
    const entries = await readdir(TEAMS_DIR, { withFileTypes: true });
    const teams: Team[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const configPath = join(TEAMS_DIR, entry.name, 'config.json');
      if (!existsSync(configPath)) continue;

      const freshness = await getTeamFreshness(entry.name);
      const status = getTeamStatus(freshness);

      // Filter out stale teams - they should not appear at all
      if (status === 'stale') continue;

      const team = await parseTeamConfig(configPath);
      if (team) {
        team.status = status;
        team.lastActivity = freshness.latestActivityMs;
        teams.push(team);
      }
    }

    return teams;
  } catch {
    return [];
  }
}
