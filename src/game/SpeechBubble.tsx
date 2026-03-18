/**
 * SpeechBubble — animated speech bubbles above agent sprites.
 *
 * Each activity state gets a distinct visual treatment:
 *  - thinking:    round thought bubble (○ ○ ○ ...) with ? or lightbulb
 *  - writing:     sharp-cornered code block (< writing: file.ts >)
 *  - error:       jagged/red alert bubble (!! ERROR !!)
 *  - celebrating: sparkles and stars  (★ DONE ★)
 *  - idle:        minimal dots or blank (sitting at desk)
 *  - others:      clean rounded box with activity icon + truncated label
 *
 * Design based on classic game speech bubbles from official pixel art sources.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ActivityState } from '../map/activityMapper.js';

// ──────────────────────────────────────────────────────────────
// State display config
// ──────────────────────────────────────────────────────────────

interface StateConfig {
  icon:    string;
  color:   string;
  style:   'round' | 'sharp' | 'thought' | 'alert' | 'star' | 'none';
  prefix?: string;
  suffix?: string;
}

const STATE_CONFIG: Record<ActivityState, StateConfig> = {
  idle:        { icon: '·',  color: 'gray',          style: 'none'    },
  thinking:    { icon: '?',  color: 'cyanBright',    style: 'thought' },
  reading:     { icon: '▶',  color: 'blueBright',    style: 'round',  prefix: '📖 ' },
  writing:     { icon: '✎',  color: 'magentaBright', style: 'sharp',  prefix: '< ', suffix: ' >' },
  searching:   { icon: '⌕',  color: 'yellowBright',  style: 'round',  prefix: '🔍 ' },
  running:     { icon: '▷',  color: 'greenBright',   style: 'sharp',  prefix: '$ ' },
  testing:     { icon: '⚗',  color: 'yellow',        style: 'round',  prefix: '🧪 ' },
  messaging:   { icon: '☎',  color: 'cyanBright',    style: 'round',  prefix: '📞 ' },
  deploying:   { icon: '▲',  color: 'redBright',     style: 'alert',  prefix: '🚀 ' },
  debugging:   { icon: '⚙',  color: 'yellow',        style: 'sharp',  prefix: '🐛 ' },
  celebrating: { icon: '★',  color: 'yellowBright',  style: 'star'   },
  error:       { icon: '✗',  color: 'red',           style: 'alert',  prefix: '!! ', suffix: ' !!' },
};

// Thought bubble dots animation (thinking state)
const THOUGHT_DOTS = [
  '○ ○ ○',
  '● ○ ○',
  '○ ● ○',
  '○ ○ ●',
];

// Celebrating sparkles animation
const STAR_FRAMES = [
  '★ ✦ ★',
  '✦ ★ ✦',
  '★ ✧ ★',
  '✧ ★ ✦',
];

// ──────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────

export interface SpeechBubbleProps {
  activityState: ActivityState;
  label:         string;
  spinnerFrame:  number;
  maxWidth?:     number;
  isSelected?:   boolean;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function SpeechBubble({
  activityState,
  label,
  spinnerFrame,
  maxWidth = 14,
  isSelected = false,
}: SpeechBubbleProps) {
  const cfg = STATE_CONFIG[activityState] ?? STATE_CONFIG['idle']!;

  // Idle: minimal display
  if (cfg.style === 'none' && !isSelected) {
    return (
      <Box width={maxWidth} justifyContent="center">
        <Text dimColor>{'·····'}</Text>
      </Box>
    );
  }

  const frame4 = Math.floor(spinnerFrame / 4) % 4;
  const frame8 = Math.floor(spinnerFrame / 2) % 8;

  // ── THOUGHT BUBBLE (thinking) ──────────────────────────────
  if (cfg.style === 'thought') {
    const dots = THOUGHT_DOTS[frame4] ?? '○ ○ ○';
    const lightbulb = frame8 < 4 ? '💡' : '?';
    return (
      <Box flexDirection="column" alignItems="center" width={maxWidth}>
        <Text color="cyanBright">{dots}</Text>
        <Text color={isSelected ? 'white' : 'cyanBright'} bold={isSelected}>
          {lightbulb}
        </Text>
      </Box>
    );
  }

  // ── STAR BURST (celebrating) ───────────────────────────────
  if (cfg.style === 'star') {
    const stars = STAR_FRAMES[frame4] ?? '★ ✦ ★';
    return (
      <Box flexDirection="column" alignItems="center" width={maxWidth}>
        <Text color="yellowBright" bold>{stars}</Text>
        <Text color="yellowBright">DONE!</Text>
      </Box>
    );
  }

  // ── Format content text ───────────────────────────────────
  const rawLabel = label && label.length > 0 ? label : cfg.icon + ' ' + activityState;

  // Use prefix/suffix for speech bubble style
  const fullText = (cfg.prefix ?? '') + (rawLabel.length > 0 ? rawLabel : activityState) + (cfg.suffix ?? '');

  // Truncate to fit
  const innerMax = Math.max(4, maxWidth - 4); // 4 = 2 border + 2 padding
  const truncated = fullText.length > innerMax
    ? fullText.slice(0, innerMax - 1) + '…'
    : fullText;

  const contentLen = truncated.length;
  const padded = truncated.padEnd(contentLen);

  // ── ALERT BUBBLE (error, deploying) ───────────────────────
  if (cfg.style === 'alert') {
    const blinkColor = spinnerFrame % 4 < 2 ? cfg.color : 'white';
    const top    = '╔' + '═'.repeat(contentLen + 2) + '╗';
    const mid    = '║ ' + padded + ' ║';
    const bot    = '╚' + '═'.repeat(contentLen + 2) + '╝';
    const tail   = ' '.repeat(Math.floor((contentLen + 4) / 2) - 1) + '▼';
    return (
      <Box flexDirection="column" alignItems="center" width={maxWidth}>
        <Text color={isSelected ? 'white' : blinkColor} bold>{top}</Text>
        <Text color={isSelected ? 'white' : cfg.color}>{mid}</Text>
        <Text color={isSelected ? 'white' : blinkColor}>{bot}</Text>
        <Text color={isSelected ? 'white' : cfg.color} dimColor>{tail}</Text>
      </Box>
    );
  }

  // ── CODE BLOCK (writing, running, debugging) ───────────────
  if (cfg.style === 'sharp') {
    const top    = '┌' + '─'.repeat(contentLen + 2) + '┐';
    const mid    = '│ ' + padded + ' │';
    const bot    = '└' + '─'.repeat(Math.floor((contentLen + 2) / 2)) + '┘';
    const tail   = ' '.repeat(Math.floor((contentLen + 4) / 2) - 1) + '│';
    return (
      <Box flexDirection="column" alignItems="center" width={maxWidth}>
        <Text color={isSelected ? 'white' : cfg.color} bold={isSelected}>{top}</Text>
        <Text color={isSelected ? 'white' : cfg.color}>{mid}</Text>
        <Text color={isSelected ? 'white' : cfg.color} dimColor>{bot}</Text>
        <Text color={isSelected ? 'white' : cfg.color} dimColor>{tail}</Text>
      </Box>
    );
  }

  // ── ROUND BUBBLE (default: reading, searching, testing, etc.) ──
  const top    = '╭' + '─'.repeat(contentLen + 2) + '╮';
  const mid    = '│ ' + padded + ' │';
  const bot    = '╰' + '─'.repeat(Math.floor((contentLen + 2) / 2)) + '╮';
  const tail   = ' '.repeat(Math.floor((contentLen + 4) / 2) - 1) + '│';

  return (
    <Box flexDirection="column" alignItems="center" width={maxWidth}>
      <Text color={isSelected ? 'white' : cfg.color} bold={isSelected}>{top}</Text>
      <Text color={isSelected ? 'white' : cfg.color}>{mid}</Text>
      <Text color={isSelected ? 'white' : cfg.color} dimColor>{bot}</Text>
      <Text color={isSelected ? 'white' : cfg.color} dimColor>{tail}</Text>
    </Box>
  );
}
