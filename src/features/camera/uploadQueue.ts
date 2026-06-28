import { logger } from '../../services/logger';
import type { NormalizedPhoto } from './normalizePhoto';

export async function enqueueUpload(photo: NormalizedPhoto): Promise<void> {
  logger.info('Camera', 'Photo queued for upload (stub)', {
    jobId: photo.jobId,
    tag: photo.tag,
    localUri: photo.localUri,
  });
}
