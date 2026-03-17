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

export function calculateLevel(xp: number): {
  level: number;
  title: string;
  icon: string;
  nextLevelXp: number;
  progress: number;
} {
  let currentLevel = 1;
  let currentTitle = 'Recruit';
  let currentIcon = '⬡';
  let currentLevelXp = 0;
  let nextLevelXp = LEVELS.length > 1 ? LEVELS[1]!.xp : 0;
  let hasNext = true;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.xp) {
      currentLevel = LEVELS[i]!.level;
      currentTitle = LEVELS[i]!.title;
      currentIcon = LEVELS[i]!.icon;
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
    icon: currentIcon,
    nextLevelXp,
    progress,
  };
}

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
    totalXpEarned: (data.totalXpEarned ?? 0) + amount,
    level: levelInfo.level,
    title: levelInfo.title,
  };
}

// ──────────────────────────────────────────────────────────────
// Achievement badges (4x4 pixel art)
// ──────────────────────────────────────────────────────────────

const _: null = null;

// Color shorthands for badges
const RD = '#FF0000';
const YL = '#FFD700';
const GN = '#00CC00';
const BR = '#8B4513';
const CY = '#00CCCC';
const W = '#FFFFFF';
const OG = '#FF6600';
const MG = '#FF00FF';
const BL = '#3498DB';
const PU = '#9B59B6';
const LG = '#C0C0C0';
const GR = '#808080';
const DG = '#333333';
const TL = '#1ABC9C';

// Badge templates
const BADGE_FIRE: PixelGrid = [
  [_, RD, RD, _],
  [RD, OG, OG, RD],
  [OG, YL, YL, OG],
  [_, OG, OG, _],
];

const BADGE_LIGHTNING: PixelGrid = [
  [_, YL, YL, _],
  [_, YL, _, _],
  [_, _, YL, _],
  [_, _, YL, _],
];

const BADGE_BOOK: PixelGrid = [
  [GN, GN, GN, GN],
  [GN, W, W, GN],
  [GN, W, W, GN],
  [GN, GN, GN, GN],
];

const BADGE_PENCIL: PixelGrid = [
  [_, _, YL, _],
  [_, YL, BR, _],
  [YL, BR, _, _],
  [BR, _, _, _],
];

const BADGE_CHAT: PixelGrid = [
  [_, CY, CY, _],
  [CY, CY, CY, CY],
  [_, CY, CY, _],
  [_, CY, _, _],
];

const BADGE_CHECKMARK: PixelGrid = [
  [_, GN, _, _],
  [_, GN, GN, _],
  [GN, GN, _, _],
  [GN, _, _, _],
];

const BADGE_RING: PixelGrid = [
  [_, OG, OG, _],
  [OG, _, _, OG],
  [OG, _, _, OG],
  [_, OG, OG, _],
];

const BADGE_ROCKET: PixelGrid = [
  [_, W, W, _],
  [_, LG, LG, _],
  [LG, OG, OG, LG],
  [_, RD, RD, _],
];

const BADGE_BUG: PixelGrid = [
  [RD, _, _, RD],
  [_, RD, RD, _],
  [RD, RD, RD, RD],
  [RD, _, _, RD],
];

const BADGE_FLASK: PixelGrid = [
  [_, GN, GN, _],
  [_, GN, _, _],
  [GN, GN, GN, _],
  [_, GN, GN, _],
];

const BADGE_STAR: PixelGrid = [
  [_, YL, _, _],
  [YL, YL, YL, _],
  [_, YL, _, _],
  [YL, _, YL, _],
];

const BADGE_CROWN: PixelGrid = [
  [YL, _, YL, _],
  [YL, YL, YL, YL],
  [YL, YL, YL, YL],
  [YL, YL, YL, YL],
];

const BADGE_DIAMOND: PixelGrid = [
  [_, BL, BL, _],
  [BL, CY, CY, BL],
  [BL, CY, CY, BL],
  [_, BL, BL, _],
];

