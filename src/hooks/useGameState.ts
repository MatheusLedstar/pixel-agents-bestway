// React hook for managing game state (XP, levels, achievements, events)
// Loads from ~/.claude/pixel-agents/<teamName>.json, auto-saves every 10 seconds

import { useState, useEffect, useCallback, useRef } from 'react';

import type { AgentGameData, GameState, GameEvent } from '../game/types.js';
import { XP_TABLE } from '../game/types.js';
import {
  loadGameState,
  saveGameState,
  createAgentGameData,
  grantXp,
  checkAchievements,
  calculateLevel,
  getAchievement,
} from '../game/xpSystem.js';

interface UseGameStateResult {
  gameState: GameState | null;
  addXp: (agentName: string, action: keyof typeof XP_TABLE) => void;
}

let eventIdCounter = 0;
function makeEventId(): string {
  return `gs_${Date.now()}_${eventIdCounter++}`;
}

export function useGameState(
  teamName: string | null,
  completedTaskCount: number,
  messageCount: number,
): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const dirtyRef = useRef(false);
  const prevCompletedRef = useRef(0);
  const prevMessagesRef = useRef(0);
  const loadedRef = useRef(false);
  const prevLevelsRef = useRef<Map<string, number>>(new Map());

  // Load game state on mount or team change
  useEffect(() => {
    if (!teamName) {
      setGameState(null);
      loadedRef.current = false;
      return;
    }

    loadedRef.current = false;

    void loadGameState(teamName).then((state) => {
      setGameState(state);
      // Initialize previous counts from loaded state to avoid granting XP for historical data
      prevCompletedRef.current = completedTaskCount;
      prevMessagesRef.current = messageCount;

      // Snapshot existing levels
      for (const [name, data] of state.agents) {
        prevLevelsRef.current.set(name, data.level);
      }
      loadedRef.current = true;
    });
  }, [teamName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track task/message changes and grant XP
  useEffect(() => {
    if (!gameState || !loadedRef.current) return;

    const prevCompleted = prevCompletedRef.current;
    const prevMessages = prevMessagesRef.current;

    const newTasks = completedTaskCount - prevCompleted;
    const newMessages = messageCount - prevMessages;

    if (newTasks <= 0 && newMessages <= 0) return;

    setGameState((prev) => {
      if (!prev) return prev;

      const updated: GameState = {
        ...prev,
        agents: new Map(prev.agents),
        events: [...(prev.events ?? [])],
      };
      const agentNames = Array.from(updated.agents.keys());
      if (agentNames.length === 0) return prev;

      if (newTasks > 0) {
        const targetName = agentNames[0] ?? 'team';
        let agentData = updated.agents.get(targetName) ?? createAgentGameData(targetName);
        const prevLevel = agentData.level;

        for (let i = 0; i < newTasks; i++) {
          agentData = grantXp(agentData, 'task_completed');
          agentData = { ...agentData, tasksDone: agentData.tasksDone + 1 };
        }

        // Emit XP gain event
        updated.events.push({
          id: makeEventId(),
          timestamp: Date.now(),
          type: 'task_complete',
          agentName: targetName,
          message: `${newTasks} task${newTasks > 1 ? 's' : ''} done +${newTasks * XP_TABLE.task_completed}XP`,
          color: 'greenBright',
          icon: '✓',
          xpGained: newTasks * XP_TABLE.task_completed,
        });

        // Check for level-up
        if (agentData.level > prevLevel) {
          updated.events.push({
            id: makeEventId(),
            timestamp: Date.now(),
            type: 'level_up',
            agentName: targetName,
            message: `Level ${agentData.level} ${agentData.title}!`,
            color: 'yellowBright',
            icon: '⬆',
          });
        }

        // Check achievements
        const newAchievements = checkAchievements(agentData);
        if (newAchievements.length > 0) {
          agentData = {
            ...agentData,
            achievements: [...agentData.achievements, ...newAchievements],
          };
          for (const achId of newAchievements) {
            const ach = getAchievement(achId);
            if (ach) {
              updated.events.push({
                id: makeEventId(),
                timestamp: Date.now(),
                type: 'achievement',
                agentName: targetName,
                message: `${ach.name} unlocked!`,
                color: 'yellowBright',
                icon: ach.icon,
                xpGained: ach.xpReward,
              });
            }
          }
        }

        updated.agents.set(targetName, agentData);
      }

      if (newMessages > 0) {
        const targetName = agentNames[0] ?? 'team';
        let agentData = updated.agents.get(targetName) ?? createAgentGameData(targetName);

        for (let i = 0; i < newMessages; i++) {
          agentData = grantXp(agentData, 'message_sent');
          agentData = { ...agentData, messagesSent: agentData.messagesSent + 1 };
        }

        // Emit XP gain event (only if significant amount)
        if (newMessages >= 3) {
          updated.events.push({
            id: makeEventId(),
            timestamp: Date.now(),
            type: 'xp_gain',
            agentName: targetName,
            message: `${newMessages} msgs +${newMessages * XP_TABLE.message_sent}XP`,
            color: 'cyan',
            icon: '✉',
            xpGained: newMessages * XP_TABLE.message_sent,
          });
        }

        const newAchievements = checkAchievements(agentData);
        if (newAchievements.length > 0) {
          agentData = {
            ...agentData,
            achievements: [...agentData.achievements, ...newAchievements],
          };
          for (const achId of newAchievements) {
            const ach = getAchievement(achId);
            if (ach) {
              updated.events.push({
                id: makeEventId(),
                timestamp: Date.now(),
                type: 'achievement',
                agentName: targetName,
                message: `${ach.name} unlocked!`,
                color: 'yellowBright',
                icon: ach.icon,
                xpGained: ach.xpReward,
              });
            }
          }
        }

        updated.agents.set(targetName, agentData);
      }

      // Recalculate team totals
      let totalXp = 0;
      for (const agent of updated.agents.values()) {
        totalXp += agent.xp;
      }
      updated.totalXp = totalXp;
      const teamLevelInfo = calculateLevel(totalXp);
      updated.teamLevel = teamLevelInfo.level;

      // Keep event log trimmed
      updated.events = updated.events.slice(-80);

      dirtyRef.current = true;
      return updated;
    });

    prevCompletedRef.current = completedTaskCount;
    prevMessagesRef.current = messageCount;
  }, [completedTaskCount, messageCount, gameState]);

  // Auto-save every 10 seconds if dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current && gameState) {
        dirtyRef.current = false;
        void saveGameState(gameState);
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [gameState]);

  const addXp = useCallback(
    (agentName: string, action: keyof typeof XP_TABLE) => {
      setGameState((prev) => {
        if (!prev) return prev;

        const updated: GameState = {
          ...prev,
          agents: new Map(prev.agents),
          events: [...(prev.events ?? [])],
        };
        let agentData = updated.agents.get(agentName) ?? createAgentGameData(agentName);
        const prevLevel = agentData.level;

        agentData = grantXp(agentData, action);

        switch (action) {
          case 'task_completed':
            agentData = { ...agentData, tasksDone: agentData.tasksDone + 1 };
            break;
          case 'message_sent':
            agentData = { ...agentData, messagesSent: agentData.messagesSent + 1 };
            break;
          case 'file_read':
            agentData = { ...agentData, filesRead: agentData.filesRead + 1 };
            break;
          case 'file_written':
            agentData = { ...agentData, filesWritten: agentData.filesWritten + 1 };
            break;
          case 'deploy_completed':
            agentData = { ...agentData, deploysCompleted: (agentData.deploysCompleted ?? 0) + 1 };
            break;
          case 'test_executed':
            agentData = { ...agentData, testsRun: (agentData.testsRun ?? 0) + 1 };
            break;
          default:
            break;
        }

        if (agentData.level > prevLevel) {
          updated.events.push({
            id: makeEventId(),
            timestamp: Date.now(),
            type: 'level_up',
            agentName,
            message: `Level ${agentData.level} ${agentData.title}!`,
            color: 'yellowBright',
            icon: '⬆',
          });
        }

        const newAchievements = checkAchievements(agentData);
        if (newAchievements.length > 0) {
          agentData = {
            ...agentData,
            achievements: [...agentData.achievements, ...newAchievements],
          };
          for (const achId of newAchievements) {
            const ach = getAchievement(achId);
            if (ach) {
              updated.events.push({
                id: makeEventId(),
                timestamp: Date.now(),
                type: 'achievement',
                agentName,
                message: `${ach.name} unlocked!`,
                color: 'yellowBright',
                icon: ach.icon,
                xpGained: ach.xpReward,
              });
            }
          }
        }

        updated.agents.set(agentName, agentData);

        let totalXp = 0;
        for (const agent of updated.agents.values()) {
          totalXp += agent.xp;
        }
        updated.totalXp = totalXp;
        const teamLevelInfo = calculateLevel(totalXp);
        updated.teamLevel = teamLevelInfo.level;

        updated.events = updated.events.slice(-80);

        dirtyRef.current = true;
        return updated;
      });
    },
    [],
  );

  return { gameState, addXp };
}
