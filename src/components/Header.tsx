import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { ViewType } from '../core/types.js';
import { SECTION_ICONS, SPINNER_FRAMES } from '../utils/icons.js';

interface HeaderProps {
  currentView: ViewType;
  teamCount: number;
  agentCount: number;
  taskCount: number;
}

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: ' Dashboard',
  'team-detail': ' Team Detail',
  'task-board': '⊡ Task Board',
  messages: '⊜ Messages',
  'agent-detail': ' Agent Detail',
};

export default function Header({ currentView, teamCount, agentCount, taskCount }: HeaderProps) {
  const [frame, setFrame] = useState(0);
  const hasActivity = agentCount > 0;

  useEffect(() => {
    if (!hasActivity) return;
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, [hasActivity]);

  return (
    <Box borderStyle="bold" borderColor="cyan" paddingX={1} justifyContent="space-between">
      <Box gap={1}>
        {hasActivity && <Text color="greenBright">{SPINNER_FRAMES[frame]}</Text>}
        <Text bold color="cyan">
          ⬡ PIXEL AGENTS
        </Text>
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
      </Box>
      <Text color="gray">{VIEW_LABELS[currentView]}</Text>
    </Box>
  );
}