const BADGE_GEAR: PixelGrid = [
  [_, LG, LG, _],
  [LG, GR, GR, LG],
  [LG, GR, GR, LG],
  [_, LG, LG, _],
];

const BADGE_MAGIC: PixelGrid = [
  [MG, _, MG, _],
  [_, MG, _, MG],
  [MG, _, MG, _],
  [_, MG, _, MG],
];

const BADGE_SHIELD: PixelGrid = [
  [BL, BL, BL, BL],
  [BL, W, W, BL],
  [BL, BL, BL, BL],
  [_, BL, BL, _],
];

const BADGE_TROPHY: PixelGrid = [
  [YL, YL, YL, YL],
  [YL, _, _, YL],
  [_, YL, YL, _],
  [_, YL, YL, _],
];

const BADGE_CODE: PixelGrid = [
  [GN, _, _, GN],
  [_, GN, GN, _],
  [_, GN, GN, _],
  [GN, _, _, GN],
];

const BADGE_INFINITY: PixelGrid = [
  [_, TL, TL, _],
  [TL, TL, TL, TL],
  [TL, TL, TL, TL],
  [_, TL, TL, _],
];

const BADGE_GHOST: PixelGrid = [
  [_, PU, PU, _],
  [PU, W, W, PU],
  [PU, PU, PU, PU],
  [PU, _, PU, _],
];

const BADGE_WRENCH: PixelGrid = [
  [_, GR, _, _],
  [GR, GR, GR, _],
  [_, GR, GR, GR],
  [_, _, GR, _],
];

const BADGE_NINJA: PixelGrid = [
  [_, DG, DG, _],
  [DG, W, DG, DG],
  [DG, DG, DG, DG],
  [DG, DG, DG, DG],
];

// ──────────────────────────────────────────────────────────────
// Achievement definitions (15 total)
// ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first task',
    icon: '🔥',
    rarity: 'common',
    xpReward: 25,
    condition: (d) => d.tasksDone >= 1,
    badge: BADGE_FIRE,
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Complete 5 tasks',
    icon: '⚡',
    rarity: 'common',
    xpReward: 50,
    condition: (d) => d.tasksDone >= 5,
    badge: BADGE_LIGHTNING,
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 20 files',
    icon: '📖',
    rarity: 'common',
    xpReward: 30,
    condition: (d) => d.filesRead >= 20,
    badge: BADGE_BOOK,
  },
  {
    id: 'prolific_writer',
    name: 'Prolific Writer',
    description: 'Write 10 files',
    icon: '✏️',
    rarity: 'common',
    xpReward: 40,
    condition: (d) => d.filesWritten >= 10,
    badge: BADGE_PENCIL,
  },
  {
    id: 'communicator',
    name: 'Communicator',
    description: 'Send 15 messages',
    icon: '💬',
    rarity: 'common',
    xpReward: 35,
    condition: (d) => d.messagesSent >= 15,
    badge: BADGE_CHAT,
  },
  {
    id: 'full_sweep',
    name: 'Full Sweep',
    description: 'Complete 10 tasks',
    icon: '✅',
    rarity: 'rare',
    xpReward: 100,
    condition: (d) => d.tasksDone >= 10,
    badge: BADGE_CHECKMARK,
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Send 10 messages and complete 3 tasks',
    icon: '🤝',
    rarity: 'rare',
    xpReward: 75,
    condition: (d) => d.messagesSent >= 10 && d.tasksDone >= 3,
    badge: BADGE_RING,
  },
  {
    id: 'rocket_science',
    name: 'Rocket Science',
    description: 'Complete 3 deployments',
    icon: '🚀',
    rarity: 'rare',
    xpReward: 90,
    condition: (d) => (d.deploysCompleted ?? 0) >= 3,
    badge: BADGE_ROCKET,
  },
  {
    id: 'bug_slayer',
    name: 'Bug Slayer',
    description: 'Debug 5 sessions',
    icon: '🐛',
    rarity: 'rare',
    xpReward: 80,
    condition: (d) => d.filesWritten >= 5 && d.tasksDone >= 2,
    badge: BADGE_BUG,
  },
  {
    id: 'lab_rat',
    name: 'Lab Rat',
    description: 'Run 10 test suites',
    icon: '🧪',
    rarity: 'rare',
    xpReward: 85,
    condition: (d) => (d.testsRun ?? 0) >= 10,
    badge: BADGE_FLASK,
  },
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Reach Level 4 Tech Lead',
    icon: '⭐',
    rarity: 'epic',
    xpReward: 150,
    condition: (d) => d.level >= 4,
    badge: BADGE_STAR,
  },
  {
    id: 'king_coder',
    name: 'King Coder',
    description: 'Complete 20 tasks',
    icon: '👑',
    rarity: 'epic',
    xpReward: 200,
    condition: (d) => d.tasksDone >= 20,
    badge: BADGE_CROWN,
  },
  {
    id: 'diamond_dev',
    name: 'Diamond Dev',
    description: 'Reach Level 6 Principal',
    icon: '💎',
    rarity: 'epic',
    xpReward: 300,
    condition: (d) => d.level >= 6,
    badge: BADGE_DIAMOND,
  },
  {
    id: 'gear_grinder',
    name: 'Gear Grinder',
    description: 'Read 50 files and write 25 files',
    icon: '⚙️',
    rarity: 'epic',
    xpReward: 250,
    condition: (d) => d.filesRead >= 50 && d.filesWritten >= 25,
    badge: BADGE_GEAR,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Reach Level 9 Legend',
    icon: '🌟',
    rarity: 'legendary',
    xpReward: 500,
    condition: (d) => d.level >= 9,
    badge: BADGE_TROPHY,
  },
];

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

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// ──────────────────────────────────────────────────────────────
// Persistence
// ──────────────────────────────────────────────────────────────

