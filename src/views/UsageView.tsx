import React from 'react';
import { Box, Text } from 'ink';
import type { UsageData } from '../core/types.js';
import type { TerminalSize } from '../hooks/useTerminalSize.js';
import { formatTokens } from '../utils/format.js';

interface UsageViewProps {
  usage: UsageData;
  spinnerFrame: number;
  termSize: TerminalSize;
}

// Shimmer chars for animated bar
const SHIMMER = ['░', '▒', '▓', '█', '▓', '▒', '░'];

// Model colors
const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4-6': 'cyanBright',
  'claude-sonnet-4-6': 'magentaBright',
  'claude-haiku-4-5-20251001': 'yellowBright',
};

function getModelColor(name: string): string {
  return MODEL_COLORS[name] ?? 'white';
}

function getModelShortName(name: string): string {
  if (name.includes('opus')) return 'opus-4-6';
  if (name.includes('sonnet')) return 'sonnet-4-6';
  if (name.includes('haiku')) return 'haiku-4-5';
  return name;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

function buildBar(filled: number, total: number, width: number, frame: number): string {
  const filledW = total === 0 ? 0 : Math.round((filled / total) * width);
  let bar = '';
  const shimmerPos = frame % (width + SHIMMER.length);

  for (let i = 0; i < width; i++) {
    if (i < filledW) {
      const shimmerIdx = i - shimmerPos + SHIMMER.length;
      if (shimmerIdx >= 0 && shimmerIdx < SHIMMER.length) {
        bar += SHIMMER[shimmerIdx] ?? '━';
      } else {
        bar += '━';
      }
    } else {
      bar += '─';
    }
  }
  return bar;
}

// Wave generation for decoration
const WAVE_CHARS = '░▒▓█▓▒░ ';
function generateWave(width: number, frame: number): string {
  let wave = '';
  for (let i = 0; i < width; i++) {
    const idx1 = (i + frame * 2) % WAVE_CHARS.length;
    const idx2 = (i * 2 + frame) % WAVE_CHARS.length;
    const c1 = WAVE_CHARS[idx1] ?? ' ';
    const c2 = WAVE_CHARS[idx2] ?? ' ';
    wave += c1 > c2 ? c1 : c2;
  }
  return wave;
}

// Particle generation for decoration
const PARTICLE_CHARS = ['·', '∙', '•', '✦', '✧', '⋆', '◦', '°'];
function renderParticleLine(width: number, frame: number, seed: number, count: number): string {
  const line = new Array<string>(width).fill(' ');
  for (let i = 0; i < count; i++) {
    const hash = ((seed + i) * 7919 + frame * 131) % 10007;
    const pos = (hash + frame * (i + 1)) % width;
    const charIdx = (hash * 3) % PARTICLE_CHARS.length;
    if (pos >= 0 && pos < width) {
      line[pos] = PARTICLE_CHARS[charIdx] ?? '·';
    }
  }
  return line.join('');
}

export default function UsageView({ usage, spinnerFrame, termSize }: UsageViewProps) {
  const contentWidth = Math.min(termSize.cols - 6, Math.max(60, Math.floor(termSize.cols * 0.85)));
  const innerWidth = contentWidth - 4; // Padding inside borders
  const barWidth = Math.max(20, innerWidth - 40);

  if (usage.loading) {
    const dots = '.'.repeat((spinnerFrame % 3) + 1);
    return (
      <Box flexDirection="column" alignItems="center" width={termSize.cols - 4}>
        <Box justifyContent="center">
          <Text color="cyan" dimColor>{generateWave(contentWidth, spinnerFrame)}</Text>
        </Box>
        <Box borderStyle="double" borderColor="cyanBright" width={contentWidth} justifyContent="center" paddingY={2}>
          <Text color="cyanBright" bold>Loading usage data{dots}</Text>
        </Box>
        <Box justifyContent="center">
          <Text color="cyan" dimColor>{generateWave(contentWidth, spinnerFrame)}</Text>
        </Box>
      </Box>
    );
  }

  if (usage.error) {
    return (
      <Box flexDirection="column" alignItems="center" width={termSize.cols - 4}>
        <Box borderStyle="double" borderColor="redBright" width={contentWidth} flexDirection="column" paddingX={2} paddingY={1}>
          <Text color="redBright" bold>◈ ERROR ◈</Text>
          <Text color="red">{usage.error}</Text>
          <Text dimColor>Press r to retry</Text>
        </Box>
      </Box>
    );
  }

  const maxModelTokens = Math.max(...usage.modelBreakdowns.map((m) => m.cost), 1);
  const totalBar = buildBar(usage.totalTokens, usage.totalTokens, barWidth, spinnerFrame);
  const timeStr = usage.lastUpdated.toLocaleTimeString();

  return (
    <Box flexDirection="column" alignItems="center" width={termSize.cols - 4}>
      {/* Top particles */}
      <Box justifyContent="center">
        <Text color="cyan" dimColor>{renderParticleLine(contentWidth, spinnerFrame, 77, Math.ceil(contentWidth / 8))}</Text>
      </Box>

      {/* Top wave */}
      <Box justifyContent="center">
        <Text color="cyanBright" dimColor>{generateWave(contentWidth, spinnerFrame)}</Text>
      </Box>

      {/* Main container */}
      <Box borderStyle="double" borderColor="cyanBright" width={contentWidth} flexDirection="column" paddingX={2}>
        {/* Header */}
        <Box justifyContent="space-between">
          <Text bold color="cyanBright">◈ TOKEN USAGE ◈</Text>
          <Box gap={2}>
            <Text color="gray">{usage.date}</Text>
            <Text dimColor>Updated {timeStr}</Text>
          </Box>
        </Box>

        {/* Separator */}
        <Box>
          <Text color="gray" dimColor>{'─'.repeat(innerWidth)}</Text>
        </Box>

        {/* Total section */}
        <Box justifyContent="space-between" marginTop={1}>
          <Text bold color="white">TOTAL TODAY</Text>
          <Box gap={2}>
            <Text color="yellowBright" bold>{formatCost(usage.totalCost)} USD</Text>
          </Box>
        </Box>

        <Box>
          <Text color="cyanBright">{totalBar}</Text>
          <Text color="white"> {formatTokens(usage.totalTokens, true)} tokens</Text>
        </Box>

        {/* Model breakdown */}
        {usage.modelBreakdowns.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Box>
              <Text color="gray">╭─ </Text>
              <Text bold color="white">BY MODEL</Text>
              <Text color="gray"> {'─'.repeat(Math.max(1, innerWidth - 14))}╮</Text>
            </Box>

            {usage.modelBreakdowns.map((model, idx) => {
              const color = getModelColor(model.modelName);
              const shortName = getModelShortName(model.modelName);
              const pct = usage.totalCost > 0 ? Math.round((model.cost / usage.totalCost) * 100) : 0;
              const modelBarW = Math.max(4, barWidth - 30);
              const bar = buildBar(model.cost, maxModelTokens, modelBarW, spinnerFrame + idx * 3);
              const totalModelTokens = model.inputTokens + model.outputTokens + model.cacheCreationTokens + model.cacheReadTokens;

              return (
                <Box key={model.modelName}>
                  <Text color="gray">│ </Text>
                  <Text color={color} bold>■</Text>
                  <Text color={color}> {shortName.padEnd(12)}</Text>
                  <Text color={color}>{bar}</Text>
                  <Text color="white"> {formatTokens(totalModelTokens, true).padStart(7)}</Text>
                  <Text color="yellowBright"> {formatCost(model.cost).padStart(8)}</Text>
                  <Text dimColor> {String(pct).padStart(3)}%</Text>
                  <Text color="gray"> │</Text>
                </Box>
              );
            })}

            <Box>
              <Text color="gray">╰{'─'.repeat(Math.max(1, innerWidth - 2))}╯</Text>
            </Box>
          </Box>
        )}

        {/* Breakdown details */}
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color="gray">╭─ </Text>
            <Text bold color="white">BREAKDOWN</Text>
            <Text color="gray"> {'─'.repeat(Math.max(1, innerWidth - 16))}╮</Text>
          </Box>

          <Box>
            <Text color="gray">│ </Text>
            <Box width={Math.floor(innerWidth / 3)}>
              <Text dimColor>Input       </Text>
              <Text color="cyanBright">{formatTokens(usage.inputTokens, true).padStart(8)}</Text>
            </Box>
            <Text color="gray"> │ </Text>
            <Box width={Math.floor(innerWidth / 3)}>
              <Text dimColor>Cache Create </Text>
              <Text color="magentaBright">{formatTokens(usage.cacheCreationTokens, true).padStart(8)}</Text>
            </Box>
            <Text color="gray"> │ </Text>
            <Box flexGrow={1}>
              <Text dimColor>Cost    </Text>
              <Text color="yellowBright" bold>{formatCost(usage.totalCost).padStart(8)}</Text>
            </Box>
            <Text color="gray"> │</Text>
          </Box>

          <Box>
            <Text color="gray">│ </Text>
            <Box width={Math.floor(innerWidth / 3)}>
              <Text dimColor>Output      </Text>
              <Text color="greenBright">{formatTokens(usage.outputTokens, true).padStart(8)}</Text>
            </Box>
            <Text color="gray"> │ </Text>
            <Box width={Math.floor(innerWidth / 3)}>
              <Text dimColor>Cache Read   </Text>
              <Text color="blueBright">{formatTokens(usage.cacheReadTokens, true).padStart(8)}</Text>
            </Box>
            <Text color="gray"> │ </Text>
            <Box flexGrow={1}>
              <Text dimColor>Models  </Text>
              <Text color="white">{String(usage.modelBreakdowns.length).padStart(8)}</Text>
            </Box>
            <Text color="gray"> │</Text>
          </Box>

          <Box>
            <Text color="gray">╰{'─'.repeat(Math.max(1, innerWidth - 2))}╯</Text>
          </Box>
        </Box>

        {/* Inner particles */}
        <Box marginTop={1} justifyContent="center">
          <Text color="magenta" dimColor>{renderParticleLine(innerWidth, spinnerFrame, 333, Math.ceil(innerWidth / 10))}</Text>
        </Box>
      </Box>

      {/* Bottom wave */}
      <Box justifyContent="center">
        <Text color="magentaBright" dimColor>{generateWave(contentWidth, spinnerFrame)}</Text>
      </Box>

      {/* Bottom particles */}
      <Box justifyContent="center">
        <Text color="green" dimColor>{renderParticleLine(contentWidth, spinnerFrame, 555, Math.ceil(contentWidth / 8))}</Text>
      </Box>

      {/* Auto-refresh note */}
      <Box justifyContent="center">
        <Text dimColor>Auto-refreshes every 60s • Press r to refresh now</Text>
      </Box>
    </Box>
  );
}
