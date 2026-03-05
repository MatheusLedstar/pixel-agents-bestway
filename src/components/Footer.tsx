import React from 'react';
import { Box, Text } from 'ink';
import type { ViewType } from '../core/types.js';

interface FooterProps {
  view: ViewType;
}

interface KeyBinding {
  key: string;
  label: string;
}

const KEYBINDINGS: Record<ViewType, KeyBinding[]> = {
  dashboard: [
    { key: '↑↓', label: 'Navigate' },
    { key: '↵', label: 'Select' },
    { key: 'Tab', label: 'View' },
    { key: 'q', label: 'Quit' },
  ],
  'team-detail': [
    { key: 'Esc', label: 'Back' },
    { key: 'm', label: 'Messages' },
    { key: 't', label: 'Tasks' },
    { key: '↵', label: 'Agent' },
    { key: 'q', label: 'Quit' },
  ],
  'task-board': [
    { key: 'Esc', label: 'Back' },
    { key: '↑↓', label: 'Navigate' },
    { key: 'q', label: 'Quit' },
  ],
  messages: [
    { key: 'Esc', label: 'Back' },
    { key: '↑↓', label: 'Scroll' },
    { key: 'q', label: 'Quit' },
  ],
  'agent-detail': [
    { key: 'Esc', label: 'Back' },
    { key: 'q', label: 'Quit' },
  ],
};

export default function Footer({ view }: FooterProps) {
  const bindings = KEYBINDINGS[view] ?? [];

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} gap={2}>
      {bindings.map((b) => (
        <Text key={b.key}>
          <Text color="cyan" bold>{b.key}</Text>
          <Text dimColor> {b.label}</Text>
        </Text>
      ))}
    </Box>
  );
}
