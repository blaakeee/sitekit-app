import NetInfo from '@react-native-community/netinfo';
import * as queue from './queueService';
import { transcribeAudio, parseTranscript } from './transcriptionService';
import { addCapture } from './firestoreService';
import { logger } from './logger';

const processing = new Set<string>();

function backoffMs(attempt: number): number {
  const base = Math.min(1000 * Math.pow(2, attempt), 30_000);
  const jitter = Math.random() * base * 0.3;
  return base + jitter;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processQueue() {
  await queue.resetStaleProcessing();

  let item = await queue.dequeueNext();
  while (item) {
    if (processing.has(item.id)) {
      item = await queue.dequeueNext();
      continue;
    }
    processing.add(item.id);

    try {
      logger.info('Sync', 'Processing queue item', { id: item.id, jobId: item.jobId, attempt: item.attempts + 1 });

      const transcript = await transcribeAudio(item.audioUri);
      const entries = await parseTranscript(transcript);

      for (const entry of entries) {
        await addCapture(item.orgId, item.jobId, {
          type: entry.category === 'materials' ? 'materials' : entry.category === 'issue' ? 'issue' : 'voice',
          title: entry.title,
          subtitle: entry.detail ?? '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioUri: item.audioUri,
          transcript,
          parsedEntries: entries,
        });
      }

      await queue.markComplete(item.id);
      logger.info('Sync', 'Queue item completed', { id: item.id, entries: entries.length });
    } catch (error: any) {
      logger.error('Sync', 'Queue item failed', {
        id: item.id,
        attempt: item.attempts + 1,
        error: error?.message ?? String(error),
      });
      await queue.markFailed(item.id);
      await delay(backoffMs(item.attempts));
    } finally {
      processing.delete(item.id);
    }

    item = await queue.dequeueNext();
  }
}

let unsubscribe: (() => void) | null = null;

export function startSyncManager() {
  if (unsubscribe) return;

  logger.info('Sync', 'Sync manager started');

  NetInfo.fetch().then((state) => {
    if (state.isConnected) processQueue();
  });

  unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      logger.info('Sync', 'Network restored, processing queue');
      processQueue();
    }
  });
}

export function stopSyncManager() {
  unsubscribe?.();
  unsubscribe = null;
  logger.info('Sync', 'Sync manager stopped');
}
