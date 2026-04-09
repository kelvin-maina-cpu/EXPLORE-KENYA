import 'dotenv/config';

const projectId = process.env.EAS_PROJECT_ID || '03787aae-8441-4ef8-86b7-e19df47dac51';
const apiUrl = process.env.API_URL || 'https://explore-kenya-hp95.onrender.com';
const appName = process.env.APP_NAME || 'Explore Kenya';
const appVersion = process.env.APP_VERSION || '1.0.0';

export default {
  expo: {
    name: appName,
    owner: 'askofu',
    slug: 'explore-kenya',
    version: appVersion,
    orientation: 'portrait',
    icon: './assets/Explore-kenya.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    scheme: 'explorekenya',
    platforms: ['ios', 'android', 'web'],
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.maishke.explorekenya',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Explore Kenya uses your location to show nearby destinations and help you navigate to attractions.',
        NSCameraUsageDescription:
          'Explore Kenya uses your camera so you can broadcast live wildlife and travel moments.',
        NSMicrophoneUsageDescription:
          'Explore Kenya uses your microphone so viewers can hear your live broadcast.',
        NSFaceIDUsageDescription:
          'Explore Kenya uses Face ID or fingerprint authentication to let you sign in securely.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/Explore-kenya.png',
        backgroundColor: '#FFFFFF',
      },
      package: 'com.maishke.explorekenya',
      versionCode: 1,
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'CAMERA',
        'RECORD_AUDIO',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'MODIFY_AUDIO_SETTINGS',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission:
            'Explore Kenya uses your camera so you can broadcast live wildlife and travel moments.',
          microphonePermission:
            'Explore Kenya uses your microphone so viewers can hear your live broadcast.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Explore Kenya uses your location to show nearby destinations and help you navigate to attractions.',
        },
      ],
      'expo-local-authentication',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl,
      router: {},
      eas: {
        projectId,
      },
    },
  },
};
