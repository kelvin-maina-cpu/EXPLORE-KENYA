# Android EAS Build

The Expo app in this folder is configured for standalone Android builds with EAS.

## Profiles

- `development`: dev client APK for native debugging
- `preview`: installable APK for internal testing
- `production`: Play Store ready Android App Bundle (`.aab`)

## Environment

`app.config.js` reads values from `Frontend/.env.production` during cloud builds:

```env
API_URL=https://explore-kenya-hp95.onrender.com
APP_NAME=Explore Kenya
APP_VERSION=1.0.0
EAS_PROJECT_ID=790bc6ce-d430-47bd-81f5-3b3dd40f2afc
```

## Commands

```bash
npm run build:android:preview
npm run build:android:production
```

## Notes

- Preview builds create an `.apk` that can be installed directly.
- Production builds create an `.aab` for Play Store submission.
- The app already reads `extra.apiUrl` from Expo config, so standalone builds use the hosted backend instead of Expo Go localhost fallbacks.
