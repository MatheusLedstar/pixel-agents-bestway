/**
 * GameMapView — The complete, fully-interactive pixel office game map.
 *
 * Features:
 *  ─ Two-column layout: office zones (left) + event log & leaderboard (right)
 *  ─ Agent walking animations (4 directions, 4 frames each)
 *  ─ Zone navigation: ←→↑↓ or h/j/k/l
 *  ─ Agent navigation: Tab/Shift-Tab to cycle globally, ↑↓ within zone
 *  ─ Enter: open AgentDetailOverlay
 *  ─ m: toggle MiniMap
 *  ─ f: toggle fullscreen (hide side panel)
 *  ─ a: cycle achievement popups (debug)
 *  ─ Esc: close overlay / deselect / back
 *  ─ Achievement popups: auto-appear when achievements unlock
 *  ─ Event log: live stream of zone changes, level-ups, completions
 *  ─ Leaderboard: ranked agents by XP
 *  ─ Stats bar: XP shimmer, team level, achievements, MVP agent
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Team, Task, Message, TeamSessionData } from '../core/types.js';
import type { TerminalSize } from '../hooks/useTerminalSize.js';
import type { ZoneId, AgentGameData, GameEvent } from './types.js';
import { ZONE_DISPLAY_NAMES, ZONE_ICONS, ZONE_COLORS } from './types.js';
import { useGameState } from '../hooks/useGameState.js';
import { mapActivity } from '../map/activityMapper.js';
import { mapActivityToZone } from './zoneMapper.js';
import { createAgentGameData, calculateLevel, getAchievement } from './xpSystem.js';
import { useAgentWalker } from './useAgentWalker.js';
import Zone from './Zone.js';
import type { ZoneAgentInfo } from './Zone.js';
import StatsBar from './StatsBar.js';
import EventLog from './EventLog.js';
import AgentLeaderboard from './AgentLeaderboard.js';
import AgentDetailOverlay from './AgentDetailOverlay.js';
import AchievementPopup from './AchievementPopup.js';
import MiniMap from './MiniMap.js';
import type { MiniMapZoneData } from './MiniMap.js';

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const ZONE_ORDER_TOP: ZoneId[]    = ['planning', 'coding',  'testing',  'deploying'];
const ZONE_ORDER_BOTTOM: ZoneId[] = ['comms',    'lounge',  'library',  'workshop'];
const ALL_ZONES: ZoneId[]         = [...ZONE_ORDER_TOP, ...ZONE_ORDER_BOTTOM];

// Zone grid coordinates [col, row]
const ZONE_GRID_POS: Record<ZoneId, [number, number]> = {
  planning:  [0, 0],
  coding:    [1, 0],
  testing:   [2, 0],
  deploying: [3, 0],
  comms:     [0, 1],
  lounge:    [1, 1],
  library:   [2, 1],
  workshop:  [3, 1],
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

let eventIdCounter = 0;
function makeEventId(): string {
  return `gmv_${Date.now()}_${eventIdCounter++}`;
}

function renderTitleBanner(teamName: string, spinnerFrame: number, width: number): string {
  const BORDER_FRAMES = ['═', '╌', '─', '╌'];
  const bc = BORDER_FRAMES[Math.floor(spinnerFrame / 6) % 4] ?? '═';
  const PULSE = ['◈', '◉', '◈', '◆'];
  const pulse = PULSE[Math.floor(spinnerFrame / 4) % 4] ?? '◈';

  const inner = ` ${pulse} PIXEL AGENTS OFFICE  ${bc}  ⬡ ${teamName.toUpperCase()} ⬡  ${bc} ${pulse} `;
  const available = Math.max(0, width - 4);
  const padded = inner.length > available
    ? inner.slice(0, available)
    : inner + bc.repeat(available - inner.length);

  return `╔${bc}${padded}${bc}╗`;
}

// Navigate zone grid with arrow keys
function navigateZone(current: ZoneId, dir: 'left' | 'right' | 'up' | 'down'): ZoneId {
  const [col, row] = ZONE_GRID_POS[current];
  let newCol = col;
  let newRow = row;

  switch (dir) {
    case 'left':  newCol = Math.max(0, col - 1); break;
    case 'right': newCol = Math.min(3, col + 1); break;
    case 'up':    newRow = Math.max(0, row - 1); break;
    case 'down':  newRow = Math.min(1, row + 1); break;
  }

  const found = ALL_ZONES.find(z => {
    const [c, r] = ZONE_GRID_POS[z];
    return c === newCol && r === newRow;
  });
  return found ?? current;
}

// ──────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────

export interface GameMapViewProps {
  team: Team;
  tasks: Task[];
  messages: Message[];
  session?: TeamSessionData;
  spinnerFrame: number;
  termSize: TerminalSize;
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
    () => tasks.filter(t => t.status === 'completed').length,
    [tasks],
  );

  const { gameState } = useGameState(team.name, completedTaskCount, messages.length);

  // ── Navigation state ────────────────────────────────────────
  const [selectedZone, setSelectedZone] = useState<ZoneId>('coding');
  const [selectedAgentIdx, setSelectedAgentIdx] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [hideSidePanel, setHideSidePanel] = useState(false);

  // ── Achievement popup queue ──────────────────────────────────
  const [pendingPopup, setPendingPopup] = useState<{
    achievement: ReturnType<typeof getAchievement>;
    agentName: string;
    shownAt: number;
  } | null>(null);
  const shownAchievementsRef = useRef<Set<string>>(new Set());
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Event log ───────────────────────────────────────────────
  const [localEvents, setLocalEvents] = useState<GameEvent[]>([]);
  const prevZonesRef = useRef<Map<string, ZoneId>>(new Map());
  const prevLevelsRef = useRef<Map<string, number>>(new Map());
  const prevAchRef = useRef<Map<string, Set<string>>>(new Map());

  // ── Build agent → zone map ───────────────────────────────────
  const agentZoneMap = useMemo(() => {
    const m = new Map<string, ZoneId>();
    for (const member of team.members) {
      const agentActivity = session?.agentActivity.get(member.name);
      const activityVisual = mapActivity(agentActivity);
      m.set(member.name, mapActivityToZone(activityVisual.state));
    }
    return m;
  }, [team.members, session]);

  // ── Walking engine ───────────────────────────────────────────
  const walkerMap = useAgentWalker(agentZoneMap, spinnerFrame);

  // ── Zone → agents ────────────────────────────────────────────
  const zoneAgents = useMemo(() => {
    const m = new Map<ZoneId, ZoneAgentInfo[]>();
    for (const z of ALL_ZONES) m.set(z, []);

    for (const member of team.members) {
      const agentActivity = session?.agentActivity.get(member.name);
      const activityVisual = mapActivity(agentActivity);
      const currentZone = mapActivityToZone(activityVisual.state);
      const walkState = walkerMap.get(member.name);
      const agentGameData: AgentGameData =
        gameState?.agents.get(member.name) ?? createAgentGameData(member.name);

      const info: ZoneAgentInfo = {
        name: member.name,
        type: member.agentType || 'default',
        state: activityVisual.state,
        activityLabel: activityVisual.label ?? '',
        gameData: { ...agentGameData, currentZone },
        isWalking: walkState?.isWalking ?? false,
        walkDirection: walkState?.direction ?? 'right',
        walkFrame: walkState?.walkFrame ?? 0,
      };

      (m.get(currentZone) ?? []).push(info);
    }

    return m;
  }, [team.members, session, gameState, walkerMap]);

  // ── Detect zone transitions & emit events ───────────────────
  useEffect(() => {
    const newEvents: GameEvent[] = [];

    for (const member of team.members) {
      const currentZone = agentZoneMap.get(member.name) ?? 'lounge';
      const prevZone = prevZonesRef.current.get(member.name);

      if (prevZone !== undefined && prevZone !== currentZone) {
        newEvents.push({
          id: makeEventId(),
          timestamp: Date.now(),
          type: 'zone_change',
          agentName: member.name,
          message: `${ZONE_DISPLAY_NAMES[prevZone] ?? prevZone} → ${ZONE_DISPLAY_NAMES[currentZone] ?? currentZone}`,
          color: ZONE_COLORS[currentZone] ?? 'cyan',
          icon: ZONE_ICONS[currentZone] ?? '◈',
        });
      }
      prevZonesRef.current.set(member.name, currentZone);
    }

    if (gameState) {
      for (const [agentName, agentData] of gameState.agents) {
        // Level-up detection
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
          });
        }
        prevLevelsRef.current.set(agentName, agentData.level);

        // Achievement detection
        const prevAchs = prevAchRef.current.get(agentName) ?? new Set<string>();
        for (const achId of agentData.achievements) {
          if (!prevAchs.has(achId) && !shownAchievementsRef.current.has(`${agentName}:${achId}`)) {
            shownAchievementsRef.current.add(`${agentName}:${achId}`);
            const ach = getAchievement(achId);
            if (ach) {
              newEvents.push({
                id: makeEventId(),
                timestamp: Date.now(),
                type: 'achievement',
                agentName,
                message: `${ach.name} (${ach.rarity})`,
                color: 'yellowBright',
                icon: ach.icon,
                xpGained: ach.xpReward,
              });
              // Queue popup (only one at a time)
              if (!pendingPopup) {
                setPendingPopup({ achievement: ach, agentName, shownAt: spinnerFrame });
                if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
                popupTimeoutRef.current = setTimeout(() => setPendingPopup(null), 4000);
              }
            }
            prevAchs.add(achId);
          }
        }
        prevAchRef.current.set(agentName, prevAchs);
      }
    }

    if (newEvents.length > 0) {
      setLocalEvents(prev => [...prev, ...newEvents].slice(-60));
    }
  }, [agentZoneMap, gameState, spinnerFrame]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard navigation ─────────────────────────────────────
  useInput((input, key) => {
    // Close overlay first
    if (showOverlay) {
      if (key.escape || input === 'q') {
        setShowOverlay(false);
      } else if (key.tab) {
        // Tab to next agent globally
        const allAgents = Array.from(zoneAgents.values()).flat();
        const selectedAgent = zoneAgents.get(selectedZone)?.[selectedAgentIdx];
        if (selectedAgent && allAgents.length > 0) {
          const idx = allAgents.findIndex(a => a.name === selectedAgent.name);
          const nextIdx = (idx + 1) % allAgents.length;
          const nextAgent = allAgents[nextIdx];
          if (nextAgent) {
            // Find which zone the next agent is in
            for (const [z, agents] of zoneAgents) {
              const aIdx = agents.findIndex(a => a.name === nextAgent.name);
              if (aIdx !== -1) {
                setSelectedZone(z);
                setSelectedAgentIdx(aIdx);
                break;
              }
            }
          }
        }
      }
      return;
    }

    // Close achievement popup
    if (pendingPopup && (key.escape || input === 'x')) {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      setPendingPopup(null);
      return;
    }

    // Zone navigation
    if (key.leftArrow || input === 'h') {
      setSelectedZone(prev => navigateZone(prev, 'left'));
      setSelectedAgentIdx(0);
    } else if (key.rightArrow || input === 'l') {
      setSelectedZone(prev => navigateZone(prev, 'right'));
      setSelectedAgentIdx(0);
    } else if (key.upArrow || input === 'k') {
      const agentsInZone = zoneAgents.get(selectedZone)?.length ?? 0;
      if (agentsInZone > 0) {
        setSelectedAgentIdx(prev => Math.max(0, prev - 1));
      } else {
        setSelectedZone(prev => navigateZone(prev, 'up'));
      }
    } else if (key.downArrow || input === 'j') {
      const agentsInZone = zoneAgents.get(selectedZone)?.length ?? 0;
      if (selectedAgentIdx < agentsInZone - 1) {
        setSelectedAgentIdx(prev => prev + 1);
      } else {
        setSelectedZone(prev => navigateZone(prev, 'down'));
        setSelectedAgentIdx(0);
      }
    }
    // Open agent detail overlay
    else if (key.return) {
      const agent = zoneAgents.get(selectedZone)?.[selectedAgentIdx];
      if (agent) {
        setShowOverlay(true);
      }
    }
    // Tab: cycle agents globally
    else if (key.tab) {
      const allAgents = Array.from(zoneAgents.values()).flat();
      if (allAgents.length === 0) return;

      const currentAgent = zoneAgents.get(selectedZone)?.[selectedAgentIdx];
      let nextIdx = 0;
      if (currentAgent) {
        const pos = allAgents.findIndex(a => a.name === currentAgent.name);
        nextIdx = (pos + 1) % allAgents.length;
      }
      const next = allAgents[nextIdx];
      if (next) {
        for (const [z, agents] of zoneAgents) {
          const ai = agents.findIndex(a => a.name === next.name);
          if (ai !== -1) {
            setSelectedZone(z);
            setSelectedAgentIdx(ai);
            break;
          }
        }
      }
    }
    // Toggles
    else if (input === 'm') {
      setShowMiniMap(prev => !prev);
    } else if (input === 'f') {
      setHideSidePanel(prev => !prev);
    }
  });

  // ── Layout calculations ─────────────────────────────────────
  const narrowLayout = termSize.cols < 110;
  const hideSide = hideSidePanel || narrowLayout;
  const sidePanelWidth = hideSide ? 0 : Math.min(30, Math.floor(termSize.cols * 0.20));
  const mapWidth = termSize.cols - sidePanelWidth - (hideSide ? 2 : 5);

  const zonesPerRow = termSize.cols < 90 ? 2 : 4;
  const zoneWidth = Math.max(14, Math.floor((mapWidth - 2) / zonesPerRow) - 1);
  const mapAvailableHeight = termSize.rows - 6;
  const zoneHeight = Math.max(10, Math.floor(mapAvailableHeight / 2));

  // Side panel splits
  const eventLogHeight = Math.max(6, Math.floor(mapAvailableHeight * 0.55));
  const leaderboardHeight = Math.max(5, mapAvailableHeight - eventLogHeight);

  // Merge events
  const allEvents = useMemo(() => {
    const stateEvents = gameState?.events ?? [];
    const combined = [...stateEvents, ...localEvents]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-60);
    const seen = new Set<string>();
    return combined.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [gameState, localEvents]);

  const agentList = useMemo(
    () => Array.from(gameState?.agents.values() ?? []).sort((a, b) => b.xp - a.xp),
    [gameState],
  );

  // MiniMap zone data
  const miniMapZones = useMemo<MiniMapZoneData[]>(() =>
    ALL_ZONES.map(zoneId => {
      const agents = zoneAgents.get(zoneId) ?? [];
      return {
        zoneId,
        agentCount: agents.length,
        agentNames: agents.map(a => a.name),
        isActive: agents.some(a => a.state !== 'idle'),
      };
    }),
    [zoneAgents],
  );

  const selectedAgent = zoneAgents.get(selectedZone)?.[selectedAgentIdx];

  const renderZoneRow = (zones: ZoneId[]) => {
    if (zonesPerRow === 2) {
      const chunks: ZoneId[][] = [];
      for (let i = 0; i < zones.length; i += 2) chunks.push(zones.slice(i, i + 2));
      return (
        <Box flexDirection="column">
          {chunks.map((row, ri) => (
            <Box key={ri} flexDirection="row">
              {row.map(zoneId => (
                <Zone
                  key={zoneId}
                  zoneId={zoneId}
                  zoneName={ZONE_DISPLAY_NAMES[zoneId] ?? zoneId}
                  agents={zoneAgents.get(zoneId) ?? []}
                  spinnerFrame={spinnerFrame}
                  width={zoneWidth}
                  height={zoneHeight}
                  isSelected={zoneId === selectedZone}
                  selectedAgentIndex={zoneId === selectedZone ? selectedAgentIdx : -1}
                />
              ))}
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Box flexDirection="row">
        {zones.map(zoneId => (
          <Zone
            key={zoneId}
            zoneId={zoneId}
            zoneName={ZONE_DISPLAY_NAMES[zoneId] ?? zoneId}
            agents={zoneAgents.get(zoneId) ?? []}
            spinnerFrame={spinnerFrame}
            width={zoneWidth}
            height={zoneHeight}
            isSelected={zoneId === selectedZone}
            selectedAgentIndex={zoneId === selectedZone ? selectedAgentIdx : -1}
          />
        ))}
      </Box>
    );
  };

  // ── Title banner ─────────────────────────────────────────────
  const titleBanner = renderTitleBanner(team.name, spinnerFrame, mapWidth);

  // ── Render ───────────────────────────────────────────────────
  return (
    <Box flexDirection="column">
      {/* Achievement popup (rendered above everything else) */}
      {pendingPopup?.achievement && (
        <AchievementPopup
          achievement={pendingPopup.achievement}
          agentName={pendingPopup.agentName}
          spinnerFrame={spinnerFrame}
          termWidth={termSize.cols}
        />
      )}

      {/* Agent detail overlay */}
      {showOverlay && selectedAgent && (
        <AgentDetailOverlay
          agentName={selectedAgent.name}
          agentType={selectedAgent.type}
          activityState={selectedAgent.state}
          activityLabel={selectedAgent.activityLabel ?? ''}
          gameData={selectedAgent.gameData}
          tasks={tasks}
          spinnerFrame={spinnerFrame}
          termWidth={termSize.cols}
          termHeight={termSize.rows}
          onClose={() => setShowOverlay(false)}
        />
      )}

      {/* Mini map overlay */}
      {showMiniMap && (
        <Box position="absolute" marginLeft={termSize.cols - 34} marginTop={0}>
          <MiniMap
            zones={miniMapZones}
            selectedZoneId={selectedZone}
            spinnerFrame={spinnerFrame}
            width={32}
          />
        </Box>
      )}

      {/* Title banner */}
      <Text color="cyanBright" bold>{titleBanner}</Text>

      {/* Main content: office map + side panel */}
      <Box flexDirection="row">
        {/* Office map grid */}
        <Box flexDirection="column" width={mapWidth}>
          {renderZoneRow(ZONE_ORDER_TOP)}
          {renderZoneRow(ZONE_ORDER_BOTTOM)}
        </Box>

        {/* Side panel */}
        {!hideSide && sidePanelWidth > 0 && (
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
              selectedAgentName={selectedAgent?.name}
            />
          </Box>
        )}
      </Box>

      {/* Stats footer */}
      {gameState && !showOverlay && (
        <StatsBar
          gameState={gameState}
          teamName={team.name}
          spinnerFrame={spinnerFrame}
          totalTasks={tasks.length}
          completedTasks={completedTaskCount}
        />
      )}

      {/* Interactive navigation hint bar */}
      {!showOverlay && (
        <Box paddingX={1} gap={2}>
          <Text dimColor>
            <Text color="cyan">←→↑↓</Text>
            <Text dimColor> zone/agent  </Text>
            <Text color="cyan">↵</Text>
            <Text dimColor> inspect  </Text>
            <Text color="cyan">Tab</Text>
            <Text dimColor> next agent  </Text>
            <Text color="cyan">m</Text>
            <Text dimColor> map  </Text>
            <Text color="cyan">f</Text>
            <Text dimColor> fullscreen  </Text>
            <Text color="cyan">Esc</Text>
            <Text dimColor> back</Text>
          </Text>
          {selectedAgent && (
            <Text color="yellowBright">
              ▶ {selectedAgent.name} @ {ZONE_DISPLAY_NAMES[selectedZone]} • {selectedAgent.state} • Lv.{selectedAgent.gameData.level}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
