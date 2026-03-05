import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Team, Task, Message, TeamTokens } from '../core/types.js';
import type { TeamSessionData } from '../core/sessionParser.js';
import type { TerminalSize } from '../hooks/useTerminalSize.js';
import { calculateLayout } from '../hooks/useTerminalSize.js';
import { formatTokens } from '../utils/format.js';
import TaskRow from '../components/TaskRow.js';
import ProgressBar from '../components/ProgressBar.js';
import OfficeMap from '../map/OfficeMap.js';
import AgentTopology from '../components/AgentTopology.js';

interface TeamDetailViewProps {
  team: Team;
  tasks: Task[];
  messages: Message[];
  tokens?: TeamTokens;
  session?: TeamSessionData;
  spinnerFrame: number;
  termSize: TerminalSize;
}

export default function TeamDetailView({ team, tasks, messages, tokens, session, spinnerFrame, termSize }: TeamDetailViewProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  const layout = useMemo(
    () => calculateLayout(termSize, team.members.length),
    [termSize, team.members.length],
  );

  const visibleTasks = useMemo(
    () => tasks.slice(0, layout.maxTaskRows),
    [tasks, layout.maxTaskRows],
  );

  const progressWidth = Math.min(30, Math.max(12, Math.floor(termSize.cols * 0.2)));

  return (
    <Box flexDirection="column" flexGrow={1} width={termSize.cols - 4}>
      {/* Cyberpunk team header */}
      <Box borderStyle="double" borderColor="cyanBright" paddingX={1} justifyContent="space-between">
        <Box gap={2}>
          <Text bold color="cyanBright">⟨ {team.name} ⟩</Text>
          {tasks.length > 0 && (
            <ProgressBar completed={completedTasks} total={tasks.length} width={progressWidth} spinnerFrame={spinnerFrame} />
          )}
        </Box>
        <Box gap={2}>
          {!layout.compact && team.description && <Text dimColor>{team.description}</Text>}
          {tokens && tokens.totalTokens > 0 && (
            <Text color="yellowBright">◇ {formatTokens(tokens.totalTokens, tokens.isReal)}</Text>
          )}
          <Text color="magentaBright">{team.members.length} nodes</Text>
        </Box>
      </Box>

      {/* Office Map — cyberpunk agent grid */}
      <Box marginTop={1} flexDirection="column">
        <Box gap={1}>
          <Text color="cyanBright" bold>◈</Text>
          <Text bold color="cyanBright">GRID</Text>
          <Text dimColor>({team.members.length} agents)</Text>
        </Box>
        <Box paddingX={1} marginTop={1} justifyContent="center">
          <OfficeMap
            team={team}
            tasks={tasks}
            messages={messages}
            session={session}
            spinnerFrame={spinnerFrame}
            layout={layout}
          />
        </Box>
      </Box>

      {/* Agent Topology — communication flow */}
      {team.members.length >= 2 && (
        <Box marginTop={1} flexDirection="column">
          <AgentTopology
            agents={team.members}
            messages={messages}
            tasks={tasks}
            leadAgent={team.leadAgentId?.split('@')[0]}
            spinnerFrame={spinnerFrame}
            width={Math.min(termSize.cols - 6, 100)}
          />
        </Box>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Box gap={1}>
            <Text color="magentaBright" bold>▣</Text>
            <Text bold color="magentaBright">TASKS</Text>
            <Text dimColor>({completedTasks}/{tasks.length})</Text>
          </Box>
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            {visibleTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {tasks.length > layout.maxTaskRows && (
              <Text dimColor>  +{tasks.length - layout.maxTaskRows} more...</Text>
            )}
          </Box>
        </Box>
      )}

    </Box>
  );
}
