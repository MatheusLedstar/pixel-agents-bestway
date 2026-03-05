import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Team, Task, Message } from '../core/types.js';
import { SECTION_ICONS } from '../utils/icons.js';
import { filterMessages } from '../utils/messageFilter.js';
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

  const recentMessages = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return filterMessages(sorted).slice(0, 5);
  }, [messages]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Team header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            ⬡ {team.name}
          </Text>
          {team.description && <Text dimColor>{team.description}</Text>}
        </Box>
        {tasks.length > 0 && (
          <Box marginTop={1}>
            <ProgressBar completed={completedTasks} total={tasks.length} />
          </Box>
        )}
      </Box>

      {/* Agents */}
      <Box marginTop={1} flexDirection="column">
        <Box gap={1}>
          <Text color="yellow">{SECTION_ICONS.agents}</Text>
          <Text bold color="yellow">Agents</Text>
          <Text dimColor>({team.members.length})</Text>
        </Box>
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          {team.members.map((agent) => {
            const agentTask = tasks.find(
              (t) => t.owner === agent.name && t.status === 'in_progress',
            );
            return (
              <AgentBadge key={agent.agentId} agent={agent} currentTask={agentTask} />
            );
          })}
        </Box>
      </Box>

      {/* Tasks */}
      {tasks.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box gap={1}>
            <Text color="magenta">{SECTION_ICONS.tasks}</Text>
            <Text bold color="magenta">Tasks</Text>
            <Text dimColor>({tasks.length})</Text>
          </Box>
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </Box>
        </Box>
      )}

      {/* Recent Messages - only if present */}
      {recentMessages.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box gap={1}>
            <Text color="green">{SECTION_ICONS.messages}</Text>
            <Text bold color="green">Recent Messages</Text>
          </Box>
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            {recentMessages.map((msg, idx) => (
              <MessageRow key={`${msg.timestamp}-${idx}`} message={msg as Message} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
