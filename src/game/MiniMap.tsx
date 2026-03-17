/**
 * MiniMap — 8-zone bird's-eye overview with agent dots.
 *
 * Shows all 8 zones as small color-coded rectangles arranged in the
 * same 4×2 grid as the main map. Active agents shown as colored dots.
 * Currently selected zone has a blinking border.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ZoneId } from './types.js';
import { ZONE_COLORS, ZONE_DISPLAY_NAMES } from './types.js';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface MiniMapZoneData {
  zoneId: ZoneId;
  agentCount: number;
  agentNames: string[];
  isActive: boolean;    // has agents doing something
}

export interface MiniMapProps {
  zones: MiniMapZoneData[];
  selectedZoneId?: ZoneId;
  spinnerFrame: number;
  width?: number;       // total width of minimap panel
}

// ──────────────────────────────────────────────────────────────
// Zone grid layout (must match GameMapView order)
// ──────────────────────────────────────────────────────────────

const TOP_ROW: ZoneId[]    = ['planning', 'coding', 'testing', 'deploying'];
const BOTTOM_ROW: ZoneId[] = ['comms',    'lounge', 'library', 'workshop'];

// Short zone labels for minimap (4 chars max)
const ZONE_SHORT: Record<ZoneId, string> = {
  planning:  'PLAN',
  coding:    'CODE',
  testing:   'TEST',
  deploying: 'DPLY',
  comms:     'COMM',
  lounge:    'LNGE',
  library:   'LIBR',
  workshop:  'SHOP',
};

// Agent dot colors (deterministic by index)
const DOT_COLORS = ['cyanBright', 'greenBright', 'magentaBright', 'yellowBright', 'redBright', 'blueBright', 'white'];

// ──────────────────────────────────────────────────────────────
// Single zone cell in minimap
// ──────────────────────────────────────────────────────────────

interface MiniZoneCellProps {
  data: MiniMapZoneData;
  isSelected: boolean;
  spinnerFrame: number;
  cellWidth: number;
}

function MiniZoneCell({ data, isSelected, spinnerFrame, cellWidth }: MiniZoneCellProps) {
  const color = ZONE_COLORS[data.zoneId] ?? 'white';
  const label = ZONE_SHORT[data.zoneId] ?? data.zoneId.slice(0, 4).toUpperCase();

  // Blink border when selected
  const blink = isSelected && Math.floor(spinnerFrame / 3) % 2 === 0;
  const borderStyle = isSelected ? 'double' : 'single';
  const borderColor = isSelected ? (blink ? 'white' : 'yellowBright') : color;

  // Agent dots
  const dots = data.agentNames.map((name, i) => {
    const dotColor = DOT_COLORS[i % DOT_COLORS.length] ?? 'white';
    const initial = name[0]?.toUpperCase() ?? '?';
    return { initial, color: dotColor };
  });

  const innerWidth = Math.max(4, cellWidth - 2);

  return (
    <Box
      flexDirection="column"
      width={cellWidth}
      borderStyle={borderStyle}
      borderColor={borderColor}
    >
      {/* Zone label */}
      <Box justifyContent="center">
        <Text color={color} bold dimColor={!data.isActive}>
          {label.slice(0, innerWidth)}
        </Text>
      </Box>

      {/* Agent dots */}
      <Box justifyContent="center" height={1}>
        {dots.length === 0 ? (
          <Text dimColor>·</Text>
        ) : (
          dots.slice(0, innerWidth).map((dot, i) => (
            <Text key={i} color={dot.color} bold>{dot.initial}</Text>
          ))
        )}
      </Box>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────
// Main MiniMap component
// ──────────────────────────────────────────────────────────────

export default function MiniMap({
  zones,
  selectedZoneId,
  spinnerFrame,
  width = 30,
}: MiniMapProps) {
  const zoneMap = new Map<ZoneId, MiniMapZoneData>(
    zones.map(z => [z.zoneId, z])
  );

  const cellWidth = Math.max(6, Math.floor((width - 2) / 4));

  const renderRow = (row: ZoneId[]) => (
    <Box flexDirection="row">
      {row.map(zoneId => {
        const data = zoneMap.get(zoneId) ?? {
          zoneId,
          agentCount: 0,
          agentNames: [],
          isActive: false,
        };
        return (
          <MiniZoneCell
            key={zoneId}
            data={data}
            isSelected={zoneId === selectedZoneId}
            spinnerFrame={spinnerFrame}
            cellWidth={cellWidth}
          />
        );
      })}
    </Box>
  );

  // Count totals
  const totalAgents = zones.reduce((s, z) => s + z.agentCount, 0);
  const activeZones = zones.filter(z => z.isActive).length;

  return (
    <Box flexDirection="column" width={width} borderStyle="single" borderColor="gray">
      {/* Header */}
      <Box justifyContent="center" paddingX={1}>
        <Text color="cyanBright" bold>MAP OVERVIEW</Text>
        <Text dimColor> {totalAgents}A {activeZones}/8Z</Text>
      </Box>

      {/* Zone grid */}
      {renderRow(TOP_ROW)}
      {renderRow(BOTTOM_ROW)}

      {/* Legend */}
      <Box paddingX={1}>
        <Text dimColor>
          {selectedZoneId ? `▶ ${ZONE_DISPLAY_NAMES[selectedZoneId] ?? selectedZoneId}` : 'Navigate: ←→↑↓'}
        </Text>
      </Box>
    </Box>
  );
}
