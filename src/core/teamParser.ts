import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TEAMS_DIR } from './watcher.js';
import type { Team, Agent } from './types.js';

// A team is "live" if its config.json was modified within this window
const MAX_STALE_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

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
 * A team is "live" only if its config.json was modified recently.
 * When agents join/leave, Claude Code updates config.json, so mtime
 * is the most reliable indicator of activity.
 * Member lists and task statuses persist after teams die - not reliable.
 */
async function isTeamLive(configPath: string): Promise<boolean> {
  try {
    const stats = await stat(configPath);
    return Date.now() - stats.mtimeMs < MAX_STALE_AGE_MS;
  } catch {
    return false;
  }
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

      // Skip stale teams
      if (!(await isTeamLive(configPath))) continue;

      const team = await parseTeamConfig(configPath);
      if (team) teams.push(team);
    }

    return teams;
  } catch {
    return [];
  }
}
