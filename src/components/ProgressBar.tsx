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

  // Modern block characters for smoother bar
  const filledStr = '━'.repeat(filled);
  const emptyStr = '╌'.repeat(empty);

  // Color based on progress
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
