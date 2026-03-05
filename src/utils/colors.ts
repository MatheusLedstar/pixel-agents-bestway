const AGENT_COLORS = [
  'cyan',
  'green',
  'yellow',
  'magenta',
  'blue',
  'red',
  'white',
  'gray',
] as const;

export type AgentColor = (typeof AGENT_COLORS)[number];

const colorMap = new Map<string, AgentColor>();
let colorIndex = 0;

export function getAgentColor(agentName: string): AgentColor {
  const existing = colorMap.get(agentName);
  if (existing) return existing;

  const color = AGENT_COLORS[colorIndex % AGENT_COLORS.length];
  colorMap.set(agentName, color);
  colorIndex++;
  return color;
}

