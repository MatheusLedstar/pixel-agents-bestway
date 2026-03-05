import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task, Message } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
import { SECTION_ICONS } from '../utils/icons.js';
import { filterMessages } from '../utils/messageFilter.js';
import StatusIndicator from '../components/StatusIndicator.js';
import TaskRow from '../components/TaskRow.js';
import MessageRow from '../components/MessageRow.js';

interface AgentDetailViewProps {
  agent: Agent;
  tasks: Task[];
  messages: Message[];
}

export default function AgentDetailView({ agent, tasks, messages }: AgentDetailViewProps) {
  const agentTasks = tasks.filter((t) => t.owner === agent.name);
  const color = getAgentColor(agent.name);

  const agentMessages = useMemo(() => {
    const relevant = messages.filter(
      (m) => m.from === agent.name || m.to === agent.name,
    );
    return filterMessages(relevant);
  }, [messages, agent.name]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Agent header */}
      <Box borderStyle="bold" borderColor={color} paddingX={1} flexDirection="column">
        <Box gap={1}>
          <StatusIndicator status={agent.isActive ? 'active' : 'idle'} />
          <Text bold color={color}>
            {agent.name}
          </Text>
        </Box>
        <Box marginTop={1} gap={3}>
          <Text>
            <Text dimColor>Type </Text>
            <Text>{agent.agentType}</Text>
          </Text>
          {agent.model && (
            <Text>
              <Text dimColor>Model </Text>
              <Text>{agent.model}</Text>
            </Text>
          )}
          <Text>
            <Text dimColor>Status </Text>
            <StatusIndicator status={agent.isActive ? 'active' : 'idle'} showLabel />
          </Text>
        </Box>
      </Box>

      {/* Tasks */}
      {agentTasks.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box gap={1}>
            <Text color="magenta">{SECTION_ICONS.tasks}</Text>
            <Text bold color="magenta">Tasks</Text>
            <Text dimColor>({agentTasks.length})</Text>
          </Box>
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            {agentTasks.map((task) => (
              <TaskRow key={task.id} task={task} showOwner={false} />
            ))}
          </Box>
        </Box>
      )}

      {/* Messages */}
      {agentMessages.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box gap={1}>
            <Text color="green">{SECTION_ICONS.messages}</Text>
            <Text bold color="green">Messages</Text>
            <Text dimColor>({agentMessages.length})</Text>
          </Box>
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            {agentMessages.map((msg, idx) => (
              <MessageRow key={`${msg.timestamp}-${idx}`} message={msg as Message} />
            ))}
          </Box>
        </Box>
      )}

      {agentTasks.length === 0 && agentMessages.length === 0 && (
        <Box paddingX={1} marginTop={1}>
          <Text dimColor>No tasks or messages for this agent.</Text>
        </Box>
      )}
    </Box>
  );
}
