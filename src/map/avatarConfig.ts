// Cyberpunk agent avatar configuration
// Tech Unicode symbols + neon colors instead of emoji circles

export interface AvatarConfig {
  icon: string;         // Single Unicode tech symbol
  tag: string;          // Short role tag (3-4 chars)
  color: string;        // Neon color for icon + name
  borderColor: string;  // Desk border color
  idleBar: string;      // Idle monitor pattern
}

const AVATAR_MAP: Record<string, AvatarConfig> = {
  'csharp-developer':      { icon: '◈', tag: 'C#',   color: 'magentaBright', borderColor: 'magenta',      idleBar: '▱▱▱▱▱▱▱▱' },
  'swift-developer':       { icon: '◆', tag: 'SWF',  color: '#FF6600',       borderColor: 'yellow',       idleBar: '▱▱▱▱▱▱▱▱' },
  'js-developer':          { icon: '⬡', tag: 'JS',   color: 'yellowBright',  borderColor: 'yellowBright', idleBar: '▱▱▱▱▱▱▱▱' },
  'security-expert':       { icon: '◉', tag: 'SEC',  color: 'redBright',     borderColor: 'red',          idleBar: '▱▱▱▱▱▱▱▱' },
  'qa-reviewer':           { icon: '✦', tag: 'QA',   color: 'greenBright',   borderColor: 'green',        idleBar: '▱▱▱▱▱▱▱▱' },
  'sql-server-expert':     { icon: '◇', tag: 'SQL',  color: 'blueBright',    borderColor: 'blue',         idleBar: '▱▱▱▱▱▱▱▱' },
  'devops':                { icon: '⟐', tag: 'OPS',  color: 'gray',          borderColor: 'gray',         idleBar: '▱▱▱▱▱▱▱▱' },
  'tester-qa':             { icon: '▣', tag: 'TST',  color: 'yellow',        borderColor: 'yellow',       idleBar: '▱▱▱▱▱▱▱▱' },
  'general-purpose':       { icon: '◎', tag: 'AGT',  color: 'cyanBright',    borderColor: 'cyan',         idleBar: '▱▱▱▱▱▱▱▱' },
  'meta-orchestrator':     { icon: '★', tag: 'META', color: 'yellowBright',  borderColor: 'yellowBright', idleBar: '▱▱▱▱▱▱▱▱' },
  'blazor-architect':      { icon: '◈', tag: 'BLZ',  color: 'magentaBright', borderColor: 'magentaBright', idleBar: '▱▱▱▱▱▱▱▱' },
  'api-designer':          { icon: '◇', tag: 'API',  color: 'blueBright',    borderColor: 'blueBright',   idleBar: '▱▱▱▱▱▱▱▱' },
  'winforms-developer':    { icon: '◈', tag: 'WIN',  color: 'magenta',       borderColor: 'magenta',      idleBar: '▱▱▱▱▱▱▱▱' },
  'performance-optimizer': { icon: '⚡', tag: 'PRF',  color: 'yellow',        borderColor: 'yellow',       idleBar: '▱▱▱▱▱▱▱▱' },
  'kotlin-developer':      { icon: '◆', tag: 'KT',   color: 'yellow',        borderColor: 'yellow',       idleBar: '▱▱▱▱▱▱▱▱' },
  'ux-designer':           { icon: '◐', tag: 'UX',   color: 'greenBright',   borderColor: 'greenBright',  idleBar: '▱▱▱▱▱▱▱▱' },
  'tech-lead-gestor':      { icon: '★', tag: 'LEAD', color: 'yellowBright',  borderColor: 'yellowBright', idleBar: '▱▱▱▱▱▱▱▱' },
};

const DEFAULT_AVATAR: AvatarConfig = {
  icon: '◎',
  tag: 'AGT',
  color: 'cyanBright',
  borderColor: 'cyan',
  idleBar: '▱▱▱▱▱▱▱▱',
};

export function getAvatarConfig(agentType: string): AvatarConfig {
  return AVATAR_MAP[agentType] ?? DEFAULT_AVATAR;
}
