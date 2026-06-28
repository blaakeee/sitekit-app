import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image, AppState } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../../components';
import { colors, fonts, radii } from '../../theme';
import { useAuth, useJobs } from '../../contexts';
import { addCapture, ensureJobExists } from '../../services/firestoreService';
import { logger } from '../../services/logger';
import { useCameraPermission } from './useCameraPermission';
import { useDeviceCapability } from './useDeviceCapability';
import { normalizePhoto, type NormalizedPhoto } from './normalizePhoto';
import { enqueueUpload } from './uploadQueue';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoCapture'>;

export function CameraScreen({ navigation, route }: Props) {
  const { jobId, tag } = route.params;
  const { orgId } = useAuth();
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.id === jobId);

  const permission = useCameraPermission();
  const { capability, setProbeResult, downgradeToFallback } = useDeviceCapability();

  const cameraRef = useRef<CameraView>(null);
  const [active, setActive] = useState(true);
  const [preview, setPreview] = useState<NormalizedPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [probing, setProbing] = useState(capability === 'unknown');

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (capability === 'unknown') {
      runProbe();
    }
  }, [capability]);

  const runProbe = async () => {
    setProbing(true);
    try {
      const granted = await permission.request();
      if (!granted) {
        await setProbeResult('fallback');
        setProbing(false);
        return;
      }
      await setProbeResult('full');
    } catch {
      await setProbeResult('fallback');
    }
    setProbing(false);
  };

  const captureWithCamera = async () => {
    if (!cameraRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setActive(false);
      const result = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!result?.uri) throw new Error('No image returned');

      const photo = await normalizePhoto(result.uri, { jobId, tag, capturedBy: 'cameraview' });
      setPreview(photo);
    } catch (error: any) {
      logger.error('Camera', 'CameraView capture failed, falling back', { error: error?.message });
      await downgradeToFallback();
      captureWithPicker();
    }
  };

  const captureWithPicker = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        exif: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const photo = await normalizePhoto(result.assets[0].uri, { jobId, tag, capturedBy: 'imagepicker' });
      setPreview(photo);
    } catch (error: any) {
      logger.error('Camera', 'ImagePicker capture failed', { error: error?.message });
    }
  };

  const handleCapture = () => {
    if (capability === 'fallback') {
      captureWithPicker();
    } else {
      captureWithCamera();
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setActive(true);
  };

  const handleConfirm = async () => {
    if (!preview || !orgId) return;
    setSaving(true);
    try {
      if (job) await ensureJobExists(orgId, job);
      await addCapture(orgId, jobId, {
        type: 'photo',
        title: `${tag.charAt(0).toUpperCase() + tag.slice(1)} photo`,
        subtitle: job?.address ?? '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        audioUri: preview.localUri,
      });
      await enqueueUpload(preview);
      navigation.goBack();
    } catch (error: any) {
      logger.error('Camera', 'Save failed', { error: error?.message });
    } finally {
      setSaving(false);
    }
  };

  if (permission.state === 'denied') {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Photo</Text>
        </View>
        <View style={styles.permissionCard}>
          <Icon name="photo_camera" size={40} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionSub}>SiteKit needs camera access to capture job photos.</Text>
          <Pressable style={styles.settingsBtn} onPress={permission.openSettings}>
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  if (probing || permission.state === 'undetermined') {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Photo</Text>
        </View>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Setting up camera...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (preview) {
    return (
      <View style={styles.fullScreen}>
        <Image source={{ uri: preview.displayUri }} style={styles.previewImage} />
        <View style={styles.previewOverlay}>
          <View style={styles.previewTagRow}>
            <View style={styles.tagBadge}>
              <MonoLabel color={colors.textInverse}>{tag.toUpperCase()}</MonoLabel>
            </View>
            {preview.gps && (
              <View style={styles.gpsBadge}>
                <Icon name="location_on" size={14} color={colors.green} />
                <MonoLabel color={colors.green} style={{ fontSize: 10 }}>GPS</MonoLabel>
              </View>
            )}
          </View>
        </View>
        <View style={styles.previewActions}>
          <Pressable style={styles.retakeBtn} onPress={handleRetake}>
            <Icon name="refresh" size={20} color={colors.dark} />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </Pressable>
          <Pressable
            style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={saving}
          >
            <Icon name="check" size={22} color={colors.textInverse} />
            <Text style={styles.confirmBtnText}>Use photo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      {capability === 'full' ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          active={active}
          animateShutter
        />
      ) : (
        <View style={[styles.camera, styles.fallbackBg]}>
          <Icon name="photo_camera" size={64} color={colors.textMuted} />
          <Text style={styles.fallbackText}>Tap the shutter to open camera</Text>
        </View>
      )}

      <View style={styles.cameraOverlay}>
        <View style={styles.cameraTopBar}>
          <BackButton />
          <View style={styles.tagBadge}>
            <MonoLabel color={colors.textInverse}>{tag.toUpperCase()}</MonoLabel>
          </View>
        </View>

        <View style={styles.cameraBottomBar}>
          <View style={{ width: 56 }} />
          <Pressable style={styles.shutterBtn} onPress={handleCapture}>
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={{ width: 56 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  fallbackBg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark,
    gap: 12,
  },
  fallbackText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  shutterBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  tagBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  permissionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
    textAlign: 'center',
  },
  permissionSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  settingsBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
  },
  settingsBtnText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textInverse,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewOverlay: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  previewTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#000',
  },
  retakeBtn: {
    flex: 1,
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: '#fff',
  },
  confirmBtn: {
    flex: 1.4,
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.textInverse,
  },
});
