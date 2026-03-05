import React from 'react';
import { Text } from 'ink';
import { progressPercent } from '../utils/format.js';

interface ProgressBarProps {
  completed: number;
  total: number;
  width?: number;
}

export default function ProgressBar({ completed, total, width = 30 }: ProgressBarProps) {
  const pct = progressPercent(completed, total);
  const filled = total === 0 ? 0 : Math.round((completed / total) * width);
  const empty = width - filled;

  // Use block chars for filled, light shade for empty
  const filledStr = '━'.repeat(filled);
  const emptyStr = '─'.repeat(empty);

  const barColor = pct >= 100 ? 'green' : pct >= 60 ? 'yellow' : 'cyan';

  return (
    <Text>
      <Text color={barColor}>{filledStr}</Text>
      <Text dimColor>{emptyStr}</Text>
      <Text color={barColor}> {pct}%</Text>
      <Text dimColor> ({completed}/{total})</Text>
    </Text>
  );
}
