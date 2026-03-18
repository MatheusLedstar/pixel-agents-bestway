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

const MAX_COLOR_MAP_SIZE = 1000;
const colorMap = new Map<string, AgentColor>();
let colorIndex = 0;

export function getAgentColor(agentName: string): AgentColor {
  const existing = colorMap.get(agentName);
  if (existing) return existing;

  // Evict oldest entries when map exceeds bounds
  if (colorMap.size >= MAX_COLOR_MAP_SIZE) {
    const firstKey = colorMap.keys().next().value;
    if (firstKey !== undefined) colorMap.delete(firstKey);
  }

  const color = AGENT_COLORS[colorIndex % AGENT_COLORS.length];
  colorMap.set(agentName, color);
  colorIndex++;
  return color;
}

