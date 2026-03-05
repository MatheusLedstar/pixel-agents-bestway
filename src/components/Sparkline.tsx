import React from 'react';
import { Text } from 'ink';

interface SparklineProps {
  /** Normalized 0..1 values */
  data: number[];
  /** Max chars width for sparkline */
  width?: number;
  color?: string;
  /** Animation frame for pulsing last point */
  spinnerFrame?: number;
  /** Label prefix */
  label?: string;
}

const SPARK_CHARS = '▁▂▃▄▅▆▇█';

/** Resample data array to fit target width */
function resample(data: number[], targetWidth: number): number[] {
  if (data.length === 0) return [];
  if (data.length <= targetWidth) return data;

  const result: number[] = [];
  const step = data.length / targetWidth;
  for (let i = 0; i < targetWidth; i++) {
    const idx = Math.min(Math.floor(i * step), data.length - 1);
    result.push(data[idx]!);
  }
  return result;
}

export default function Sparkline({ data, width = 12, color = 'cyanBright', spinnerFrame = 0, label }: SparklineProps) {
  if (data.length === 0) {
    return (
      <Text dimColor>
        {label ? `${label} ` : ''}{'▁'.repeat(width)}
      </Text>
    );
  }

  const resampled = resample(data, width);
  const maxLevel = SPARK_CHARS.length - 1;

  const chars = resampled.map((val, idx) => {
    const level = Math.min(maxLevel, Math.round(val * maxLevel));
    return SPARK_CHARS[level]!;
  });

  // Pulse last point: alternate between actual and one level up
  if (chars.length > 0) {
    const lastIdx = chars.length - 1;
    const lastVal = resampled[lastIdx]!;
    const baseLevel = Math.min(maxLevel, Math.round(lastVal * maxLevel));
    const pulseLevel = spinnerFrame % 4 < 2
      ? Math.min(maxLevel, baseLevel + 1)
      : baseLevel;
    chars[lastIdx] = SPARK_CHARS[pulseLevel]!;
  }

  const sparkStr = chars.join('');

  return (
    <Text>
      {label && <Text dimColor>{label} </Text>}
      <Text color={color}>{sparkStr}</Text>
    </Text>
  );
}
