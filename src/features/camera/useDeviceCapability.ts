import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { logger } from '../../services/logger';

const CAPABILITY_KEY = 'camera_capability';
const BANNER_DISMISSED_KEY = 'camera_banner_dismissed';

export type CameraCapability = 'full' | 'fallback' | 'unknown';

export function useDeviceCapability() {
  const [capability, setCapability] = useState<CameraCapability>('unknown');
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(CAPABILITY_KEY);
      if (stored === 'full' || stored === 'fallback') {
        setCapability(stored);
      }
      const dismissed = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
      setBannerDismissed(dismissed === 'true');
    })();
  }, []);

  const setProbeResult = async (result: 'full' | 'fallback') => {
    setCapability(result);
    await AsyncStorage.setItem(CAPABILITY_KEY, result);
    logger.info('Camera', 'Probe complete', {
      capability: result,
      manufacturer: Device.manufacturer ?? 'unknown',
      model: Device.modelName ?? 'unknown',
    });
  };

  const dismissBanner = async () => {
    setBannerDismissed(true);
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    logger.info('Camera', 'Capability banner dismissed');
  };

  const downgradeToFallback = async () => {
    setCapability('fallback');
    await AsyncStorage.setItem(CAPABILITY_KEY, 'fallback');
    logger.warn('Camera', 'Downgraded to fallback mid-session', {
      manufacturer: Device.manufacturer ?? 'unknown',
      model: Device.modelName ?? 'unknown',
    });
  };

  return { capability, bannerDismissed, setProbeResult, dismissBanner, downgradeToFallback };
}
