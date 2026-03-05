import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../core/types.js';
import { STATUS_COLORS, STATUS_ICONS, SECTION_ICONS } from '../utils/icons.js';
import { getAgentColor } from '../utils/colors.js';
import { truncate } from '../utils/format.js';

interface TaskBoardViewProps {
  tasks: Task[];
  teamName: string;
}

interface ColumnProps {
  title: string;
  icon: string;
  color: string;
  tasks: Task[];
}

function Column({ title, icon, color, tasks }: ColumnProps) {
  return (
    <Box flexDirection="column" flexGrow={1} flexBasis={0} marginRight={1}>
      <Box borderStyle="bold" borderColor={color} paddingX={1} justifyContent="center">
        <Text bold color={color}>
          {icon} {title} ({tasks.length})
        </Text>
      </Box>
      <Box flexDirection="column" paddingX={1}>
        {tasks.map((task) => (
          <Box key={task.id} flexDirection="column" marginTop={1}>
            <Text>
              <Text dimColor>#{task.id}</Text>{' '}
              <Text color={color}>{truncate(task.subject, 28)}</Text>
            </Text>
            {task.owner && (
              <Text>
                {'  '}
                <Text color={getAgentColor(task.owner)}>{task.owner}</Text>
              </Text>
            )}
            {task.blockedBy && task.blockedBy.length > 0 && (
              <Text color="red">{'  '} blocked by #{task.blockedBy.join(', #')}</Text>
            )}
          </Box>
        ))}
        {tasks.length === 0 && (
          <Text dimColor>  —</Text>
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
      <Box gap={1}>
        <Text color="cyan">{SECTION_ICONS.tasks}</Text>
        <Text bold color="cyan">Task Board</Text>
        <Text dimColor>· {teamName}</Text>
      </Box>
      <Box marginTop={1} flexGrow={1}>
        <Column
          title="Pending"
          icon={STATUS_ICONS.pending}
          color={STATUS_COLORS.pending}
          tasks={pending}
        />
        <Column
          title="In Progress"
          icon={STATUS_ICONS.in_progress}
          color={STATUS_COLORS.in_progress}
          tasks={inProgress}
        />
        <Column
          title="Completed"
          icon={STATUS_ICONS.completed}
          color={STATUS_COLORS.completed}
          tasks={completed}
        />
      </Box>
    </Box>
  );
}
