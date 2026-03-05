import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Agent, Task, Message } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import { getAgentColor } from '../utils/colors.js';
import { SECTION_ICONS, SPINNER_FRAMES } from '../utils/icons.js';
import { formatTokens } from '../utils/format.js';
import { filterMessages } from '../utils/messageFilter.js';
import TaskRow from '../components/TaskRow.js';
import MessageRow from '../components/MessageRow.js';

interface AgentDetailViewProps {
  agent: Agent;
  tasks: Task[];
  messages: Message[];
  session?: TeamSessionData;
  spinnerFrame: number;
}

export default function AgentDetailView({ agent, tasks, messages, session, spinnerFrame }: AgentDetailViewProps) {
  const agentTasks = tasks.filter((t) => t.owner === agent.name);
  const color = getAgentColor(agent.name);

  const agentMessages = useMemo(() => {
    const relevant = messages.filter(
      (m) => m.from === agent.name || m.to === agent.name,
    );
    return filterMessages(relevant);
  }, [messages, agent.name]);

  const statusIcon = agent.isActive ? SPINNER_FRAMES[spinnerFrame] : '○';
  const statusColor = agent.isActive ? 'greenBright' : 'gray';
  const statusLabel = agent.isActive ? 'Active' : 'Idle';

  // Get activity and tokens from session
  const activity = session?.agentActivity.get(agent.name);
  const agentTokens = session?.agentTokens.get(agent.name);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Agent header */}
      <Box borderStyle="bold" borderColor={color} paddingX={1} flexDirection="column">
        <Box gap={1}>
          <Text color={statusColor}>{statusIcon}</Text>
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
            <Text color={statusColor}>{statusIcon} {statusLabel}</Text>
          </Text>
          {agentTokens && agentTokens.totalTokens > 0 && (
            <Text>
              <Text dimColor>Tokens </Text>
              <Text color="yellow">{formatTokens(agentTokens.totalTokens, true)}</Text>
            </Text>
          )}
        </Box>
        {/* Live activity */}
        {activity && agent.isActive && (
          <Box marginTop={1}>
            <Text dimColor>Activity </Text>
            <Text>
              {activity.lastActionIcon} {activity.lastAction}
              {activity.isThinking && <Text color="yellow"> 💭</Text>}
            </Text>
          </Box>
        )}
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
