import React from 'react';
import { Box, Text } from 'ink';
import type { Team, Task } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
import ProgressBar from './ProgressBar.js';
import StatusIndicator from './StatusIndicator.js';

interface TeamCardProps {
  team: Team;
  tasks: Task[];
  isSelected: boolean;
}

export default function TeamCard({ team, tasks, isSelected }: TeamCardProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return (
    <Box
      borderStyle={isSelected ? 'double' : 'single'}
      borderColor={isSelected ? 'cyan' : 'gray'}
      paddingX={1}
      flexDirection="column"
      width="100%"
    >
      <Box justifyContent="space-between">
        <Text bold color={isSelected ? 'cyan' : 'white'}>
          {team.name}
        </Text>
        {team.description && <Text dimColor>{team.description}</Text>}
      </Box>

      <Box marginTop={1}>
        <ProgressBar completed={completedTasks} total={tasks.length} width={15} />
      </Box>

      <Box marginTop={1} flexDirection="column">
        {team.members.map((agent) => {
          const agentTask = tasks.find((t) => t.owner === agent.name && t.status === 'in_progress');
          return (
            <Box key={agent.agentId} gap={1}>
              <StatusIndicator status={agent.isActive ? 'active' : 'idle'} />
              <Text color={getAgentColor(agent.name)}>{agent.name}</Text>
              {agentTask && (
                <Text dimColor>
                  {' '}
                  {agentTask.activeForm ?? agentTask.subject}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
