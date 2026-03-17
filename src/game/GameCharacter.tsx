// Renders a single agent pixel-art character with speech bubble, name, level and achievements

import React from 'react';
import { Box, Text } from 'ink';
import type { ActivityState } from '../map/activityMapper.js';
import type { AgentGameData } from './types.js';
import { RARITY_COLORS } from './types.js';
import type { SpriteState } from './sprites.js';
import { getSprite } from './sprites.js';
import { renderPixelGrid } from './PixelCanvas.js';
import { getAchievement } from './xpSystem.js';
import SpeechBubble from './SpeechBubble.js';
import type { WalkDirection } from './useAgentWalker.js';

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
  walkDirection?: WalkDirection;
  walkFrame?: number;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function getLevelColor(level: number): string {
  if (level >= 9) return 'yellowBright';
  if (level >= 7) return 'magentaBright';
  if (level >= 5) return 'cyanBright';
  if (level >= 3) return 'greenBright';
  return 'white';
}

function getSpriteState(
  activityState: ActivityState,
  isWalking: boolean,
  walkDirection: WalkDirection,
): SpriteState {
  if (isWalking) {
    switch (walkDirection) {
      case 'left':  return 'walk_left';
      case 'right': return 'walk_right';
      case 'up':    return 'walk_up';
      case 'down':  return 'walk_down';
    }
  }
  // Use sitting sprite for idle (at desk)
  if (activityState === 'idle') return 'sitting';
  // Use phone sprite for messaging
  if (activityState === 'messaging') return 'phone';
  return activityState;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

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
  walkFrame = 0,
}: GameCharacterProps) {
  // Cycle through 4 sprite frames for walking, 2 for activity
  const frame = isWalking ? (walkFrame % 4) : (spinnerFrame % 2);
  const spriteState = getSpriteState(activityState, isWalking, walkDirection);
  const sprite = getSprite(spriteState, agentType, frame);
  const lines = renderPixelGrid(sprite);

  const maxNameLen = compact ? 8 : 12;
  const displayName = agentName.length > maxNameLen
    ? agentName.slice(0, maxNameLen - 1) + '…'
    : agentName;

  const levelColor = getLevelColor(gameData.level);

  // Show rarest achievement icon
  const latestAchievement = gameData.achievements.length > 0
    ? getAchievement(gameData.achievements[gameData.achievements.length - 1]!)
    : undefined;

  // Compact mode: just name + level
  if (compact) {
    return (
      <Box flexDirection="column" alignItems="center" width={10}>
        {isSelected
          ? <Text color="yellowBright" bold>▼</Text>
          : <Text dimColor>▵</Text>
        }
        <Text color={isSelected ? 'yellowBright' : 'white'} bold={isSelected}>
          {displayName}
        </Text>
        <Text color={levelColor}>L{gameData.level}</Text>
        <Text dimColor>
          {isWalking ? '→' : activityState.slice(0, 4)}
        </Text>
      </Box>
    );
  }

  const charWidth = 16;

  return (
    <Box flexDirection="column" alignItems="center" width={charWidth}>
      {/* Speech bubble (hidden during walking) */}
      {!isWalking && (
        <SpeechBubble
          activityState={activityState}
          label={activityLabel}
          spinnerFrame={spinnerFrame}
          maxWidth={charWidth}
          isSelected={isSelected}
        />
      )}

      {/* Walking indicator */}
      {isWalking && (
        <Box justifyContent="center" width={charWidth}>
          <Text color="cyan" dimColor>
            {walkDirection === 'left'  ? '◀ moving ◀' :
             walkDirection === 'right' ? '▶ moving ▶' :
             walkDirection === 'up'    ? '▲ moving ▲' :
                                         '▼ moving ▼'}
          </Text>
        </Box>
      )}

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

      {/* Achievement + XP badges */}
      <Box flexDirection="row" gap={0}>
        {latestAchievement && (
          <Text color={RARITY_COLORS[latestAchievement.rarity]} bold>
            {latestAchievement.icon}
          </Text>
        )}
        {gameData.achievements.length > 1 && (
          <Text dimColor>+{gameData.achievements.length - 1}</Text>
        )}
      </Box>
    </Box>
  );
}
