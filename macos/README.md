# Pixel Agents - macOS

A native macOS application that visualizes Claude Code Agent Teams in real time. It combines a professional monitoring dashboard with an interactive 2D game map where AI agents are represented as pixel-art robots navigating a virtual office.

Built with SwiftUI and Canvas 2D rendering. Zero external dependencies.

## Features

### Dashboard View

- **Teams Sidebar** -- Lists all active, idle, and completed agent teams discovered from `~/.claude/teams/`. Teams are sorted by creation date with automatic lifecycle detection (active / idle / completed / stale). Includes one-click cleanup of finished teams.
- **Team Header** -- Displays the selected team name, description, agent count, and three metric cards: total tokens used, estimated cost (USD), and elapsed time.
- **Agent Cards** -- Horizontally scrollable cards for each team member showing current activity status (writing, reading, thinking, messaging, testing, deploying, debugging, idle, done, error), current task, file being worked on, lines added/deleted, token usage, and task progress bar.
- **Activity Feed** -- Live-updating chronological feed of session entries and agent messages with colored action badges (WRITE, READ, THINK, MSG, TEST, DEPLOY, DEBUG, ERROR).
- **Team Chat Room** -- Full chat view of inter-agent messages with markdown rendering, @mention highlighting, structured message type badges, and sender/recipient indicators. Supports maximize/minimize toggle.
- **CTO Executive Summary** -- Generates an AI-powered executive summary of the team's progress by invoking the `claude` CLI in print mode. Includes task overview, collaboration patterns, risks, metrics, and next steps (output in Portuguese BR).
- **Diff Viewer** -- Click any changed file in an agent card to open a modal diff overlay with syntax-colored added/removed/context lines.
- **Token Tracking** -- Periodically fetches daily token usage via `npx ccusage@latest` and displays totals in the team header.

### Game Map View

An interactive 2D isometric-style office world rendered on a SwiftUI `Canvas` at 30 FPS. Agents appear as pixel-art robot characters that walk between rooms based on their real-time activity.

- **8 Office Rooms** arranged in two rows separated by a central corridor:
  - Top row: Planning Room, Coding Lab, Test Lab, Deploy Center
  - Bottom row: Comms Hub, Lounge, Library, Debug Workshop
- **Pixel-Art Robot Sprites** -- Each agent type (csharp-developer, js-developer, sql-server-expert, tester-qa, security-expert, devops, tech-lead-gestor, qa-reviewer) has a unique color palette. Sprites are pre-rendered into a CGImage cache with 4 directional views (front/back/left/right), walk animation (4 frames), idle breathing (2 frames), sitting, and typing states.
- **Smart Activity Classifier** -- A weighted multi-signal scoring system determines which room each agent belongs in and what visual activity to display. Signals include: current tool use, file being edited, active task subject, agent type, agent name keywords, recent message content, and task completion ratio.
- **A\* Pathfinding** -- Agents navigate around walls and furniture using a 4-directional A\* algorithm. If no path is found, agents teleport directly to their destination.
- **Furniture Rendering** -- Each room contains themed furniture drawn procedurally on the Canvas: desks, monitors, chairs, bookshelves, server racks, sofas, coffee machines, whiteboards, plants, coffee tables, workbenches, and lamps. Server rack LEDs and monitor code lines animate based on the frame counter.
- **LED Strip Accents** -- Each room has colored LED strips along the top and bottom walls that pulse with a sine-wave animation.
- **Agent Inspector Panel** -- Click any agent on the map to open a floating overlay showing: name, type, level, title, current activity, task list, XP bar, stats (tasks completed, messages sent, files read/written), and a command input to send messages directly to the agent's inbox.
- **Emote Bubbles** -- Floating emoji bubbles above agents with a bobbing animation indicate their current activity (thought bubble, laptop, test tube, rocket, speech bubble, wrench, coffee, etc.).

### XP & Leveling System

Agents earn experience points (XP) from real actions tracked by the dashboard:

| Action           | XP  |
|------------------|-----|
| Task started     | 10  |
| Task completed   | 50  |
| Message sent     | 5   |
| File written     | 3   |
| File read        | 2   |
| Test executed    | 20  |
| Deploy completed | 30  |

**Levels:**

| Level | XP Required | Title       |
|-------|-------------|-------------|
| 1     | 0           | Recruit     |
| 2     | 100         | Developer   |
| 3     | 300         | Senior Dev  |
| 4     | 600         | Tech Lead   |
| 5     | 1000        | Architect   |
| 6     | 1500        | CTO         |
| 7     | 2500        | Legend       |

**Achievements:** First Task, Task Master (10 tasks), Chatterbox (50 messages), Bookworm (100 files read), Prolific Writer (50 files written), Architect (level 5), Legend (level 7).

Game state persists to `~/.claude/pixel-agents/<team-name>.json`.

## Architecture

### Tech Stack

- **Language:** Swift 5.9+
- **UI Framework:** SwiftUI (macOS 14+)
- **2D Rendering:** SwiftUI `Canvas` with `GraphicsContext` (CoreGraphics-backed)
- **Package Manager:** Swift Package Manager (SPM)
- **External Dependencies:** None

### Project Structure

