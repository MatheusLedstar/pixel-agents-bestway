import React from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../core/types.js';
import MessageRow from '../components/MessageRow.js';

interface MessagesViewProps {
  messages: Message[];
  teamName: string;
}

export default function MessagesView({ messages, teamName }: MessagesViewProps) {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text bold color="cyan">
        {' '}Messages - {teamName}
      </Text>
      <Box flexDirection="column" marginTop={1} paddingX={1} flexGrow={1}>
        {sorted.map((msg, idx) => (
          <MessageRow key={`${msg.timestamp}-${msg.from}-${idx}`} message={msg} />
        ))}
        {sorted.length === 0 && (
          <Text dimColor>No messages for this team.</Text>
        )}
      </Box>
    </Box>
  );
}
