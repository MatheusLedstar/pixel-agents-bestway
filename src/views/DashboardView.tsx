import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Team, Task, Message } from '../core/types.js';
import { SECTION_ICONS } from '../utils/icons.js';
import { filterMessages } from '../utils/messageFilter.js';
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
  // Collect and filter messages across all teams
  const latestMessages = useMemo(() => {
    const allMsgs: Message[] = [];
    for (const msgs of allMessages.values()) {
      allMsgs.push(...msgs);
    }
    // Sort newest first
    allMsgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    // Filter out system/JSON noise, take top 8
    return filterMessages(allMsgs).slice(0, 8);
  }, [allMessages]);

  useInput((input, key) => {
    if (key.return && teams[selectedIndex]) {
      onSelectTeam(teams[selectedIndex].name);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Teams section */}
      <Box flexDirection="column" flexGrow={1}>
        <Box gap={1}>
          <Text color="cyan">{SECTION_ICONS.teams}</Text>
          <Text bold color="cyan">Teams</Text>
          {teams.length > 0 && <Text dimColor>({teams.length})</Text>}
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {teams.map((team, idx) => (
            <TeamCard
              key={team.name}
              team={team}
              tasks={allTasks.get(team.name) ?? []}
              isSelected={idx === selectedIndex}
              teamIndex={idx}
            />
          ))}
          {teams.length === 0 && (
            <Box paddingX={1} paddingY={1}>
              <Text dimColor>No active teams. Waiting for agent activity...</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Messages section - only show if there are messages */}
      {latestMessages.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box gap={1}>
            <Text color="green">{SECTION_ICONS.messages}</Text>
            <Text bold color="green">Recent Messages</Text>
          </Box>
          <Box flexDirection="column" marginTop={1} paddingX={1}>
            {latestMessages.map((msg, idx) => (
              <MessageRow
                key={`${msg.timestamp}-${msg.from}-${idx}`}
                message={msg as Message}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
