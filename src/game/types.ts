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
}

export interface GameState {
  teamName: string;
  agents: Map<string, AgentGameData>;
  totalXp: number;
  teamLevel: number;
  teamAchievements: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (data: AgentGameData) => boolean;
  badge: PixelGrid; // 4x4 pixel art badge
}

export const XP_TABLE = {
  task_started: 10,
  task_completed: 50,
  message_sent: 5,
  file_written: 3,
  file_read: 2,
  test_executed: 20,
  deploy_completed: 30,
} as const;

export const LEVELS = [
  { level: 1, xp: 0, title: 'Recruit' },
  { level: 2, xp: 100, title: 'Developer' },
  { level: 3, xp: 300, title: 'Senior Dev' },
  { level: 4, xp: 600, title: 'Tech Lead' },
  { level: 5, xp: 1000, title: 'Architect' },
  { level: 6, xp: 1500, title: 'CTO' },
  { level: 7, xp: 2500, title: 'Legend' },
] as const;
