// Renders a single zone on the game map with its background and agents

import React from 'react';
import { Box, Text } from 'ink';
import type { ZoneId, AgentGameData } from './types.js';
import type { ActivityState } from '../map/activityMapper.js';
import { generateZoneBackground } from './tiles.js';
import { renderPixelGrid } from './PixelCanvas.js';
import GameCharacter from './GameCharacter.js';

export interface ZoneAgentInfo {
  name: string;
  type: string;
  state: ActivityState;
  gameData: AgentGameData;
}

export interface ZoneProps {
  zoneId: ZoneId;
  zoneName: string;
  agents: ZoneAgentInfo[];
  spinnerFrame: number;
  width: number;
  height: number;
  isSelected?: boolean;
}

const ZONE_COLORS: Record<ZoneId, string> = {
  planning: 'cyanBright',
  coding: 'greenBright',
  testing: 'yellowBright',
  deploying: 'redBright',
  comms: 'magentaBright',
  lounge: 'gray',
  library: 'blueBright',
  workshop: 'yellow',
};

const ZONE_DISPLAY_NAMES: Record<ZoneId, string> = {
  planning: 'PLANNING ROOM',
  coding: 'CODING LAB',
  testing: 'TEST ARENA',
  deploying: 'LAUNCH PAD',
  comms: 'COMMS CENTER',
  lounge: 'LOUNGE',
  library: 'LIBRARY',
  workshop: 'WORKSHOP',
};

export default function Zone({
  zoneId,
  zoneName,
  agents,
  spinnerFrame,
  width,
  height,
  isSelected = false,
}: ZoneProps) {
  const color = ZONE_COLORS[zoneId] ?? 'white';
  const displayName = zoneName || ZONE_DISPLAY_NAMES[zoneId] || zoneId.toUpperCase();

  // Inner dimensions (accounting for border)
  const innerWidth = Math.max(4, width - 2);
  const innerHeight = Math.max(2, height - 3); // border top/bottom + header

  // Generate background tile art
  // Only render background if there's enough room and we have space beyond agents
  const bgPixelHeight = Math.max(2, Math.min(4, innerHeight - 1)) * 2; // pixel rows (half-block doubles)
  const bgPixelWidth = Math.max(4, innerWidth);
  const bgGrid = generateZoneBackground(zoneId, bgPixelWidth, bgPixelHeight);
  const bgLines = renderPixelGrid(bgGrid);

  // Determine if compact mode (not enough space for full sprites)
  const compact = innerWidth < 20 || innerHeight < 8;

  // Truncate header to fit
  const headerText = displayName.length > innerWidth
    ? displayName.slice(0, innerWidth - 1) + '\u2026'
    : displayName;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderColor={isSelected ? 'white' : color}
    >
      {/* Zone header */}
      <Box justifyContent="center">
        <Text color={color} bold>{headerText}</Text>
      </Box>

      {/* Background tile (1-2 lines) */}
      {bgLines.length > 0 && (
        <Box flexDirection="column">
          {bgLines.slice(0, 2).map((line, i) => (
            <Text key={`bg-${i}`}>{line}</Text>
          ))}
        </Box>
      )}

      {/* Agents or empty message */}
      {agents.length === 0 ? (
        <Box justifyContent="center" flexGrow={1}>
          <Text dimColor>empty</Text>
        </Box>
      ) : (
        <Box flexDirection="row" flexWrap="wrap" justifyContent="center" gap={1} flexGrow={1}>
          {agents.map((agent) => (
            <GameCharacter
              key={agent.name}
              agentName={agent.name}
              agentType={agent.type}
              activityState={agent.state}
              gameData={agent.gameData}
              spinnerFrame={spinnerFrame}
              compact={compact}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export { ZONE_COLORS, ZONE_DISPLAY_NAMES };
