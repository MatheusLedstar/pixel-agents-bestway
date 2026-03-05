import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import type { CrossTeamData } from '../core/types.js';
import { formatTimestamp, truncate, relativeTime } from '../utils/format.js';
import { glitchText, shouldFlicker } from '../utils/glitch.js';
import NetworkTopology from '../components/NetworkTopology.js';

interface CrossTeamViewProps {
  crossTeam: CrossTeamData;
  spinnerFrame: number;
}

// Animated particle decorations
const PARTICLES = ['·', '✦', '·', '⋆', '◦', '·', '✦', '·'];
const WAVE_CHARS = ['░', '▒', '▓', '█', '▓', '▒', '░'];

function buildProgressBar(completed: number, total: number, width: number): string {
  if (total === 0) return '─'.repeat(width);
  const filled = Math.round((completed / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export default function CrossTeamView({ crossTeam, spinnerFrame }: CrossTeamViewProps) {
  const { registry, messages, activeCall } = crossTeam;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Total scrollable items: teams + messages
  const totalItems = registry.length + messages.length;

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(totalItems - 1, prev + 1));
    }
  });

  const particleLine = useMemo(() => {
    const offset = spinnerFrame % PARTICLES.length;
    const wave = WAVE_CHARS.map((_, i) => WAVE_CHARS[(i + spinnerFrame) % WAVE_CHARS.length]).join('');
    const left = PARTICLES.slice(offset).concat(PARTICLES.slice(0, offset)).join('');
    return `  ${left} ${wave}  ${wave} ${left}`;
  }, [spinnerFrame]);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'ACT', color: 'greenBright' as const };
      case 'idle': return { text: 'IDLE', color: 'yellowBright' as const };
      case 'completed': return { text: 'DONE', color: 'gray' as const };
      default: return { text: '???', color: 'gray' as const };
    }
  };

  const flickering = shouldFlicker(spinnerFrame, 55);
  const headerText = glitchText('◈ CROSS-TEAM NETWORK ◈', spinnerFrame, 0.06, 55);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with glitch */}
      <Box borderStyle="double" borderColor="#CC6600" paddingX={1} justifyContent="space-between">
        <Text color="#CC6600" bold dimColor={flickering}>{headerText}</Text>
        <Text dimColor>{registry.length} team{registry.length !== 1 ? 's' : ''}</Text>
      </Box>

      {/* Network Topology Graph */}
      {registry.length > 1 && (
        <Box marginTop={1}>
          <NetworkTopology registry={registry} spinnerFrame={spinnerFrame} />
        </Box>
      )}

      {/* Teams Registry */}
      <Box marginTop={1} flexDirection="column">
        <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1}>
          <Text color="cyanBright" bold>TEAMS</Text>
          {registry.length === 0 ? (
            <Text dimColor>No teams registered. Start pixel-agents with --team to register.</Text>
          ) : (
            registry.map((card, idx) => {
              const total = card.tasksSummary.pending + card.tasksSummary.in_progress + card.tasksSummary.completed;
              const done = card.tasksSummary.completed;
              const barWidth = 10;
              const bar = buildProgressBar(done, total, barWidth);
              const sl = statusLabel(card.status);
              const isSelected = idx === selectedIndex;

              return (
                <Box key={card.teamName} gap={1}>
                  <Text color={isSelected ? 'yellowBright' : (card.status === 'active' ? 'greenBright' : 'gray')}>
                    {isSelected ? '▸' : (card.status === 'active' ? '●' : '○')}
                  </Text>
                  <Text color={isSelected ? 'yellowBright' : 'white'} bold>{truncate(card.teamName, 20).padEnd(20)}</Text>
                  <Text dimColor>{String(card.memberCount).padStart(2)} agents</Text>
                  <Text color={done === total && total > 0 ? 'greenBright' : 'cyanBright'}>{bar}</Text>
                  <Text dimColor>{total > 0 ? `${done}/${total} tasks` : 'no tasks'}</Text>
                  <Text color={sl.color}>{sl.text.padStart(4)}</Text>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Active Call */}
      {activeCall && activeCall.participants.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box borderStyle="round" borderColor="yellowBright" flexDirection="column" paddingX={1}>
            <Text color="yellowBright" bold>ACTIVE CALL</Text>
            <Box gap={1}>
              <Text color="yellowBright">📞</Text>
              <Text color="cyanBright">
                {activeCall.participants.map((p) => `${p.teamName}:${p.agentName}`).join(' ←→ ')}
              </Text>
            </Box>
            <Box gap={2}>
              {activeCall.topic && <Text dimColor>Topic: {activeCall.topic}</Text>}
              <Text dimColor>Started: {relativeTime(activeCall.startedAt)}</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Cross-Team Messages */}
      <Box marginTop={1} flexDirection="column" flexGrow={1}>
        <Box borderStyle="round" borderColor="green" flexDirection="column" paddingX={1}>
          <Text color="greenBright" bold>CROSS-TEAM MESSAGES</Text>
          {messages.length === 0 ? (
            <Text dimColor>No cross-team messages yet.</Text>
          ) : (
            messages.slice(0, 15).map((msg, idx) => {
              const msgIdx = registry.length + idx;
              const isSelected = msgIdx === selectedIndex;
              const time = formatTimestamp(msg.timestamp);
              const target = msg.toTeam ? msg.toTeam : 'ALL';
              const typeIcon = msg.type === 'call_invite' ? '📞'
                : msg.type === 'status_update' ? '📊'
                : msg.type === 'call_join' ? '→'
                : msg.type === 'call_leave' ? '←'
                : '›';

              return (
                <Box key={msg.id} gap={1}>
                  <Text color={isSelected ? 'yellowBright' : 'gray'}>{isSelected ? '▸' : ' '}</Text>
                  <Text dimColor>{time}</Text>
                  <Text color="cyanBright">{truncate(msg.fromTeam, 15)}</Text>
                  <Text dimColor>{typeIcon}</Text>
                  <Text color="#90EE90">{truncate(target, 15)}</Text>
                  <Text color={isSelected ? 'white' : undefined}>{truncate(msg.content, 50)}</Text>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Animated particles footer */}
      <Box justifyContent="center" marginTop={1}>
        <Text color="#CC6600" dimColor>{particleLine}</Text>
      </Box>
    </Box>
  );
}
