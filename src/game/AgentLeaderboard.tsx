// AgentLeaderboard panel: ranked agents by XP with level, achievements count

import React from 'react';
import { Box, Text } from 'ink';
import type { AgentGameData } from './types.js';
import { ACHIEVEMENTS } from './xpSystem.js';
import { renderPixelGrid } from './PixelCanvas.js';

export interface AgentLeaderboardProps {
  agents: AgentGameData[];
  width: number;
  height: number;
  spinnerFrame: number;
  selectedAgentName?: string;
}

// Medal icons for top 3
const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['yellowBright', 'white', 'yellow', 'gray'];

// Level color tiers
function getLevelColor(level: number): string {
  if (level >= 9) return 'yellowBright';
  if (level >= 7) return 'magentaBright';
  if (level >= 5) return 'cyanBright';
  if (level >= 3) return 'greenBright';
  return 'white';
}

// XP bar (visual, 8 chars)
function xpBar(xp: number, nextXp: number, width: number = 8): string {
  const filled = nextXp > 0 ? Math.round((xp / nextXp) * width) : width;
  return '▰'.repeat(Math.min(filled, width)) + '▱'.repeat(Math.max(0, width - filled));
}

function renderAchievementBadges(agentData: AgentGameData, maxBadges: number): string {
  return agentData.achievements.slice(-maxBadges).map((id) => {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    return ach?.icon ?? '◈';
  }).join('');
}

export default function AgentLeaderboard({
  agents,
  width,
  height,
  spinnerFrame,
  selectedAgentName,
}: AgentLeaderboardProps) {
  // Sort agents by XP descending
  const sorted = [...agents].sort((a, b) => b.xp - a.xp);

  const innerWidth = Math.max(8, width - 4);
  const maxAgents = Math.max(2, height - 5);
  const displayAgents = sorted.slice(0, maxAgents);

  const titleFrame = Math.floor(spinnerFrame / 8) % 2;
  const titleChar = titleFrame === 0 ? '▸' : '▹';

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="double"
      borderColor="magenta"
    >
      {/* Header */}
      <Box justifyContent="center">
        <Text color="magentaBright" bold>
          {titleChar} LEADERBOARD {titleChar}
        </Text>
      </Box>

      <Text color="magenta" dimColor>{'─'.repeat(innerWidth)}</Text>

      {/* Column headers */}
      <Box flexDirection="row">
        <Text color="gray" dimColor>{'#'.padEnd(3)}</Text>
        <Text color="gray" dimColor>{'AGENT'.padEnd(Math.max(6, Math.floor(innerWidth * 0.4)))}</Text>
        <Text color="gray" dimColor>{'LVL'.padEnd(5)}</Text>
        <Text color="gray" dimColor>XP</Text>
      </Box>

      <Text color="magenta" dimColor>{'╌'.repeat(innerWidth)}</Text>

      {/* Agent rows */}
      {displayAgents.length === 0 ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text dimColor>no agents</Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {displayAgents.map((agent, idx) => {
            const medal = MEDALS[idx] ?? `${idx + 1}.`;
            const rankColor = RANK_COLORS[Math.min(idx, 3)] ?? 'gray';
            const nameMaxLen = Math.max(6, Math.floor(innerWidth * 0.4));
            const displayName = agent.agentName.length > nameMaxLen
              ? agent.agentName.slice(0, nameMaxLen - 1) + '…'
              : agent.agentName.padEnd(nameMaxLen);
            const levelColor = getLevelColor(agent.level);
            const isSelected = agent.agentName === selectedAgentName;
            const achBadges = renderAchievementBadges(agent, 3);

            // Calculate next level XP threshold (simplified)
            const nextLevelXp = Math.max(agent.xp, Math.round(agent.xp * 1.5 + 100));
            const bar = xpBar(agent.xp, nextLevelXp, 5);

            return (
              <Box key={agent.agentName} flexDirection="row" gap={0}>
                <Text color={rankColor} bold>{medal}</Text>
                <Text
                  color={isSelected ? 'yellowBright' : 'white'}
                  bold={isSelected}
                >
                  {' '}{displayName}
                </Text>
                <Text color={levelColor} bold>{`L${agent.level}`.padEnd(4)}</Text>
                <Text color="cyan" dimColor>{bar}</Text>
                {achBadges.length > 0 && (
                  <Text dimColor>{achBadges}</Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
