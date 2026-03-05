import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { TeamCard, CrossTeamMessage, CrossTeamCall, CrossTeamData } from './types.js';

export const CROSS_TEAM_DIR = join(homedir(), '.claude', 'cross-team');
const REGISTRY_DIR = join(CROSS_TEAM_DIR, 'registry');
const MESSAGES_DIR = join(CROSS_TEAM_DIR, 'messages');
const CALLS_DIR = join(CROSS_TEAM_DIR, 'calls');

const MAX_MESSAGES = 50;
const MAX_FILE_SIZE = 1_048_576; // 1MB - reject oversized files (L3)
const STALE_THRESHOLD_MS = 5 * 60 * 1000;   // 5min → idle
const INACTIVE_THRESHOLD_MS = 30 * 60 * 1000; // 30min → remove

const VALID_MSG_TYPES = new Set(['message', 'call_invite', 'call_join', 'call_leave', 'status_update']);

/**
 * Sanitize a name for safe use as filename (H1: path traversal prevention)
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\.\0]/g, '_').slice(0, 100);
}

/**
 * Verify a resolved path stays within expected directory (M3: symlink protection)
 */
function isPathSafe(filePath: string, expectedDir: string): boolean {
  return resolve(filePath).startsWith(resolve(expectedDir) + '/');
}

/**
 * Strip control characters from strings before rendering (L2: escape injection)
 */
export function sanitizeString(str: string): string {
  return str.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
}

/**
 * Ensure cross-team directories exist
 */
export async function ensureCrossTeamDirs(): Promise<void> {
  for (const dir of [REGISTRY_DIR, MESSAGES_DIR, CALLS_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

/**
 * Load all registered team cards from registry/
 */
export async function loadRegistry(): Promise<TeamCard[]> {
  if (!existsSync(REGISTRY_DIR)) return [];

  try {
    const entries = await readdir(REGISTRY_DIR);
    const cards: TeamCard[] = [];

    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      try {
        const raw = await readFile(join(REGISTRY_DIR, entry), 'utf-8');
        const data = JSON.parse(raw);
        const card: TeamCard = {
          teamName: sanitizeString(String(data.teamName ?? '')),
          description: data.description != null ? sanitizeString(String(data.description)) : undefined,
          leadAgent: sanitizeString(String(data.leadAgent ?? '')),
          memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
          tasksSummary: {
            pending: data.tasksSummary?.pending ?? 0,
            in_progress: data.tasksSummary?.in_progress ?? 0,
            completed: data.tasksSummary?.completed ?? 0,
          },
          status: data.status === 'idle' || data.status === 'completed' ? data.status : 'active',
          registeredAt: typeof data.registeredAt === 'number' ? data.registeredAt : Date.now(),
          lastHeartbeat: typeof data.lastHeartbeat === 'number' ? data.lastHeartbeat : Date.now(),
        };

        // Stale detection
        const age = Date.now() - card.lastHeartbeat;
        if (age > INACTIVE_THRESHOLD_MS) continue; // skip inactive teams
        if (age > STALE_THRESHOLD_MS) card.status = 'idle';

        cards.push(card);
      } catch {
        // Skip malformed files
      }
    }

    return cards;
  } catch {
    return [];
  }
}

/**
 * Validate message type against allowed values (M4)
 */
function validMsgType(t: unknown): CrossTeamMessage['type'] {
  return typeof t === 'string' && VALID_MSG_TYPES.has(t)
    ? (t as CrossTeamMessage['type'])
    : 'message';
}

/**
 * Load cross-team messages, sorted by timestamp desc, capped at MAX_MESSAGES.
 * Only reads the most recent files to avoid DoS (M1).
 */
export async function loadCrossTeamMessages(): Promise<CrossTeamMessage[]> {
  if (!existsSync(MESSAGES_DIR)) return [];

  try {
    let entries = await readdir(MESSAGES_DIR);
    entries = entries.filter((e) => e.endsWith('.json'));

    // M1: Sort by filename desc (timestamp-based) and only read the most recent
    entries.sort((a, b) => b.localeCompare(a));
    entries = entries.slice(0, MAX_MESSAGES);

    const messages: CrossTeamMessage[] = [];

    for (const entry of entries) {
      try {
        const raw = await readFile(join(MESSAGES_DIR, entry), 'utf-8');
        if (raw.length > MAX_FILE_SIZE) continue; // L3: skip oversized
        const data = JSON.parse(raw);
        messages.push({
          id: String(data.id ?? `msg-${entry}`),
          fromTeam: sanitizeString(String(data.fromTeam ?? '')),
          fromAgent: sanitizeString(String(data.fromAgent ?? '')),
          toTeam: data.toTeam != null ? sanitizeString(String(data.toTeam)) : undefined,
          toAgent: data.toAgent != null ? sanitizeString(String(data.toAgent)) : undefined,
          content: sanitizeString(String(data.content ?? '')),
          timestamp: String(data.timestamp ?? new Date().toISOString()),
          type: validMsgType(data.type),
        });
      } catch {
        // Skip malformed
      }
    }

    // Sort desc by timestamp
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return messages;
  } catch {
    return [];
  }
}

/**
 * Load active call if it exists
 */
export async function loadActiveCall(): Promise<CrossTeamCall | null> {
  const callPath = join(CALLS_DIR, 'active-call.json');
  if (!existsSync(callPath)) return null;

  try {
    const raw = await readFile(callPath, 'utf-8');
    const data = JSON.parse(raw);
    return {
      id: String(data.id ?? 'call-unknown'),
      startedAt: String(data.startedAt ?? new Date().toISOString()),
      participants: Array.isArray(data.participants)
        ? data.participants.map((p: Record<string, unknown>) => ({
            teamName: String(p.teamName ?? ''),
            agentName: String(p.agentName ?? ''),
            joinedAt: String(p.joinedAt ?? ''),
          }))
        : [],
      topic: data.topic != null ? String(data.topic) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Load all cross-team data combined
 */
export async function loadCrossTeamData(): Promise<CrossTeamData> {
  const [registry, messages, activeCall] = await Promise.all([
    loadRegistry(),
    loadCrossTeamMessages(),
    loadActiveCall(),
  ]);

  return { registry, messages, activeCall, loading: false };
}

/**
 * Register or update a team in the registry (auto-registration).
 * H1: sanitizes teamName to prevent path traversal.
 * M3: validates resolved path stays within registry dir.
 * L1: writes with owner-only permissions.
 */
export async function registerTeam(card: TeamCard): Promise<void> {
  await ensureCrossTeamDirs();
  const safeName = sanitizeFilename(card.teamName);
  if (!safeName) return;
  const filePath = join(REGISTRY_DIR, `${safeName}.json`);
  if (!isPathSafe(filePath, REGISTRY_DIR)) return;
  await writeFile(filePath, JSON.stringify(card, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

/**
 * Write a cross-team message.
 * W2: random suffix prevents collision on same-millisecond writes.
 * L1: writes with owner-only permissions.
 */
export async function sendCrossTeamMessage(msg: Omit<CrossTeamMessage, 'id'>): Promise<void> {
  await ensureCrossTeamDirs();
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  const id = `msg-${timestamp}-${rand}`;
  const filePath = join(MESSAGES_DIR, `${timestamp}-${rand}.json`);
  if (!isPathSafe(filePath, MESSAGES_DIR)) return;
  await writeFile(filePath, JSON.stringify({ ...msg, id }, null, 2), { encoding: 'utf-8', mode: 0o600 });
}
