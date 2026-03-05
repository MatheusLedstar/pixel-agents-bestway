import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Agent, Message, Task } from '../core/types.js';
import { getAgentColor } from '../utils/colors.js';

interface AgentTopologyProps {
  agents: Agent[];
  messages: Message[];
  tasks: Task[];
  leadAgent?: string;
  spinnerFrame: number;
  width?: number;
}

// Node dimensions
const NODE_W = 20;
const NODE_H = 3; // top border, content, bottom border

// Particle-based edge animation using dots for smooth movement sprites
// Uses dot sizes (· • ● ◦) to create traveling particle effect
const EDGE_R = [' · ·•● ', '· ·•●  ', ' · ·•● ', '  · ·•●']; // particle moving right
const EDGE_L = [' ●•· · ', '  ●•· ·', ' ●•· · ', '●•· ·  ']; // particle moving left
const EDGE_BI = ['·•●·•● ', '•●·•●· ', '●·•●·• ', '·•●·•●·']; // bidirectional particles

interface AgentNode {
  x: number;
  y: number;
  agent: Agent;
  task?: Task;
  msgSent: number;
  msgRecv: number;
}

interface CommEdge {
  from: number; // agent index
  to: number;
  count: number; // messages from→to
  reverseCount: number; // messages to→from
}

function truncName(name: string, max: number): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + '…';
}

