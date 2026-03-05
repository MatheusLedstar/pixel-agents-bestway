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

// ── Wave generation ──────────────────────────────────────────
const WAVE_CHARS = '░▒▓█▓▒░ ';

function generateWave(width: number, frame: number, speed: number = 1): string {
  let wave = '';
  for (let i = 0; i < width; i++) {
    const idx = (i + frame * speed) % WAVE_CHARS.length;
    wave += WAVE_CHARS[idx] ?? ' ';
  }
  return wave;
}

// Double wave: two overlapping patterns
function generateDoubleWave(width: number, frame: number): string {
  let wave = '';
  for (let i = 0; i < width; i++) {
    const idx1 = (i + frame * 2) % WAVE_CHARS.length;
    const idx2 = (i * 2 + frame) % WAVE_CHARS.length;
    // Pick the brighter of the two
    const c1 = WAVE_CHARS[idx1] ?? ' ';
    const c2 = WAVE_CHARS[idx2] ?? ' ';
    wave += c1 > c2 ? c1 : c2;
  }
  return wave;
}

// ── Scanline: bright dot moving across ───────────────────────
function generateScanline(width: number, frame: number): string {
  const pos = (frame * 3) % (width * 2);
  const actualPos = pos < width ? pos : width * 2 - pos; // bounce
  let line = '';
  for (let i = 0; i < width; i++) {
    const dist = Math.abs(i - actualPos);
    if (dist === 0) line += '█';
    else if (dist === 1) line += '▓';
    else if (dist === 2) line += '▒';
    else if (dist <= 4) line += '░';
    else line += ' ';
  }
  return line;
}

// ── Particles: floating sparks ───────────────────────────────
const PARTICLE_CHARS = ['·', '∙', '•', '✦', '✧', '⋆', '◦', '°'];
const PARTICLE_COLORS = ['cyan', 'magenta', 'yellow', 'green', 'blue', 'red', 'white'] as const;

interface Particle {
  char: string;
  color: string;
  pos: number;
}

function generateParticles(width: number, frame: number, count: number, seed: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    // Pseudo-random but deterministic per frame
    const hash = ((seed + i) * 7919 + frame * 131) % 10007;
    const pos = (hash + frame * (i + 1)) % width;
    const charIdx = (hash * 3) % PARTICLE_CHARS.length;
    const colorIdx = (hash * 7) % PARTICLE_COLORS.length;
    particles.push({
      char: PARTICLE_CHARS[charIdx] ?? '·',
      color: PARTICLE_COLORS[colorIdx] ?? 'cyan',
      pos,
    });
  }
  return particles;
}

function renderParticleLine(width: number, frame: number, seed: number, count: number): string {
  const particles = generateParticles(width, frame, count, seed);
  const line = new Array<string>(width).fill(' ');
  for (const p of particles) {
    if (p.pos >= 0 && p.pos < width) {
      line[p.pos] = p.char;
    }
  }
  return line.join('');
}

// ── Data flow lines: show data moving between desks ──────────
const DATA_FLOW = ['⟩', '⟫', '▸', '▹', '›'];
function generateDataFlow(width: number, frame: number): string {
  let line = '';
  for (let i = 0; i < width; i++) {
    const idx = (i + frame * 2) % (DATA_FLOW.length * 3);
    if (idx < DATA_FLOW.length) {
      line += DATA_FLOW[idx] ?? ' ';
    } else {
      line += ' ';
    }
  }
  return line;
}

const CIRCUIT_L = '╠═';
const CIRCUIT_R = '═╣';

export default function OfficeMap({ team, tasks, messages, session, spinnerFrame, layout }: OfficeMapProps) {
  const agents = team.members;

  const rows = useMemo(() => {
    const result: (typeof agents)[] = [];
    for (let i = 0; i < agents.length; i += layout.cols) {
      result.push(agents.slice(i, i + layout.cols));
    }
    return result;
  }, [agents, layout.cols]);

  const waveWidth = Math.max(layout.commsWidth, layout.cols * (layout.deskWidth + 8) + 6);

  return (
    <Box flexDirection="column" gap={0}>
      {/* Top particle field */}
      <Box justifyContent="center">
        <Text color="cyan" dimColor>{renderParticleLine(waveWidth, spinnerFrame, 42, Math.ceil(waveWidth / 10))}</Text>
      </Box>

      {/* Top scanline — bouncing */}
      <Box justifyContent="center">
        <Text color="cyanBright" dimColor>{generateScanline(waveWidth, spinnerFrame)}</Text>
      </Box>

      {/* Top wave */}
      <Box justifyContent="center">
        <Text color="cyan" dimColor>{generateDoubleWave(waveWidth, spinnerFrame)}</Text>
      </Box>

      {rows.map((row, rowIdx) => (
        <Box key={`row-${rowIdx}`} flexDirection="column">
          {/* Particle field above each row */}
          <Box justifyContent="center">
            <Text color="magenta" dimColor>{renderParticleLine(waveWidth, spinnerFrame, rowIdx * 100 + 7, Math.ceil(waveWidth / 14))}</Text>
          </Box>

          {/* Agent desks row */}
          <Box flexDirection="row" justifyContent="center" alignItems="center">
            <Text color="gray" dimColor>{CIRCUIT_L}</Text>

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

            <Text color="gray" dimColor>{CIRCUIT_R}</Text>
          </Box>

          {/* Data flow + wave separator between rows */}
          {rowIdx < rows.length - 1 && (
            <>
              <Box justifyContent="center">
                <Text color="greenBright" dimColor>{generateDataFlow(waveWidth, spinnerFrame)}</Text>
              </Box>
              <Box justifyContent="center">
                <Text color="cyan" dimColor>{generateWave(waveWidth, spinnerFrame, rowIdx + 2)}</Text>
              </Box>
            </>
          )}
        </Box>
      ))}

      {/* Particles before meeting table */}
      <Box justifyContent="center">
        <Text color="yellow" dimColor>{renderParticleLine(waveWidth, spinnerFrame, 999, Math.ceil(waveWidth / 8))}</Text>
      </Box>

      {/* Double wave before meeting table */}
      <Box justifyContent="center">
        <Text color="magentaBright" dimColor>{generateDoubleWave(waveWidth, spinnerFrame)}</Text>
      </Box>

      {/* Meeting table */}
      <Box justifyContent="center" marginTop={0}>
        <MeetingRoom messages={messages} width={layout.commsWidth} spinnerFrame={spinnerFrame} />
      </Box>

      {/* Bottom wave */}
      <Box justifyContent="center">
        <Text color="cyan" dimColor>{generateDoubleWave(waveWidth, spinnerFrame)}</Text>
      </Box>

      {/* Bottom scanline — bouncing opposite direction */}
      <Box justifyContent="center">
        <Text color="magentaBright" dimColor>{generateScanline(waveWidth, spinnerFrame + Math.floor(waveWidth / 2))}</Text>
      </Box>

      {/* Bottom particle field */}
      <Box justifyContent="center">
        <Text color="green" dimColor>{renderParticleLine(waveWidth, spinnerFrame, 1337, Math.ceil(waveWidth / 10))}</Text>
      </Box>
    </Box>
  );
}
