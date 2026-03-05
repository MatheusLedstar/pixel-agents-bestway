import { watch, type FSWatcher } from 'chokidar';
import { join } from 'node:path';
import { homedir } from 'node:os';

export type WatchEvent = 'add' | 'change' | 'unlink';
export type WatchCallback = (event: WatchEvent, path: string) => void;

const CLAUDE_DIR = join(homedir(), '.claude');
const TEAMS_DIR = join(CLAUDE_DIR, 'teams');
const TASKS_DIR = join(CLAUDE_DIR, 'tasks');

const DEBOUNCE_MS = 500;

export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private callbacks: WatchCallback[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingEvent: { event: WatchEvent; path: string } | null = null;

  onUpdate(cb: WatchCallback): void {
    this.callbacks.push(cb);
  }

  private notify(event: WatchEvent, path: string): void {
    this.pendingEvent = { event, path };

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.pendingEvent) {
        for (const cb of this.callbacks) {
          cb(this.pendingEvent.event, this.pendingEvent.path);
        }
        this.pendingEvent = null;
      }
      this.debounceTimer = null;
    }, DEBOUNCE_MS);
  }

  watchTeams(): void {
    const watcher = watch(join(TEAMS_DIR, '*/config.json'), {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });
    watcher.on('add', (p) => this.notify('add', p));
    watcher.on('change', (p) => this.notify('change', p));
    watcher.on('unlink', (p) => this.notify('unlink', p));
    this.watchers.push(watcher);
  }

  watchTasks(teamName?: string): void {
    const pattern = teamName
      ? join(TASKS_DIR, teamName, '*.json')
      : join(TASKS_DIR, '*/*.json');
    const watcher = watch(pattern, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });
    watcher.on('add', (p) => this.notify('add', p));
    watcher.on('change', (p) => this.notify('change', p));
    watcher.on('unlink', (p) => this.notify('unlink', p));
    this.watchers.push(watcher);
  }

  watchInboxes(teamName?: string): void {
    const pattern = teamName
      ? join(TEAMS_DIR, teamName, 'inboxes', '*.json')
      : join(TEAMS_DIR, '*/inboxes/*.json');
    const watcher = watch(pattern, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });
    watcher.on('add', (p) => this.notify('add', p));
    watcher.on('change', (p) => this.notify('change', p));
    watcher.on('unlink', (p) => this.notify('unlink', p));
    this.watchers.push(watcher);
  }

  watchAll(): void {
    this.watchTeams();
    this.watchTasks();
    this.watchInboxes();
  }

  async close(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await Promise.all(this.watchers.map((w) => w.close()));
    this.watchers = [];
    this.callbacks = [];
  }
}

export { CLAUDE_DIR, TEAMS_DIR, TASKS_DIR };
