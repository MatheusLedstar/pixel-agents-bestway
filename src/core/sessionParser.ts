import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { getActionIcon } from '../utils/icons.js';

// ──────────────────────────────────────────────────────────────
// Public interfaces
// ──────────────────────────────────────────────────────────────

export interface AgentActivity {
  agentName: string;
  lastAction: string;       // e.g. "Reading App.tsx", "Running tests"
  lastActionIcon: string;   // emoji icon
  lastActionTime: string;   // ISO timestamp
  isThinking: boolean;      // true when last content block was thinking
}

export interface RealTokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;      // inputTokens + outputTokens (not cache)
}

export interface TeamSessionData {
  teamName: string;
  totalTokens: RealTokenUsage;
  agentTokens: Map<string, RealTokenUsage>;   // agentId → usage
  agentActivity: Map<string, AgentActivity>;  // agentId → activity
}

// ──────────────────────────────────────────────────────────────
// Internal types
// ──────────────────────────────────────────────────────────────

interface TeamConfig {
  name: string;
  leadSessionId?: string;
  leadAgentId?: string;
  members: Array<{ agentId: string; name: string }>;
}

interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

interface RawContentBlock {
  type: string;
  name?: string;
  text?: string;
  thinking?: string;
  input?: Record<string, unknown>;
}

interface RawAssistantMessage {
  type: 'assistant';
  agentId?: string | null;
  timestamp?: string;
  message?: {
    content?: RawContentBlock[];
    usage?: RawUsage;
  };
}

// ──────────────────────────────────────────────────────────────
// Simple in-memory cache (2-second TTL)
// ──────────────────────────────────────────────────────────────

interface CacheEntry {
  data: TeamSessionData;
  expiresAt: number;
}

const sessionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2_000;

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const CLAUDE_DIR = join(homedir(), '.claude');
const TEAMS_DIR = join(CLAUDE_DIR, 'teams');
const PROJECTS_BASE = join(CLAUDE_DIR, 'projects');

function emptyUsage(): RealTokenUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
  };
}

function addUsage(acc: RealTokenUsage, raw: RawUsage): void {
  acc.inputTokens += raw.input_tokens ?? 0;
  acc.outputTokens += raw.output_tokens ?? 0;
  acc.cacheReadTokens += raw.cache_read_input_tokens ?? 0;
  acc.cacheCreationTokens += raw.cache_creation_input_tokens ?? 0;
  acc.totalTokens = acc.inputTokens + acc.outputTokens;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max) + '…';
}

function fileBasename(filePath: unknown): string {
  if (typeof filePath !== 'string' || !filePath) return '';
  return basename(filePath);
}

/** Derive a human-readable display name from a raw agentId (hash) or filename. */
function agentDisplayName(agentId: string): string {
  // agentId may look like "a4c3e433c5ce41485" – shorten it for display
  return agentId.length > 12 ? agentId.slice(0, 12) : agentId;
}

/** Parse a tool_use content block into a readable action string. */
function toolUseToAction(block: RawContentBlock): string {
  const name = block.name ?? '';
  const input = block.input ?? {};

  switch (name) {
    case 'Read':
      return `Reading ${fileBasename(input.file_path)}`;
    case 'Write':
      return `Writing ${fileBasename(input.file_path)}`;
    case 'Edit':
      return `Editing ${fileBasename(input.file_path)}`;
    case 'Grep':
      return `Searching: ${truncate(String(input.pattern ?? ''), 30)}`;
    case 'Glob':
      return `Finding files: ${truncate(String(input.pattern ?? ''), 30)}`;
    case 'Bash':
      return `Running: ${truncate(String(input.command ?? input.description ?? ''), 30)}`;
    case 'Task':
    case 'Agent':
      return `Delegating: ${truncate(String(input.description ?? input.name ?? ''), 30)}`;
    case 'WebSearch':
      return `Searching web: ${truncate(String(input.query ?? ''), 30)}`;
    case 'WebFetch': {
      const url = String(input.url ?? '');
      const urlBase = url ? basename(url.replace(/\?.*$/, '')) || url.slice(-30) : '';
      return `Fetching: ${urlBase}`;
    }
    case 'SendMessage':
      return `Sending message`;
    case 'TaskUpdate':
      return `Updating task`;
    case 'TaskCreate':
      return `Creating task`;
    default:
      return `Using ${name}`;
  }
}

