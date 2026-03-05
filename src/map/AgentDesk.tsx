import React from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task } from '../core/types.js';
import type { AgentActivity } from '../core/sessionParser.js';
import { getAvatarConfig } from './avatarConfig.js';
import { mapActivity, THINKING_FRAMES } from './activityMapper.js';
import { truncate } from '../utils/format.js';

interface AgentDeskProps {
  agent: Agent;
  activity?: AgentActivity;
  task?: Task;
  spinnerFrame: number;
  deskWidth: number;
  compact?: boolean;
}

// Pulse effect: border alternates brightness with spinnerFrame
const PULSE_CHARS = ['░', '▒', '▓', '█', '▓', '▒', '░', ' '];

export default function AgentDesk({ agent, activity, task, spinnerFrame, deskWidth, compact }: AgentDeskProps) {
  const config = getAvatarConfig(agent.agentType, agent.name);
  const visual = mapActivity(activity);

  const isActive = visual.state !== 'idle';
  const isDone = task?.status === 'completed';

  // Neon border color
  let borderColor = 'gray';
  if (isDone || visual.state === 'celebrating') borderColor = 'greenBright';
  else if (visual.state === 'error') borderColor = 'redBright';
  else if (isActive) borderColor = config.borderColor;

  // Monitor bar: scale to desk width
  const barLen = Math.max(4, deskWidth - 4);
  const rawFrame = visual.monitorFrames[spinnerFrame % visual.monitorFrames.length] ?? '';
  const monitorBar = rawFrame.length >= barLen
    ? rawFrame.slice(0, barLen)
    : rawFrame + '▱'.repeat(Math.max(0, barLen - rawFrame.length));

  // Activity label
  let activityIcon = '';
  let activityText = '';
  let activityColor = 'gray';

  if (visual.state === 'thinking') {
    const frame = THINKING_FRAMES[spinnerFrame % THINKING_FRAMES.length] ?? '⣾';
    activityIcon = frame;
    activityText = 'THINKING';
    activityColor = 'cyanBright';
  } else if (isActive) {
    activityIcon = visual.icon;
    activityText = truncate(visual.label, compact ? 6 : deskWidth - 2);
    activityColor = visual.labelColor;
  } else if (isDone) {
    activityIcon = '✓';
    activityText = 'DONE';
    activityColor = 'greenBright';
  }

  // Pulse indicator for active agents
  const pulse = isActive ? PULSE_CHARS[spinnerFrame % PULSE_CHARS.length] : '';

  const nameMaxLen = compact ? 8 : deskWidth;

  return (
    <Box flexDirection="column" alignItems="center" width={deskWidth + 6} marginX={1}>
      {/* Activity label above desk */}
      {activityText ? (
        <Text color={activityColor} bold wrap="truncate">
          {activityIcon} {activityText}
        </Text>
      ) : (
        <Text> </Text>
      )}

      {/* Desk — double border cyberpunk */}
      <Box
        borderStyle="double"
        borderColor={borderColor}
        width={deskWidth}
        flexDirection="column"
        alignItems="center"
      >
        {/* Agent icon + role tag + pulse */}
        <Text>
          <Text color={config.color} bold>{config.icon}</Text>
          <Text color="gray">:</Text>
          <Text color={config.color}>{config.tag}</Text>
          {pulse ? <Text color={borderColor}> {pulse}</Text> : null}
        </Text>

        {/* Monitor bar — animated */}
        <Text color={isActive ? activityColor : 'gray'}>
          {monitorBar}
        </Text>
      </Box>

      {/* Agent name */}
      <Text color={config.color} bold dimColor={!isActive && !isDone}>
        {truncate(agent.name, nameMaxLen)}
      </Text>
    </Box>
  );
}
