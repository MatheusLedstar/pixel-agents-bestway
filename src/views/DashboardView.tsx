import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { Team, Task, Message } from '../core/types.js';
import TeamCard from '../components/TeamCard.js';
import MessageRow from '../components/MessageRow.js';

interface DashboardViewProps {
  teams: Team[];
  allTasks: Map<string, Task[]>;
  allMessages: Map<string, Message[]>;
  selectedIndex: number;
  onSelectTeam: (name: string) => void;
}

export default function DashboardView({
  teams,
  allTasks,
  allMessages,
  selectedIndex,
  onSelectTeam,
}: DashboardViewProps) {
  const recentMessages: Message[] = [];
  for (const msgs of allMessages.values()) {
    recentMessages.push(...msgs);
  }
  recentMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestMessages = recentMessages.slice(0, 5);

  useInput((input, key) => {
    if (key.return && teams[selectedIndex]) {
      onSelectTeam(teams[selectedIndex].name);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color="cyan">
          {' '}Teams
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {teams.map((team, idx) => (
            <TeamCard
              key={team.name}
              team={team}
              tasks={allTasks.get(team.name) ?? []}
              isSelected={idx === selectedIndex}
            />
          ))}
          {teams.length === 0 && (
            <Box paddingX={1}>
              <Text dimColor>No active teams. Waiting for agent activity...</Text>
            </Box>
          )}
        </Box>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">
          {' '}Recent Messages
        </Text>
        <Box flexDirection="column" marginTop={1} paddingX={1}>
          {latestMessages.map((msg, idx) => (
            <MessageRow key={`${msg.timestamp}-${msg.from}-${idx}`} message={msg} />
          ))}
          {latestMessages.length === 0 && (
            <Text dimColor>No messages yet.</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
