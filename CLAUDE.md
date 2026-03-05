# pixel-agents-bestway

TUI dashboard para monitorar Claude Code Agent Teams em tempo real.

## Stack
- TypeScript strict, ESM
- Ink 5 (React para terminal) + React 18
- chokidar v4 (file watching)
- tsup (build)
- meow (CLI args)

## Estrutura
```
src/
  index.tsx        # Entry point CLI
  App.tsx          # Root component, navegacao
  core/            # Data layer (watcher, parsers, types)
  hooks/           # React hooks reativos
  views/           # Telas (Dashboard, TeamDetail, TaskBoard, Messages)
  components/      # Componentes reutilizaveis (Header, Footer, Cards, etc)
  utils/           # Cores, formatacao
```

## Comandos
- `npm run build` - Build com tsup
- `npm run dev` - Build em watch mode
- `npm start` - Executar
- `npm run typecheck` - Type check sem emit

## Convencoes
- Imports com extensao .js (ESM)
- Componentes funcionais com props tipadas
- Hooks gerenciam estado reativo via file watching
- Views recebem dados via props, nao gerenciam estado
- useInput apenas nas views para keyboard navigation

## Data Sources
- Teams: ~/.claude/teams/<name>/config.json
- Tasks: ~/.claude/tasks/<team>/<id>.json
- Inboxes: ~/.claude/teams/<name>/inboxes/<agent>.json
