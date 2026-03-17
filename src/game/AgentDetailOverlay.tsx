/**
 * AgentDetailOverlay — Full-screen inspection panel for a selected agent.
 *
 * Renders as a centered modal overlay showing:
 *  - 2x-scaled pixel art sprite (animated)
 *  - Agent name, level, title with color coding
 *  - XP progress bar with shimmer
 *  - Achievement badges (rendered pixel art + name + rarity)
 *  - Current task & activity
 *  - Stats breakdown (tasks done, messages, files, deploys)
 *  - Navigation hint
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { AgentGameData } from './types.js';
import { RARITY_COLORS } from './types.js';
import type { ActivityState } from '../map/activityMapper.js';
import { getSprite } from './sprites.js';
import { renderPixelGrid } from './PixelCanvas.js';
import { calculateLevel, ACHIEVEMENTS, getAchievement } from './xpSystem.js';
import type { Task } from '../core/types.js';

// ──────────────────────────────────────────────────────────────
// 2× Sprite scaler
// ──────────────────────────────────────────────────────────────

/**
 * Scale a PixelGrid by 2× horizontally (each pixel becomes 2 chars wide).
 * Vertically, the half-block renderer already doubles, so no vertical scaling needed.
 */
function scalePixelGrid2x(grid: (string | null)[][]): (string | null)[][] {
  return grid.map(row => {
    const scaled: (string | null)[] = [];
    for (const pixel of row) {
      scaled.push(pixel, pixel); // duplicate each pixel horizontally
    }
    return scaled;
  });
}

// ──────────────────────────────────────────────────────────────
// XP shimmer bar
// ──────────────────────────────────────────────────────────────

function shimmerXpBar(progress: number, width: number, frame: number): string {
  const filled = Math.round(progress * width);
  const shimmerPos = frame % (width + 4);
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i < filled) {
      bar += i === shimmerPos ? '◈' : '▰';
    } else {
      bar += '▱';
    }
  }
  return bar;
}

// ──────────────────────────────────────────────────────────────
// Level color
// ──────────────────────────────────────────────────────────────

function getLevelColor(level: number): string {
  if (level >= 9) return 'yellowBright';
  if (level >= 7) return 'magentaBright';
  if (level >= 5) return 'cyanBright';
  if (level >= 3) return 'greenBright';
  return 'white';
}

// ──────────────────────────────────────────────────────────────
// Activity state display
// ──────────────────────────────────────────────────────────────

const STATE_COLORS: Record<ActivityState, string> = {
  idle:        'gray',
  thinking:    'cyanBright',
  reading:     'cyan',
  writing:     'magentaBright',
  searching:   'yellowBright',
  running:     'greenBright',
  testing:     'yellow',
  messaging:   'cyanBright',
  deploying:   'redBright',
  debugging:   'yellow',
  celebrating: 'yellowBright',
  error:       'red',
};

// ──────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────

