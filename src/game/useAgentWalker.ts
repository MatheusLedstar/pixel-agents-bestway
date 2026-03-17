/**
 * useAgentWalker — Hook that manages agent walking animations.
 *
 * Tracks each agent's "previous zone" and "current zone". When zones differ,
 * marks the agent as "walking" for WALK_DURATION frames.
 *
 * Walk direction is derived from the zone grid position:
 *   TOP ROW:    planning(0,0) | coding(1,0) | testing(2,0) | deploying(3,0)
 *   BOTTOM ROW: comms(0,1)   | lounge(1,1) | library(2,1) | workshop(3,1)
 */

import { useRef, useMemo, useEffect } from 'react';
import type { ZoneId } from './types.js';

// ──────────────────────────────────────────────────────────────
// Zone grid positions
// ──────────────────────────────────────────────────────────────

const ZONE_GRID: Record<ZoneId, { col: number; row: number }> = {
  planning:  { col: 0, row: 0 },
  coding:    { col: 1, row: 0 },
  testing:   { col: 2, row: 0 },
  deploying: { col: 3, row: 0 },
  comms:     { col: 0, row: 1 },
  lounge:    { col: 1, row: 1 },
  library:   { col: 2, row: 1 },
  workshop:  { col: 3, row: 1 },
};

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type WalkDirection = 'left' | 'right' | 'up' | 'down';

export interface AgentWalkState {
  isWalking: boolean;
  direction: WalkDirection;
  walkFrame: number;   // 0-3, cycles through 4 walk frames
  fromZone: ZoneId;
  toZone: ZoneId;
  progress: number;    // 0.0 → 1.0
}

export type AgentWalkerMap = Map<string, AgentWalkState>;

// Walking lasts this many spinnerFrame ticks (each tick = 200ms → 4 ticks = 800ms)
const WALK_DURATION_TICKS = 6;

// ──────────────────────────────────────────────────────────────
// Direction computation
// ──────────────────────────────────────────────────────────────

function computeDirection(from: ZoneId, to: ZoneId): WalkDirection {
  const fromPos = ZONE_GRID[from];
  const toPos = ZONE_GRID[to];

  if (!fromPos || !toPos) return 'right';

  const dc = toPos.col - fromPos.col;
  const dr = toPos.row - fromPos.row;

  if (Math.abs(dc) >= Math.abs(dr)) {
    return dc >= 0 ? 'right' : 'left';
  }
  return dr >= 0 ? 'down' : 'up';
}

// ──────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────

/**
 * @param agentZones  Map<agentName, currentZoneId> — the current zone for each agent
 * @param spinnerFrame  current animation frame counter
 * @returns  Map<agentName, AgentWalkState> — walking state per agent
 */
export function useAgentWalker(
  agentZones: Map<string, ZoneId>,
  spinnerFrame: number,
): AgentWalkerMap {
  // Persistent state refs (survive re-renders without causing them)
  const prevZonesRef = useRef<Map<string, ZoneId>>(new Map());
  const walkStartFrameRef = useRef<Map<string, number>>(new Map());
  const walkInfoRef = useRef<Map<string, { from: ZoneId; to: ZoneId; dir: WalkDirection }>>(new Map());

  // Detect zone changes every render cycle
  for (const [name, currentZone] of agentZones) {
    const prevZone = prevZonesRef.current.get(name);

    if (prevZone === undefined) {
      // First time seeing this agent — initialize
      prevZonesRef.current.set(name, currentZone);
    } else if (prevZone !== currentZone) {
      // Zone changed — start walk animation
      const dir = computeDirection(prevZone, currentZone);
      walkStartFrameRef.current.set(name, spinnerFrame);
      walkInfoRef.current.set(name, { from: prevZone, to: currentZone, dir });
      prevZonesRef.current.set(name, currentZone);
    }
  }

  // Build current walk state map
  const walkerMap: AgentWalkerMap = new Map();

  for (const [name] of agentZones) {
    const walkStart = walkStartFrameRef.current.get(name);
    const walkInfo = walkInfoRef.current.get(name);

    if (walkStart !== undefined && walkInfo !== undefined) {
      const elapsed = spinnerFrame - walkStart;

      if (elapsed < WALK_DURATION_TICKS) {
        const progress = Math.min(1, elapsed / WALK_DURATION_TICKS);
        const walkFrame = Math.floor(elapsed) % 4;

        walkerMap.set(name, {
          isWalking: true,
          direction: walkInfo.dir,
          walkFrame,
          fromZone: walkInfo.from,
          toZone: walkInfo.to,
          progress,
        });
      } else {
        // Walk finished
        walkerMap.set(name, {
          isWalking: false,
          direction: walkInfo.dir,
          walkFrame: 0,
          fromZone: walkInfo.from,
          toZone: walkInfo.to,
          progress: 1,
        });
      }
    } else {
      const currentZone = agentZones.get(name) ?? 'lounge';
      walkerMap.set(name, {
        isWalking: false,
        direction: 'right',
        walkFrame: 0,
        fromZone: currentZone,
        toZone: currentZone,
        progress: 1,
      });
    }
  }

  return walkerMap;
}
