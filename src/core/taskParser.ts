import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TASKS_DIR } from './watcher.js';
import type { Task, TaskStatus } from './types.js';

const VALID_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed'];

function isValidStatus(s: unknown): s is TaskStatus {
  return typeof s === 'string' && VALID_STATUSES.includes(s as TaskStatus);
}

export async function parseTask(filePath: string): Promise<Task | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    const status = isValidStatus(data.status) ? data.status : 'pending';

    return {
      id: String(data.id ?? ''),
      subject: String(data.subject ?? ''),
      description: data.description != null ? String(data.description) : undefined,
      status,
      owner: data.owner != null ? String(data.owner) : undefined,
      activeForm: data.activeForm != null ? String(data.activeForm) : undefined,
      blocks: Array.isArray(data.blocks) ? data.blocks.map(String) : undefined,
      blockedBy: Array.isArray(data.blockedBy) ? data.blockedBy.map(String) : undefined,
    };
  } catch {
    return null;
  }
}

function sortTasks(tasks: Task[]): Task[] {
  tasks.sort((a, b) => {
    const aNum = parseInt(a.id, 10);
    const bNum = parseInt(b.id, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.id.localeCompare(b.id);
  });
  return tasks;
}

export async function loadTeamTasks(teamName: string): Promise<Task[]> {
  const teamDir = join(TASKS_DIR, teamName);
  if (!existsSync(teamDir)) return [];

  try {
    const entries = await readdir(teamDir);
    const tasks: Task[] = [];

    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      if (entry.startsWith('.')) continue;

      const task = await parseTask(join(teamDir, entry));
      if (task) tasks.push(task);
    }

    return sortTasks(tasks);
  } catch {
    return [];
  }
}

export async function loadAllTeamsTasks(teamNames: string[]): Promise<Map<string, Task[]>> {
  const result = new Map<string, Task[]>();
  await Promise.all(
    teamNames.map(async (name) => {
      const tasks = await loadTeamTasks(name);
      result.set(name, tasks);
    }),
  );
  return result;
}
