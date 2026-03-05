import React from 'react';
import { Box, Text } from 'ink';
import type { CrossTeamData } from '../core/types.js';
import { relativeTime, truncate } from '../utils/format.js';

interface CrossTeamCallPanelProps {
  crossTeam: CrossTeamData;
  currentTeamName: string;
  spinnerFrame: number;
}

const PULSE_CHARS = ['◈', '◇', '◈', '◆'];

export default function CrossTeamCallPanel({ crossTeam, currentTeamName, spinnerFrame }: CrossTeamCallPanelProps) {
  const { registry, messages, activeCall } = crossTeam;

  // Filter out current team from the registry
  const otherTeams = registry.filter((t) => t.teamName !== currentTeamName);

  // Nothing to show if no other teams and no active call
  if (otherTeams.length === 0 && !activeCall) return null;

  const pulseChar = PULSE_CHARS[spinnerFrame % PULSE_CHARS.length];
  const recentMsgCount = messages.length;
  const lastMsg = messages[0];

  // Active call panel
  if (activeCall && activeCall.participants.length > 0) {
    const participantStr = activeCall.participants
      .map((p) => `${p.teamName}:${p.agentName}`)
      .join(' ←→ ');

    return (
      <Box
        borderStyle="double"
        borderColor="yellowBright"
        paddingX={1}
        flexDirection="column"
      >
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color="yellowBright" bold>{pulseChar} CROSS-TEAM CALL</Text>
          </Box>
          <Text dimColor>{relativeTime(activeCall.startedAt)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color="cyanBright">{participantStr}</Text>
          </Box>
          <Box gap={2}>
            {activeCall.topic && <Text dimColor>Topic: {truncate(activeCall.topic, 35)}</Text>}
            {recentMsgCount > 0 && <Text dimColor>{recentMsgCount} msgs</Text>}
          </Box>
        </Box>
      </Box>
    );
  }

  // Teams online panel (no active call)
  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      flexDirection="column"
    >
      <Box justifyContent="space-between">
        <Box gap={2}>
          <Text color="cyanBright" bold>TEAMS ONLINE</Text>
          {otherTeams.map((t) => {
            const total = t.tasksSummary.pending + t.tasksSummary.in_progress + t.tasksSummary.completed;
            const done = t.tasksSummary.completed;
            const statusColor = t.status === 'active' ? 'greenBright' : 'gray';
            return (
              <Text key={t.teamName}>
                <Text color={statusColor}>●</Text>
                <Text color="white"> {t.teamName}</Text>
                <Text dimColor> ({t.memberCount} agents{total > 0 ? `, ${done}/${total} tasks` : ''})</Text>
              </Text>
            );
          })}
        </Box>
        <Box gap={2}>
          {lastMsg && (
            <Text dimColor>
              Last: {truncate(lastMsg.content, 30)} ({relativeTime(lastMsg.timestamp)})
            </Text>
          )}
          <Text color="cyan">[c] Cross-Team</Text>
        </Box>
      </Box>
    </Box>
  );
}
