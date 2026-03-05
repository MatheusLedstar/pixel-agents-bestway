// Cyberpunk agent avatar configuration
// Tech Unicode symbols + neon colors
// Detects agent type from agentType field OR infers from agent name

export interface AvatarConfig {
  icon: string;
  tag: string;
  color: string;
  borderColor: string;
}

const AVATAR_MAP: Record<string, AvatarConfig> = {
  'csharp-developer':      { icon: '◈', tag: 'C#',   color: 'magentaBright', borderColor: 'magenta' },
  'swift-developer':       { icon: '◆', tag: 'SWF',  color: '#FF6600',       borderColor: 'yellow' },
  'js-developer':          { icon: '⬡', tag: 'JS',   color: 'yellowBright',  borderColor: 'yellowBright' },
  'security-expert':       { icon: '◉', tag: 'SEC',  color: 'redBright',     borderColor: 'red' },
  'qa-reviewer':           { icon: '✦', tag: 'QA',   color: 'greenBright',   borderColor: 'green' },
  'sql-server-expert':     { icon: '◇', tag: 'SQL',  color: 'blueBright',    borderColor: 'blue' },
  'devops':                { icon: '⟐', tag: 'OPS',  color: 'gray',          borderColor: 'gray' },
  'tester-qa':             { icon: '▣', tag: 'TST',  color: 'yellow',        borderColor: 'yellow' },
  'general-purpose':       { icon: '◎', tag: 'AGT',  color: 'cyanBright',    borderColor: 'cyan' },
  'meta-orchestrator':     { icon: '★', tag: 'META', color: 'yellowBright',  borderColor: 'yellowBright' },
  'blazor-architect':      { icon: '◈', tag: 'BLZ',  color: 'magentaBright', borderColor: 'magentaBright' },
  'api-designer':          { icon: '◇', tag: 'API',  color: 'blueBright',    borderColor: 'blueBright' },
  'winforms-developer':    { icon: '◈', tag: 'WIN',  color: 'magenta',       borderColor: 'magenta' },
  'performance-optimizer': { icon: '⚡', tag: 'PRF',  color: 'yellow',        borderColor: 'yellow' },
  'kotlin-developer':      { icon: '◆', tag: 'KT',   color: 'yellow',        borderColor: 'yellow' },
  'ux-designer':           { icon: '◐', tag: 'UX',   color: 'greenBright',   borderColor: 'greenBright' },
  'tech-lead-gestor':      { icon: '★', tag: 'LEAD', color: 'yellowBright',  borderColor: 'yellowBright' },
};

const DEFAULT_AVATAR: AvatarConfig = {
  icon: '◎',
  tag: 'AGT',
  color: 'cyanBright',
  borderColor: 'cyan',
};

/** Infer agent type from the agent's name when agentType is missing or generic */
function inferTypeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (/backend|csharp|c#|dotnet|\.net/.test(lower)) return 'csharp-developer';
  if (/swift|ios|macos/.test(lower)) return 'swift-developer';
  if (/js|react|next|frontend|web|node/.test(lower)) return 'js-developer';
  if (/sec|security|audit/.test(lower)) return 'security-expert';
  if (/qa|review|quality/.test(lower)) return 'qa-reviewer';
  if (/sql|db|database/.test(lower)) return 'sql-server-expert';
  if (/devops|ops|deploy|docker|ci/.test(lower)) return 'devops';
  if (/test|tester|verif/.test(lower)) return 'tester-qa';
  if (/lead|meta|orchestrat|coord/.test(lower)) return 'meta-orchestrator';
  if (/kotlin|android/.test(lower)) return 'kotlin-developer';
  if (/ux|design/.test(lower)) return 'ux-designer';
  if (/blazor/.test(lower)) return 'blazor-architect';
  if (/api/.test(lower)) return 'api-designer';
  if (/winform/.test(lower)) return 'winforms-developer';
  if (/perf|optim/.test(lower)) return 'performance-optimizer';
  return null;
}

export function getAvatarConfig(agentType: string, agentName?: string): AvatarConfig {
  // Direct match on agentType
  const direct = AVATAR_MAP[agentType];
  if (direct && agentType !== 'general-purpose') return direct;

  // Infer from name if agentType is generic
  if (agentName) {
    const inferred = inferTypeFromName(agentName);
    if (inferred) return AVATAR_MAP[inferred] ?? DEFAULT_AVATAR;
  }

  return direct ?? DEFAULT_AVATAR;
}
