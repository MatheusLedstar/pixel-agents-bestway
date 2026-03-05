import React from 'react';
import { Box, Text } from 'ink';
import type { ActivityEvent } from '../hooks/useActivityLog.js';
import { EVENT_ICONS, EVENT_COLORS } from '../hooks/useActivityLog.js';
import { relativeTime, truncate } from '../utils/format.js';
import { getAgentColor } from '../utils/colors.js';

interface ActivityTimelineProps {
  events: ActivityEvent[];
  maxEvents?: number;
  spinnerFrame: number;
}

export default function ActivityTimeline({ events, maxEvents = 8, spinnerFrame }: ActivityTimelineProps) {
  if (events.length === 0) return null;

  const visible = events.slice(0, maxEvents);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color="magenta" bold>▸</Text>
        <Text color="magenta" bold>Activity Timeline</Text>
      </Box>
      <Box flexDirection="column" marginTop={0} paddingX={1}>
        {visible.map((event, idx) => {
          const icon = EVENT_ICONS[event.type];
          const color = EVENT_COLORS[event.type];
          const isFirst = idx === 0;
          const isLast = idx === visible.length - 1;
          const timeStr = event.timestamp > 0
            ? relativeTime(new Date(event.timestamp).toISOString())
            : '';

          return (
            <Box key={event.id} gap={0}>
              {/* Timeline connector */}
              <Box flexDirection="column" width={3} alignItems="center">
                <Text color={color}>{icon}</Text>
                {!isLast && <Text dimColor>│</Text>}
              </Box>

              {/* Event content */}
              <Box gap={1} marginLeft={1}>
                {event.agent && (
                  <Text color={getAgentColor(event.agent)} bold>
                    {truncate(event.agent, 12)}
                  </Text>
                )}
                <Text color={isFirst && spinnerFrame % 4 < 2 ? 'white' : undefined}>
                  {truncate(event.description, 40)}
                </Text>
                <Text dimColor>{timeStr}</Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
