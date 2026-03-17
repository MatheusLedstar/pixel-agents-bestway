// Enhanced stats bar for the game map — shows XP progress, level, achievements, agent stats

import React from 'react';
import { Box, Text } from 'ink';
import type { GameState } from './types.js';
import { RARITY_COLORS } from './types.js';
import { calculateLevel, ACHIEVEMENTS, getAchievement } from './xpSystem.js';
import { renderPixelGrid } from './PixelCanvas.js';

export interface StatsBarProps {
  gameState: GameState;
  teamName: string;
  spinnerFrame: number;
  totalTasks?: number;
  completedTasks?: number;
}

// XP progress bar with shimmer effect
function shimmerXpBar(progress: number, width: number, frame: number): string {
  const filled = Math.round(progress * width);
  const shimmerPos = frame % (width + 4);
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i < filled) {
      if (i === shimmerPos || i === shimmerPos - 1) {
        bar += '◈'; // shimmer highlight
      } else {
        bar += '▰';
      }
    } else {
      bar += '▱';
    }
  }
  return bar;
}

export default function StatsBar({
  gameState,
  teamName,
  spinnerFrame,
  totalTasks = 0,
  completedTasks = 0,
}: StatsBarProps) {
  const levelInfo = calculateLevel(gameState.totalXp);

  // XP progress bar
  const xpBarWidth = 12;
  const xpBar = shimmerXpBar(levelInfo.progress, xpBarWidth, Math.floor(spinnerFrame / 3));

  // Collect all unlocked achievements across all agents
  const allUnlocked = new Set<string>();
  for (const agent of gameState.agents.values()) {
    for (const ach of agent.achievements) {
      allUnlocked.add(ach);
    }
  }
  const unlockedCount = allUnlocked.size;
  const totalAchievements = ACHIEVEMENTS.length;

  // Show up to 6 achievement icons in order of rarity
  const sortedAchievements = ACHIEVEMENTS
    .filter((a) => allUnlocked.has(a.id))
    .sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  const displayAchievements = sortedAchievements.slice(0, 6);

  // Team stats
  const totalAgents = gameState.agents.size;
  const activeAgents = Array.from(gameState.agents.values()).filter(
    (a) => a.tasksDone > 0 || a.messagesSent > 0
  ).length;

  // Top agent by XP
  let topAgent: { name: string; xp: number; level: number } | null = null;
  for (const [name, data] of gameState.agents) {
    if (!topAgent || data.xp > topAgent.xp) {
      topAgent = { name, xp: data.xp, level: data.level };
    }
  }

  // Level color
  function levelColor(level: number): string {
    if (level >= 9) return 'yellowBright';
    if (level >= 7) return 'magentaBright';
    if (level >= 5) return 'cyanBright';
    if (level >= 3) return 'greenBright';
    return 'white';
  }

  const teamDisplayName = teamName.length > 14
    ? teamName.slice(0, 13) + '…'
    : teamName;

  // Animated separator
  const sep = spinnerFrame % 4 === 0 ? '◈' : '│';

  return (
    <Box borderStyle="double" borderColor="cyan" paddingX={1}>
      {/* Team identity */}
      <Text color="cyan" bold>TEAM </Text>
      <Text color="white" bold>{teamDisplayName}</Text>

      <Text dimColor> {sep} </Text>

      {/* XP bar */}
      <Text color="cyan" bold>XP </Text>
      <Text color="yellowBright">{xpBar}</Text>
      <Text dimColor> {gameState.totalXp}</Text>

      <Text dimColor> {sep} </Text>

      {/* Level + title */}
      <Text color="cyan" bold>LVL </Text>
      <Text color={levelColor(levelInfo.level)} bold>{levelInfo.level}</Text>
      <Text color="white"> {levelInfo.title}</Text>

      <Text dimColor> {sep} </Text>

      {/* Task progress */}
      {totalTasks > 0 && (
        <>
          <Text color="cyan" bold>TASKS </Text>
          <Text color="greenBright">{completedTasks}</Text>
          <Text dimColor>/{totalTasks}</Text>
          <Text dimColor> {sep} </Text>
        </>
      )}

      {/* Achievements */}
      <Text color="cyan" bold>ACH </Text>
      <Text color="yellowBright">{unlockedCount}</Text>
      <Text dimColor>/{totalAchievements}</Text>

      {displayAchievements.length > 0 && (
        <>
          <Text dimColor> </Text>
          {displayAchievements.map((ach) => (
            <Text key={ach.id} color={RARITY_COLORS[ach.rarity]}>
              {ach.icon}
            </Text>
          ))}
        </>
      )}

      {topAgent && (
        <>
          <Text dimColor> {sep} </Text>
          <Text color="cyan" bold>MVP </Text>
          <Text color={levelColor(topAgent.level)}>
            {topAgent.name.length > 10 ? topAgent.name.slice(0, 9) + '…' : topAgent.name}
          </Text>
          <Text dimColor> Lv{topAgent.level}</Text>
        </>
      )}
    </Box>
  );
}
