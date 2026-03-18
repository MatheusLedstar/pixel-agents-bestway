import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTeamConfig } from '../core/teamParser.js';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));

const { readFile } = await import('node:fs/promises');
const mockedReadFile = vi.mocked(readFile);

describe('parseTeamConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses valid team config JSON', async () => {
    const validConfig = JSON.stringify({
      name: 'test-team',
      description: 'A test team',
      createdAt: 1700000000000,
      leadAgentId: 'abc123',
      members: [
        { agentId: 'a1', name: 'backend-dev', agentType: 'csharp-developer', model: 'opus' },
        { agentId: 'a2', name: 'tester', agentType: 'tester-qa' },
      ],
    });

    mockedReadFile.mockResolvedValue(validConfig);

    const result = await parseTeamConfig('/fake/config.json');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('test-team');
    expect(result!.description).toBe('A test team');
    expect(result!.createdAt).toBe(1700000000000);
    expect(result!.leadAgentId).toBe('abc123');
    expect(result!.members).toHaveLength(2);
    expect(result!.members[0].name).toBe('backend-dev');
    expect(result!.members[0].model).toBe('opus');
    expect(result!.members[1].model).toBeUndefined();
  });

  it('returns null for invalid JSON', async () => {
    mockedReadFile.mockResolvedValue('not valid json {{{');

    const result = await parseTeamConfig('/fake/config.json');
    expect(result).toBeNull();
  });

  it('returns null when file read fails', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));

    const result = await parseTeamConfig('/fake/missing.json');
    expect(result).toBeNull();
  });

  it('handles missing optional fields gracefully', async () => {
    const minimalConfig = JSON.stringify({
      name: 'minimal-team',
      members: [],
    });

    mockedReadFile.mockResolvedValue(minimalConfig);

    const result = await parseTeamConfig('/fake/config.json');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('minimal-team');
    expect(result!.description).toBeUndefined();
    expect(result!.createdAt).toBeUndefined();
    expect(result!.leadAgentId).toBeUndefined();
    expect(result!.members).toHaveLength(0);
  });

  it('handles members with alternate field names (agent_id, agent_type)', async () => {
    const config = JSON.stringify({
      name: 'alt-fields-team',
      members: [
        { agent_id: 'x1', name: 'dev', agent_type: 'js-developer' },
      ],
    });

    mockedReadFile.mockResolvedValue(config);

    const result = await parseTeamConfig('/fake/config.json');

    expect(result).not.toBeNull();
    expect(result!.members[0].agentId).toBe('x1');
    expect(result!.members[0].agentType).toBe('js-developer');
  });
});
