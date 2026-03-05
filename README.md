# pixel-agents-bestway

Real-time TUI dashboard for Claude Code Agent Teams. Monitor your teams, agents, tasks and messages directly in the terminal.

## Features

- **Dashboard** - Overview of all teams with progress bars
- **Team Detail** - Agents table + task list for a specific team
- **Task Board** - Kanban view (Pending → In Progress → Completed)
- **Messages Feed** - Live message stream from agent inboxes
- **File Watching** - Auto-updates when teams/tasks change on disk

## Install & Run

```bash
# Clone and build
git clone https://github.com/MatheusLedstar/pixel-agents-bestway.git
cd pixel-agents-bestway
npm install
npm run build

# Run
npm start

# Or directly
node dist/index.js

# Filter by team
node dist/index.js --team security-review
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Switch between views |
| `↑` `↓` | Navigate items |
| `Enter` | Open detail view |
| `Esc` | Go back |
| `m` | Messages view (from team detail) |
| `t` | Task board view (from team detail) |
| `q` | Quit |

## How It Works

Watches `~/.claude/teams/` and `~/.claude/tasks/` directories for changes using chokidar. When Claude Code creates teams, spawns agents, creates tasks, or agents send messages, the dashboard updates in real-time.

## Requirements

- Node.js 20+
- Claude Code with Agent Teams

## Stack

- TypeScript + Ink 5 (React for terminals)
- chokidar (file watching)
- tsup (build)
