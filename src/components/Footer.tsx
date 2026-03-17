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
    { key: 'h', label: 'Toggle completed' },
    { key: 'c', label: 'Cross-Team' },
    { key: 'u', label: 'Usage' },
    { key: 'q', label: 'Quit' },
  ],
  'team-detail': [
    { key: 'Esc', label: 'Back' },
    { key: 'm', label: 'Messages' },
    { key: 't', label: 'Tasks' },
    { key: 'g', label: 'Game Map' },
    { key: 'c', label: 'Cross-Team' },
    { key: 'u', label: 'Usage' },
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
  usage: [
    { key: 'Esc', label: 'Back' },
    { key: 'r', label: 'Refresh' },
    { key: 'q', label: 'Quit' },
  ],
  'cross-team': [
    { key: 'Esc', label: 'Back' },
    { key: '↑↓', label: 'Scroll' },
    { key: 'q', label: 'Quit' },
  ],
  'game-map': [
    { key: 'Esc', label: 'Back' },
    { key: '←→↑↓', label: 'Navigate' },
    { key: '↵', label: 'Inspect' },
    { key: 'Tab', label: 'Next Agent' },
    { key: 'm', label: 'Mini-Map' },
    { key: 'f', label: 'Fullscreen' },
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
