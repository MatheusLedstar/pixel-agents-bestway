import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseInbox } from '../core/inboxParser.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));

const { readFile } = await import('node:fs/promises');
const mockedReadFile = vi.mocked(readFile);

describe('parseInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses an array of messages', async () => {
    const messages = JSON.stringify([
      { from: 'backend-dev', to: 'fix-lead', text: 'Task done', timestamp: '2026-03-18T10:00:00Z', summary: 'Done' },
      { from: 'tester', text: 'Tests passing', timestamp: '2026-03-18T10:01:00Z' },
    ]);

    mockedReadFile.mockResolvedValue(messages);

    const result = await parseInbox('/fake/inbox.json');

    expect(result).toHaveLength(2);
    expect(result[0].from).toBe('backend-dev');
    expect(result[0].to).toBe('fix-lead');
    expect(result[0].text).toBe('Task done');
    expect(result[0].summary).toBe('Done');
    expect(result[1].from).toBe('tester');
    expect(result[1].to).toBeUndefined();
  });

  it('wraps a single message object in an array', async () => {
    const single = JSON.stringify({
      from: 'lead',
      text: 'Hello team',
      timestamp: '2026-03-18T09:00:00Z',
    });

    mockedReadFile.mockResolvedValue(single);

    const result = await parseInbox('/fake/inbox.json');

    expect(result).toHaveLength(1);
    expect(result[0].from).toBe('lead');
    expect(result[0].text).toBe('Hello team');
  });

  it('returns empty array for invalid JSON', async () => {
    mockedReadFile.mockResolvedValue('not json!!!');

    const result = await parseInbox('/fake/inbox.json');
    expect(result).toEqual([]);
  });

  it('returns empty array when file read fails', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));

    const result = await parseInbox('/fake/missing.json');
    expect(result).toEqual([]);
  });

  it('falls back to content field when text is missing', async () => {
    const messages = JSON.stringify([
      { from: 'agent', content: 'Message via content field', timestamp: '2026-03-18T10:00:00Z' },
    ]);

    mockedReadFile.mockResolvedValue(messages);

    const result = await parseInbox('/fake/inbox.json');

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Message via content field');
  });
});
