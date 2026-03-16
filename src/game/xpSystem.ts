// XP and achievement system for agent gamification

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

import type { PixelGrid } from './PixelCanvas.js';
import type { AgentGameData, GameState, Achievement } from './types.js';
import { XP_TABLE, LEVELS } from './types.js';

// ──────────────────────────────────────────────────────────────
// XP and Level calculations
// ──────────────────────────────────────────────────────────────

/**
 * Calculate the current level, title, and progress from raw XP.
 */
export function calculateLevel(xp: number): {
  level: number;
  title: string;
  nextLevelXp: number;
  progress: number;
} {
  let currentLevel = 1;
  let currentTitle = 'Recruit';
  let currentLevelXp = 0;
  let nextLevelXp = LEVELS.length > 1 ? LEVELS[1]!.xp : 0;
  let hasNext = true;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.xp) {
      currentLevel = LEVELS[i]!.level;
      currentTitle = LEVELS[i]!.title;
      currentLevelXp = LEVELS[i]!.xp;
      if (i + 1 < LEVELS.length) {
        nextLevelXp = LEVELS[i + 1]!.xp;
        hasNext = true;
      } else {
        nextLevelXp = LEVELS[i]!.xp;
        hasNext = false;
      }
      break;
    }
  }
  const rangeXp = nextLevelXp - currentLevelXp;
  const progress = rangeXp > 0 && hasNext ? Math.min(1, (xp - currentLevelXp) / rangeXp) : 1;

  return {
    level: currentLevel,
    title: currentTitle,
    nextLevelXp,
    progress,
  };
}

/**
 * Grant XP for an action and return updated AgentGameData.
 */
export function grantXp(
  data: AgentGameData,
  action: keyof typeof XP_TABLE,
): AgentGameData {
  const amount = XP_TABLE[action];
  const newXp = data.xp + amount;
  const levelInfo = calculateLevel(newXp);

  return {
    ...data,
    xp: newXp,
    level: levelInfo.level,
    title: levelInfo.title,
  };
}

// ──────────────────────────────────────────────────────────────
// Achievements
// ──────────────────────────────────────────────────────────────

// Transparent shorthand
const _: null = null;

const RD = '#FF0000';
const YL = '#FFD700';
const GN = '#00CC00';
const BR = '#8B4513';
const CY = '#00CCCC';
const W = '#FFFFFF';
const OG = '#FF6600';

/** Achievement definitions with 4x4 pixel art badges */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first task',
    condition: (d) => d.tasksDone >= 1,
    badge: [
      [_, RD, RD, _],
      [RD, RD, RD, _],
      [_, RD, RD, _],
      [_, _, RD, _],
    ],
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Complete 5 tasks',
    condition: (d) => d.tasksDone >= 5,
    badge: [
      [_, YL, _, _],
      [_, YL, YL, _],
      [YL, YL, _, _],
      [_, YL, _, _],
    ],
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 20 files',
    condition: (d) => d.filesRead >= 20,
    badge: [
      [GN, GN, GN, GN],
      [GN, W, W, GN],
      [GN, W, W, GN],
      [GN, GN, GN, GN],
    ],
  },
  {
    id: 'prolific_writer',
    name: 'Prolific Writer',
    description: 'Write 10 files',
    condition: (d) => d.filesWritten >= 10,
    badge: [
      [_, _, YL, _],
      [_, YL, BR, _],
      [YL, BR, _, _],
      [BR, _, _, _],
    ],
  },
  {
    id: 'communicator',
    name: 'Communicator',
    description: 'Send 15 messages',
    condition: (d) => d.messagesSent >= 15,
    badge: [
      [_, CY, CY, _],
      [CY, CY, CY, CY],
      [_, CY, _, _],
      [_, CY, _, _],
    ],
  },
  {
    id: 'full_sweep',
    name: 'Full Sweep',
    description: 'Complete 10 tasks',
    condition: (d) => d.tasksDone >= 10,
    badge: [
      [_, GN, _, _],
      [_, GN, GN, _],
      [GN, GN, _, _],
      [GN, _, _, _],
    ],
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Send 10 messages and complete 3 tasks',
    condition: (d) => d.messagesSent >= 10 && d.tasksDone >= 3,
    badge: [
      [_, OG, OG, _],
      [OG, _, _, OG],
      [OG, _, _, OG],
      [_, OG, OG, _],
    ],
  },
];

/**
 * Check which achievements are newly unlocked for an agent.
 * Returns array of achievement IDs that were not previously in the agent's list.
 */
export function checkAchievements(data: AgentGameData): string[] {
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (data.achievements.includes(achievement.id)) continue;
    if (achievement.condition(data)) {
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}

// ──────────────────────────────────────────────────────────────
// Persistence
// ──────────────────────────────────────────────────────────────

const GAME_DATA_DIR = join(homedir(), '.claude', 'pixel-agents');

function gameStatePath(teamName: string): string {
  return join(GAME_DATA_DIR, `${teamName}.json`);
}

/** Serializable format for GameState (Map → Record) */
interface SerializedGameState {
  teamName: string;
  agents: Record<string, AgentGameData>;
  totalXp: number;
  teamLevel: number;
  teamAchievements: string[];
}

function serializeGameState(state: GameState): SerializedGameState {
  const agents: Record<string, AgentGameData> = {};
  for (const [key, value] of state.agents) {
    agents[key] = value;
  }
  return {
    teamName: state.teamName,
    agents,
    totalXp: state.totalXp,
    teamLevel: state.teamLevel,
    teamAchievements: state.teamAchievements,
  };
}

function deserializeGameState(raw: SerializedGameState): GameState {
  const agents = new Map<string, AgentGameData>();
  for (const [key, value] of Object.entries(raw.agents)) {
    agents.set(key, value);
  }
  return {
    teamName: raw.teamName,
    agents,
    totalXp: raw.totalXp,
    teamLevel: raw.teamLevel,
    teamAchievements: raw.teamAchievements,
  };
}

/**
 * Load game state from disk. Returns a fresh state if no save exists.
 */
export async function loadGameState(teamName: string): Promise<GameState> {
  const filePath = gameStatePath(teamName);

  if (!existsSync(filePath)) {
    return {
      teamName,
      agents: new Map(),
      totalXp: 0,
      teamLevel: 1,
      teamAchievements: [],
    };
  }

  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as SerializedGameState;
    return deserializeGameState(parsed);
  } catch {
    return {
      teamName,
      agents: new Map(),
      totalXp: 0,
      teamLevel: 1,
      teamAchievements: [],
    };
  }
}

/**
 * Save game state to disk at ~/.claude/pixel-agents/<team>.json
 */
export async function saveGameState(state: GameState): Promise<void> {
  if (!existsSync(GAME_DATA_DIR)) {
    await mkdir(GAME_DATA_DIR, { recursive: true });
  }

  const filePath = gameStatePath(state.teamName);
  const serialized = serializeGameState(state);
  await writeFile(filePath, JSON.stringify(serialized, null, 2), 'utf-8');
}

/**
 * Create default AgentGameData for a new agent.
 */
export function createAgentGameData(agentName: string): AgentGameData {
  return {
    agentName,
    xp: 0,
    level: 1,
    title: 'Recruit',
    currentZone: 'lounge',
    achievements: [],
    tasksDone: 0,
    messagesSent: 0,
    filesRead: 0,
    filesWritten: 0,
  };
}
