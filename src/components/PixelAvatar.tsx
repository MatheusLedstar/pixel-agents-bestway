import React from 'react';
import { Box, Text } from 'ink';

export type AvatarState = 'idle' | 'working' | 'thinking' | 'celebrating' | 'error';

interface PixelAvatarProps {
  state: AvatarState;
  spinnerFrame: number;
  agentCount: number;
  activeCount: number;
  completedTasks: number;
  totalTasks: number;
}

// Each frame is an array of strings, one per line.
// All lines are padded to 16 chars for consistent rendering.

const FRAMES: Record<AvatarState, string[][] | string[][]> = {
  idle: [
    [
      '  ╭─────╮  ',
      '  │ ᐧ  ᐧ │  ',
      '  ╰──┬──╯  ',
      ' ╭─┤   ├─╮ ',
      ' │  ╰─╯  │ ',
      ' ╰─┬───┬─╯ ',
      '   │   │   ',
      '   ╰─ ─╯   ',
    ],
  ],

  working: [
    // Frame A - arms wide, eyes open
    [
      '   ╭─────╮  ',
      '   │ ●  ● │  ',
      '   ╰──┬──╯  ',
      ' ╭──┤   ├──╮',
      ' │   ╰─╯   │',
      ' ╰─┬─────┬─╯',
      '   │     │  ',
      '   ╰── ──╯  ',
    ],
    // Frame B - one arm up (typing)
    [
      '   ╭─────╮  ',
      '   │ ◉  ◉ │  ',
      '   ╰──┬──╯  ',
      ' ╭──┤   ├╮  ',
      ' │   ╰─╯ │  ',
      ' ╰─┬────╯   ',
      '   │    ╱   ',
      '   ╰── ╱    ',
    ],
  ],

  thinking: [
    // Frame A - half-circle eyes left, question mark
    [
      '  ╭─────╮ ? ',
      '  │ ◑  ◑ │  ',
      '  ╰──┬──╯   ',
      ' ╭─┤   ├─╮  ',
      ' │  ╰─╯  │  ',
      ' ╰─┬───┬─╯  ',
      '   │   │    ',
      '   ╰─ ─╯    ',
    ],
    // Frame B - half-circle eyes right, exclamation
    [
      '  ╭─────╮ ! ',
      '  │ ◐  ◐ │  ',
      '  ╰──┬──╯   ',
      ' ╭─┤   ├─╮  ',
      ' │  ╰─╯  │  ',
      ' ╰─┬───┬─╯  ',
      '   │   │    ',
      '   ╰─ ─╯    ',
    ],
  ],

  celebrating: [
    // Frame A - star eyes, arms wide + legs spread
    [
      '  ╭─────╮   ',
      '  │ ★  ★ │   ',
      '  ╰──┬──╯   ',
      '╭───┤   ├───╮',
      '│    ╰─╯    │',
      '╰───┬───┬───╯',
      '  ╱ │   │ ╲ ',
      ' ╱  ╰───╯  ╲',
    ],
    // Frame B - sparkle eyes, arms raised
    [
      ' ╲ ╭─────╮ ╱',
      '   │ ✦  ✦ │  ',
      '   ╰──┬──╯  ',
      ' ╭───┤   ├───╮',
      ' │    ╰─╯    │',
      ' ╰───┬───┬───╯',
      '     │   │   ',
      '     ╰───╯   ',
    ],
  ],

  error: [
    [
      '  ╭─────╮  ',
      '  │ ✗  ✗ │  ',
      '  ╰──┬──╯  ',
      ' ╭─┤   ├─╮ ',
      ' │  ╰─╯  │ ',
      ' ╰─┬───┬─╯ ',
      '   │   │   ',
      '   ╰─ ─╯   ',
    ],
  ],
};

const STATE_COLORS: Record<AvatarState, string> = {
  idle: 'gray',
  working: 'cyan',
  thinking: 'yellow',
  celebrating: 'green',
  error: 'red',
};

const STATE_LABELS: Record<AvatarState, string> = {
  idle: 'Idle',
  working: 'Working',
  thinking: 'Thinking',
  celebrating: 'Done!',
  error: 'Error',
};

export function getAvatarState(
  activeAgents: number,
  thinkingAgents: number,
  completedTasks: number,
  totalTasks: number,
  hasErrors: boolean,
): AvatarState {
  if (hasErrors) return 'error';
  if (totalTasks > 0 && completedTasks === totalTasks) return 'celebrating';
  if (thinkingAgents > 0) return 'thinking';
  if (activeAgents > 0) return 'working';
  return 'idle';
}

export default function PixelAvatar({
  state,
  spinnerFrame,
  agentCount,
  activeCount,
  completedTasks,
  totalTasks,
}: PixelAvatarProps) {
  const frames = FRAMES[state];
  const frameIndex = frames.length > 1 ? spinnerFrame % 2 : 0;
  const currentFrame = frames[frameIndex];
  const color = STATE_COLORS[state];
  const label = STATE_LABELS[state];

  return (
    <Box flexDirection="column" alignItems="center">
      {currentFrame.map((line, i) => (
        <Text key={i} color={color}>
          {line}
        </Text>
      ))}
      <Box marginTop={1} flexDirection="column" alignItems="center" gap={0}>
        <Text color={color} dimColor>
          [{label}]
        </Text>
        <Text color="gray">
          {'👤 '}
          <Text color={activeCount > 0 ? color : 'gray'}>
            {activeCount}/{agentCount}
          </Text>
          {' agents'}
        </Text>
        <Text color="gray">
          {'📋 '}
          <Text color={completedTasks > 0 ? 'green' : 'gray'}>
            {completedTasks}/{totalTasks}
          </Text>
          {' tasks'}
        </Text>
      </Box>
    </Box>
  );
}