const GAME_DATA_DIR = join(homedir(), '.claude', 'pixel-agents');

function gameStatePath(teamName: string): string {
  return join(GAME_DATA_DIR, `${teamName}.json`);
}

interface SerializedGameState {
  teamName: string;
  agents: Record<string, AgentGameData>;
  totalXp: number;
  teamLevel: number;
  teamAchievements: string[];
  events?: Array<{
    id: string;
    timestamp: number;
    type: string;
    agentName: string;
    message: string;
    color: string;
    icon: string;
    xpGained?: number;
  }>;
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
    events: state.events?.slice(-50), // persist last 50 events
  };
}

function deserializeGameState(raw: SerializedGameState): GameState {
  const agents = new Map<string, AgentGameData>();
  for (const [key, value] of Object.entries(raw.agents)) {
    agents.set(key, {
      ...value,
      deploysCompleted: value.deploysCompleted ?? 0,
      testsRun: value.testsRun ?? 0,
      totalXpEarned: value.totalXpEarned ?? value.xp,
      streakDays: value.streakDays ?? 0,
    });
  }
  return {
    teamName: raw.teamName,
    agents,
    totalXp: raw.totalXp,
    teamLevel: raw.teamLevel,
    teamAchievements: raw.teamAchievements,
    events: (raw.events ?? []) as GameState['events'],
  };
}

export async function loadGameState(teamName: string): Promise<GameState> {
  const filePath = gameStatePath(teamName);

  if (!existsSync(filePath)) {
    return {
      teamName,
      agents: new Map(),
      totalXp: 0,
      teamLevel: 1,
      teamAchievements: [],
      events: [],
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
      events: [],
    };
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  if (!existsSync(GAME_DATA_DIR)) {
    await mkdir(GAME_DATA_DIR, { recursive: true });
  }

  const filePath = gameStatePath(state.teamName);
  const serialized = serializeGameState(state);
  await writeFile(filePath, JSON.stringify(serialized, null, 2), 'utf-8');
}

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
    deploysCompleted: 0,
    testsRun: 0,
    totalXpEarned: 0,
    streakDays: 0,
  };
}
