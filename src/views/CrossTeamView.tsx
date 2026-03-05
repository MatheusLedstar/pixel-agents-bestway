import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { CrossTeamData } from '../core/types.js';
import { formatTimestamp, truncate, relativeTime } from '../utils/format.js';

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

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="magentaBright" paddingX={1} justifyContent="space-between">
        <Text color="magentaBright" bold>◈ CROSS-TEAM NETWORK ◈</Text>
        <Text dimColor>{registry.length} team{registry.length !== 1 ? 's' : ''}</Text>
      </Box>

      {/* Teams Registry */}
      <Box marginTop={1} flexDirection="column">
        <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1}>
          <Text color="cyanBright" bold>TEAMS</Text>
          {registry.length === 0 ? (
            <Text dimColor>No teams registered. Start pixel-agents with --team to register.</Text>
          ) : (
            registry.map((card) => {
              const total = card.tasksSummary.pending + card.tasksSummary.in_progress + card.tasksSummary.completed;
              const done = card.tasksSummary.completed;
              const barWidth = 10;
              const bar = buildProgressBar(done, total, barWidth);
              const sl = statusLabel(card.status);

              return (
                <Box key={card.teamName} gap={1}>
                  <Text color={card.status === 'active' ? 'greenBright' : 'gray'}>
                    {card.status === 'active' ? '●' : '○'}
                  </Text>
                  <Text color="white" bold>{truncate(card.teamName, 20).padEnd(20)}</Text>
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
            messages.slice(0, 15).map((msg) => {
              const time = formatTimestamp(msg.timestamp);
              const target = msg.toTeam ? msg.toTeam : 'ALL';
              const typeIcon = msg.type === 'call_invite' ? '📞'
                : msg.type === 'status_update' ? '📊'
                : msg.type === 'call_join' ? '→'
                : msg.type === 'call_leave' ? '←'
                : '›';

              return (
                <Box key={msg.id} gap={1}>
                  <Text dimColor>{time}</Text>
                  <Text color="cyanBright">{truncate(msg.fromTeam, 15)}</Text>
                  <Text dimColor>{typeIcon}</Text>
                  <Text color="magentaBright">{truncate(target, 15)}</Text>
                  <Text>{truncate(msg.content, 50)}</Text>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Animated particles footer */}
      <Box justifyContent="center" marginTop={1}>
        <Text color="magentaBright" dimColor>{particleLine}</Text>
      </Box>
    </Box>
  );
}
