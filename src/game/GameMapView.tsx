// Main Game Map view — pixel-art office with zones, agents, event log, and leaderboard

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Team, Task, Message, TeamSessionData } from '../core/types.js';
import type { TerminalSize } from '../hooks/useTerminalSize.js';
import type { ZoneId, AgentGameData, GameEvent } from './types.js';
import { ZONE_DISPLAY_NAMES, ZONE_ICONS } from './types.js';
import { useGameState } from '../hooks/useGameState.js';
import { mapActivity } from '../map/activityMapper.js';
import { mapActivityToZone } from './zoneMapper.js';
import { createAgentGameData, calculateLevel } from './xpSystem.js';
import Zone from './Zone.js';
import type { ZoneAgentInfo } from './Zone.js';
import StatsBar from './StatsBar.js';
import EventLog from './EventLog.js';
import AgentLeaderboard from './AgentLeaderboard.js';

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
const ALL_ZONES: ZoneId[] = [...ZONE_ORDER_TOP, ...ZONE_ORDER_BOTTOM];

// Generate a unique event ID
let eventCounter = 0;
function makeEventId(): string {
  return `evt_${Date.now()}_${eventCounter++}`;
}

// ──────────────────────────────────────────────────────────────
// Animated title banner
// ──────────────────────────────────────────────────────────────

