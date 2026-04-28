import { useState, useEffect, useCallback, useRef } from 'react';

export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'love-offline-queue';
const MAX_RETRIES = 3;

function loadQueue(): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  } catch {
    // ignore storage errors
  }
}

export function useOfflineQueue(
  onFlush: (msg: QueuedMessage) => Promise<boolean>,
) {
  const [queue, setQueue] = useState<QueuedMessage[]>(() => loadQueue());
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const flushingRef = useRef(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const enqueue = useCallback((content: string) => {
    const msg: QueuedMessage = {
      id: crypto.randomUUID(),
      content,
      timestamp: Date.now(),
      retries: 0,
    };
    setQueue((prev) => {
      const next = [...prev, msg];
      saveQueue(next);
      return next;
    });
    return msg.id;
  }, []);

  const dequeue = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveQueue(next);
      return next;
    });
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current || !isOnline) return;
    flushingRef.current = true;
    const current = loadQueue();
    for (const msg of current) {
      if (msg.retries >= MAX_RETRIES) {
        dequeue(msg.id);
        continue;
      }
      const success = await onFlush(msg);
      if (success) {
        dequeue(msg.id);
      } else {
        setQueue((prev) => {
          const next = prev.map((m) =>
            m.id === msg.id ? { ...m, retries: m.retries + 1 } : m,
          );
          saveQueue(next);
          return next;
        });
      }
    }
    flushingRef.current = false;
  }, [isOnline, onFlush, dequeue]);

  // Auto-flush when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      flush();
    }
  }, [isOnline, queue.length, flush]);

  return { queue, isOnline, enqueue, dequeue, flush };
}
