import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';
import * as Location from 'expo-location';
import { logger } from '../../services/logger';

const PHOTOS_DIR = 'photos';

export interface NormalizedPhoto {
  localUri: string;
  thumbUri: string;
  displayUri: string;
  width: number;
  height: number;
  takenAt: string;
  gps: { lat: number; lng: number } | null;
  format: 'jpeg';
  capturedBy: 'cameraview' | 'imagepicker';
  jobId: string;
  tag: 'before' | 'during' | 'after';
}

function ensurePhotosDir(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR);
  if (!dir.exists) dir.create();
  return dir;
}

async function getGps(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return null;
  }
}

async function resizeToFile(
  sourceUri: string,
  longEdge: number,
  quality: number,
  filename: string,
): Promise<{ uri: string; width: number; height: number }> {
  const result = await manipulateAsync(
    sourceUri,
    [{ resize: { width: longEdge } }],
    { compress: quality / 100, format: SaveFormat.JPEG }
  );

  const dir = ensurePhotosDir();
  const dest = new File(dir, filename);
  const source = new File(result.uri);

  if (dest.exists) dest.delete();

  const reader = source.readableStream().getReader();
  const writer = dest.writableStream().getWriter();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
    }
  } finally {
    await writer.close();
    reader.releaseLock();
  }

  try {
    source.delete();
  } catch {}

  return { uri: dest.uri, width: result.width, height: result.height };
}

export async function normalizePhoto(
  rawUri: string,
  opts: {
    jobId: string;
    tag: 'before' | 'during' | 'after';
    capturedBy: 'cameraview' | 'imagepicker';
  },
): Promise<NormalizedPhoto> {
  const timestamp = Date.now();
  const prefix = `${opts.jobId}_${opts.tag}_${timestamp}`;

  const gps = await getGps();

  const web = await resizeToFile(rawUri, 2000, 75, `${prefix}_web.jpg`);
  const display = await resizeToFile(web.uri, 800, 75, `${prefix}_display.jpg`);
  const thumb = await resizeToFile(web.uri, 200, 60, `${prefix}_thumb.jpg`);

  logger.info('Camera', 'Photo normalized', {
    jobId: opts.jobId,
    tag: opts.tag,
    capturedBy: opts.capturedBy,
    width: web.width,
    height: web.height,
    hasGps: gps !== null,
  });

  return {
    localUri: web.uri,
    thumbUri: thumb.uri,
    displayUri: display.uri,
    width: web.width,
    height: web.height,
    takenAt: new Date(timestamp).toISOString(),
    gps,
    format: 'jpeg',
    capturedBy: opts.capturedBy,
    jobId: opts.jobId,
    tag: opts.tag,
  };
}