function renderTitleBanner(teamName: string, spinnerFrame: number, width: number): string {
  const BORDER_CHARS = ['═', '╌', '─', '╌'];
  const borderChar = BORDER_CHARS[Math.floor(spinnerFrame / 8) % 4] ?? '═';

  const leftDeco  = `╔${borderChar.repeat(3)} PIXEL AGENTS OFFICE `;
  const rightDeco = ` ${borderChar.repeat(3)}╗`;
  const teamLabel = `⬡ ${teamName.toUpperCase()} ⬡`;
  const mid = teamLabel;

  const totalFixed = leftDeco.length + rightDeco.length + mid.length;
  const remaining = Math.max(0, width - totalFixed);
  const padL = Math.floor(remaining / 2);
  const padR = remaining - padL;

  return leftDeco + borderChar.repeat(padL) + mid + borderChar.repeat(padR) + rightDeco;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function GameMapView({
  team,
  tasks,
  messages,
  session,
  spinnerFrame,
  termSize,
}: GameMapViewProps) {
  const completedTaskCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  );

  const { gameState } = useGameState(team.name, completedTaskCount, messages.length);

  // Local event log (zone changes, level-ups, etc.)
  const [localEvents, setLocalEvents] = useState<GameEvent[]>([]);
  const prevZonesRef = useRef<Map<string, ZoneId>>(new Map());
  const prevLevelsRef = useRef<Map<string, number>>(new Map());

  // Navigation state
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(0);
  const [selectedAgentIdx, setSelectedAgentIdx] = useState(0);

  // Build zone → agents mapping with activity data
  const zoneAgents = useMemo(() => {
    const map = new Map<ZoneId, ZoneAgentInfo[]>();
    for (const zoneId of ALL_ZONES) {
      map.set(zoneId, []);
    }

    for (const member of team.members) {
      const agentActivity = session?.agentActivity.get(member.name);
      const activityVisual = mapActivity(agentActivity);
      const activityState = activityVisual.state;
      const zoneId = mapActivityToZone(activityState);

      const agentGameData: AgentGameData =
        gameState?.agents.get(member.name) ?? createAgentGameData(member.name);

      const prevZone = prevZonesRef.current.get(member.name);
      const isWalking = prevZone !== undefined && prevZone !== zoneId &&
        (spinnerFrame % 6) < 3; // walking animation lasts 3 frames

      const agentInfo: ZoneAgentInfo = {
        name: member.name,
        type: member.agentType || 'default',
        state: activityState,
        activityLabel: activityVisual.label || '',
        gameData: { ...agentGameData, currentZone: zoneId },
        isWalking,
        walkDirection: isWalking ? 'right' : 'right',
      };

      const existing = map.get(zoneId);
      if (existing) {
        existing.push(agentInfo);
      }
    }

    return map;
  }, [team.members, session, gameState, spinnerFrame]);

  // Track zone changes and emit events
  useEffect(() => {
    const newEvents: GameEvent[] = [];

    for (const member of team.members) {
      const agentActivity = session?.agentActivity.get(member.name);
      const activityVisual = mapActivity(agentActivity);
      const currentZone = mapActivityToZone(activityVisual.state);
      const prevZone = prevZonesRef.current.get(member.name);

      if (prevZone !== undefined && prevZone !== currentZone) {
        newEvents.push({
          id: makeEventId(),
          timestamp: Date.now(),
          type: 'zone_change',
          agentName: member.name,
          message: `→ ${ZONE_DISPLAY_NAMES[currentZone] ?? currentZone}`,
          color: 'cyan',
          icon: ZONE_ICONS[currentZone] ?? '◈',
        });
      }

      prevZonesRef.current.set(member.name, currentZone);
    }

    // Check for level-ups from game state
    if (gameState) {
      for (const [agentName, agentData] of gameState.agents) {
        const prevLevel = prevLevelsRef.current.get(agentName);
        if (prevLevel !== undefined && agentData.level > prevLevel) {
          newEvents.push({
            id: makeEventId(),
            timestamp: Date.now(),
            type: 'level_up',
            agentName,
            message: `Lv.${agentData.level} ${agentData.title}!`,
            color: 'yellowBright',
            icon: '⬆',
            xpGained: 0,
          });
        }
        prevLevelsRef.current.set(agentName, agentData.level);

        // Check for new achievements
        const storedEvents = gameState.events ?? [];
        for (const event of storedEvents) {
          if (event.type === 'achievement') {
            const alreadyLogged = localEvents.some((e) => e.id === event.id);
            if (!alreadyLogged) {
              newEvents.push({ ...event, id: makeEventId() });
            }
          }
        }
      }
    }

    if (newEvents.length > 0) {
      setLocalEvents((prev) => [...prev, ...newEvents].slice(-40));
    }
  }, [session, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation within the game map
  useInput((input, key) => {
    const zonesWithAgents = ALL_ZONES.filter((z) => (zoneAgents.get(z)?.length ?? 0) > 0);

    if (key.leftArrow || input === 'h') {
      setSelectedZoneIdx((prev) => Math.max(0, prev - 1));
      setSelectedAgentIdx(0);
    } else if (key.rightArrow || input === 'l') {
      setSelectedZoneIdx((prev) => Math.min(ALL_ZONES.length - 1, prev + 1));
      setSelectedAgentIdx(0);
    } else if (key.upArrow || input === 'k') {
      setSelectedAgentIdx((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      const currentZone = ALL_ZONES[selectedZoneIdx];
      const agentsInZone = currentZone ? (zoneAgents.get(currentZone)?.length ?? 0) : 0;
      setSelectedAgentIdx((prev) => Math.min(Math.max(0, agentsInZone - 1), prev + 1));
    }
  });

  // Layout calculations
  const narrowLayout = termSize.cols < 100;
  const sidePanelWidth = narrowLayout ? 0 : Math.min(28, Math.floor(termSize.cols * 0.22));
  const mapWidth = termSize.cols - sidePanelWidth - 4;

  const zonesPerRow = narrowLayout ? 2 : 4;
  const zoneWidth = Math.max(14, Math.floor((mapWidth - 2) / zonesPerRow) - 1);
  const mapHeight = termSize.rows - 8; // leave room for title and stats
  const zoneHeight = Math.max(10, Math.floor((mapHeight - 2) / 2));

  const currentSelectedZone = ALL_ZONES[selectedZoneIdx];

  // Side panel height split
  const eventLogHeight = Math.floor((mapHeight - 1) * 0.6);
  const leaderboardHeight = mapHeight - eventLogHeight - 1;

  // Merge local events with game state events for display
  const allEvents = useMemo(() => {
    const stateEvents = gameState?.events ?? [];
    const combined = [...stateEvents, ...localEvents]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-40);
    // Deduplicate by id
    const seen = new Set<string>();
    return combined.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [gameState, localEvents]);

  // Agent list for leaderboard
  const agentList = useMemo(
    () => Array.from(gameState?.agents.values() ?? []),
    [gameState],
  );

  const selectedAgentInZone = currentSelectedZone
    ? zoneAgents.get(currentSelectedZone)?.[selectedAgentIdx]
    : undefined;

  const renderZoneRow = (zones: ZoneId[]) => {
    if (zonesPerRow === 2) {
      const chunks: ZoneId[][] = [];
      for (let i = 0; i < zones.length; i += 2) {
        chunks.push(zones.slice(i, i + 2));
      }
      return (
        <Box flexDirection="column">
          {chunks.map((row, ri) => (
            <Box key={ri} flexDirection="row">
              {row.map((zoneId) => {
                const zoneIdx = ALL_ZONES.indexOf(zoneId);
                return (
                  <Zone
                    key={zoneId}
                    zoneId={zoneId}
                    zoneName={ZONE_DISPLAY_NAMES[zoneId] ?? zoneId}
                    agents={zoneAgents.get(zoneId) ?? []}
                    spinnerFrame={spinnerFrame}
                    width={zoneWidth}
                    height={zoneHeight}
                    isSelected={zoneIdx === selectedZoneIdx}
                    selectedAgentIndex={zoneIdx === selectedZoneIdx ? selectedAgentIdx : -1}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Box flexDirection="row">
        {zones.map((zoneId) => {
          const zoneIdx = ALL_ZONES.indexOf(zoneId);
          return (
            <Zone
              key={zoneId}
              zoneId={zoneId}
              zoneName={ZONE_DISPLAY_NAMES[zoneId] ?? zoneId}
              agents={zoneAgents.get(zoneId) ?? []}
              spinnerFrame={spinnerFrame}
              width={zoneWidth}
              height={zoneHeight}
              isSelected={zoneIdx === selectedZoneIdx}
              selectedAgentIndex={zoneIdx === selectedZoneIdx ? selectedAgentIdx : -1}
            />
          );
        })}
      </Box>
    );
  };

  const titleBanner = renderTitleBanner(team.name, spinnerFrame, mapWidth);

  return (
    <Box flexDirection="column">
      {/* Animated title banner */}
      <Text color="cyanBright" bold>{titleBanner}</Text>

      {/* Main layout: map + side panel */}
      <Box flexDirection="row">
        {/* Zone grid */}
        <Box flexDirection="column" width={mapWidth}>
          {renderZoneRow(ZONE_ORDER_TOP)}
          {renderZoneRow(ZONE_ORDER_BOTTOM)}
        </Box>

        {/* Side panel: event log + leaderboard */}
        {!narrowLayout && sidePanelWidth > 0 && (
          <Box flexDirection="column" width={sidePanelWidth} marginLeft={1}>
            <EventLog
              events={allEvents}
              width={sidePanelWidth}
              height={eventLogHeight}
              spinnerFrame={spinnerFrame}
            />
            <AgentLeaderboard
              agents={agentList}
              width={sidePanelWidth}
              height={leaderboardHeight}
              spinnerFrame={spinnerFrame}
              selectedAgentName={selectedAgentInZone?.name}
            />
          </Box>
        )}
      </Box>

      {/* Stats footer */}
      {gameState && (
        <StatsBar
          gameState={gameState}
          teamName={team.name}
          spinnerFrame={spinnerFrame}
          totalTasks={tasks.length}
          completedTasks={completedTaskCount}
        />
      )}

      {/* Navigation hint */}
      <Box>
        <Text dimColor>
          ←→ zone  ↑↓ agent  {currentSelectedZone ? `[${ZONE_DISPLAY_NAMES[currentSelectedZone]}]` : ''}
          {selectedAgentInZone ? `  ▶ ${selectedAgentInZone.name}  Lv.${selectedAgentInZone.gameData.level}` : ''}
        </Text>
      </Box>
    </Box>
  );
}
