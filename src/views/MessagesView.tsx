import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../core/types.js';
import { SECTION_ICONS } from '../utils/icons.js';
import { filterMessages } from '../utils/messageFilter.js';
import MessageRow from '../components/MessageRow.js';

interface MessagesViewProps {
  messages: Message[];
  teamName: string;
}

export default function MessagesView({ messages, teamName }: MessagesViewProps) {
  const filtered = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    return filterMessages(sorted);
  }, [messages]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box gap={1}>
        <Text color="green">{SECTION_ICONS.messages}</Text>
        <Text bold color="green">Messages</Text>
        <Text dimColor>· {teamName}</Text>
        {filtered.length > 0 && <Text dimColor>({filtered.length})</Text>}
      </Box>
      <Box flexDirection="column" marginTop={1} paddingX={1} flexGrow={1}>
        {filtered.map((msg, idx) => (
          <MessageRow key={`${msg.timestamp}-${msg.from}-${idx}`} message={msg as Message} />
        ))}
        {filtered.length === 0 && (
          <Text dimColor>No messages for this team.</Text>
        )}
      </Box>
    </Box>
  );
}
