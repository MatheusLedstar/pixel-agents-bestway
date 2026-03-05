import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { TeamCard } from '../core/types.js';

interface NetworkTopologyProps {
  registry: TeamCard[];
  spinnerFrame: number;
  width?: number;
}

// Node rendering constants
const NODE_W = 22;
const NODE_H = 3;
const EDGE_FRAMES = ['─⟩─⟩─⟩', '⟩─⟩─⟩─', '─⟩─⟩─⟩'];

interface NodePos {
  x: number;
  y: number;
  team: TeamCard;
}

function statusChar(status: string): string {
  switch (status) {
    case 'active': return '●';
    case 'idle': return '○';
    case 'completed': return '✓';
    default: return '?';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'greenBright';
    case 'idle': return 'yellowBright';
    case 'completed': return 'gray';
    default: return 'gray';
  }
}

/** Build a 2D char buffer and render team nodes + animated edges */
export default function NetworkTopology({ registry, spinnerFrame, width = 80 }: NetworkTopologyProps) {
  if (registry.length === 0) return null;

  const topology = useMemo(() => {
    // Grid layout: sqrt distribution
    const cols = Math.min(3, Math.ceil(Math.sqrt(registry.length)));
    const rows = Math.ceil(registry.length / cols);

    // Calculate node positions
    const gap_x = NODE_W + 8;
    const gap_y = NODE_H + 2;
    const positions: NodePos[] = [];

    registry.forEach((team, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: col * gap_x + 2,
        y: row * gap_y,
        team,
      });
    });

    const bufW = Math.max(width, cols * gap_x + 4);
    const bufH = rows * gap_y + NODE_H + 1; // +1 for bottom border at y+3

    // Build 2D buffer
    const buf: string[][] = [];
    for (let y = 0; y < bufH; y++) {
      buf.push(Array(bufW).fill(' '));
    }

    // Draw nodes
    for (const pos of positions) {
      const { x, y, team } = pos;
      const name = team.teamName.slice(0, NODE_W - 4);
      const stats = `${team.memberCount}A ${team.tasksSummary.completed}/${team.tasksSummary.pending + team.tasksSummary.in_progress + team.tasksSummary.completed}T`;

      // Top border
      const top = '┌' + '─'.repeat(NODE_W - 2) + '┐';
      for (let i = 0; i < top.length && x + i < bufW; i++) {
        if (y < bufH) buf[y]![x + i] = top[i]!;
      }

      // Middle: status + name
      const mid = '│' + ` ${statusChar(team.status)} ${name}`.padEnd(NODE_W - 2).slice(0, NODE_W - 2) + '│';
      for (let i = 0; i < mid.length && x + i < bufW; i++) {
        if (y + 1 < bufH) buf[y + 1]![x + i] = mid[i]!;
      }

      // Stats line
      const stLine = '│' + ` ${stats}`.padEnd(NODE_W - 2).slice(0, NODE_W - 2) + '│';
      for (let i = 0; i < stLine.length && x + i < bufW; i++) {
        if (y + 2 < bufH) buf[y + 2]![x + i] = stLine[i]!;
      }

      // Bottom border
      const bot = '└' + '─'.repeat(NODE_W - 2) + '┘';
      for (let i = 0; i < bot.length && x + i < bufW; i++) {
        if (y + 3 < bufH && y + 3 >= 0) buf[y + 3]![x + i] = bot[i]!;
      }
    }

    // Draw edges between adjacent nodes (horizontal)
    const edgeStr = EDGE_FRAMES[Math.floor(spinnerFrame / 4) % EDGE_FRAMES.length]!;
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i]!;
      const b = positions[i + 1]!;
      // Same row? Draw horizontal edge
      if (Math.abs(a.y - b.y) < 2) {
        const edgeY = a.y + 1;
        const startX = a.x + NODE_W;
        const endX = b.x;
        if (edgeY < bufH && startX < endX) {
          for (let ex = startX; ex < endX && ex < bufW; ex++) {
            const edgeChar = edgeStr[(ex - startX + Math.floor(spinnerFrame / 4)) % edgeStr.length]!;
            buf[edgeY]![ex] = edgeChar;
          }
        }
      }
    }

    // Draw vertical connectors between rows
    for (let i = 0; i < positions.length; i++) {
      const a = positions[i]!;
      // Find node directly below
      const below = positions.find((p) => p.x === a.x && p.y > a.y && p.y - a.y < gap_y + 2);
      if (below) {
        const connX = a.x + Math.floor(NODE_W / 2);
        for (let cy = a.y + NODE_H + 1; cy < below.y && cy < bufH; cy++) {
          if (connX < bufW) buf[cy]![connX] = Math.floor(spinnerFrame / 8) % 2 === 0 ? '│' : '┃';
        }
      }
    }

    return { buf, positions, bufH };
  }, [registry, spinnerFrame, width]);

  // Render buffer as Text lines with coloring
  const lines = topology.buf.map((row) => row.join(''));

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="center" marginBottom={0}>
        <Text color="#CC6600" bold dimColor>{'─'.repeat(3)} NETWORK TOPOLOGY {'─'.repeat(3)}</Text>
      </Box>
      {lines.map((line, i) => {
        // Color nodes based on status
        let lineColor: string | undefined;
        for (const pos of topology.positions) {
          if (i >= pos.y && i <= pos.y + NODE_H) {
            lineColor = statusColor(pos.team.status);
            break;
          }
        }
        return (
          <Text key={i} color={lineColor ?? 'gray'} dimColor={!lineColor}>
            {line}
          </Text>
        );
      })}
    </Box>
  );
}
