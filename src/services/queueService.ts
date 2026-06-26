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

export async function dequeue(): Promise<QueueItem | null> {
  const queue = await getQueue();
  const next = queue.find((item) => item.status === 'pending');
  return next ?? null;
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

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.filter((item) => item.status === 'pending').length;
}

export async function getAllPending(): Promise<QueueItem[]> {
  const queue = await getQueue();
  return queue.filter((item) => item.status === 'pending');
}
