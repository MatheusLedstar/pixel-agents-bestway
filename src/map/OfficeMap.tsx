import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Team, Task, Message } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import type { GridLayout } from '../hooks/useTerminalSize.js';
import AgentDesk from './AgentDesk.js';
import MeetingRoom from './MeetingRoom.js';

interface OfficeMapProps {
  team: Team;
  tasks: Task[];
  messages: Message[];
  session?: TeamSessionData;
  spinnerFrame: number;
  layout: GridLayout;
}

const CIRCUIT_L = '╠═';
const CIRCUIT_R = '═╣';
const CIRCUIT_DOT = '◦';

export default function OfficeMap({ team, tasks, messages, session, spinnerFrame, layout }: OfficeMapProps) {
  const agents = team.members;

  const rows = useMemo(() => {
    const result: (typeof agents)[] = [];
    for (let i = 0; i < agents.length; i += layout.cols) {
      result.push(agents.slice(i, i + layout.cols));
    }
    return result;
  }, [agents, layout.cols]);

  return (
    <Box flexDirection="column" gap={0}>
      {rows.map((row, rowIdx) => (
        <Box key={`row-${rowIdx}`} flexDirection="row" justifyContent="center" alignItems="center">
          {/* Circuit decoration left */}
          <Text color="gray" dimColor>
            {rowIdx % 2 === 0 ? CIRCUIT_L : ` ${CIRCUIT_DOT}`}
          </Text>

          {row.map((agent) => {
            const agentTask = tasks.find(
              (t) => t.owner === agent.name && t.status === 'in_progress',
            );
            const doneTask = !agentTask
              ? tasks.find((t) => t.owner === agent.name && t.status === 'completed')
              : undefined;
            const agentActivity = session?.agentActivity.get(agent.name);

            return (
              <AgentDesk
                key={agent.agentId}
                agent={agent}
                activity={agentActivity}
                task={agentTask ?? doneTask}
                spinnerFrame={spinnerFrame}
                deskWidth={layout.deskWidth}
                compact={layout.compact}
              />
            );
          })}

          {/* Circuit decoration right */}
          <Text color="gray" dimColor>
            {rowIdx % 2 === 0 ? CIRCUIT_R : `${CIRCUIT_DOT} `}
          </Text>
        </Box>
      ))}

      {/* Comms room */}
      {messages.length > 0 && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="gray" dimColor>{CIRCUIT_L}{'══'}</Text>
          <MeetingRoom messages={messages} width={layout.commsWidth} />
          <Text color="gray" dimColor>{'══'}{CIRCUIT_R}</Text>
        </Box>
      )}
    </Box>
  );
}
