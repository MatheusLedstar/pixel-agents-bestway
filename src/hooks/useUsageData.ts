import { useState, useEffect, useCallback } from 'react';
import type { UsageData } from '../core/types.js';
import { loadUsage } from '../core/usageParser.js';

interface UseUsageDataResult {
  usage: UsageData;
  refreshUsage: () => void;
}

const EMPTY_USAGE: UsageData = {
  date: '',
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  modelBreakdowns: [],
  lastUpdated: new Date(),
  loading: true,
};

export function useUsageData(): UseUsageDataResult {
  const [usage, setUsage] = useState<UsageData>(EMPTY_USAGE);

  const refreshUsage = useCallback(() => {
    setUsage((prev) => ({ ...prev, loading: true, error: undefined }));
    void loadUsage().then((data) => {
      setUsage(data);
    });
  }, []);

  useEffect(() => {
    // Initial load
    refreshUsage();

    // Refresh every 60 seconds
    const interval = setInterval(refreshUsage, 60_000);
    return () => clearInterval(interval);
  }, [refreshUsage]);

  return { usage, refreshUsage };
}
