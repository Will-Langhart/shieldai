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
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.shieldai.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
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
    [
      '@stripe/stripe-react-native',
      {
        merchantIdentifier: 'merchant.com.shieldai.app',
        enableGooglePay: true,
      },
    ],
    'react-native-maps',
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


