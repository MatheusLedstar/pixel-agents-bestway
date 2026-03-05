import React from 'react';
import { Text } from 'ink';
import { progressPercent } from '../utils/format.js';

interface ProgressBarProps {
  completed: number;
  total: number;
  width?: number;
}

export default function ProgressBar({ completed, total, width = 20 }: ProgressBarProps) {
  const pct = progressPercent(completed, total);
  const filled = total === 0 ? 0 : Math.round((completed / total) * width);
  const empty = width - filled;

  const filledStr = '\u2588'.repeat(filled);
  const emptyStr = '\u2591'.repeat(empty);

  return (
    <Text>
      <Text color="green">{filledStr}</Text>
      <Text dimColor>{emptyStr}</Text>
      <Text> {pct}% ({completed}/{total})</Text>
    </Text>
  );
}
