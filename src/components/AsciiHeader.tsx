import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { glitchText, shiftPattern, shouldFlicker } from '../utils/glitch.js';
import { formatTokens } from '../utils/format.js';
import { SECTION_ICONS } from '../utils/icons.js';

interface AsciiHeaderProps {
  teamCount: number;
  agentCount: number;
  taskCount: number;
  totalTokens: number;
  isRealTokens: boolean;
  spinnerFrame: number;
  filterTeam?: string;
  hasActiveCall?: boolean;
  crossTeamCount?: number;
  termWidth: number;
}

const CALL_PULSE = ['◈', '◇', '◈', '◆'];

// Neon border pattern that shifts each frame
const BORDER_PATTERN = '░▒▓█';

// Logo variants by terminal width
function getLogoLines(width: number): string[] {
  if (width < 80) {
    // Compact: single line
    return ['██▓▒░ PIXEL AGENTS ░▒▓██'];
  }
  if (width < 130) {
    // Normal: stylized block
    return [
      '  ██▓▒░  PIXEL  AGENTS  ░▒▓██  ',
      '  ╚═══════════════════════════╝  ',
    ];
  }
  // Full: wide with decorations
  return [
    '  ╔══════════════════════════════════════════╗  ',
    '  ║  ██▓▒░    P I X E L   A G E N T S    ░▒▓██  ║  ',
    '  ╚══════════════════════════════════════════╝  ',
  ];
}

export default function AsciiHeader({
  teamCount,
  agentCount,
  taskCount,
  totalTokens,
  isRealTokens,
  spinnerFrame,
  filterTeam,
  hasActiveCall,
  crossTeamCount,
  termWidth,
}: AsciiHeaderProps) {
  const flickering = shouldFlicker(spinnerFrame, 77);
  const hasActivity = agentCount > 0;

  const borderLine = useMemo(() => {
    const inner = shiftPattern(BORDER_PATTERN, Math.max(10, termWidth - 4), spinnerFrame);
    return inner;
  }, [termWidth, spinnerFrame]);

  const logoLines = useMemo(() => getLogoLines(termWidth), [termWidth]);

  // Apply glitch to logo text
  const glitchedLogo = useMemo(() => {
    const intensity = hasActivity ? 0.04 : 0.02;
    return logoLines.map((line, i) => glitchText(line, spinnerFrame, intensity, 1337 + i));
  }, [logoLines, spinnerFrame, hasActivity]);

  return (
    <Box flexDirection="column">
      {/* Top neon border */}
      <Text color="cyan" dimColor={flickering}>{borderLine}</Text>

      {/* ASCII Logo */}
      {glitchedLogo.map((line, i) => (
        <Box key={i} justifyContent="center">
          <Text bold color={flickering ? 'gray' : 'cyanBright'}>{line}</Text>
        </Box>
      ))}

      {/* Stats bar */}
      <Box justifyContent="center" gap={2} marginTop={0}>
        {hasActivity && <Text color="greenBright">●</Text>}
        {filterTeam && (
          <Text color="yellowBright" bold>[{filterTeam}]</Text>
        )}
        {hasActiveCall && (
          <Text color="yellowBright" bold>
            {CALL_PULSE[spinnerFrame % CALL_PULSE.length]} CALL
          </Text>
        )}
        <Text>
          <Text color="cyan">{SECTION_ICONS.teams}</Text> <Text color="white">{teamCount}</Text>
        </Text>
        <Text>
          <Text color="green">{SECTION_ICONS.agents}</Text> <Text color="white">{agentCount}</Text>
        </Text>
        <Text>
          <Text color="magenta">{SECTION_ICONS.tasks}</Text> <Text color="white">{taskCount}</Text>
        </Text>
        {totalTokens > 0 && (
          <Text>
            <Text color="yellow">{SECTION_ICONS.tokens}</Text>{' '}
            <Text color="yellow">{formatTokens(totalTokens, isRealTokens)}</Text>
          </Text>
        )}
        {(crossTeamCount ?? 0) > 0 && (
          <Text>
            <Text color="#CC6600">◈</Text> <Text color="#CC6600">{crossTeamCount}</Text>
          </Text>
        )}
      </Box>

      {/* Bottom neon border */}
      <Text color="cyan" dimColor={flickering}>{borderLine}</Text>
    </Box>
  );
}
