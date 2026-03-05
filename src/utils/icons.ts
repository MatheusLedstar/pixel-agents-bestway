// Nerd Font icons (requires a Nerd Font like FiraCode NF, JetBrains Mono NF, etc.)
// Fallbacks to Unicode symbols if Nerd Font not available

// Agent action icons based on tool/activity keywords
const ACTION_MAP: [RegExp, string][] = [
  [/read|lendo|reading/i, '󰈙'],        // nf-md-file_document_outline
  [/write|escrev|writing|criando/i, '󰏫'],  // nf-md-pencil
  [/edit|editando|editing|modific/i, ''],  // nf-cod-tools
  [/grep|search|busca|procur/i, ''],     // nf-cod-search
  [/glob|finding|arquivos/i, ''],        // nf-cod-files
  [/bash|execut|running|command|terminal|dotnet|swift|npm/i, ''], // nf-cod-terminal
  [/build|compil|bundl/i, ''],           // nf-oct-package
  [/test|testa|testing|xunit|vitest/i, '󰙨'], // nf-md-test_tube
  [/review|revis|analis/i, ''],          // nf-cod-eye
  [/plan|planej|design/i, ''],           // nf-cod-layout
  [/debug|investig|diagnos/i, ''],       // nf-cod-bug
  [/deploy|push|publish/i, ''],          // nf-cod-rocket
  [/security|segur|audit/i, '󰒃'],        // nf-md-shield_check
  [/refactor|refator/i, ''],             // nf-cod-references
  [/fix|corrig|fixing/i, ''],            // nf-cod-wrench
  [/implement|implemen/i, ''],           // nf-cod-gear
  [/consolidar|relat|report/i, ''],      // nf-cod-graph
  [/docker|container/i, ''],             // nf-dev-docker (fallback)
  [/git|commit|branch/i, ''],           // nf-cod-git_branch
  [/api|endpoint|rest/i, ''],            // nf-cod-globe
  [/database|sql|query/i, ''],           // nf-cod-database
  [/ui|view|component|frontend/i, ''],   // nf-cod-paintcan
  [/message|send|chat|inbox/i, '󰍡'],     // nf-md-message_text
  [/idle|waiting|aguard/i, '󰏤'],         // nf-md-pause
  [/complet|done|finish|conclu/i, ''],   // nf-cod-check
];

export function getActionIcon(text: string): string {
  for (const [pattern, icon] of ACTION_MAP) {
    if (pattern.test(text)) return icon;
  }
  return '▸';
}

// Spinner frames for active agents (braille dots - smooth animation)
export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Alternative spinner - dots expanding
export const PULSE_FRAMES = ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'];

// Status icons (Nerd Font preferred, Unicode fallback)
export const STATUS_ICONS: Record<string, string> = {
  completed: '',   // nf-cod-check
  in_progress: '', // nf-cod-loading (or use spinner)
  pending: '',     // nf-cod-circle_outline
  blocked: '',     // nf-cod-error
  active: '',      // nf-cod-pulse
  idle: '󰏤',       // nf-md-pause
  done: '',        // nf-cod-check_all
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

// Team icons (rotating per team index)
export const TEAM_ICONS = ['⬡', '◈', '⬢', '◆', '❖', '✦'];

export function getTeamIcon(index: number): string {
  return TEAM_ICONS[index % TEAM_ICONS.length];
}

// Section headers
export const SECTION_ICONS = {
  teams: '⊞',
  agents: '⊛',
  tasks: '⊡',
  messages: '⊜',
  progress: '◔',
};
