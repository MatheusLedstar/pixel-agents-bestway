import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../core/types.js';
import { STATUS_COLORS } from '../utils/colors.js';
import { truncate } from '../utils/format.js';

interface TaskBoardViewProps {
  tasks: Task[];
  teamName: string;
}

interface ColumnProps {
  title: string;
  color: string;
  tasks: Task[];
}

function Column({ title, color, tasks }: ColumnProps) {
  return (
    <Box flexDirection="column" flexGrow={1} flexBasis={0} marginRight={1}>
      <Box borderStyle="single" borderColor={color} paddingX={1} justifyContent="center">
        <Text bold color={color}>
          {title} ({tasks.length})
        </Text>
      </Box>
      <Box flexDirection="column" paddingX={1}>
        {tasks.map((task) => (
          <Box key={task.id} flexDirection="column" marginTop={1}>
            <Text>
              <Text dimColor>#{task.id}</Text> {truncate(task.subject, 30)}
            </Text>
            {task.owner && <Text dimColor>  {task.owner}</Text>}
          </Box>
        ))}
        {tasks.length === 0 && (
          <Text dimColor>  (empty)</Text>
        )}
      </Box>
    </Box>
  );
}

export default function TaskBoardView({ tasks, teamName }: TaskBoardViewProps) {
  const pending = tasks.filter((t) => t.status === 'pending');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const completed = tasks.filter((t) => t.status === 'completed');

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text bold color="cyan">
        {' '}Task Board - {teamName}
      </Text>
      <Box marginTop={1} flexGrow={1}>
        <Column title="Pending" color={STATUS_COLORS.pending} tasks={pending} />
        <Column title="In Progress" color={STATUS_COLORS.in_progress} tasks={inProgress} />
        <Column title="Completed" color={STATUS_COLORS.completed} tasks={completed} />
      </Box>
    </Box>
  );
}
