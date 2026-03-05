import React from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task } from '../core/types.js';
import type { AgentActivity } from '../core/sessionParser.js';
import { getAgentColor } from '../utils/colors.js';
import { getActionIcon, SPINNER_FRAMES } from '../utils/icons.js';

interface AgentBadgeProps {
  agent: Agent;
  currentTask?: Task;
  activity?: AgentActivity;
  spinnerFrame: number;
}

export default function AgentBadge({ agent, currentTask, activity, spinnerFrame }: AgentBadgeProps) {
  const isActive = agent.isActive;
  const statusIcon = isActive ? SPINNER_FRAMES[spinnerFrame] : '○';
  const statusColor = isActive ? 'greenBright' : 'gray';

  // Use JSONL activity when available, fall back to task-based activity
  let actionDisplay = '';
  let actionIcon = '';

  if (activity && isActive) {
    actionIcon = activity.lastActionIcon;
    actionDisplay = activity.lastAction;
  } else if (isActive && currentTask) {
    const actionText = currentTask.activeForm ?? currentTask.subject ?? '';
    actionIcon = getActionIcon(actionText);
    actionDisplay = actionText;
  }

  return (
    <Box gap={1}>
      <Text color={statusColor}>{statusIcon}</Text>
      <Text bold color={getAgentColor(agent.name)}>
        {agent.name}
      </Text>
      {isActive && actionDisplay ? (
        <Text dimColor>
          {actionIcon} {actionDisplay}
        </Text>
      ) : isActive ? (
        <Text color="greenBright">● active</Text>
      ) : (
        <Text dimColor>○ idle</Text>
      )}
      {activity?.isThinking && isActive && (
        <Text color="yellow"> 💭</Text>
      )}
    </Box>
  );
}
