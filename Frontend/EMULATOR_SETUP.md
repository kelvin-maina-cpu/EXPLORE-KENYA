# Android Emulator Setup

This project is an Expo app with EAS development-client support already configured.

## What To Install

Install these first on Windows:

1. Android Studio
2. Android SDK Platform Tools
3. Android Emulator
4. At least one Android Virtual Device in Device Manager
5. Node.js and npm

Recommended emulator:

- Pixel 6 or Pixel 7
- Android 14 or Android 15 system image

## Environment Variables

Set one of these Windows environment variables to your Android SDK path:

- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`

Typical path:

```powershell
C:\Users\<your-user>\AppData\Local\Android\Sdk
```

Make sure these folders are available in `PATH`:

```powershell
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\cmdline-tools\latest\bin
```

After updating environment variables, restart PowerShell.

## Backend For Emulator Testing

Start the backend first:

```powershell
cd C:\xampp\htdocs\EXPLORE-KENYA-PROJECT\Backend
npm start
```

The frontend already has API fallback logic in `services/api.js`, but for Android emulator testing the safest backend target is:

```text
http://10.0.2.2:5000
```

If you want to force the emulator to use that API base, set it before starting Expo:

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:5000"
```

## Expo Go Testing

For general app testing in the Android emulator:

```powershell
cd C:\xampp\htdocs\EXPLORE-KENYA-PROJECT\Frontend
npm run android:clear
```

This opens Expo and launches the app in the Android emulator.

Use this mode for:

- landing page
- registration
- login
- attractions
- bookings
- chatbot

## Development Build Testing

Use a development build if you need native modules that Expo Go does not provide consistently, especially:

- biometric login
- deeper native-device integration

Build the Android development client:

```powershell
cd C:\xampp\htdocs\EXPLORE-KENYA-PROJECT\Frontend
npm run build:android:dev
```

Then start Metro for the dev client:

```powershell
npm run android:dev-client
```

## Recommended Test Flow

1. Start the backend on port `5000`
2. Start the Android emulator from Android Studio
3. In a new terminal, go to `Frontend`
4. Set:

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:5000"
```

5. Run:

```powershell
npm run android:clear
```

6. Test:
   - register a new user
   - log in
   - confirm the landing page loads after login
   - navigate to attractions, profile, bookings, and live screens

## Quick Checks

Verify emulator connection:

```powershell
adb devices
```

Verify backend from the emulator host machine:

```powershell
Invoke-RestMethod http://localhost:5000/
```

Verify M-Pesa OAuth from backend:

```powershell
Invoke-RestMethod http://localhost:5000/api/mpesa/oauth-token
```

## If Android Does Not Launch

Try these in order:

1. Open Android Studio Device Manager and start the emulator manually
2. Run `adb devices` and confirm one emulator is listed
3. Run `npm run android:clear` again
4. If Expo cannot reach the backend, set:

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:5000"
```

5. Restart Expo with cache clear

## Notes For This Project

- `app.json` already contains Android permissions for location, camera, audio, and network
- `eas.json` already contains a `development` profile for Android APK builds
- Expo Go is fine for most auth and navigation checks
- biometric login should be tested in a development build, not Expo Go
