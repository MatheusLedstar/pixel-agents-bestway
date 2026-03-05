import React from 'react';
import { Box, Text } from 'ink';
import type { ViewType } from '../core/types.js';
import { SPINNER_FRAMES, SECTION_ICONS } from '../utils/icons.js';
import { formatTokens } from '../utils/format.js';

interface HeaderProps {
  currentView: ViewType;
  teamCount: number;
  agentCount: number;
  taskCount: number;
  totalTokens: number;
  isRealTokens: boolean;
  spinnerFrame: number;
  filterTeam?: string;
  hasActiveCall?: boolean;
  crossTeamCount?: number;
}

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  'team-detail': 'Team Detail',
  'task-board': 'Task Board',
  messages: 'Messages',
  'agent-detail': 'Agent Detail',
  usage: 'Usage',
  'cross-team': 'Cross-Team',
};

const CALL_PULSE = ['◈', '◇', '◈', '◆'];

export default function Header({
  currentView,
  teamCount,
  agentCount,
  taskCount,
  totalTokens,
  isRealTokens,
  spinnerFrame,
  filterTeam,
  hasActiveCall,
  crossTeamCount,
}: HeaderProps) {
  const hasActivity = agentCount > 0;

  return (
    <Box borderStyle="bold" borderColor="cyan" paddingX={1} justifyContent="space-between">
      <Box gap={1}>
        {hasActivity && <Text color="greenBright">{SPINNER_FRAMES[spinnerFrame]}</Text>}
        <Text bold color="cyan">
          PIXEL AGENTS
        </Text>
        {filterTeam && (
          <Text color="yellowBright" bold>
            [{filterTeam}]
          </Text>
        )}
        {hasActiveCall && (
          <Text color="yellowBright" bold>
            {CALL_PULSE[spinnerFrame % CALL_PULSE.length]} CALL
          </Text>
        )}
      </Box>
      <Box gap={2}>
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
            <Text color="magentaBright">◈</Text> <Text color="magentaBright">{crossTeamCount}</Text>
          </Text>
        )}
      </Box>
      <Text color="gray">{VIEW_LABELS[currentView]}</Text>
    </Box>
  );
}
