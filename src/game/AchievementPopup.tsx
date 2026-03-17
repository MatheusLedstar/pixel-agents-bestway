/**
 * AchievementPopup — Animated achievement unlock notification.
 *
 * Displays as a centered banner that:
 *  - Fades in (shows after 1 frame delay)
 *  - Shows achievement icon, name, description, XP reward
 *  - Renders the 4x4 pixel art badge (scaled 3x)
 *  - Animates borders with glitch-style characters
 *  - Auto-dismisses after ~3 seconds (caller controls visibility)
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Achievement } from './types.js';
import { RARITY_COLORS } from './types.js';
import { renderPixelGrid } from './PixelCanvas.js';

// ──────────────────────────────────────────────────────────────
// Scale the 4x4 badge to 3x (12 pixels wide → 12 cols × 6 rows terminal)
// ──────────────────────────────────────────────────────────────

type PixelGrid = (string | null)[][];

function scaleGrid(grid: PixelGrid, scale: number): PixelGrid {
  const result: PixelGrid = [];
  for (const row of grid) {
    // Scale vertically (repeat each row `scale` times)
    for (let ry = 0; ry < scale; ry++) {
      const scaledRow: (string | null)[] = [];
      for (const pixel of row) {
        // Scale horizontally
        for (let rx = 0; rx < scale; rx++) {
          scaledRow.push(pixel);
        }
      }
      result.push(scaledRow);
    }
  }
  return result;
}

// ──────────────────────────────────────────────────────────────
// Animated rarity border characters
// ──────────────────────────────────────────────────────────────

const RARITY_BORDER_CYCLES: Record<Achievement['rarity'], string[]> = {
  common:    ['─', '─', '─', '─'],
  rare:      ['═', '─', '═', '─'],
  epic:      ['═', '╌', '═', '╌'],
  legendary: ['▓', '▒', '░', '▒'],
};

// ──────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────

export interface AchievementPopupProps {
  achievement: Achievement;
  agentName: string;
  spinnerFrame: number;
  termWidth: number;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function AchievementPopup({
  achievement,
  agentName,
  spinnerFrame,
  termWidth,
}: AchievementPopupProps) {
  const rarityColor = RARITY_COLORS[achievement.rarity];
  const borderCycle = RARITY_BORDER_CYCLES[achievement.rarity];
  const borderChar = borderCycle[Math.floor(spinnerFrame / 3) % 4] ?? '═';

  // Scaled badge (3x)
  const scaledBadge = scaleGrid(achievement.badge, 3);
  const badgeLines = renderPixelGrid(scaledBadge);

  // Panel width
  const panelW = Math.min(termWidth - 8, 52);
  const marginL = Math.floor((termWidth - panelW - 4) / 2);

  // Animated title
  const titleAnim = Math.floor(spinnerFrame / 4) % 2 === 0
    ? `★ ACHIEVEMENT UNLOCKED ★`
    : `☆ ACHIEVEMENT UNLOCKED ☆`;

  const xpText = achievement.xpReward > 0 ? `+${achievement.xpReward} XP` : '';

  return (
    <Box
      flexDirection="column"
      width={panelW + 4}
      marginLeft={marginL}
      marginTop={1}
    >
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={rarityColor}
        width={panelW}
        paddingX={1}
        paddingY={0}
      >
        {/* Animated header */}
        <Box justifyContent="center">
          <Text color={rarityColor} bold>{titleAnim}</Text>
        </Box>

        {/* Animated separator */}
        <Text color={rarityColor} dimColor>
          {borderChar.repeat(panelW - 2)}
        </Text>

        {/* Content: badge + info */}
        <Box flexDirection="row" gap={2} alignItems="flex-start">

          {/* Badge column */}
          <Box flexDirection="column" alignItems="center" width={16}>
            {badgeLines.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            <Text color={rarityColor} bold>{achievement.rarity.toUpperCase()}</Text>
          </Box>

          {/* Info column */}
          <Box flexDirection="column" flexGrow={1} gap={0}>
            {/* Achievement icon + name */}
            <Box flexDirection="row" gap={1}>
              <Text color={rarityColor} bold>{achievement.icon}</Text>
              <Text color="white" bold>{achievement.name}</Text>
            </Box>

            {/* Description */}
            <Text color="white" dimColor>{achievement.description}</Text>

            {/* Agent + XP */}
            <Box flexDirection="row" gap={1} marginTop={1}>
              <Text color="cyan">{agentName}</Text>
              <Text dimColor>earned</Text>
              {xpText && <Text color="yellowBright" bold>{xpText}</Text>}
            </Box>
          </Box>
        </Box>

        {/* Bottom border animation */}
        <Text color={rarityColor} dimColor>
          {borderChar.repeat(panelW - 2)}
        </Text>
      </Box>
    </Box>
  );
}
