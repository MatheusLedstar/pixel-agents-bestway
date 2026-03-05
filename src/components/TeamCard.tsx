import React from 'react';
import { Box, Text } from 'ink';
import type { Team, Task, TeamTokens } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import { SECTION_ICONS } from '../utils/icons.js';
import { formatTokens } from '../utils/format.js';
import ProgressBar from './ProgressBar.js';
import AgentBadge from './AgentBadge.js';
import Sparkline from './Sparkline.js';

interface TeamCardProps {
  team: Team;
  tasks: Task[];
  isSelected: boolean;
  tokens?: TeamTokens;
  session?: TeamSessionData;
  spinnerFrame: number;
  /** Normalized activity data for sparkline */
  activityData?: number[];
}

export default function TeamCard({ team, tasks, isSelected, tokens, session, spinnerFrame, activityData }: TeamCardProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <Box
      borderStyle={isSelected ? 'bold' : 'single'}
      borderColor={isSelected ? 'cyan' : 'gray'}
      paddingX={1}
      flexDirection="column"
      width="100%"
    >
      {/* Team header */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text bold color={isSelected ? 'cyan' : 'white'}>
            {team.name}
          </Text>
          {team.description && (
            <Text dimColor>· {team.description}</Text>
          )}
        </Box>
        <Box gap={2}>
          <Text dimColor>
            {SECTION_ICONS.agents} <Text color="white">{team.members.length}</Text>
          </Text>
          <Text dimColor>
            {SECTION_ICONS.tasks} <Text color="white">{tasks.length}</Text>
            {activeTasks > 0 && <Text color="yellow"> ({activeTasks} active)</Text>}
          </Text>
          {tokens && tokens.totalTokens > 0 && (
            <Text dimColor>
              {SECTION_ICONS.tokens} <Text color="yellow">{formatTokens(tokens.totalTokens, tokens.isReal)}</Text>
            </Text>
          )}
        </Box>
      </Box>

      {/* Progress bar + sparkline side by side */}
      {tasks.length > 0 && (
        <Box marginTop={1} gap={2}>
          <ProgressBar completed={completedTasks} total={tasks.length} width={30} spinnerFrame={spinnerFrame} />
          {activityData && activityData.length > 1 && (
            <Sparkline data={activityData} width={10} color="greenBright" spinnerFrame={spinnerFrame} />
          )}
        </Box>
      )}

      {/* Separator */}
      <Box marginTop={0}>
        <Text dimColor>╠{'──'.repeat(8)}╣</Text>
      </Box>

      {/* Agent list with live activity */}
      <Box flexDirection="column">
        {team.members.map((agent) => {
          const agentTask = tasks.find(
            (t) => t.owner === agent.name && t.status === 'in_progress',
          );
          const agentActivity = session?.agentActivity.get(agent.name);
          return (
            <AgentBadge
              key={agent.agentId}
              agent={agent}
              currentTask={agentTask}
              activity={agentActivity}
              spinnerFrame={spinnerFrame}
            />
          );
        })}
      </Box>
    </Box>
  );
}
