import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TEAMS_DIR } from './watcher.js';
import type { Team, Agent } from './types.js';

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

export async function loadAllTeams(): Promise<Team[]> {
  if (!existsSync(TEAMS_DIR)) return [];

  try {
    const entries = await readdir(TEAMS_DIR, { withFileTypes: true });
    const teams: Team[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const configPath = join(TEAMS_DIR, entry.name, 'config.json');
      if (!existsSync(configPath)) continue;

      const team = await parseTeamConfig(configPath);
      if (team) teams.push(team);
    }

    return teams;
  } catch {
    return [];
  }
}
