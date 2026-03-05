import { useState, useEffect, useCallback, useRef } from 'react';
import { FileWatcher } from '../core/watcher.js';
import { loadTeamMessages } from '../core/inboxParser.js';
import type { Message } from '../core/types.js';

export function useMessages(teamName: string | null): { messages: Message[]; loading: boolean } {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const watcherRef = useRef<FileWatcher | null>(null);

  const refresh = useCallback(async () => {
    if (!teamName) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const result = await loadTeamMessages(teamName);
    setMessages(result);
    setLoading(false);
  }, [teamName]);

  useEffect(() => {
    setLoading(true);

    if (!teamName) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const watcher = new FileWatcher();
    watcherRef.current = watcher;

    watcher.onUpdate(() => {
      void refresh();
    });

    watcher.watchInboxes(teamName);

    const timer = setTimeout(() => {
      void refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      void watcher.close();
    };
  }, [teamName, refresh]);

  return { messages, loading };
}
