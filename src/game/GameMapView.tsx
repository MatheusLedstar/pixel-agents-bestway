// Main Game Map view — 2D zone-based map showing agents as pixel art characters

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Team, Task, Message, TeamSessionData } from '../core/types.js';
import type { TerminalSize } from '../hooks/useTerminalSize.js';
import type { ZoneId, AgentGameData } from './types.js';
import { useGameState } from '../hooks/useGameState.js';
import { mapActivity } from '../map/activityMapper.js';
import { mapActivityToZone } from './zoneMapper.js';
import { createAgentGameData } from './xpSystem.js';
import Zone from './Zone.js';
import type { ZoneAgentInfo } from './Zone.js';
import StatsBar from './StatsBar.js';

export interface GameMapViewProps {
  team: Team;
  tasks: Task[];
  messages: Message[];
  session?: TeamSessionData;
  spinnerFrame: number;
  termSize: TerminalSize;
}

const ZONE_ORDER_TOP: ZoneId[] = ['planning', 'coding', 'testing', 'deploying'];
const ZONE_ORDER_BOTTOM: ZoneId[] = ['comms', 'lounge', 'library', 'workshop'];

const ZONE_NAMES: Record<ZoneId, string> = {
  planning: 'PLANNING ROOM',
  coding: 'CODING LAB',
  testing: 'TEST ARENA',
  deploying: 'LAUNCH PAD',
  comms: 'COMMS CENTER',
  lounge: 'LOUNGE',
  library: 'LIBRARY',
  workshop: 'WORKSHOP',
};

export default function GameMapView({
  team,
  tasks,
  messages,
  session,
  spinnerFrame,
  termSize,
}: GameMapViewProps) {
  // Count completed tasks and messages for useGameState
  const completedTaskCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  );

  const { gameState } = useGameState(team.name, completedTaskCount, messages.length);

  // Build agent zone mapping
  const zoneAgents = useMemo(() => {
    const map = new Map<ZoneId, ZoneAgentInfo[]>();

    // Initialize all zones
    for (const zoneId of [...ZONE_ORDER_TOP, ...ZONE_ORDER_BOTTOM]) {
      map.set(zoneId, []);
    }

    for (const member of team.members) {
      // Get activity from session data
      const agentActivity = session?.agentActivity.get(member.name);
      const activityVisual = mapActivity(agentActivity);
      const activityState = activityVisual.state;

      // Determine zone from activity
      const zoneId = mapActivityToZone(activityState);

      // Get or create game data for this agent
      const agentGameData: AgentGameData =
        gameState?.agents.get(member.name) ?? createAgentGameData(member.name);

      const agentInfo: ZoneAgentInfo = {
        name: member.name,
        type: member.agentType || 'default',
        state: activityState,
        gameData: { ...agentGameData, currentZone: zoneId },
      };

      const existing = map.get(zoneId);
      if (existing) {
        existing.push(agentInfo);
      }
    }

    return map;
  }, [team.members, session, gameState]);

  // Calculate zone dimensions
  const narrowLayout = termSize.cols < 80;
  const zonesPerRow = narrowLayout ? 2 : 4;
  const zoneWidth = Math.max(12, Math.floor((termSize.cols - 4) / zonesPerRow));
  const zoneHeight = Math.max(8, Math.floor((termSize.rows - 10) / 2));

  // Render zone rows
  const renderZoneRow = (zones: ZoneId[]) => {
    if (narrowLayout) {
      // 2 zones per row, so split into chunks of 2
      const rows: ZoneId[][] = [];
      for (let i = 0; i < zones.length; i += 2) {
        rows.push(zones.slice(i, i + 2));
      }
      return (
        <Box flexDirection="column">
          {rows.map((row, rowIdx) => (
            <Box key={rowIdx} flexDirection="row">
              {row.map((zoneId) => (
                <Zone
                  key={zoneId}
                  zoneId={zoneId}
                  zoneName={ZONE_NAMES[zoneId]}
                  agents={zoneAgents.get(zoneId) ?? []}
                  spinnerFrame={spinnerFrame}
                  width={zoneWidth}
                  height={zoneHeight}
                />
              ))}
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Box flexDirection="row">
        {zones.map((zoneId) => (
          <Zone
            key={zoneId}
            zoneId={zoneId}
            zoneName={ZONE_NAMES[zoneId]}
            agents={zoneAgents.get(zoneId) ?? []}
            spinnerFrame={spinnerFrame}
            width={zoneWidth}
            height={zoneHeight}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {/* Map title */}
      <Box justifyContent="center" marginBottom={0}>
        <Text color="yellowBright" bold>
          {'\u2550\u2550\u2550'} GAME MAP: {team.name} {'\u2550\u2550\u2550'}
        </Text>
      </Box>

      {/* Top zone row */}
      {renderZoneRow(ZONE_ORDER_TOP)}

      {/* Bottom zone row */}
      {renderZoneRow(ZONE_ORDER_BOTTOM)}

      {/* Stats bar */}
      {gameState && (
        <StatsBar
          gameState={gameState}
          teamName={team.name}
          spinnerFrame={spinnerFrame}
        />
      )}
    </Box>
  );
}
