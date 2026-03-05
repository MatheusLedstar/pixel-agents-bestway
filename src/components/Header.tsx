import React from 'react';
import { Box, Text } from 'ink';
import type { ViewType } from '../core/types.js';

interface HeaderProps {
  currentView: ViewType;
  teamCount: number;
  agentCount: number;
  taskCount: number;
}

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  'team-detail': 'Team Detail',
  'task-board': 'Task Board',
  messages: 'Messages',
  'agent-detail': 'Agent Detail',
};

export default function Header({ currentView, teamCount, agentCount, taskCount }: HeaderProps) {
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1} justifyContent="space-between">
      <Text bold color="cyan">
        PIXEL AGENTS BESTWAY
      </Text>
      <Text dimColor>
        Teams: <Text color="green">{teamCount}</Text>
        {'  '}Agents: <Text color="yellow">{agentCount}</Text>
        {'  '}Tasks: <Text color="magenta">{taskCount}</Text>
      </Text>
      <Text>
        <Text dimColor>[</Text>
        <Text bold color="white">{VIEW_LABELS[currentView]}</Text>
        <Text dimColor>]</Text>
      </Text>
    </Box>
  );
}
