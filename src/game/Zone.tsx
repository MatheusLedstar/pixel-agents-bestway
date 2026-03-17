// Renders a single zone on the game map with atmosphere, background and agents

import React from 'react';
import { Box, Text } from 'ink';
import type { ZoneId, AgentGameData } from './types.js';
import { ZONE_COLORS, ZONE_DISPLAY_NAMES, ZONE_ICONS } from './types.js';
import type { ActivityState } from '../map/activityMapper.js';
import { generateZoneBackground } from './tiles.js';
import { ZONE_ATMOSPHERE, ZONE_ATMOSPHERE_COLORS } from './tiles.js';
import { renderPixelGrid } from './PixelCanvas.js';
import GameCharacter from './GameCharacter.js';

export interface ZoneAgentInfo {
  name: string;
  type: string;
  state: ActivityState;
  activityLabel?: string;
  gameData: AgentGameData;
  isWalking?: boolean;
  walkDirection?: 'left' | 'right';
}

export interface ZoneProps {
  zoneId: ZoneId;
  zoneName: string;
  agents: ZoneAgentInfo[];
  spinnerFrame: number;
  width: number;
  height: number;
  isSelected?: boolean;
  selectedAgentIndex?: number;
}

// Zone-specific corner decorations
const ZONE_CORNERS: Record<ZoneId, string> = {
  planning:  '📋',
  coding:    '💻',
  testing:   '🧪',
  deploying: '🚀',
  comms:     '📡',
  lounge:    '☕',
  library:   '📚',
  workshop:  '🔧',
};

export default function Zone({
  zoneId,
  zoneName,
  agents,
  spinnerFrame,
  width,
  height,
  isSelected = false,
  selectedAgentIndex = -1,
}: ZoneProps) {
  const color = ZONE_COLORS[zoneId] ?? 'white';
  const atmosphereColor = ZONE_ATMOSPHERE_COLORS[zoneId] ?? 'gray';
  const displayName = zoneName || ZONE_DISPLAY_NAMES[zoneId] || zoneId.toUpperCase();
  const icon = ZONE_ICONS[zoneId] ?? '◈';
  const cornerIcon = ZONE_CORNERS[zoneId] ?? '';

  const innerWidth = Math.max(4, width - 2);
  const innerHeight = Math.max(2, height - 3);

  // Generate atmosphere lines (2 lines of animated ASCII)
  const atmosphereFn = ZONE_ATMOSPHERE[zoneId];
  const atmosphereLines = atmosphereFn
    ? atmosphereFn(innerWidth, spinnerFrame)
    : ['', ''];

  // Pixel background (only if we have extra height)
  const showPixelBg = innerHeight >= 10 && innerWidth >= 12;
  const bgPixelHeight = 4;
  const bgPixelWidth = Math.min(innerWidth, 12);
  const bgGrid = showPixelBg ? generateZoneBackground(zoneId, bgPixelWidth, bgPixelHeight) : null;
  const bgLines = bgGrid ? renderPixelGrid(bgGrid) : [];

  // Compact mode when zone is too small
  const compact = innerWidth < 18 || innerHeight < 14;

  // Truncate header to fit (leave room for icon + agent count)
  const countBadge = agents.length > 0 ? ` [${agents.length}]` : '';
  const headerMaxLen = innerWidth - countBadge.length - 2;
  const headerText = displayName.length > headerMaxLen
    ? displayName.slice(0, headerMaxLen - 1) + '…'
    : displayName;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle={isSelected ? 'double' : 'single'}
      borderColor={isSelected ? 'white' : color}
    >
      {/* Zone header with name + agent count */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text color={color} bold>{headerText}</Text>
          {agents.length > 0 && (
            <Text color="white" dimColor>{countBadge}</Text>
          )}
        </Box>
        <Text dimColor>{cornerIcon || icon}</Text>
      </Box>

      {/* Atmosphere / background pattern */}
      <Box flexDirection="column">
        {atmosphereLines.slice(0, 2).map((line, i) => (
          <Text key={`atm-${i}`} color={atmosphereColor} dimColor>
            {line.length > innerWidth ? line.slice(0, innerWidth) : line}
          </Text>
        ))}
      </Box>

      {/* Pixel background tile (if room) */}
      {showPixelBg && bgLines.slice(0, 2).map((line, i) => (
        <Text key={`bg-${i}`} dimColor>{line}</Text>
      ))}

      {/* Agents or empty state */}
      {agents.length === 0 ? (
        <Box justifyContent="center" flexGrow={1} alignItems="center">
          <Text dimColor>─ empty ─</Text>
        </Box>
      ) : (
        <Box
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={1}
          flexGrow={1}
          alignItems="flex-start"
        >
          {agents.map((agent, idx) => (
            <GameCharacter
              key={agent.name}
              agentName={agent.name}
              agentType={agent.type}
              activityState={agent.state}
              activityLabel={agent.activityLabel}
              gameData={agent.gameData}
              spinnerFrame={spinnerFrame}
              compact={compact}
              isSelected={isSelected && idx === selectedAgentIndex}
              isWalking={agent.isWalking}
              walkDirection={agent.walkDirection}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export { ZONE_COLORS, ZONE_DISPLAY_NAMES };
