// Activity log hook — collects events for timeline display
// Tracks task completions, agent actions, messages

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Task, Message } from '../core/types.js';

export type ActivityEventType = 'task_completed' | 'task_started' | 'message' | 'agent_active' | 'agent_idle';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  agent?: string;
  team?: string;
  description: string;
  timestamp: number;
}

const MAX_EVENTS = 30;
const MAX_SEEN_SIZE = 500;

const EVENT_ICONS: Record<ActivityEventType, string> = {
  task_completed: '✓',
  task_started: '▶',
  message: '◆',
  agent_active: '●',
  agent_idle: '○',
};

const EVENT_COLORS: Record<ActivityEventType, string> = {
  task_completed: 'greenBright',
  task_started: 'cyanBright',
  message: 'yellowBright',
  agent_active: 'greenBright',
  agent_idle: 'gray',
};

export { EVENT_ICONS, EVENT_COLORS };

export function useActivityLog(
  allTasks: Map<string, Task[]>,
  allMessages: Map<string, Message[]>,
): ActivityEvent[] {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const seenTasks = useRef(new Set<string>());
  const seenMessages = useRef(new Set<string>());
  const initialized = useRef(false);

  const processUpdates = useCallback(() => {
    const newEvents: ActivityEvent[] = [];

    // Track task state changes
    for (const [teamName, tasks] of allTasks) {
      for (const task of tasks) {
        const taskKey = `${teamName}:${task.id}:${task.status}`;
        if (seenTasks.current.has(taskKey)) continue;
        seenTasks.current.add(taskKey);

        // Skip initial load to avoid flooding timeline
        if (!initialized.current) continue;

        if (task.status === 'completed') {
          newEvents.push({
            id: `tc-${taskKey}`,
            type: 'task_completed',
            agent: task.owner,
            team: teamName,
            description: task.subject,
            timestamp: Date.now(),
          });
        } else if (task.status === 'in_progress') {
          newEvents.push({
            id: `ts-${taskKey}`,
            type: 'task_started',
            agent: task.owner,
            team: teamName,
            description: task.subject,
            timestamp: Date.now(),
          });
        }
      }
    }

    // Track new messages
    for (const [teamName, msgs] of allMessages) {
      for (const msg of msgs) {
        const msgKey = `${teamName}:${msg.timestamp}:${msg.from}`;
        if (seenMessages.current.has(msgKey)) continue;
        seenMessages.current.add(msgKey);

        if (!initialized.current) continue;

        newEvents.push({
          id: `msg-${msgKey}`,
          type: 'message',
          agent: msg.from,
          team: teamName,
          description: msg.summary ?? msg.text.slice(0, 60),
          timestamp: new Date(msg.timestamp).getTime() || Date.now(),
        });
      }
    }

    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    if (newEvents.length > 0) {
      setEvents((prev) => {
        const combined = [...newEvents, ...prev];
        return combined.slice(0, MAX_EVENTS);
      });
    }

    // Prevent unbounded Set growth
    if (seenTasks.current.size > MAX_SEEN_SIZE) {
      const entries = [...seenTasks.current];
      seenTasks.current = new Set(entries.slice(-MAX_SEEN_SIZE / 2));
    }
    if (seenMessages.current.size > MAX_SEEN_SIZE) {
      const entries = [...seenMessages.current];
      seenMessages.current = new Set(entries.slice(-MAX_SEEN_SIZE / 2));
    }
  }, [allTasks, allMessages]);

  useEffect(() => {
    processUpdates();
  }, [processUpdates]);

  return events;
}
