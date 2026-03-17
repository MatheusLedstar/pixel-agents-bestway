// Renders a single agent pixel-art character with speech bubble, name, level and title

import React from 'react';
import { Box, Text } from 'ink';
import type { ActivityState } from '../map/activityMapper.js';
import type { AgentGameData } from './types.js';
import { RARITY_COLORS } from './types.js';
import { getSprite } from './sprites.js';
import { renderPixelGrid } from './PixelCanvas.js';
import { getAchievement } from './xpSystem.js';
import SpeechBubble from './SpeechBubble.js';

export interface GameCharacterProps {
  agentName: string;
  agentType: string;
  activityState: ActivityState;
  activityLabel?: string;
  gameData: AgentGameData;
  spinnerFrame: number;
  compact?: boolean;
  isSelected?: boolean;
  isWalking?: boolean;
  walkDirection?: 'left' | 'right';
}

// Level color tiers
function getLevelColor(level: number): string {
  if (level >= 9) return 'yellowBright';
  if (level >= 7) return 'magentaBright';
  if (level >= 5) return 'cyanBright';
  if (level >= 3) return 'greenBright';
  return 'white';
}

// Activity state → sprite state (with walk override)
function getSpriteState(
  activityState: ActivityState,
  isWalking: boolean,
  walkDirection: 'left' | 'right',
): ActivityState | 'walk_left' | 'walk_right' {
  if (isWalking) {
    return walkDirection === 'left' ? 'walk_left' : 'walk_right';
  }
  return activityState;
}

export default function GameCharacter({
  agentName,
  agentType,
  activityState,
  activityLabel = '',
  gameData,
  spinnerFrame,
  compact = false,
  isSelected = false,
  isWalking = false,
  walkDirection = 'right',
}: GameCharacterProps) {
  const frame = spinnerFrame % 2;
  const spriteState = getSpriteState(activityState, isWalking, walkDirection);
  const sprite = getSprite(spriteState, agentType, frame);
  const lines = renderPixelGrid(sprite);

  const maxNameLen = compact ? 8 : 12;
  const displayName = agentName.length > maxNameLen
    ? agentName.slice(0, maxNameLen - 1) + '…'
    : agentName;

  const levelColor = getLevelColor(gameData.level);

  // Show most recent achievement badge icon
  const latestAchievement = gameData.achievements.length > 0
    ? getAchievement(gameData.achievements[gameData.achievements.length - 1]!)
    : undefined;

  if (compact) {
    return (
      <Box flexDirection="column" alignItems="center" width={10}>
        {isSelected && <Text color="white" bold>▼</Text>}
        {!isSelected && <Text dimColor>▵</Text>}
        <Text color="white" bold>{displayName}</Text>
        <Text color={levelColor} bold>Lv{gameData.level}</Text>
        <Text dimColor>{activityState.slice(0, 4)}</Text>
      </Box>
    );
  }

  const charWidth = 14;

  return (
    <Box flexDirection="column" alignItems="center" width={charWidth}>
      {/* Speech bubble */}
      <SpeechBubble
        activityState={activityState}
        label={activityLabel}
        spinnerFrame={spinnerFrame}
        maxWidth={charWidth}
        isSelected={isSelected}
      />

      {/* Sprite */}
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}

      {/* Name + selection indicator */}
      <Box flexDirection="row" alignItems="center" gap={0}>
        {isSelected && <Text color="yellowBright" bold>▶</Text>}
        <Text color={isSelected ? 'yellowBright' : 'white'} bold={isSelected}>
          {displayName}
        </Text>
      </Box>

      {/* Level + title */}
      <Box flexDirection="row" gap={1}>
        <Text color={levelColor} bold>Lv.{gameData.level}</Text>
        <Text dimColor>{gameData.title.slice(0, 8)}</Text>
      </Box>

      {/* Achievement badge icon (if any) */}
      {latestAchievement && (
        <Box>
          <Text color={RARITY_COLORS[latestAchievement.rarity]} bold>
            {latestAchievement.icon}
          </Text>
        </Box>
      )}
    </Box>
  );
}
