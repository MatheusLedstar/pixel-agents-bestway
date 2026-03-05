// Terminal-safe icons - ONLY emoji + basic Unicode
// Works on ALL terminals (macOS Terminal, iTerm2, VS Code, etc.)
// NO Nerd Font codepoints (private use area)

// Agent action icons based on tool/activity keywords
const ACTION_MAP: [RegExp, string][] = [
  [/read|lendo|reading/i, '📖'],
  [/write|escrev|writing|criando/i, '✏️'],
  [/edit|editando|editing|modific/i, '🔧'],
  [/grep|search|busca|procur/i, '🔍'],
  [/glob|finding|arquivos/i, '📁'],
  [/bash|execut|running|command|terminal|dotnet|swift|npm/i, '⚡'],
  [/build|compil|bundl/i, '🏗️'],
  [/test|testa|testing|xunit|vitest/i, '🧪'],
  [/review|revis|analis/i, '👁️'],
  [/plan|planej|design/i, '📐'],
  [/debug|investig|diagnos/i, '🐛'],
  [/deploy|push|publish/i, '🚀'],
  [/security|segur|audit/i, '🛡️'],
  [/refactor|refator/i, '♻️'],
  [/fix|corrig|fixing/i, '🔨'],
  [/implement|implemen/i, '⚙️'],
  [/consolidar|relat|report/i, '📊'],
  [/docker|container/i, '🐳'],
  [/git|commit|branch/i, '🌿'],
  [/api|endpoint|rest/i, '🌐'],
  [/database|sql|query/i, '🗄️'],
  [/ui|view|component|frontend/i, '🎨'],
  [/message|send|chat|inbox/i, '💬'],
  [/idle|waiting|aguard/i, '⏸️'],
  [/complet|done|finish|conclu/i, '✅'],
];

export function getActionIcon(text: string): string {
  for (const [pattern, icon] of ACTION_MAP) {
    if (pattern.test(text)) return icon;
  }
  return '▸';
}

// Spinner frames - braille dots (universally supported)
export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Large spinner frames (more visible)
export const LARGE_SPINNER_FRAMES = ['◐', '◓', '◑', '◒'];

// Status icons - basic Unicode only
export const STATUS_ICONS: Record<string, string> = {
  completed: '✓',
  in_progress: '●',
  pending: '○',
  blocked: '✗',
  active: '●',
  idle: '○',
  done: '✓',
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  completed: 'green',
  in_progress: 'yellow',
  pending: 'gray',
  blocked: 'red',
  active: 'greenBright',
  idle: 'gray',
  done: 'green',
};

// Section headers - basic Unicode
export const SECTION_ICONS = {
  teams: '■',
  agents: '●',
  tasks: '□',
  messages: '◆',
  tokens: '◇',
};