export interface AgentDetailOverlayProps {
  agentName: string;
  agentType: string;
  activityState: ActivityState;
  activityLabel: string;
  gameData: AgentGameData;
  tasks?: Task[];
  spinnerFrame: number;
  termWidth: number;
  termHeight: number;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function AgentDetailOverlay({
  agentName,
  agentType,
  activityState,
  activityLabel,
  gameData,
  tasks = [],
  spinnerFrame,
  termWidth,
  termHeight,
  onClose,
}: AgentDetailOverlayProps) {
  const frame = spinnerFrame % 2;
  const sprite = getSprite(activityState, agentType, frame);
  const bigSprite = scalePixelGrid2x(sprite);
  const spriteLines = renderPixelGrid(bigSprite);

  const levelInfo = calculateLevel(gameData.xp);
  const xpBar = shimmerXpBar(levelInfo.progress, 20, Math.floor(spinnerFrame / 2));
  const levelColor = getLevelColor(gameData.level);

  // Panel dimensions
  const panelW = Math.min(termWidth - 4, 78);
  const panelH = Math.min(termHeight - 2, 34);

  // All achievements
  const unlockedAchs = ACHIEVEMENTS.filter(a => gameData.achievements.includes(a.id));
  const lockedAchs = ACHIEVEMENTS.filter(a => !gameData.achievements.includes(a.id));

  // Tasks for this agent
  const myTasks = tasks.filter(t => t.owner === agentName);
  const activeTasks = myTasks.filter(t => t.status === 'in_progress');
  const doneTasks = myTasks.filter(t => t.status === 'completed');

  // Animated header border
  const BORDER_SEQ = ['═', '─', '═', '─'];
  const borderChar = BORDER_SEQ[Math.floor(spinnerFrame / 5) % 4] ?? '═';
  const headerLine = `╔${borderChar.repeat(panelW - 2)}╗`;
  const footerLine = `╚${borderChar.repeat(panelW - 2)}╝`;
  const sideLine = (content: string): string => {
    const pad = Math.max(0, panelW - 2 - content.length);
    return `║ ${content}${' '.repeat(pad - 1)}║`;
  };

  // Activity color
  const actColor = STATE_COLORS[activityState] ?? 'white';

  // Stats breakdown
  const stats = [
    { label: 'Tasks Done',  value: String(gameData.tasksDone),              icon: '✓', color: 'greenBright' },
    { label: 'Messages',    value: String(gameData.messagesSent),           icon: '✉', color: 'cyan' },
    { label: 'Files Read',  value: String(gameData.filesRead),              icon: '📖', color: 'blueBright' },
    { label: 'Files Write', value: String(gameData.filesWritten),           icon: '✎', color: 'magentaBright' },
    { label: 'Deploys',     value: String(gameData.deploysCompleted ?? 0),  icon: '🚀', color: 'redBright' },
    { label: 'Tests Run',   value: String(gameData.testsRun ?? 0),          icon: '🧪', color: 'yellowBright' },
  ];

  return (
    <Box
      flexDirection="column"
      width={panelW + 4}
      height={panelH + 4}
      marginLeft={Math.floor((termWidth - panelW - 4) / 2)}
      marginTop={1}
    >
      {/* Dimmed backdrop hint */}
      <Box>
        <Text dimColor>{'░'.repeat(Math.min(termWidth - 2, 60))}</Text>
      </Box>

      {/* Panel */}
      <Box flexDirection="column" borderStyle="double" borderColor="cyanBright" width={panelW}>

        {/* Header */}
        <Box justifyContent="space-between" paddingX={1}>
          <Box gap={1}>
            <Text color="cyanBright" bold>◈ AGENT PROFILE</Text>
            <Text dimColor>│</Text>
            <Text color={levelColor} bold>{agentName}</Text>
          </Box>
          <Box gap={1}>
            <Text dimColor>Lv.{gameData.level} {gameData.title}</Text>
            <Text color="gray" dimColor>[ESC close]</Text>
          </Box>
        </Box>

        {/* Separator */}
        <Text color="cyan" dimColor>{'─'.repeat(panelW - 2)}</Text>

        {/* Main content: sprite + info side by side */}
        <Box flexDirection="row" paddingX={1} gap={2}>

          {/* Left: large sprite + status */}
          <Box flexDirection="column" alignItems="center" width={20}>
            {/* 2× scale sprite */}
            {spriteLines.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            <Text color={levelColor} bold>{agentName}</Text>
            <Text color={levelColor}>{levelInfo.icon} Lv.{gameData.level} {gameData.title}</Text>
            <Text color={actColor}>{activityState.toUpperCase()}</Text>
            {activityLabel && (
              <Text color={actColor} dimColor>
                {activityLabel.length > 18 ? activityLabel.slice(0, 17) + '…' : activityLabel}
              </Text>
            )}
          </Box>

          {/* Right: stats + XP */}
          <Box flexDirection="column" flexGrow={1} gap={1}>

            {/* XP section */}
            <Box flexDirection="column">
              <Text color="cyan" bold>── EXPERIENCE ─────────────────</Text>
              <Box flexDirection="row" gap={1}>
                <Text color="yellowBright">{xpBar}</Text>
                <Text dimColor>{gameData.xp}/{levelInfo.nextLevelXp} XP</Text>
              </Box>
              <Text dimColor>Total earned: {gameData.totalXpEarned ?? gameData.xp} XP</Text>
            </Box>

            {/* Stats grid */}
            <Box flexDirection="column">
              <Text color="cyan" bold>── STATS ───────────────────────</Text>
              <Box flexDirection="row" flexWrap="wrap" gap={2}>
                {stats.map(stat => (
                  <Box key={stat.label} flexDirection="column" width={14}>
                    <Text color={stat.color}>{stat.icon} {stat.value}</Text>
                    <Text dimColor>{stat.label}</Text>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Current task */}
            {activeTasks.length > 0 && (
              <Box flexDirection="column">
                <Text color="cyan" bold>── ACTIVE TASK ─────────────────</Text>
                {activeTasks.slice(0, 2).map(t => (
                  <Box key={t.id} gap={1}>
                    <Text color="yellow" bold>▶</Text>
                    <Text color="white">
                      {t.subject.length > 44 ? t.subject.slice(0, 43) + '…' : t.subject}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Separator */}
        <Text color="cyan" dimColor>{'─'.repeat(panelW - 2)}</Text>

        {/* Achievements row */}
        <Box flexDirection="column" paddingX={1} gap={0}>
          <Text color="cyan" bold>── ACHIEVEMENTS ({unlockedAchs.length}/{ACHIEVEMENTS.length}) ────────────────────</Text>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {ACHIEVEMENTS.map(ach => {
              const unlocked = gameData.achievements.includes(ach.id);
              return (
                <Box key={ach.id} flexDirection="row" gap={0} width={22}>
                  <Text color={unlocked ? RARITY_COLORS[ach.rarity] : 'gray'} bold={unlocked}>
                    {ach.icon}
                  </Text>
                  <Text color={unlocked ? 'white' : 'gray'} dimColor={!unlocked}>
                    {' '}{ach.name.length > 14 ? ach.name.slice(0, 13) + '…' : ach.name.padEnd(14)}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Navigation hint */}
        <Box paddingX={1}>
          <Text color="gray" dimColor>
            ↑↓ scroll  TAB next agent  ESC close
          </Text>
        </Box>

      </Box>
    </Box>
  );
}
