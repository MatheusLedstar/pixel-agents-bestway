import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../core/types.js';
import { STATUS_COLORS } from '../utils/colors.js';
import { truncate } from '../utils/format.js';
import StatusIndicator from './StatusIndicator.js';

interface TaskRowProps {
  task: Task;
  showOwner?: boolean;
}

export default function TaskRow({ task, showOwner = true }: TaskRowProps) {
  const statusColor = STATUS_COLORS[task.status] ?? 'white';

  return (
    <Box gap={1}>
      <Text dimColor>#{task.id}</Text>
      <StatusIndicator status={task.status} />
      <Text color={statusColor}>{truncate(task.subject, 50)}</Text>
      {showOwner && task.owner && (
        <Text dimColor>[{task.owner}]</Text>
      )}
      {task.blockedBy && task.blockedBy.length > 0 && (
        <Text color="red">[blocked by {task.blockedBy.join(', ')}]</Text>
      )}
    </Box>
  );
}
