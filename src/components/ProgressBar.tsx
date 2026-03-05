import React from 'react';
import { Text } from 'ink';
import { progressPercent } from '../utils/format.js';

interface ProgressBarProps {
  completed: number;
  total: number;
  width?: number;
  spinnerFrame?: number;
}

// Shimmer chars for animated highlight moving across the bar
const SHIMMER = ['░', '▒', '▓', '█', '▓', '▒', '░'];

export default function ProgressBar({ completed, total, width = 30, spinnerFrame = 0 }: ProgressBarProps) {
  const pct = progressPercent(completed, total);
  const filled = total === 0 ? 0 : Math.round((completed / total) * width);
  const empty = width - filled;

  const barColor = pct >= 100 ? 'greenBright' : pct >= 60 ? 'yellowBright' : 'cyanBright';

  // Build bar with shimmer effect on the filled portion
  let bar = '';
  const shimmerPos = spinnerFrame % (width + SHIMMER.length);

  for (let i = 0; i < width; i++) {
    if (i < filled) {
      // Check if shimmer passes over this position
      const shimmerIdx = i - shimmerPos + SHIMMER.length;
      if (shimmerIdx >= 0 && shimmerIdx < SHIMMER.length && pct < 100) {
        bar += SHIMMER[shimmerIdx] ?? '━';
      } else {
        bar += '━';
      }
    } else {
      bar += '─';
    }
  }

  // Split bar into filled and empty parts for coloring
  const filledPart = bar.slice(0, filled);
  const emptyPart = bar.slice(filled);

  return (
    <Text>
      <Text color={barColor}>{filledPart}</Text>
      <Text dimColor>{emptyPart}</Text>
      <Text color={barColor}> {pct}%</Text>
      <Text dimColor> ({completed}/{total})</Text>
    </Text>
  );
}
