import NetInfo from '@react-native-community/netinfo';
import * as queue from './queueService';
import { transcribeAudio, parseTranscript } from './transcriptionService';
import { addCapture } from './firestoreService';

let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    await queue.resetStaleProcessing();

    let item = await queue.dequeueNext();
    while (item) {
      try {
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
      } catch (error) {
        console.error(`Queue item ${item.id} failed:`, error);
        await queue.markFailed(item.id);
      }
      item = await queue.dequeueNext();
    }
  } finally {
    isProcessing = false;
  }
}

let unsubscribe: (() => void) | null = null;

export function startSyncManager() {
  if (unsubscribe) return;

  NetInfo.fetch().then((state) => {
    if (state.isConnected) {
      processQueue();
    }
  });

  unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processQueue();
    }
  });
}

export function stopSyncManager() {
  unsubscribe?.();
  unsubscribe = null;
}
