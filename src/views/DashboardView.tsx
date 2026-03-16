import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Team, Task, Message, TeamTokens } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import type { ActivityEvent } from '../hooks/useActivityLog.js';
import { SECTION_ICONS } from '../utils/icons.js';
import { filterMessages } from '../utils/messageFilter.js';
import TeamCard from '../components/TeamCard.js';
import MessageRow from '../components/MessageRow.js';
import ActivityTimeline from '../components/ActivityTimeline.js';

interface DashboardViewProps {
  teams: Team[];
  allTasks: Map<string, Task[]>;
  allMessages: Map<string, Message[]>;
  allTokens: Map<string, TeamTokens>;
  allSessions: Map<string, TeamSessionData>;
  selectedIndex: number;
  onSelectTeam: (name: string) => void;
  spinnerFrame: number;
  /** Activity series per team for sparklines (normalized 0..1) */
  teamActivityData?: Map<string, number[]>;
  /** Activity events for timeline */
  activityEvents?: ActivityEvent[];
}

export default function DashboardView({
  teams,
  allTasks,
  allMessages,
  allTokens,
  allSessions,
  selectedIndex,
  onSelectTeam,
  spinnerFrame,
  teamActivityData,
  activityEvents,
}: DashboardViewProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const visibleTeams = useMemo(() => {
    if (showCompleted) return teams;
    return teams.filter((t) => t.status !== 'completed');
  }, [teams, showCompleted]);

  const latestMessages = useMemo(() => {
    const allMsgs: Message[] = [];
    for (const msgs of allMessages.values()) {
      allMsgs.push(...msgs);
    }
    allMsgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return filterMessages(allMsgs).slice(0, 8);
  }, [allMessages]);

  const completedCount = useMemo(() => {
    return teams.filter((t) => t.status === 'completed').length;
  }, [teams]);

  useInput((input, key) => {
    if (key.return && visibleTeams[selectedIndex]) {
      onSelectTeam(visibleTeams[selectedIndex].name);
    }
    if (input === 'h') {
      setShowCompleted((prev) => !prev);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Teams section */}
      <Box flexDirection="column" flexGrow={1}>
        <Box gap={1}>
          <Text color="cyan">{SECTION_ICONS.teams}</Text>
          <Text bold color="cyan">Teams</Text>
          {visibleTeams.length > 0 && <Text dimColor>({visibleTeams.length})</Text>}
          {!showCompleted && completedCount > 0 && (
            <Text dimColor> +{completedCount} completed</Text>
          )}
        </Box>

        <Box flexDirection="column" marginTop={1}>
          {visibleTeams.map((team, idx) => (
            <TeamCard
              key={team.name}
              team={team}
              tasks={allTasks.get(team.name) ?? []}
              isSelected={idx === selectedIndex}
              tokens={allTokens.get(team.name)}
              session={allSessions.get(team.name)}
              spinnerFrame={spinnerFrame}
              activityData={teamActivityData?.get(team.name)}
            />
          ))}
          {visibleTeams.length === 0 && (
            <Box paddingX={1} paddingY={1}>
              <Text dimColor>No active teams. Waiting for agent activity...</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Messages section */}
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

      {/* Activity Timeline */}
      {activityEvents && activityEvents.length > 0 && (
        <ActivityTimeline events={activityEvents} spinnerFrame={spinnerFrame} />
      )}
    </Box>
  );
}
