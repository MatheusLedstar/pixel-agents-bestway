import React from 'react';
import { Box, Text } from 'ink';
import type { Team, Task } from '../core/types.js';
import { getTeamIcon, SECTION_ICONS } from '../utils/icons.js';
import ProgressBar from './ProgressBar.js';
import AgentBadge from './AgentBadge.js';

interface TeamCardProps {
  team: Team;
  tasks: Task[];
  isSelected: boolean;
  teamIndex?: number;
}

export default function TeamCard({ team, tasks, isSelected, teamIndex = 0 }: TeamCardProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const teamIcon = getTeamIcon(teamIndex);

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
          <Text color={isSelected ? 'cyan' : 'white'}>{teamIcon}</Text>
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
        </Box>
      </Box>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <Box marginTop={1}>
          <ProgressBar completed={completedTasks} total={tasks.length} width={20} />
        </Box>
      )}

      {/* Agent list */}
      <Box marginTop={1} flexDirection="column">
        {team.members.map((agent) => {
          const agentTask = tasks.find(
            (t) => t.owner === agent.name && t.status === 'in_progress',
          );
          return (
            <AgentBadge key={agent.agentId} agent={agent} currentTask={agentTask} />
          );
        })}
      </Box>
    </Box>
  );
}
