import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef } from 'react';

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const permissionGranted = useRef(false);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      permissionGranted.current = status.granted;
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const start = async () => {
    if (!permissionGranted.current) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) throw new Error('Microphone permission denied');
      permissionGranted.current = true;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async (): Promise<string | null> => {
    await recorder.stop();
    return recorder.uri ?? null;
  };

  const cancel = async () => {
    await recorder.stop();
  };

  return {
    start,
    stop,
    cancel,
    isRecording: recorderState.isRecording,
    durationMs: recorderState.durationMillis ?? 0,
  };
}