/** Build communication matrix from messages */
function buildCommMatrix(agents: Agent[], messages: Message[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();
  for (const a of agents) {
    matrix.set(a.name, new Map());
  }

  for (const msg of messages) {
    const from = msg.from;
    const to = msg.to;
    if (!to || !matrix.has(from) || !matrix.has(to)) continue;
    const row = matrix.get(from)!;
    row.set(to, (row.get(to) ?? 0) + 1);
  }

  return matrix;
}

export default function AgentTopology({
  agents,
  messages,
  tasks,
  leadAgent,
  spinnerFrame,
  width = 80,
}: AgentTopologyProps) {
  if (agents.length < 2) return null;

  const topology = useMemo(() => {
    // Build communication matrix
    const matrix = buildCommMatrix(agents, messages);

    // Build edges
    const edges: CommEdge[] = [];
    const agentNames = agents.map((a) => a.name);

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const aToB = matrix.get(agentNames[i]!)?.get(agentNames[j]!) ?? 0;
        const bToA = matrix.get(agentNames[j]!)?.get(agentNames[i]!) ?? 0;
        if (aToB > 0 || bToA > 0) {
          edges.push({ from: i, to: j, count: aToB, reverseCount: bToA });
        }
      }
    }

    // Layout: hub-spoke if lead exists, otherwise grid
    const cols = Math.min(3, Math.ceil(Math.sqrt(agents.length)));
    const rows = Math.ceil(agents.length / cols);
    const gapX = NODE_W + 6;
    const gapY = NODE_H + 2;

    const positions: AgentNode[] = agents.map((agent, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const agentTask = tasks.find(
        (t) => t.owner === agent.name && t.status === 'in_progress',
      );
      const sentCount = matrix.get(agent.name)?.size ?? 0;
      let recvCount = 0;
      for (const [, row] of matrix) {
        if (row.has(agent.name)) recvCount++;
      }

      return {
        x: col * gapX + 2,
        y: row * gapY,
        agent,
        task: agentTask,
        msgSent: sentCount,
        msgRecv: recvCount,
      };
    });

    const bufW = Math.max(width, cols * gapX + 4);
    const bufH = rows * gapY + NODE_H + 1;

    // Build 2D char buffer
    const buf: string[][] = [];
    for (let y = 0; y < bufH; y++) {
      buf.push(Array(bufW).fill(' '));
    }

    // Helper: write string into buffer
    const writeStr = (bx: number, by: number, str: string) => {
      const chars = [...str];
      for (let i = 0; i < chars.length; i++) {
        if (bx + i < bufW && by >= 0 && by < bufH) {
          buf[by]![bx + i] = chars[i]!;
        }
      }
    };

    // Draw nodes
    for (const pos of positions) {
      const { x, y, agent } = pos;
      const isLead = agent.name === leadAgent;
      const statusIcon = agent.isActive ? '●' : '○';
      const name = truncName(agent.name, NODE_W - 5);

      // Borders — double for lead
      const hChar = isLead ? '═' : '─';
      const tlChar = isLead ? '╔' : '┌';
      const trChar = isLead ? '╗' : '┐';
      const blChar = isLead ? '╚' : '└';
      const brChar = isLead ? '╝' : '┘';
      const vChar = isLead ? '║' : '│';

      writeStr(x, y, tlChar + hChar.repeat(NODE_W - 2) + trChar);
      const content = `${vChar} ${statusIcon} ${name}`.padEnd(NODE_W - 1).slice(0, NODE_W - 1) + vChar;
      writeStr(x, y + 1, content);

      // Task or status line
      let statusLine: string;
      if (pos.task) {
        const taskText = truncName(pos.task.activeForm ?? pos.task.subject, NODE_W - 5);
        statusLine = `${vChar} ▸${taskText}`.padEnd(NODE_W - 1).slice(0, NODE_W - 1) + vChar;
      } else {
        const msgInfo = `↑${pos.msgSent} ↓${pos.msgRecv}`;
        statusLine = `${vChar} ${msgInfo}`.padEnd(NODE_W - 1).slice(0, NODE_W - 1) + vChar;
      }
      writeStr(x, y + 2, statusLine);

      writeStr(x, y + 3, blChar + hChar.repeat(NODE_W - 2) + brChar);
    }

    // Draw horizontal edges between nodes in same row
    const slowFrame = Math.floor(spinnerFrame / 4);
    for (const edge of edges) {
      const a = positions[edge.from]!;
      const b = positions[edge.to]!;

      // Same row — horizontal edge
      if (Math.abs(a.y - b.y) < 2) {
        const left = a.x < b.x ? a : b;
        const right = a.x < b.x ? b : a;
        const leftIsFrom = left === a;

        const edgeY = left.y + 1;
        const startX = left.x + NODE_W;
        const endX = right.x;

        if (edgeY < bufH && startX < endX) {
          const isBidirectional = edge.count > 0 && edge.reverseCount > 0;
          const frames = isBidirectional
            ? EDGE_BI
            : leftIsFrom
              ? (edge.count > 0 ? EDGE_R : EDGE_L)
              : (edge.reverseCount > 0 ? EDGE_R : EDGE_L);
          const edgeStr = frames[slowFrame % frames.length]!;

          // Message count label in the middle
          const totalMsgs = edge.count + edge.reverseCount;
          const label = totalMsgs > 0 ? `[${totalMsgs}]` : '';
          const midX = Math.floor((startX + endX) / 2) - Math.floor(label.length / 2);

          for (let ex = startX; ex < endX && ex < bufW; ex++) {
            if (label && ex >= midX && ex < midX + label.length) {
              buf[edgeY]![ex] = label[ex - midX]!;
            } else {
              buf[edgeY]![ex] = edgeStr[(ex - startX + slowFrame) % edgeStr.length]!;
            }
          }
        }
      }
    }

    // Draw vertical connectors for nodes in different rows
    for (const edge of edges) {
      const a = positions[edge.from]!;
      const b = positions[edge.to]!;

      if (Math.abs(a.y - b.y) >= 2) {
        const top = a.y < b.y ? a : b;
        const bottom = a.y < b.y ? b : a;
        const connX = top.x + Math.floor(NODE_W / 2);

        for (let cy = top.y + NODE_H + 1; cy < bottom.y && cy < bufH; cy++) {
          if (connX < bufW) {
            // Vertical particle animation: dot travels down
            const vPhase = (cy + slowFrame) % 4;
            buf[cy]![connX] = vPhase === 0 ? '●' : vPhase === 1 ? '•' : vPhase === 2 ? '·' : ' ';
          }
        }

        // Label near connector
        const totalMsgs = edge.count + edge.reverseCount;
        if (totalMsgs > 0) {
          const labelY = top.y + NODE_H + 1;
          if (connX + 1 < bufW && labelY < bufH) {
            const lbl = `${totalMsgs}`;
            writeStr(connX + 1, labelY, lbl);
          }
        }
      }
    }

    return { buf, positions, edges, bufH };
  }, [agents, messages, tasks, leadAgent, spinnerFrame, width]);

  const lines = topology.buf.map((row) => row.join(''));

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={0}>
        <Text color="cyanBright" bold>◈</Text>
        <Text bold color="cyanBright">AGENT TOPOLOGY</Text>
        <Text dimColor>
          ({agents.length} agents, {topology.edges.length} connections)
        </Text>
      </Box>
      {lines.map((line, i) => {
        // Color based on node positions and status
        let lineColor: string | undefined;
        for (const pos of topology.positions) {
          if (i >= pos.y && i <= pos.y + NODE_H) {
            if (pos.agent.name === leadAgent) {
              lineColor = 'yellowBright';
            } else if (pos.agent.isActive) {
              lineColor = getAgentColor(pos.agent.name);
            } else {
              lineColor = 'gray';
            }
            break;
          }
        }
        return (
          <Text key={i} color={lineColor ?? 'cyanBright'} dimColor={!lineColor}>
            {line}
          </Text>
        );
      })}
    </Box>
  );
}
