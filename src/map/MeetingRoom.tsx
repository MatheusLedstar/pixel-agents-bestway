import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../core/types.js';
import { filterMessages } from '../utils/messageFilter.js';
import { truncate, formatTimestamp } from '../utils/format.js';
import { getAgentColor } from '../utils/colors.js';

interface MeetingRoomProps {
  messages: Message[];
  maxMessages?: number;
  width?: number;
}

export default function MeetingRoom({ messages, maxMessages = 3, width = 40 }: MeetingRoomProps) {
  const recent = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return filterMessages(sorted).slice(0, maxMessages);
  }, [messages, maxMessages]);

  // Message text space: width - timestamp(6) - sender(~10) - padding/arrows(~8)
  const msgTextLen = Math.max(10, width - 24);

  return (
    <Box
      borderStyle="double"
      borderColor="gray"
      flexDirection="column"
      paddingX={1}
      width={width}
    >
      <Text bold color="cyanBright">⟨ COMMS ⟩</Text>
      {recent.length === 0 ? (
        <Text dimColor>  ▱ no signal ▱</Text>
      ) : (
        recent.map((msg, i) => (
          <Text key={`msg-${i}`} wrap="truncate">
            <Text dimColor>{formatTimestamp(msg.timestamp)} </Text>
            <Text color={getAgentColor(msg.from)} bold>{truncate(msg.from, 8)}</Text>
            <Text dimColor>{msg.to ? ` ⟫ ${truncate(msg.to, 6)}` : ''} </Text>
            <Text color="white">{truncate(msg.text, msgTextLen)}</Text>
          </Text>
        ))
      )}
    </Box>
  );
}
