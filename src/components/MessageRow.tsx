import React from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
import { formatTimestamp, truncate } from '../utils/format.js';
import { parseMessage } from '../utils/messageFilter.js';

interface MessageRowProps {
  message: Message;
  maxWidth?: number;
}

export default function MessageRow({ message, maxWidth = 70 }: MessageRowProps) {
  const parsed = parseMessage(message);

  // Skip system/hidden messages
  if (parsed.isSystem || parsed.text.length === 0) return null;

  const fromColor = getAgentColor(parsed.from);
  const toColor = parsed.to ? getAgentColor(parsed.to) : 'gray';

  return (
    <Box gap={1}>
      <Text dimColor>{formatTimestamp(parsed.timestamp)}</Text>
      <Text>
        <Text color={fromColor} bold>{parsed.from}</Text>
        <Text dimColor> → </Text>
        <Text color={toColor}>{parsed.to ?? 'all'}</Text>
      </Text>
      <Text>{truncate(parsed.text, maxWidth)}</Text>
    </Box>
  );
}
