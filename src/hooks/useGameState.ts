// React hook for managing game state (XP, levels, achievements)
// Loads from ~/.claude/pixel-agents/<teamName>.json, auto-saves every 10 seconds

import { useState, useEffect, useCallback, useRef } from 'react';

import type { AgentGameData, GameState } from '../game/types.js';
import { XP_TABLE } from '../game/types.js';
import {
  loadGameState,
  saveGameState,
  createAgentGameData,
  grantXp,
  checkAchievements,
  calculateLevel,
} from '../game/xpSystem.js';

interface UseGameStateResult {
  gameState: GameState | null;
  addXp: (agentName: string, action: keyof typeof XP_TABLE) => void;
}

/**
 * Hook that manages the RPG game state for a team.
 *
 * - Loads game state on mount from disk
 * - Tracks changes in task completion count and message count
 * - Grants XP accordingly and checks for new achievements
 * - Auto-saves dirty state every 10 seconds
 *
 * @param teamName - the team whose game state to manage
 * @param completedTaskCount - current number of completed tasks (from useTasks)
 * @param messageCount - current number of messages (from useMessages)
 */
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
      let totalTasksDone = 0;
      let totalMessagesSent = 0;
      for (const agent of state.agents.values()) {
        totalTasksDone += agent.tasksDone;
        totalMessagesSent += agent.messagesSent;
      }
      prevCompletedRef.current = completedTaskCount;
      prevMessagesRef.current = messageCount;
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

      const updated = { ...prev, agents: new Map(prev.agents) };
      // Distribute XP across all agents in the team
      const agentNames = Array.from(updated.agents.keys());
      if (agentNames.length === 0) return prev;

      // Grant task XP to first agent (or create one named "team")
      if (newTasks > 0) {
        const targetName = agentNames[0] ?? 'team';
        let agentData = updated.agents.get(targetName) ?? createAgentGameData(targetName);

        for (let i = 0; i < newTasks; i++) {
          agentData = grantXp(agentData, 'task_completed');
          agentData = { ...agentData, tasksDone: agentData.tasksDone + 1 };
        }

        // Check achievements
        const newAchievements = checkAchievements(agentData);
        if (newAchievements.length > 0) {
          agentData = {
            ...agentData,
            achievements: [...agentData.achievements, ...newAchievements],
          };
        }

        updated.agents.set(targetName, agentData);
      }

      // Grant message XP to first agent
      if (newMessages > 0) {
        const targetName = agentNames[0] ?? 'team';
        let agentData = updated.agents.get(targetName) ?? createAgentGameData(targetName);

        for (let i = 0; i < newMessages; i++) {
          agentData = grantXp(agentData, 'message_sent');
          agentData = { ...agentData, messagesSent: agentData.messagesSent + 1 };
        }

        const newAchievements = checkAchievements(agentData);
        if (newAchievements.length > 0) {
          agentData = {
            ...agentData,
            achievements: [...agentData.achievements, ...newAchievements],
          };
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

  // Manual XP grant function
  const addXp = useCallback(
    (agentName: string, action: keyof typeof XP_TABLE) => {
      setGameState((prev) => {
        if (!prev) return prev;

        const updated = { ...prev, agents: new Map(prev.agents) };
        let agentData = updated.agents.get(agentName) ?? createAgentGameData(agentName);

        agentData = grantXp(agentData, action);

        // Update specific counters
        switch (action) {
          case 'task_completed':
            agentData = { ...agentData, tasksDone: agentData.tasksDone + 1 };
            break;
          case 'task_started':
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
          default:
            break;
        }

        // Check achievements
        const newAchievements = checkAchievements(agentData);
        if (newAchievements.length > 0) {
          agentData = {
            ...agentData,
            achievements: [...agentData.achievements, ...newAchievements],
          };
        }

        updated.agents.set(agentName, agentData);

        // Recalculate team totals
        let totalXp = 0;
        for (const agent of updated.agents.values()) {
          totalXp += agent.xp;
        }
        updated.totalXp = totalXp;
        const teamLevelInfo = calculateLevel(totalXp);
        updated.teamLevel = teamLevelInfo.level;

        dirtyRef.current = true;
        return updated;
      });
    },
    [],
  );

  return { gameState, addXp };
}
