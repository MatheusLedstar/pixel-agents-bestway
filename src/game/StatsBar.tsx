// Stats bar for the game map footer — shows team XP, level, achievements, tasks

import React from 'react';
import { Box, Text } from 'ink';
import type { GameState } from './types.js';
import { calculateLevel, ACHIEVEMENTS } from './xpSystem.js';

export interface StatsBarProps {
  gameState: GameState;
  teamName: string;
  spinnerFrame: number;
}

export default function StatsBar({ gameState, teamName }: StatsBarProps) {
  const levelInfo = calculateLevel(gameState.totalXp);

  // XP progress bar: 10 chars
  const filled = Math.round(levelInfo.progress * 10);
  const empty = 10 - filled;
  const xpBar = '\u25B0'.repeat(filled) + '\u25B1'.repeat(empty);

  // Achievements count
  const totalAchievements = ACHIEVEMENTS.length;
  let unlockedCount = 0;
  for (const agent of gameState.agents.values()) {
    // Count unique achievements across the team
    for (const ach of agent.achievements) {
      // Simple approach: count unique per team
      if (!gameState.teamAchievements.includes(ach)) {
        // Count from agent data directly
      }
      unlockedCount = Math.max(unlockedCount, agent.achievements.length);
    }
  }
  // Use team-wide unique count
  const allAchievementIds = new Set<string>();
  for (const agent of gameState.agents.values()) {
    for (const ach of agent.achievements) {
      allAchievementIds.add(ach);
    }
  }
  unlockedCount = allAchievementIds.size;

  // Total tasks completed
  let totalTasksDone = 0;
  let totalTasks = 0;
  for (const agent of gameState.agents.values()) {
    totalTasksDone += agent.tasksDone;
    totalTasks += agent.tasksDone; // We only track done in game data
  }

  // Display name truncated
  const displayTeam = teamName.length > 16
    ? teamName.slice(0, 15) + '\u2026'
    : teamName;

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} gap={1}>
      <Text color="cyan" bold>TEAM:</Text>
      <Text color="white">{displayTeam}</Text>
      <Text dimColor>{'\u2502'}</Text>
      <Text color="cyan" bold>XP:</Text>
      <Text color="yellowBright">{xpBar}</Text>
      <Text dimColor>{gameState.totalXp}/{levelInfo.nextLevelXp}</Text>
      <Text dimColor>{'\u2502'}</Text>
      <Text color="cyan" bold>LVL:</Text>
      <Text color="greenBright">{levelInfo.level}</Text>
      <Text color="white">{levelInfo.title}</Text>
      <Text dimColor>{'\u2502'}</Text>
      <Text color="yellowBright">{unlockedCount}/{totalAchievements}</Text>
      <Text dimColor>{'\u2502'}</Text>
      <Text color="cyan" bold>TASKS:</Text>
      <Text color="white">{totalTasksDone}</Text>
    </Box>
  );
}
