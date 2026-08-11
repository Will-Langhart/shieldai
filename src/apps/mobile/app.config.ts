import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const appConfig: ExpoConfig = {
  name: 'Shield AI',
  slug: 'shieldai-mobile',
  scheme: 'shieldai',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1A6CF8',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.shieldai.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'com.shieldai.app',
    permissions: [],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    // Note: react-native-maps is autolinked and needs no config plugin at the
    // Expo-53-pinned version (1.20.1). Only add it back (with a version that ships
    // one) if you need to inject a Google Maps API key.
    // Re-applies the fmt consteval build fix on every `expo prebuild` (Xcode 26).
    './plugins/withFmtConstevalFix',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  updates: {
    url: process.env.EAS_UPDATE_URL,
    enabled: true,
  },
};

export default appConfig;


