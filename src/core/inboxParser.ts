import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TEAMS_DIR } from './watcher.js';
import type { Message } from './types.js';

function parseMessageObj(data: Record<string, unknown>): Message {
  return {
    from: String(data.from ?? ''),
    to: data.to != null ? String(data.to) : undefined,
    text: String(data.text ?? data.content ?? ''),
    timestamp: String(data.timestamp ?? new Date().toISOString()),
    color: data.color != null ? String(data.color) : undefined,
    read: typeof data.read === 'boolean' ? data.read : undefined,
    summary: data.summary != null ? String(data.summary) : undefined,
  };
}

export async function parseInbox(filePath: string): Promise<Message[]> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      return data.map((item) => parseMessageObj(item as Record<string, unknown>));
    }

    if (typeof data === 'object' && data !== null) {
      return [parseMessageObj(data as Record<string, unknown>)];
    }

    return [];
  } catch {
    return [];
  }
}

function sortMessages(messages: Message[]): Message[] {
  messages.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return tb - ta;
  });
  return messages;
}

export async function loadTeamMessages(teamName: string): Promise<Message[]> {
  const inboxDir = join(TEAMS_DIR, teamName, 'inboxes');
  if (!existsSync(inboxDir)) return [];

  try {
    const entries = await readdir(inboxDir);
    const allMessages: Message[] = [];

    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;

      const messages = await parseInbox(join(inboxDir, entry));
      allMessages.push(...messages);
    }

    return sortMessages(allMessages);
  } catch {
    return [];
  }
}

export async function loadAllTeamsMessages(teamNames: string[]): Promise<Map<string, Message[]>> {
  const result = new Map<string, Message[]>();
  await Promise.all(
    teamNames.map(async (name) => {
      const msgs = await loadTeamMessages(name);
      result.set(name, msgs);
    }),
  );
  return result;
}
