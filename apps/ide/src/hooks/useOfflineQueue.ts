import { useEffect, useRef, useCallback } from 'react';

interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
}

const QUEUE_KEY = 'lovable_offline_queue';

function loadQueue(): QueuedMessage[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedMessage[];
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedMessage[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function useOfflineQueue(onFlush: (msg: QueuedMessage) => Promise<void>) {
  const queue = useRef<QueuedMessage[]>(loadQueue());
  const flushing = useRef(false);

  const enqueue = useCallback((content: string) => {
    const msg: QueuedMessage = { id: crypto.randomUUID(), content, timestamp: Date.now() };
    queue.current = [...queue.current, msg];
    saveQueue(queue.current);
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || queue.current.length === 0) return;
    flushing.current = true;
    while (queue.current.length > 0) {
      const msg = queue.current[0];
      try {
        await onFlush(msg);
        queue.current = queue.current.slice(1);
        saveQueue(queue.current);
      } catch {
        break;
      }
    }
    flushing.current = false;
  }, [onFlush]);

  useEffect(() => {
    const handleOnline = () => flush();
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) flush();
    return () => window.removeEventListener('online', handleOnline);
  }, [flush]);

  return { enqueue, isOnline: navigator.onLine };
}
