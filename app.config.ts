import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SiteKit',
  slug: 'SiteKit',
  owner: 'synaptic86',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.synaptic86.sitekit',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-asset',
    'expo-font',
    'expo-splash-screen',
    'expo-audio',
    '@react-native-google-signin/google-signin',
  ],
  extra: {
    eas: {
      projectId: '8b0c371b-fd05-43d8-bb55-4d612d6f7a80',
    },
  },
});
