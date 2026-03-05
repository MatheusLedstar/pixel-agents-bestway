import React from 'react';
import { Box, Text } from 'ink';
import type { Team, Task, Message } from '../core/types.js';
import AgentBadge from '../components/AgentBadge.js';
import TaskRow from '../components/TaskRow.js';
import MessageRow from '../components/MessageRow.js';
import ProgressBar from '../components/ProgressBar.js';

interface TeamDetailViewProps {
  team: Team;
  tasks: Task[];
  messages: Message[];
}

export default function TeamDetailView({ team, tasks, messages }: TeamDetailViewProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const recentMessages = messages.slice(-5);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            {team.name}
          </Text>
          {team.description && <Text dimColor>{team.description}</Text>}
        </Box>
        <Box marginTop={1}>
          <ProgressBar completed={completedTasks} total={tasks.length} />
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">
          {' '}Agents ({team.members.length})
        </Text>
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          {team.members.map((agent) => {
            const agentTask = tasks.find(
              (t) => t.owner === agent.name && t.status === 'in_progress'
            );
            return (
              <AgentBadge key={agent.agentId} agent={agent} currentTask={agentTask} />
            );
          })}
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="magenta">
          {' '}Tasks ({tasks.length})
        </Text>
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {tasks.length === 0 && <Text dimColor>No tasks.</Text>}
        </Box>
      </Box>

      {recentMessages.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="green">
            {' '}Recent Messages
          </Text>
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            {recentMessages.map((msg, idx) => (
              <MessageRow key={`${msg.timestamp}-${idx}`} message={msg} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
