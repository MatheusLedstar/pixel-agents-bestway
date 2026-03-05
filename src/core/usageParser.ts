import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { UsageData, ModelUsage } from './types.js';

const execFileAsync = promisify(execFile);

function todayYYYYMMDD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export async function loadUsage(): Promise<UsageData> {
  const today = todayYYYYMMDD();
  try {
    const { stdout } = await execFileAsync('npx', [
      'ccusage@latest', '--json', '--offline',
      '--since', today, '--until', today,
    ], { timeout: 20_000 });

    // Filter out [ccusage] log lines from stdout
    const jsonStr = stdout
      .split('\n')
      .filter((l) => !l.startsWith('[ccusage]') && l.trim().length > 0)
      .join('\n');

    const data = JSON.parse(jsonStr) as {
      daily: Array<{
        date: string;
        inputTokens: number;
        outputTokens: number;
        cacheCreationTokens: number;
        cacheReadTokens: number;
        totalTokens: number;
        totalCost: number;
        modelBreakdowns: ModelUsage[];
      }>;
    };

    const day = data.daily[0];
    if (!day) {
      return {
        date: new Date().toISOString().slice(0, 10),
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        modelBreakdowns: [],
        lastUpdated: new Date(),
        loading: false,
      };
    }

    return {
      date: day.date,
      inputTokens: day.inputTokens,
      outputTokens: day.outputTokens,
      cacheCreationTokens: day.cacheCreationTokens,
      cacheReadTokens: day.cacheReadTokens,
      totalTokens: day.totalTokens,
      totalCost: day.totalCost,
      modelBreakdowns: day.modelBreakdowns ?? [],
      lastUpdated: new Date(),
      loading: false,
    };
  } catch (err) {
    return {
      date: new Date().toISOString().slice(0, 10),
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      modelBreakdowns: [],
      lastUpdated: new Date(),
      loading: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
