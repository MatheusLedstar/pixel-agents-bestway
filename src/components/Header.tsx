import React from 'react';
import { Box, Text } from 'ink';
import type { ViewType } from '../core/types.js';
import AsciiHeader from './AsciiHeader.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

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
  const termSize = useTerminalSize();

  return (
    <Box flexDirection="column">
      <AsciiHeader
        teamCount={teamCount}
        agentCount={agentCount}
        taskCount={taskCount}
        totalTokens={totalTokens}
        isRealTokens={isRealTokens}
        spinnerFrame={spinnerFrame}
        filterTeam={filterTeam}
        hasActiveCall={hasActiveCall}
        crossTeamCount={crossTeamCount}
        termWidth={termSize.cols}
      />
      {/* View label bar */}
      <Box justifyContent="flex-end" paddingX={1}>
        <Text dimColor>{'─'.repeat(3)} </Text>
        <Text color="gray" bold>{VIEW_LABELS[currentView]}</Text>
        <Text dimColor> {'─'.repeat(3)}</Text>
      </Box>
    </Box>
  );
}
