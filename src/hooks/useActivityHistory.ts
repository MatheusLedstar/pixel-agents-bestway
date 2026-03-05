// Ring buffer hook for tracking activity snapshots over time
// Used by sparklines to visualize trends

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Team, Task, Message } from '../core/types.js';

export interface ActivitySnapshot {
  timestamp: number;
  activeAgents: number;
  completedTasks: number;
  totalTasks: number;
  messageCount: number;
}

export interface ActivityHistory {
  snapshots: ActivitySnapshot[];
  /** Normalized 0..1 values for sparkline rendering */
  agentSeries: number[];
  taskSeries: number[];
  messageSeries: number[];
}

const MAX_SNAPSHOTS = 20;
const SNAPSHOT_INTERVAL = 5000; // 5 seconds

export function useActivityHistory(
  teams: Team[],
  allTasks: Map<string, Task[]>,
  allMessages: Map<string, Message[]>,
): ActivityHistory {
  const [snapshots, setSnapshots] = useState<ActivitySnapshot[]>([]);
  const prevMsgCount = useRef(0);

  const takeSnapshot = useCallback(() => {
    let activeAgents = 0;
    let completedTasks = 0;
    let totalTasks = 0;
    let messageCount = 0;

    for (const team of teams) {
      activeAgents += team.members.filter((m) => m.isActive).length;
    }
    for (const tasks of allTasks.values()) {
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t) => t.status === 'completed').length;
    }
    for (const msgs of allMessages.values()) {
      messageCount += msgs.length;
    }

    // Delta messages since last snapshot
    const msgDelta = Math.max(0, messageCount - prevMsgCount.current);
    prevMsgCount.current = messageCount;

    const snap: ActivitySnapshot = {
      timestamp: Date.now(),
      activeAgents,
      completedTasks,
      totalTasks,
      messageCount: msgDelta,
    };

    setSnapshots((prev) => {
      const next = [...prev, snap];
      if (next.length > MAX_SNAPSHOTS) next.shift();
      return next;
    });
  }, [teams, allTasks, allMessages]);

  useEffect(() => {
    // Take initial snapshot
    takeSnapshot();

    const interval = setInterval(takeSnapshot, SNAPSHOT_INTERVAL);
    return () => clearInterval(interval);
  }, [takeSnapshot]);

  // Normalize series to 0..1
  const normalize = (values: number[]): number[] => {
    if (values.length === 0) return [];
    const max = Math.max(...values, 1);
    return values.map((v) => v / max);
  };

  const agentSeries = normalize(snapshots.map((s) => s.activeAgents));
  const taskSeries = normalize(snapshots.map((s) => s.totalTasks > 0 ? s.completedTasks / s.totalTasks : 0));
  const messageSeries = normalize(snapshots.map((s) => s.messageCount));

  return { snapshots, agentSeries, taskSeries, messageSeries };
}
