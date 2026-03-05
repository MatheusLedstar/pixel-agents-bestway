import React from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
import { formatTimestamp, truncate } from '../utils/format.js';

interface MessageRowProps {
  message: Message;
}

export default function MessageRow({ message }: MessageRowProps) {
  const fromColor = getAgentColor(message.from);
  const toColor = message.to ? getAgentColor(message.to) : 'gray';

  return (
    <Box gap={1}>
      <Text dimColor>{formatTimestamp(message.timestamp)}</Text>
      <Text>
        <Text color={fromColor}>{message.from}</Text>
        <Text dimColor> {'\u2192'} </Text>
        <Text color={toColor}>{message.to ?? 'all'}</Text>
      </Text>
      <Text>{truncate(message.summary ?? message.text, 60)}</Text>
    </Box>
  );
}
