import React from 'react';
import { Text } from 'ink';
import { STATUS_ICONS, STATUS_COLORS } from '../utils/icons.js';

interface StatusIndicatorProps {
  status: string;
  showLabel?: boolean;
}

export default function StatusIndicator({ status, showLabel = false }: StatusIndicatorProps) {
  const icon = STATUS_ICONS[status] ?? '?';
  const color = STATUS_COLORS[status] ?? 'white';

  return (
    <Text color={color}>
      {icon}{showLabel ? ` ${status}` : ''}
    </Text>
  );
}
