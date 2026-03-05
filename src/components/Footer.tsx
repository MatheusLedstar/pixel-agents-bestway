import React from 'react';
import { Box, Text } from 'ink';
import type { ViewType } from '../core/types.js';

interface FooterProps {
  view: ViewType;
}

const KEYBINDINGS: Record<ViewType, string[]> = {
  dashboard: ['[Tab] Switch view', '[Up/Down] Navigate', '[Enter] Detail', '[q] Quit'],
  'team-detail': ['[Esc] Back', '[m] Messages', '[t] Task Board', '[Enter] Agent Detail', '[q] Quit'],
  'task-board': ['[Esc] Back', '[Up/Down] Navigate', '[q] Quit'],
  messages: ['[Esc] Back', '[Up/Down] Scroll', '[q] Quit'],
  'agent-detail': ['[Esc] Back', '[q] Quit'],
};

export default function Footer({ view }: FooterProps) {
  const bindings = KEYBINDINGS[view] ?? [];

  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1}>
      <Text dimColor>
        {bindings.join('  ')}
      </Text>
    </Box>
  );
}
