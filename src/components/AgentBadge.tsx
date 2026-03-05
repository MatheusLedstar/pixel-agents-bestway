import React from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task } from '../core/types.js';
import type { AgentActivity } from '../core/sessionParser.js';
import { getAgentColor } from '../utils/colors.js';
import { getActionIcon, SPINNER_FRAMES } from '../utils/icons.js';
import { getAvatarConfig } from '../map/avatarConfig.js';
import { mapActivity } from '../map/activityMapper.js';

interface AgentBadgeProps {
  agent: Agent;
  currentTask?: Task;
  activity?: AgentActivity;
  spinnerFrame: number;
}

// Mini monitor bar: 4 chars animated from activityMapper frames
function miniMonitor(activity: AgentActivity | undefined, isActive: boolean, frame: number): string {
  if (!isActive) return '▱▱▱▱';
  const visual = mapActivity(activity);
  const frames = visual.monitorFrames;
  if (frames.length === 0) return '▱▱▱▱';
  const fullFrame = frames[frame % frames.length] ?? '▱▱▱▱▱▱▱▱';
  // Take first 4 chars
  return fullFrame.slice(0, 4);
}

// Heat color based on activity state
function heatColor(isActive: boolean, activity: AgentActivity | undefined): string {
  if (!isActive) return 'gray';
  if (!activity) return 'greenBright';
  if (activity.isThinking) return 'cyanBright';
  const visual = mapActivity(activity);
  switch (visual.state) {
    case 'writing': return 'magentaBright';
    case 'running': return 'yellowBright';
    case 'testing': return 'yellowBright';
    case 'error': return 'redBright';
    case 'searching': return 'yellowBright';
    default: return 'greenBright';
  }
}

export default function AgentBadge({ agent, currentTask, activity, spinnerFrame }: AgentBadgeProps) {
  const isActive = agent.isActive;
  const statusIcon = isActive ? SPINNER_FRAMES[spinnerFrame] : '○';
  const statusColor = isActive ? 'greenBright' : 'gray';
  const avatar = getAvatarConfig(agent.agentType, agent.name);
  const heat = heatColor(!!isActive, activity);

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

  const monitor = miniMonitor(activity, !!isActive, spinnerFrame);

  return (
    <Box gap={1}>
      <Text color={statusColor}>{statusIcon}</Text>
      {/* Avatar tag */}
      <Text color={avatar.color} dimColor>{avatar.tag.padEnd(4)}</Text>
      {/* Mini monitor bar */}
      <Text color={heat}>{monitor}</Text>
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
