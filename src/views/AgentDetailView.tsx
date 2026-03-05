import React from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task, Message } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';
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
  const agentMessages = messages.filter(
    (m) => m.from === agent.name || m.to === agent.name
  );
  const color = getAgentColor(agent.name);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box borderStyle="single" borderColor={color} paddingX={1} flexDirection="column">
        <Box gap={1}>
          <StatusIndicator status={agent.isActive ? 'active' : 'idle'} />
          <Text bold color={color}>
            {agent.name}
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text dimColor>Type: </Text>
            {agent.agentType}
          </Text>
          {agent.model && (
            <Text>
              <Text dimColor>Model: </Text>
              {agent.model}
            </Text>
          )}
          <Text>
            <Text dimColor>Status: </Text>
            {agent.isActive ? 'Active' : 'Idle'}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="magenta">
          {' '}Tasks ({agentTasks.length})
        </Text>
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          {agentTasks.map((task) => (
            <TaskRow key={task.id} task={task} showOwner={false} />
          ))}
          {agentTasks.length === 0 && <Text dimColor>No tasks assigned.</Text>}
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="green">
          {' '}Messages ({agentMessages.length})
        </Text>
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          {agentMessages.map((msg, idx) => (
            <MessageRow key={`${msg.timestamp}-${idx}`} message={msg} />
          ))}
          {agentMessages.length === 0 && <Text dimColor>No messages.</Text>}
        </Box>
      </Box>
    </Box>
  );
}
