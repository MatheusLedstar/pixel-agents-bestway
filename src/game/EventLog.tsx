// EventLog panel: shows live stream of game events (zone changes, level ups, achievements, XP)

import React from 'react';
import { Box, Text } from 'ink';
import type { GameEvent } from './types.js';

export interface EventLogProps {
  events: GameEvent[];
  width: number;
  height: number;
  spinnerFrame: number;
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

function truncateName(name: string, maxLen: number): string {
  return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
}

// Glowing title animation
const GLOW_CHARS = ['═', '─', '═', '─'];

export default function EventLog({ events, width, height, spinnerFrame }: EventLogProps) {
  const innerWidth = Math.max(6, width - 4);
  const maxEvents = Math.max(2, height - 5);
  const displayEvents = events.slice(-maxEvents).reverse();

  // Animated title border
  const borderChar = GLOW_CHARS[Math.floor(spinnerFrame / 10) % 4] ?? '═';
  const titleLine = `${borderChar} EVENTS ${borderChar}`;
  const titlePad = Math.max(0, Math.floor((innerWidth - titleLine.length) / 2));

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="double"
      borderColor="cyan"
    >
      {/* Animated header */}
      <Box justifyContent="center">
        <Text color="cyanBright" bold>
          {' '.repeat(titlePad)}{titleLine}
        </Text>
      </Box>

      {/* Separator */}
      <Text color="cyan" dimColor>{'─'.repeat(innerWidth)}</Text>

      {/* Events list */}
      {displayEvents.length === 0 ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text dimColor>no events yet</Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {displayEvents.map((event) => {
            const nameLen = Math.min(8, Math.floor(innerWidth * 0.35));
            const msgLen = innerWidth - nameLen - 7; // space for icon + time + separators
            const truncMsg = event.message.length > msgLen
              ? event.message.slice(0, msgLen - 1) + '…'
              : event.message.padEnd(msgLen);
            const ago = timeAgo(event.timestamp).padStart(3);
            const name = truncateName(event.agentName, nameLen).padEnd(nameLen);

            return (
              <Box key={event.id} flexDirection="row" gap={0}>
                <Text color={event.color} bold>{event.icon} </Text>
                <Text color="white" dimColor>{name} </Text>
                <Text color={event.color}>{truncMsg}</Text>
                <Text dimColor> {ago}</Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
