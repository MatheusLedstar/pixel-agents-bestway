import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTask } from '../core/taskParser.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));

const { readFile } = await import('node:fs/promises');
const mockedReadFile = vi.mocked(readFile);

describe('parseTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses a valid task JSON', async () => {
    const validTask = JSON.stringify({
      id: '1',
      subject: 'Fix the bug',
      description: 'There is a critical bug in module X',
      status: 'in_progress',
      owner: 'backend-dev',
      activeForm: 'Fixing the bug',
      blocks: ['2'],
      blockedBy: [],
    });

    mockedReadFile.mockResolvedValue(validTask);

    const result = await parseTask('/fake/task.json');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('1');
    expect(result!.subject).toBe('Fix the bug');
    expect(result!.description).toBe('There is a critical bug in module X');
    expect(result!.status).toBe('in_progress');
    expect(result!.owner).toBe('backend-dev');
    expect(result!.activeForm).toBe('Fixing the bug');
    expect(result!.blocks).toEqual(['2']);
    expect(result!.blockedBy).toEqual([]);
  });

  it('returns null for invalid JSON', async () => {
    mockedReadFile.mockResolvedValue('}{broken');

    const result = await parseTask('/fake/task.json');
    expect(result).toBeNull();
  });

  it('returns null when file read fails', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));

    const result = await parseTask('/fake/missing.json');
    expect(result).toBeNull();
  });

  it('defaults status to pending for invalid status values', async () => {
    const taskWithBadStatus = JSON.stringify({
      id: '2',
      subject: 'Some task',
      status: 'invalid_status',
    });

    mockedReadFile.mockResolvedValue(taskWithBadStatus);

    const result = await parseTask('/fake/task.json');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('pending');
  });

  it('handles missing optional fields gracefully', async () => {
    const minimalTask = JSON.stringify({
      id: '3',
      subject: 'Minimal task',
      status: 'completed',
    });

    mockedReadFile.mockResolvedValue(minimalTask);

    const result = await parseTask('/fake/task.json');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('3');
    expect(result!.subject).toBe('Minimal task');
    expect(result!.status).toBe('completed');
    expect(result!.owner).toBeUndefined();
    expect(result!.description).toBeUndefined();
    expect(result!.activeForm).toBeUndefined();
    expect(result!.blocks).toBeUndefined();
    expect(result!.blockedBy).toBeUndefined();
  });
});
