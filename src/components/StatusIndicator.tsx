import React from 'react';
import { Text } from 'ink';

interface StatusIndicatorProps {
  status: string;
}

const STATUS_ICONS: Record<string, string> = {
  completed: '\u2705',
  in_progress: '\uD83D\uDD04',
  pending: '\u2B1C',
  blocked: '\uD83D\uDD12',
  active: '\uD83D\uDFE2',
  idle: '\uD83D\uDFE1',
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const icon = STATUS_ICONS[status] ?? '\u2753';
  return <Text>{icon}</Text>;
}
