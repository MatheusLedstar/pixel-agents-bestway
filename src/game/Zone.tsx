// Renders a single zone on the game map with atmosphere, furniture, background and agents

import React from 'react';
import { Box, Text } from 'ink';
import type { ZoneId, AgentGameData } from './types.js';
import { ZONE_COLORS, ZONE_DISPLAY_NAMES, ZONE_ICONS } from './types.js';
import type { ActivityState } from '../map/activityMapper.js';
import { generateZoneBackground } from './tiles.js';
import { ZONE_ATMOSPHERE, ZONE_ATMOSPHERE_COLORS } from './tiles.js';
import { renderPixelGrid } from './PixelCanvas.js';
import { ZONE_FURNITURE } from './FurnitureProps.js';
import GameCharacter from './GameCharacter.js';
import type { WalkDirection } from './useAgentWalker.js';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface ZoneAgentInfo {
  name: string;
  type: string;
  state: ActivityState;
  activityLabel?: string;
  gameData: AgentGameData;
  isWalking?: boolean;
  walkDirection?: WalkDirection;
  walkFrame?: number;
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
  showFurniture?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Zone corner decorations
// ──────────────────────────────────────────────────────────────

const ZONE_CORNER_CHARS: Record<ZoneId, string> = {
  planning:  '📋',
  coding:    '💻',
  testing:   '🧪',
  deploying: '🚀',
  comms:     '📡',
  lounge:    '☕',
  library:   '📚',
  workshop:  '🔧',
};

// ──────────────────────────────────────────────────────────────
// Furniture renderer (ASCII art lines)
// ──────────────────────────────────────────────────────────────

function renderFurniture(zoneId: ZoneId, innerWidth: number, spinnerFrame: number): React.ReactNode {
  const furniture = ZONE_FURNITURE[zoneId];
  if (!furniture || furniture.length === 0) return null;

  // Pick one furniture item to show (cycle based on frame to add variety)
  const item = furniture[Math.floor(spinnerFrame / 30) % furniture.length];
  if (!item) return null;

  const padL = Math.max(0, Math.floor((innerWidth - item.width) / 2));

  return (
    <Box flexDirection="column" alignItems="flex-start" marginLeft={padL} marginBottom={0}>
      {item.art.map((line, i) => (
        <Text key={i} color={item.color} dimColor>{line}</Text>
      ))}
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────
// Zone component
// ──────────────────────────────────────────────────────────────

export default function Zone({
  zoneId,
  zoneName,
  agents,
  spinnerFrame,
  width,
  height,
  isSelected = false,
  selectedAgentIndex = -1,
  showFurniture = true,
}: ZoneProps) {
  const color = ZONE_COLORS[zoneId] ?? 'white';
  const atmosphereColor = ZONE_ATMOSPHERE_COLORS[zoneId] ?? 'gray';
  const displayName = zoneName || ZONE_DISPLAY_NAMES[zoneId] || zoneId.toUpperCase();
  const cornerIcon = ZONE_CORNER_CHARS[zoneId] ?? '◈';

  const innerWidth = Math.max(4, width - 2);
  const innerHeight = Math.max(2, height - 3);

  // Determine if we're in compact mode
  const compact = innerWidth < 16 || innerHeight < 12;
  const showAtmosphere = innerHeight >= 6;
  const showBgTiles = innerHeight >= 10 && innerWidth >= 10 && !compact;

  // Atmosphere lines (animated ASCII pattern)
  const atmosphereFn = ZONE_ATMOSPHERE[zoneId];
  const atmosphereLines = (showAtmosphere && atmosphereFn)
    ? atmosphereFn(innerWidth, spinnerFrame)
    : [];

  // Pixel background (only in larger zones)
  const bgLines: string[] = [];
  if (showBgTiles) {
    const bgPixelH = 4;
    const bgPixelW = Math.min(innerWidth, 10);
    const bgGrid = generateZoneBackground(zoneId, bgPixelW, bgPixelH);
    const rendered = renderPixelGrid(bgGrid);
    bgLines.push(...rendered.slice(0, 2));
  }

  // Header text — zone name truncated, with agent count badge
  const countBadge = agents.length > 0 ? ` [${agents.length}]` : '';
  const headerMaxLen = innerWidth - countBadge.length - 3; // 3 for icon + space
  const headerText = displayName.length > headerMaxLen
    ? displayName.slice(0, headerMaxLen - 1) + '…'
    : displayName;

  // Activity pulse for border (when zone has active agents)
  const hasActive = agents.some(a => a.state !== 'idle');
  const borderStyle = isSelected ? 'double' : 'single';
  const borderColor = isSelected
    ? 'white'
    : (hasActive ? color : 'gray');

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle={borderStyle}
      borderColor={borderColor}
    >
      {/* Zone header: name + count + corner icon */}
      <Box justifyContent="space-between" paddingX={0}>
        <Box gap={0}>
          <Text color={color} bold>{headerText}</Text>
          {agents.length > 0 && (
            <Text color="white" dimColor>{countBadge}</Text>
          )}
        </Box>
        <Text dimColor>{cornerIcon}</Text>
      </Box>

      {/* Atmosphere lines */}
      {atmosphereLines.slice(0, 1).map((line, i) => (
        <Text key={`atm-${i}`} color={atmosphereColor} dimColor>
          {line.length > innerWidth ? line.slice(0, innerWidth) : line}
        </Text>
      ))}

      {/* Background tiles */}
      {bgLines.slice(0, 1).map((line, i) => (
        <Text key={`bg-${i}`} dimColor>{line}</Text>
      ))}

      {/* Furniture (if room and not too compact) */}
      {showFurniture && !compact && agents.length === 0 && innerHeight >= 8 && (
        renderFurniture(zoneId, innerWidth, spinnerFrame)
      )}

      {/* Agents or empty state */}
      {agents.length === 0 ? (
        <Box justifyContent="center" flexGrow={1} alignItems="center">
          <Text dimColor>─ vacant ─</Text>
        </Box>
      ) : (
        <Box
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={1}
          flexGrow={1}
          alignItems="flex-start"
          paddingX={0}
        >
          {agents.map((agent, idx) => (
            <GameCharacter
              key={agent.name}
              agentName={agent.name}
              agentType={agent.type}
              activityState={agent.state}
              activityLabel={agent.activityLabel ?? ''}
              gameData={agent.gameData}
              spinnerFrame={spinnerFrame}
              compact={compact}
              isSelected={isSelected && idx === selectedAgentIndex}
              isWalking={agent.isWalking ?? false}
              walkDirection={agent.walkDirection ?? 'right'}
              walkFrame={agent.walkFrame ?? 0}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export { ZONE_COLORS, ZONE_DISPLAY_NAMES };
