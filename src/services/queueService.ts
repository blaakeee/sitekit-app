import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueueItem } from '../types';

const QUEUE_KEY = 'sitekit_transcription_queue';
const MAX_RETRIES = 3;

async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(
  item: Omit<QueueItem, 'id' | 'attempts' | 'status'>
): Promise<string> {
  const queue = await getQueue();
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ ...item, id, attempts: 0, status: 'pending' });
  await saveQueue(queue);
  return id;
}

export async function dequeueNext(): Promise<QueueItem | null> {
  const queue = await getQueue();
  const next = queue.find((item) => item.status === 'pending');
  if (!next) return null;

  const updated = queue.map((item) =>
    item.id === next.id ? { ...item, status: 'processing' as const } : item
  );
  await saveQueue(updated);
  return next;
}

export async function markComplete(id: string): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter((item) => item.id !== id));
}

export async function markFailed(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((item) => {
    if (item.id !== id) return item;
    const attempts = item.attempts + 1;
    return {
      ...item,
      attempts,
      status: attempts >= MAX_RETRIES ? ('failed' as const) : ('pending' as const),
    };
  });
  await saveQueue(updated);
}

export async function resetStaleProcessing(): Promise<void> {
  const queue = await getQueue();
  const hadStale = queue.some((item) => item.status === 'processing');
  if (!hadStale) return;

  const updated = queue.map((item) =>
    item.status === 'processing' ? { ...item, status: 'pending' as const } : item
  );
  await saveQueue(updated);
}

export type QueueStatus = {
  pending: number;
  processing: number;
  failed: number;
};

export async function getQueueStatus(): Promise<QueueStatus> {
  const queue = await getQueue();
  return {
    pending: queue.filter((item) => item.status === 'pending').length,
    processing: queue.filter((item) => item.status === 'processing').length,
    failed: queue.filter((item) => item.status === 'failed').length,
  };
}

export async function getFailedItems(): Promise<QueueItem[]> {
  const queue = await getQueue();
  return queue.filter((item) => item.status === 'failed');
}

export async function retryFailed(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((item) =>
    item.id === id && item.status === 'failed'
      ? { ...item, status: 'pending' as const, attempts: 0 }
      : item
  );
  await saveQueue(updated);
}

export async function discardFailed(id: string): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter((item) => !(item.id === id && item.status === 'failed')));
}
