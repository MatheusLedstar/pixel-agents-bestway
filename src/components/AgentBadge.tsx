import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
import { getActionIcon, SPINNER_FRAMES } from '../utils/icons.js';

interface AgentBadgeProps {
  agent: Agent;
  currentTask?: Task;
  compact?: boolean;
}

export default function AgentBadge({ agent, currentTask, compact = false }: AgentBadgeProps) {
  const [frame, setFrame] = useState(0);
  const isActive = agent.isActive;

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, [isActive]);

  // Determine action icon from task activeForm or status
  const actionText = currentTask?.activeForm ?? currentTask?.subject ?? '';
  const actionIcon = isActive && actionText ? getActionIcon(actionText) : '';

  const statusIcon = isActive ? SPINNER_FRAMES[frame] : '󰏤';
  const statusColor = isActive ? 'greenBright' : 'gray';

  if (compact) {
    return (
      <Box gap={1}>
        <Text color={statusColor}>{statusIcon}</Text>
        <Text bold color={getAgentColor(agent.name)}>{agent.name}</Text>
        {actionIcon && <Text>{actionIcon}</Text>}
      </Box>
    );
  }

  return (
    <Box gap={1}>
      <Text color={statusColor}>{statusIcon}</Text>
      <Text bold color={getAgentColor(agent.name)}>
        {agent.name}
      </Text>
      {isActive && currentTask ? (
        <Text dimColor>
          {actionIcon} {currentTask.activeForm ?? currentTask.subject}
        </Text>
      ) : isActive ? (
        <Text color="greenBright"> active</Text>
      ) : (
        <Text dimColor>󰏤 idle</Text>
      )}
    </Box>
  );
}
