import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { File, Directory, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { logger } from './logger';

const RECORDINGS_DIR = 'recordings';

function deleteFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort cleanup
  }
}

async function persistRecording(cacheUri: string): Promise<string> {
  const dir = new Directory(Paths.document, RECORDINGS_DIR);
  if (!dir.exists) {
    dir.create();
  }

  const filename = `rec_${Date.now()}.m4a`;
  const source = new File(cacheUri);

  if (!source.exists) {
    return cacheUri;
  }

  const dest = new File(dir, filename);
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

  deleteFile(cacheUri);

  return dest.uri;
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [permissionState, setPermissionState] = useState<PermissionState>('undetermined');

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionState(status.granted ? 'granted' : 'denied');
      if (status.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }
    })();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (status.granted) {
      setPermissionState('granted');
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      return true;
    }

    setPermissionState('denied');
    Alert.alert(
      'Microphone access required',
      'SiteKit needs microphone access to record voice notes. Open settings to enable it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'android') {
              Linking.openSettings();
            }
          },
        },
      ]
    );
    return false;
  };

  const start = async () => {
    if (permissionState !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async (): Promise<string | null> => {
    await recorder.stop();
    const cacheUri = recorder.uri;
    if (!cacheUri) return null;

    try {
      return await persistRecording(cacheUri);
    } catch (error) {
      logger.warn('Audio', 'Failed to persist recording, using cache URI', { error: String(error) });
      return cacheUri;
    }
  };

  const cancel = async () => {
    await recorder.stop();
    const cacheUri = recorder.uri;
    if (cacheUri) {
      deleteFile(cacheUri);
    }
  };

  return {
    start,
    stop,
    cancel,
    permissionState,
    isRecording: recorderState.isRecording,
    durationMs: recorderState.durationMillis ?? 0,
  };
}
