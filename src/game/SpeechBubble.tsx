// Speech bubble component displayed above agent sprites
// Shows the current activity/action with animated dots for thinking

import React from 'react';
import { Box, Text } from 'ink';
import type { ActivityState } from '../map/activityMapper.js';

export interface SpeechBubbleProps {
  activityState: ActivityState;
  label: string;
  spinnerFrame: number;
  maxWidth?: number;
  isSelected?: boolean;
}

// Activity state → short display text + color
const STATE_DISPLAY: Record<ActivityState, { text: string; color: string; icon: string }> = {
  idle:        { text: 'idle',      color: 'gray',          icon: '·' },
  thinking:    { text: 'thinking',  color: 'cyanBright',    icon: '?' },
  reading:     { text: 'reading',   color: 'cyan',          icon: '▶' },
  writing:     { text: 'writing',   color: 'magentaBright', icon: '✎' },
  searching:   { text: 'searching', color: 'yellowBright',  icon: '⌕' },
  running:     { text: 'running',   color: 'greenBright',   icon: '▷' },
  testing:     { text: 'testing',   color: 'yellow',        icon: '⚗' },
  messaging:   { text: 'messaging', color: 'cyanBright',    icon: '⟫' },
  deploying:   { text: 'deploy',    color: 'redBright',     icon: '▲' },
  debugging:   { text: 'debug',     color: 'yellow',        icon: '⚙' },
  celebrating: { text: 'done!',     color: 'yellowBright',  icon: '★' },
  error:       { text: 'error',     color: 'red',           icon: '✗' },
};

const THINKING_DOTS = ['   ', '.  ', '.. ', '...'];

export default function SpeechBubble({
  activityState,
  label,
  spinnerFrame,
  maxWidth = 14,
  isSelected = false,
}: SpeechBubbleProps) {
  const display = STATE_DISPLAY[activityState] ?? STATE_DISPLAY['idle']!;
  const isThinking = activityState === 'thinking';
  const isIdle = activityState === 'idle';

  if (isIdle && !isSelected) {
    // Show a minimal dotted line for idle agents
    return (
      <Box flexDirection="column" alignItems="center" width={maxWidth}>
        <Text dimColor>{'·'.repeat(Math.min(6, maxWidth))}</Text>
      </Box>
    );
  }

  // Animated dots for thinking
  const dots = isThinking
    ? THINKING_DOTS[Math.floor(spinnerFrame / 5) % 4] ?? '   '
    : '';

  // Format the content text
  let content = '';
  if (label && label.length > 0 && label !== 'idle') {
    // Truncate label to fit
    const maxLabelLen = maxWidth - 4;
    content = label.length > maxLabelLen ? label.slice(0, maxLabelLen - 1) + '…' : label;
  } else {
    content = display.text + dots;
  }

  const bubbleInner = `${display.icon} ${content}`;
  const bubbleWidth = Math.min(maxWidth - 2, Math.max(6, bubbleInner.length + 2));
  const padded = bubbleInner.length < bubbleWidth - 2
    ? bubbleInner + ' '.repeat(bubbleWidth - 2 - bubbleInner.length)
    : bubbleInner.slice(0, bubbleWidth - 2);

  const topBorder = '╭' + '─'.repeat(bubbleWidth) + '╮';
  const midLine   = '│' + padded + '│';
  const botBorder = '╰' + '─'.repeat(Math.floor(bubbleWidth / 2)) + '╮';
  const tail      = ' '.repeat(Math.floor(bubbleWidth / 2) + 1) + '│';

  return (
    <Box flexDirection="column" alignItems="center" width={maxWidth}>
      <Text color={isSelected ? 'white' : display.color} bold={isSelected}>
        {topBorder}
      </Text>
      <Text color={isSelected ? 'white' : display.color}>
        {midLine}
      </Text>
      <Text color={isSelected ? 'white' : display.color} dimColor>
        {botBorder}
      </Text>
      <Text color={isSelected ? 'white' : display.color} dimColor>
        {tail}
      </Text>
    </Box>
  );
}
