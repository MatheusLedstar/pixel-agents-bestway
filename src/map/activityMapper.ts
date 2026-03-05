// Cyberpunk activity mapper — converts agent activity to visual states
// Uses block characters and tech patterns for monitor animation

import type { AgentActivity } from '../core/sessionParser.js';

export type ActivityState =
  | 'idle'
  | 'reading'
  | 'writing'
  | 'searching'
  | 'running'
  | 'thinking'
  | 'messaging'
  | 'testing'
  | 'celebrating'
  | 'error';

export interface ActivityVisual {
  state: ActivityState;
  icon: string;           // Status indicator character
  label: string;          // Activity description
  monitorFrames: string[];  // Animated monitor bar patterns
  labelColor: string;     // Neon color for the activity label
}

const IDLE_VISUAL: ActivityVisual = {
  state: 'idle',
  icon: '·',
  label: '',
  monitorFrames: ['▱▱▱▱▱▱▱▱'],
  labelColor: 'gray',
};

export function mapActivity(activity: AgentActivity | undefined): ActivityVisual {
  if (!activity) return IDLE_VISUAL;

  const { lastAction, isThinking } = activity;

  if (isThinking) {
    return {
      state: 'thinking',
      icon: '⣾',
      label: 'THINKING',
      monitorFrames: ['⣾▱▱▱▱▱▱▱', '▱⣽▱▱▱▱▱▱', '▱▱⣻▱▱▱▱▱', '▱▱▱⢿▱▱▱▱', '▱▱▱▱⡿▱▱▱', '▱▱▱▱▱⣟▱▱', '▱▱▱▱▱▱⣯▱', '▱▱▱▱▱▱▱⣷'],
      labelColor: 'cyanBright',
    };
  }

  if (/^Reading /i.test(lastAction)) {
    const file = lastAction.replace(/^Reading /i, '');
    return {
      state: 'reading',
      icon: '▶',
      label: file,
      monitorFrames: ['░▒▓█▓▒░▱', '▱░▒▓█▓▒░', '░▱░▒▓█▓▒', '▒░▱░▒▓█▓'],
      labelColor: 'cyanBright',
    };
  }

  if (/^(Writing|Editing) /i.test(lastAction)) {
    const file = lastAction.replace(/^(Writing|Editing) /i, '');
    return {
      state: 'writing',
      icon: '▶',
      label: file,
      monitorFrames: ['▰▱▱▱▱▱▱▱', '▰▰▱▱▱▱▱▱', '▰▰▰▱▱▱▱▱', '▰▰▰▰▱▱▱▱', '▰▰▰▰▰▱▱▱', '▰▰▰▰▰▰▱▱', '▰▰▰▰▰▰▰▱', '▰▰▰▰▰▰▰▰'],
      labelColor: 'magentaBright',
    };
  }

  if (/^(Searching|Finding) /i.test(lastAction)) {
    const target = lastAction.replace(/^(Searching|Finding files): ?/i, '');
    return {
      state: 'searching',
      icon: '⟐',
      label: target,
      monitorFrames: ['▓▱▱▱▱▱▱▱', '▱▓▱▱▱▱▱▱', '▱▱▓▱▱▱▱▱', '▱▱▱▓▱▱▱▱', '▱▱▱▱▓▱▱▱', '▱▱▱▱▱▓▱▱', '▱▱▱▱▱▱▓▱', '▱▱▱▱▱▱▱▓'],
      labelColor: 'yellowBright',
    };
  }

  if (/^Running/i.test(lastAction)) {
    const cmd = lastAction.replace(/^Running: ?/i, '');
    if (/test|jest|xunit|vitest/i.test(cmd)) {
      return {
        state: 'testing',
        icon: '▶',
        label: 'TESTING',
        monitorFrames: ['▰▱▰▱▰▱▰▱', '▱▰▱▰▱▰▱▰'],
        labelColor: 'yellowBright',
      };
    }
    return {
      state: 'running',
      icon: '▶',
      label: cmd,
      monitorFrames: ['▰▰▱▱▰▰▱▱', '▱▱▰▰▱▱▰▰'],
      labelColor: 'greenBright',
    };
  }

  if (/^(Sending message|Updating task|Creating task)/i.test(lastAction)) {
    return {
      state: 'messaging',
      icon: '⟫',
      label: 'MSG OUT',
      monitorFrames: ['▱▱▱▱▱▱▰▰', '▱▱▱▱▰▰▱▱', '▱▱▰▰▱▱▱▱', '▰▰▱▱▱▱▱▱'],
      labelColor: 'cyanBright',
    };
  }

  if (/^Delegating/i.test(lastAction)) {
    return {
      state: 'messaging',
      icon: '⟫',
      label: lastAction.replace(/^Delegating: ?/i, ''),
      monitorFrames: ['▱▱▱▱▱▱▰▰', '▱▱▱▱▰▰▱▱', '▱▱▰▰▱▱▱▱', '▰▰▱▱▱▱▱▱'],
      labelColor: 'cyanBright',
    };
  }

  if (/^(Fetching|Searching web)/i.test(lastAction)) {
    return {
      state: 'searching',
      icon: '⟐',
      label: lastAction.replace(/^(Fetching|Searching web): ?/i, ''),
      monitorFrames: ['░▒▓█▓▒░▱', '▱░▒▓█▓▒░'],
      labelColor: 'yellowBright',
    };
  }

  if (/^Using /i.test(lastAction)) {
    return {
      state: 'running',
      icon: '▶',
      label: lastAction,
      monitorFrames: ['▰▰▱▱▰▰▱▱', '▱▱▰▰▱▱▰▰'],
      labelColor: 'greenBright',
    };
  }

  if (lastAction && lastAction !== 'Working...') {
    return {
      state: 'running',
      icon: '▶',
      label: lastAction,
      monitorFrames: ['▰▱▰▱▰▱▰▱', '▱▰▱▰▱▰▱▰'],
      labelColor: 'greenBright',
    };
  }

  return IDLE_VISUAL;
}

// Braille spinner for thinking state (8 frames)
export const THINKING_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
