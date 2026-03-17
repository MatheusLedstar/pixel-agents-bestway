// Game types for the RPG gamification layer

import type { PixelGrid } from './PixelCanvas.js';

export type ZoneId =
  | 'planning'
  | 'coding'
  | 'testing'
  | 'deploying'
  | 'comms'
  | 'lounge'
  | 'library'
  | 'workshop';

export interface AgentPosition {
  zoneId: ZoneId;
  col: number; // column within zone (0-based)
  row: number; // row within zone (0-based)
}

export interface AgentMovement {
  fromZone: ZoneId;
  toZone: ZoneId;
  startFrame: number; // spinnerFrame when movement began
  walkFrame: number;  // 0-3, cycling through walk animation
}

export interface AgentGameData {
  agentName: string;
  xp: number;
  level: number;
  title: string;
  currentZone: ZoneId;
  achievements: string[];
  tasksDone: number;
  messagesSent: number;
  filesRead: number;
  filesWritten: number;
  deploysCompleted: number;
  testsRun: number;
  totalXpEarned: number;
  streakDays: number;
}

export interface GameState {
  teamName: string;
  agents: Map<string, AgentGameData>;
  totalXp: number;
  teamLevel: number;
  teamAchievements: string[];
  events: GameEvent[];
}

export type GameEventType =
  | 'zone_change'
  | 'level_up'
  | 'achievement'
  | 'task_complete'
  | 'xp_gain'
  | 'deploy'
  | 'test_pass'
  | 'streak';

export interface GameEvent {
  id: string;
  timestamp: number;
  type: GameEventType;
  agentName: string;
  message: string;
  color: string;
  icon: string;
  xpGained?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (data: AgentGameData) => boolean;
  badge: PixelGrid; // 4x4 pixel art badge
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export const XP_TABLE = {
  task_started: 10,
  task_completed: 50,
  message_sent: 5,
  file_written: 3,
  file_read: 2,
  test_executed: 20,
  deploy_completed: 30,
  debug_session: 15,
  search_completed: 8,
} as const;

export const LEVELS = [
  { level: 1, xp: 0,    title: 'Recruit',      icon: '⬡' },
  { level: 2, xp: 100,  title: 'Developer',    icon: '⬡' },
  { level: 3, xp: 300,  title: 'Senior Dev',   icon: '◈' },
  { level: 4, xp: 600,  title: 'Tech Lead',    icon: '◈' },
  { level: 5, xp: 1000, title: 'Architect',    icon: '✦' },
  { level: 6, xp: 1500, title: 'Principal',    icon: '✦' },
  { level: 7, xp: 2000, title: 'Distinguished',icon: '★' },
  { level: 8, xp: 3000, title: 'Fellow',       icon: '★' },
  { level: 9, xp: 5000, title: 'Legend',       icon: '⬟' },
] as const;

export const ZONE_ICONS: Record<ZoneId, string> = {
  planning:  '📋',
  coding:    '💻',
  testing:   '🧪',
  deploying: '🚀',
  comms:     '📡',
  lounge:    '☕',
  library:   '📚',
  workshop:  '🔧',
};

export const ZONE_COLORS: Record<ZoneId, string> = {
  planning:  'cyanBright',
  coding:    'greenBright',
  testing:   'yellowBright',
  deploying: 'redBright',
  comms:     'magentaBright',
  lounge:    'gray',
  library:   'blueBright',
  workshop:  'yellow',
};

export const ZONE_DISPLAY_NAMES: Record<ZoneId, string> = {
  planning:  'PLANNING ROOM',
  coding:    'CODING LAB',
  testing:   'TEST ARENA',
  deploying: 'LAUNCH PAD',
  comms:     'COMMS CENTER',
  lounge:    'LOUNGE',
  library:   'LIBRARY',
  workshop:  'WORKSHOP',
};

export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common:    'white',
  rare:      'cyanBright',
  epic:      'magentaBright',
  legendary: 'yellowBright',
};
