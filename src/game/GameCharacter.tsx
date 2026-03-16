// Renders a single agent pixel-art character with name, level and title

import React from 'react';
import { Box, Text } from 'ink';
import type { ActivityState } from '../map/activityMapper.js';
import type { AgentGameData } from './types.js';
import { getSprite } from './sprites.js';
import { renderPixelGrid } from './PixelCanvas.js';

export interface GameCharacterProps {
  agentName: string;
  agentType: string;
  activityState: ActivityState;
  gameData: AgentGameData;
  spinnerFrame: number;
  compact?: boolean;
}

export default function GameCharacter({
  agentName,
  agentType,
  activityState,
  gameData,
  spinnerFrame,
  compact = false,
}: GameCharacterProps) {
  const frame = spinnerFrame % 2;
  const sprite = getSprite(activityState, agentType, frame);
  const lines = renderPixelGrid(sprite);

  // Truncate name to fit
  const maxNameLen = compact ? 6 : 10;
  const displayName = agentName.length > maxNameLen
    ? agentName.slice(0, maxNameLen - 1) + '\u2026'
    : agentName;

  const levelLabel = `Lv.${gameData.level}`;
  const titleLabel = gameData.title;

  if (compact) {
    // Compact mode: just name + level icon, no sprite
    return (
      <Box flexDirection="column" alignItems="center">
        <Text color="white" bold>{displayName}</Text>
        <Text dimColor>{levelLabel}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center">
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      <Text color="white" bold>{displayName}</Text>
      <Text dimColor>{levelLabel} {titleLabel}</Text>
    </Box>
  );
}