/** Max lines to read from very large JSONL files. */
const MAX_JSONL_LINES = 10_000;

/** Read all lines from a JSONL file, filtering out blanks. Caps at MAX_JSONL_LINES (tail). */
async function readJsonlLines(filePath: string): Promise<string[]> {
  const raw = await readFile(filePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  // For very large sessions, keep only the most recent lines
  if (lines.length > MAX_JSONL_LINES) {
    return lines.slice(-MAX_JSONL_LINES);
  }
  return lines;
}

// ──────────────────────────────────────────────────────────────
// Step 1 – locate all project directories that might contain JSONL sessions
// ──────────────────────────────────────────────────────────────

async function findProjectDirs(): Promise<string[]> {
  if (!existsSync(PROJECTS_BASE)) return [];
  try {
    const entries = await readdir(PROJECTS_BASE, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => join(PROJECTS_BASE, e.name));
  } catch {
    return [];
  }
}

/** Scan all project dirs to locate the JSONL for a given leadSessionId. */
async function findLeadSessionFile(leadSessionId: string): Promise<string | null> {
  const projectDirs = await findProjectDirs();
  for (const dir of projectDirs) {
    const candidate = join(dir, `${leadSessionId}.jsonl`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Scan for subagent JSONL files.
 * Returns Map<agentId, filePath>.
 * Subagent files live at: <projectDir>/<leadSessionId>/subagents/agent-<agentId>.jsonl
 */
async function findSessionFiles(teamName: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // Read team config
  const configPath = join(TEAMS_DIR, teamName, 'config.json');
  if (!existsSync(configPath)) return result;

  let config: TeamConfig;
  try {
    const raw = await readFile(configPath, 'utf-8');
    config = JSON.parse(raw) as TeamConfig;
  } catch {
    return result;
  }

  const leadSessionId = config.leadSessionId;
  if (!leadSessionId) return result;

  // Find the project dir that contains the lead session JSONL
  const leadFile = await findLeadSessionFile(leadSessionId);
  if (!leadFile) return result;

  // Lead session itself – key it by a stable name
  result.set('__lead__', leadFile);

  // Subagents directory is the session dir without .jsonl extension
  const sessionDir = leadFile.replace(/\.jsonl$/, '');
  const subagentsDir = join(sessionDir, 'subagents');

  if (!existsSync(subagentsDir)) return result;

  try {
    const entries = await readdir(subagentsDir);
    for (const entry of entries) {
      if (!entry.endsWith('.jsonl')) continue;
      // filename: agent-<agentId>.jsonl
      const agentId = entry.replace(/^agent-/, '').replace(/\.jsonl$/, '');
      result.set(agentId, join(subagentsDir, entry));
    }
  } catch {
    // subagents dir unreadable – return what we have
  }

  return result;
}

// ──────────────────────────────────────────────────────────────
// Step 2 – parse token usage from a JSONL file
// ──────────────────────────────────────────────────────────────

async function parseSessionTokens(filePath: string): Promise<RealTokenUsage> {
  const totals = emptyUsage();
  try {
    const lines = await readJsonlLines(filePath);
    for (const line of lines) {
      try {
        const obj = JSON.parse(line) as Partial<RawAssistantMessage>;
        if (obj.type !== 'assistant') continue;
        const usage = obj.message?.usage;
        if (!usage) continue;
        addUsage(totals, usage);
      } catch {
        // skip malformed line
      }
    }
  } catch {
    // file unreadable
  }
  return totals;
}

// ──────────────────────────────────────────────────────────────
// Step 3 – parse the most recent activity from a JSONL file
// ──────────────────────────────────────────────────────────────

async function parseAgentActivity(filePath: string, agentName: string): Promise<AgentActivity> {
  const fallback: AgentActivity = {
    agentName,
    lastAction: 'Working...',
    lastActionIcon: getActionIcon('working'),
    lastActionTime: new Date().toISOString(),
    isThinking: false,
  };

  try {
    const lines = await readJsonlLines(filePath);
    // Check last 20 lines for the most recent assistant message
    const tail = lines.slice(-20);

    let latestMsg: RawAssistantMessage | null = null;
    let latestTimestamp = '';

    for (const line of tail) {
      try {
        const obj = JSON.parse(line) as Partial<RawAssistantMessage>;
        if (obj.type !== 'assistant') continue;
        const ts = obj.timestamp ?? '';
        if (!latestTimestamp || ts > latestTimestamp) {
          latestTimestamp = ts;
          latestMsg = obj as RawAssistantMessage;
        }
      } catch {
        // skip
      }
    }

    if (!latestMsg) return fallback;

    const content = latestMsg.message?.content ?? [];
    if (content.length === 0) return { ...fallback, lastActionTime: latestTimestamp || fallback.lastActionTime };

    // Walk content blocks from last to first to find the most interesting one
    let action = 'Working...';
    let isThinking = false;

    for (let i = content.length - 1; i >= 0; i--) {
      const block = content[i];
      if (!block) continue;

      if (block.type === 'thinking') {
        action = 'Thinking...';
        isThinking = true;
        break;
      }

      if (block.type === 'tool_use') {
        action = toolUseToAction(block);
        isThinking = false;
        break;
      }

      if (block.type === 'text') {
        action = 'Working...';
        isThinking = false;
        break;
      }
    }

    return {
      agentName,
      lastAction: action,
      lastActionIcon: getActionIcon(action),
      lastActionTime: latestTimestamp || fallback.lastActionTime,
      isThinking,
    };
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────────
// Step 4 – build agent name mapping from team config + lead JSONL
// ──────────────────────────────────────────────────────────────

/**
 * Try to build a mapping of agentId (hash) → member name by reading the lead JSONL.
 * Single-pass strategy:
 *  1. For 'assistant' lines: collect Task/Agent tool_use blocks with name + prompt.
 *  2. For 'progress' lines: correlate agentId hashes via prompt similarity.
 *
 * This is best-effort; unmapped agentIds fall back to a shortened hash display name.
 */
async function buildAgentNameMap(
  leadFilePath: string | undefined,
  teamName: string,
): Promise<Map<string, string>> {
  const mapping = new Map<string, string>(); // hash agentId → member name

  if (!leadFilePath) return mapping;

  try {
    const lines = await readJsonlLines(leadFilePath);

    // Collected in a single pass
    const taskPrompts = new Map<string, string>(); // member name → prompt start (first 200 chars)
    const pendingProgress: Array<{ hashAgentId: string; promptStart: string }> = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line) as Record<string, unknown>;
        const lineType = obj['type'];

        if (lineType === 'assistant') {
          const message = obj['message'] as Record<string, unknown> | undefined;
          const content = (message?.['content'] as RawContentBlock[] | undefined) ?? [];
          for (const block of content) {
            if (block.type !== 'tool_use') continue;
            if (block.name !== 'Task' && block.name !== 'Agent') continue;
            const input = (block.input ?? {}) as Record<string, unknown>;
            const memberName = String(input['name'] ?? '');
            const targetTeam = String(input['team_name'] ?? '');
            const prompt = String(input['prompt'] ?? '').slice(0, 200);
            if (memberName && targetTeam === teamName && prompt) {
              taskPrompts.set(memberName, prompt);
            }
          }
        } else if (lineType === 'progress') {
          const data = (obj['data'] ?? {}) as Record<string, unknown>;
          const hashAgentId = String(data['agentId'] ?? '');
          if (!hashAgentId || mapping.has(hashAgentId)) continue;

          const promptInProgress = String(data['prompt'] ?? '').slice(0, 200);
          if (!promptInProgress) continue;

          // Try to match immediately against prompts collected so far
          let matched = false;
          for (const [memberName, taskPrompt] of taskPrompts) {
            if (
              promptInProgress.length > 20 &&
              taskPrompt.length > 20 &&
              promptInProgress.slice(0, 80) === taskPrompt.slice(0, 80)
            ) {
              mapping.set(hashAgentId, memberName);
              matched = true;
              break;
            }
          }
          // If not matched yet (progress arrived before the Task tool_use), queue for later
          if (!matched) {
            pendingProgress.push({ hashAgentId, promptStart: promptInProgress });
          }
        }
      } catch {
        // skip malformed line
      }
    }

    // Resolve any pending progress events against final taskPrompts
    for (const { hashAgentId, promptStart } of pendingProgress) {
      if (mapping.has(hashAgentId)) continue;
      for (const [memberName, taskPrompt] of taskPrompts) {
        if (
          promptStart.length > 20 &&
          taskPrompt.length > 20 &&
          promptStart.slice(0, 80) === taskPrompt.slice(0, 80)
        ) {
          mapping.set(hashAgentId, memberName);
          break;
        }
      }
    }
  } catch {
    // lead file unreadable
  }

  return mapping;
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Load real token usage and live activity for a single team.
 * Returns null if the team has no leadSessionId or cannot be read.
 */
export async function loadTeamSessionData(teamName: string): Promise<TeamSessionData | null> {
  // Check cache
  const cached = sessionCache.get(teamName);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const sessionFiles = await findSessionFiles(teamName);
    if (sessionFiles.size === 0) return null;

    const leadFile = sessionFiles.get('__lead__');

    // Build best-effort name mapping (hash → member name)
    const nameMap = await buildAgentNameMap(leadFile, teamName);

    // Aggregate usage and activity in parallel
    const agentTokens = new Map<string, RealTokenUsage>();
    const agentActivity = new Map<string, AgentActivity>();
    const totalTokens = emptyUsage();

    const tasks: Promise<void>[] = [];

    for (const [fileKey, filePath] of sessionFiles) {
      if (fileKey === '__lead__') {
        // Lead agent tokens counted but not shown per-agent
        tasks.push(
          parseSessionTokens(filePath).then((usage) => {
            addUsage(totalTokens, {
              input_tokens: usage.inputTokens,
              output_tokens: usage.outputTokens,
              cache_read_input_tokens: usage.cacheReadTokens,
              cache_creation_input_tokens: usage.cacheCreationTokens,
            });
          }),
        );
        continue;
      }

      // fileKey is the hash agentId (e.g. "a4c3e433c5ce41485")
      const hashAgentId = fileKey;
      const displayName = nameMap.get(hashAgentId) ?? agentDisplayName(hashAgentId);

      tasks.push(
        Promise.all([
          parseSessionTokens(filePath),
          parseAgentActivity(filePath, displayName),
        ]).then(([usage, activity]) => {
          agentTokens.set(displayName, usage);
          agentActivity.set(displayName, activity);
          // Add to total
          addUsage(totalTokens, {
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            cache_read_input_tokens: usage.cacheReadTokens,
            cache_creation_input_tokens: usage.cacheCreationTokens,
          });
        }),
      );
    }

    await Promise.all(tasks);

    const data: TeamSessionData = {
      teamName,
      totalTokens,
      agentTokens,
      agentActivity,
    };

    // Store in cache
    sessionCache.set(teamName, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return data;
  } catch {
    return null;
  }
}

/**
 * Load session data for multiple teams in parallel.
 * Returns Map<teamName, TeamSessionData> – teams that fail are omitted.
 */
export async function loadAllTeamsSessions(
  teamNames: string[],
): Promise<Map<string, TeamSessionData>> {
  const result = new Map<string, TeamSessionData>();

  await Promise.all(
    teamNames.map(async (name) => {
      const data = await loadTeamSessionData(name);
      if (data) result.set(name, data);
    }),
  );

  return result;
}
