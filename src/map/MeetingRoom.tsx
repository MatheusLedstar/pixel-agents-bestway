import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../core/types.js';
import { filterMessages } from '../utils/messageFilter.js';
import { truncate, formatTimestamp } from '../utils/format.js';
import { getAgentColor } from '../utils/colors.js';
import { glitchText, shouldFlicker } from '../utils/glitch.js';

interface MeetingRoomProps {
  messages: Message[];
  maxMessages?: number;
  width?: number;
  spinnerFrame: number;
}

// Animated table edge
const TABLE_FRAMES = ['─═─═─═─═', '═─═─═─═─'];

export default function MeetingRoom({ messages, maxMessages = 5, width = 40, spinnerFrame }: MeetingRoomProps) {
  const recent = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return filterMessages(sorted).slice(0, maxMessages);
  }, [messages, maxMessages]);

  const msgTextLen = Math.max(10, width - 26);
  const tableEdge = TABLE_FRAMES[spinnerFrame % TABLE_FRAMES.length] ?? TABLE_FRAMES[0];

  // Repeat table edge to fill width
  const edgeLine = (tableEdge ?? '').repeat(Math.ceil((width - 4) / (tableEdge?.length ?? 8))).slice(0, width - 4);

  return (
    <Box flexDirection="column" width={width} alignItems="center">
      {/* Table top edge — animated */}
      <Text color="cyanBright" dimColor>╔{edgeLine}╗</Text>

      {/* Title bar */}
      <Box width={width} justifyContent="center">
        <Text bold color="cyanBright">║</Text>
        <Box flexGrow={1} justifyContent="center">
          <Text bold color="cyanBright" dimColor={shouldFlicker(spinnerFrame, 99)}>
          {glitchText(' ◈ MEETING TABLE ◈ ', spinnerFrame, 0.05, 99)}
        </Text>
        </Box>
        <Text bold color="cyanBright">║</Text>
      </Box>

      {/* Separator */}
      <Text color="cyanBright" dimColor>╠{edgeLine}╣</Text>

      {/* Messages */}
      {recent.length === 0 ? (
        <Box width={width} justifyContent="center">
          <Text bold color="cyanBright">║</Text>
          <Box flexGrow={1} justifyContent="center">
            <Text dimColor> ▱ awaiting comms ▱ </Text>
          </Box>
          <Text bold color="cyanBright">║</Text>
        </Box>
      ) : (
        recent.map((msg, i) => (
          <Box key={`msg-${i}`} width={width}>
            <Text color="cyanBright" dimColor>║ </Text>
            <Box flexGrow={1}>
              <Text dimColor>{formatTimestamp(msg.timestamp)} </Text>
              <Text color={getAgentColor(msg.from)} bold>{truncate(msg.from, 10)}</Text>
              <Text dimColor>{msg.to ? ` ⟫ ${truncate(msg.to, 8)}` : ''} </Text>
              <Text color="white">{truncate(msg.text, msgTextLen)}</Text>
            </Box>
            <Text color="cyanBright" dimColor> ║</Text>
          </Box>
        ))
      )}

      {/* Table bottom edge — animated */}
      <Text color="cyanBright" dimColor>╚{edgeLine}╝</Text>
    </Box>
  );
}
