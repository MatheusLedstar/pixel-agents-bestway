import React from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
import StatusIndicator from './StatusIndicator.js';

interface AgentBadgeProps {
  agent: Agent;
  currentTask?: Task;
}

export default function AgentBadge({ agent, currentTask }: AgentBadgeProps) {
  return (
    <Box gap={1}>
      <StatusIndicator status={agent.isActive ? 'active' : 'idle'} />
      <Text bold color={getAgentColor(agent.name)}>
        {agent.name}
      </Text>
      {currentTask ? (
        <Text dimColor>
          {currentTask.activeForm ?? currentTask.subject}
        </Text>
      ) : (
        <Text dimColor>{agent.isActive ? 'active' : 'idle'}</Text>
      )}
    </Box>
  );
}
