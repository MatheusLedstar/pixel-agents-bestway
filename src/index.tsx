import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './App.js';

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

render(<App filterTeam={cli.flags.team} />);