```
Sources/PixelAgents/
  App/
    PixelAgentsApp.swift       -- @main entry point, window setup, activation policy
    AppIcon.swift              -- Programmatic app icon (6 agents in a circle)
  Models/
    ActivityType.swift         -- AgentStatus, TaskStatus, ActivityType enums
    AgentActivity.swift        -- Agent activity derived from session entries + tasks + messages
    AgentTask.swift            -- Task model with status, owner, blocks/blockedBy
    DiffData.swift             -- DiffLine, FileChange, DiffParser for file diffs
    GameModels.swift           -- XpAction, AgentGameData, ZoneId, LevelDefinition, GameState
    InboxMessage.swift         -- Agent inbox message with ISO8601 parsing, protocol filtering
    SessionEntry.swift         -- JSONL session entry from Claude Code sessions
    TeamConfig.swift           -- Team configuration with members, decoded from config.json
    TeamStatus.swift           -- Team lifecycle (active/idle/completed/stale) + freshness
    TeamTelemetry.swift        -- Duration, cost, tokens, errors, files changed
  Services/
    ActivityClassifier.swift   -- Multi-signal weighted scoring for zone/visual classification
    ClaudeDataService.swift    -- Main @Observable service: loads teams/tasks/messages from disk
    CTOSummaryService.swift    -- Generates CTO summary via claude CLI subprocess
    FileWatcher.swift          -- DispatchSource-based directory watcher with debounce
    GameStateService.swift     -- XP, levels, achievements, zone tracking, persistence
    SessionParser.swift        -- JSONL parser for session log files
    TokenTracker.swift         -- Fetches daily token usage via npx ccusage
  Theme/
    PixelTheme.swift           -- Colors, fonts, AgentColorPalette, GlassBackground, StatusBadge
  Views/
    Components/
      DiffViewerOverlay.swift  -- Modal diff viewer with line numbers and coloring
      PixelAvatar.swift        -- Gradient circle avatar with eyes + breathing animation
      TeamChatRoom.swift       -- Chat room with markdown bubbles + CTO summary sheet
    Dashboard/
      ActivityFeed.swift       -- Live feed of session entries and messages
      AgentCardsSection.swift  -- Horizontal scrollable agent cards
      DashboardView.swift      -- Root view: sidebar + main content
      MainContentView.swift    -- Dashboard or Game Map toggle
      MetricCard.swift         -- Token/cost/duration metric display
      TeamHeader.swift         -- Team name, description, metric cards
    GameMap/
      AgentCharacter.swift     -- Character model with grid/pixel position, state, path
      AgentInspectorView.swift -- Floating agent detail panel with command input
      CanvasRenderer.swift     -- Full Canvas rendering: floor, walls, furniture, LED, characters
      GameMapView.swift        -- Game loop, gestures, agent sync, inspector overlay
      OfficeWorld.swift        -- Tile grid (50x32), room layout, furniture placement, seats
      PathFinder.swift         -- A* pathfinding on tile grid
      SpriteSheet.swift        -- Pixel-art robot sprite pre-renderer with palette system
      StatsBarView.swift       -- Bottom bar: total XP, progress, top level, trophies
    Sidebar/
      TeamsSidebar.swift       -- Team list with status badges, clear completed, refresh
Tests/PixelAgentsTests/
  AgentColorPaletteTests.swift
  ClaudeDataServiceTests.swift
  DiffDataTests.swift
  FileWatcherTests.swift
  ModelTests.swift
  PixelAgentsTests.swift
  PixelThemeTests.swift
  SessionParserTests.swift
  StressTests.swift
```

### Data Sources

The app reads data from the Claude Code Agent Teams filesystem:

| Path | Content |
|------|---------|
| `~/.claude/teams/<name>/config.json` | Team configuration (name, members, lead) |
| `~/.claude/teams/<name>/inboxes/<agent>.json` | Agent inbox messages (array of messages) |
| `~/.claude/tasks/<name>/<id>.json` | Individual task files (subject, status, owner) |
| `~/.claude/pixel-agents/<name>.json` | Game state persistence (XP, levels, achievements) |

File changes are detected via `DispatchSource` watchers on team/task directories, plus a 5-second polling interval for content changes (light refresh) and a 30-second interval for full team list reload.

## Requirements

- macOS 14.0 (Sonoma) or later
- Swift 5.9+
- Apple Silicon or Intel Mac

## Build

```bash
cd /tmp/pixel-agents-macos-work/macos

# Debug build
swift build

# Release build (optimized)
swift build -c release
```

## Run

```bash
# Run debug build directly
swift run

# Or run the compiled binary
.build/debug/PixelAgents

# Release binary
.build/release/PixelAgents
```

The app opens a window (minimum 1200x800) and automatically discovers teams from `~/.claude/teams/`. It selects the most recent team on launch.

## Game Map Controls

### Navigation

| Action | Control |
|--------|---------|
| **Pan** | Click and drag anywhere on the map |
| **Zoom in** | Pinch-to-zoom gesture, or click the **+** button |
| **Zoom out** | Pinch-to-zoom gesture, or click the **-** button |
| **Reset view** | Click the reset button (counterclockwise arrow) |
| **Select agent** | Click on an agent character |
| **Deselect agent** | Click on empty space, or press **Esc** |

### Zoom Range

- Minimum: 0.3x
- Maximum: 3.0x
- Default: 1.0x

### Agent Inspector

When an agent is selected, a floating panel appears showing:
- Agent identity (name, type, level, title)
- Current activity with live indicator
- Task list (up to 3 shown, with overflow count)
- XP progress bar toward next level
- Stats: tasks done, messages sent, files touched
- **Command input:** Type a message and press Enter or click the send button to write directly to the agent's inbox file

### Dashboard/Map Toggle

Click the **Game Map** / **Dashboard** button in the team header to switch between views.

## Theme

Dark mode only. Accent color: orange (#F97316). The theme uses a glass-morphism aesthetic with:

- Background: #0D0D0D (page), #08080A (sidebar), #0F0F12 (surfaces)
- Text: white primary, 70% secondary, 38% muted
- Agent colors: 8 gradient palettes (green, amber, blue, purple, red, cyan, pink, indigo) assigned by name hash
- Fonts: SF Pro (system) for UI text, SF Mono (system monospaced) for technical data

## License

Private project.
