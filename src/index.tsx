import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './App.js';
import { ensureCrossTeamDirs } from './core/crossTeamParser.js';

const cli = meow(
  `
  Usage
    $ pixel-agents-bestway

  Options
    --team, -t   Filter by team name
    --help       Show this help

  Examples
    $ pixel-agents-bestway
    $ pixel-agents-bestway --team security-review
`,
  {
    importMeta: import.meta,
    flags: {
      team: {
        type: 'string',
        shortFlag: 't',
      },
    },
  },
);

// Ensure cross-team directories exist
void ensureCrossTeamDirs();

// Enter alternate screen buffer (like Gemini CLI)
// This prevents flickering by giving us a dedicated screen
process.stdout.write('\x1b[?1049h'); // Enter alternate buffer
process.stdout.write('\x1b[?25l');   // Hide cursor
process.stdout.write('\x1b[2J');     // Clear screen
process.stdout.write('\x1b[H');      // Move to top-left

const cleanup = () => {
  process.stdout.write('\x1b[?25h');   // Show cursor
  process.stdout.write('\x1b[?1049l'); // Leave alternate buffer
};

// Handle cleanup on exit
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

const instance = render(<App filterTeam={cli.flags.team} />);
instance.waitUntilExit().then(cleanup).catch(cleanup);
