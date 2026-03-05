import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../core/types.js';
import { STATUS_COLORS, STATUS_ICONS } from '../utils/icons.js';
import { getAgentColor } from '../utils/colors.js';
import { truncate } from '../utils/format.js';

interface TaskRowProps {
  task: Task;
  showOwner?: boolean;
}

export default function TaskRow({ task, showOwner = true }: TaskRowProps) {
  const statusColor = STATUS_COLORS[task.status] ?? 'white';
  const statusIcon = STATUS_ICONS[task.status] ?? '?';

  return (
    <Box gap={1}>
      <Text dimColor>#{task.id}</Text>
      <Text color={statusColor}>{statusIcon}</Text>
      <Text color={statusColor}>{truncate(task.subject, 45)}</Text>
      {showOwner && task.owner && (
        <Text color={getAgentColor(task.owner)}>{task.owner}</Text>
      )}
      {task.blockedBy && task.blockedBy.length > 0 && (
        <Text color="red"> blocked by #{task.blockedBy.join(', #')}</Text>
      )}
    </Box>
  );
}
