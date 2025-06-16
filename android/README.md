# Darshanam Compass Android App

A React Native compass application built with Expo that shows device heading and target direction for spiritual navigation.

## Features

- **Real-time Compass**: Uses device magnetometer to show current heading
- **Target Direction**: Shows a target bearing (default: 45° NE) with visual indicator
- **Digital Readout**: Large, clear display of current heading in degrees and cardinal direction
- **Visual Feedback**: Target indicator changes color when you're facing the correct direction
- **Modern UI**: Dark theme with glowing effects inspired by the original web app

## Project Structure

```
android/DarshanamCompass/
├── App.tsx                 # Main app component
├── components/
│   └── CompassView.tsx     # Compass component with magnetometer integration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Prerequisites

- Node.js (installed via NVM)
- Android SDK and emulator
- Java Development Kit (JDK)

## Quick Start

### 1. Test in Web Browser (Recommended)
```bash
cd android/DarshanamCompass
npm run web
```
This opens the app in your browser for quick testing (magnetometer simulation).

### 2. Test on Physical Android Device
1. Install [Expo Go](https://expo.dev/client) on your Android device
2. Run: `npm start`
3. Scan the QR code with Expo Go app

### 3. Test on Android Emulator
```bash
# Wait for ARM64 system image to finish downloading, then:
export ANDROID_HOME=~/android-sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH

# Create ARM64 AVD (better for Apple Silicon Macs)
avdmanager create avd -n DarshanamARM -k "system-images;android-34;google_apis;arm64-v8a" --device "pixel_3" --force

# Start emulator
emulator -avd DarshanamARM &

# Wait for emulator to boot, then:
npm run android
```

## Customization

### Change Target Direction
Edit `App.tsx` line 15:
```tsx
<CompassView targetHeading={90} /> {/* Change to desired bearing */
```

### Styling
- Modify colors and effects in `components/CompassView.tsx`
- Adjust layout and typography in the `styles` object

## Dependencies

- **expo-sensors**: Magnetometer access for compass functionality
- **react-native-svg**: Vector graphics for compass visualization
- **expo-location**: Location services (for future enhancements)

## Troubleshooting

### Emulator Won't Start
- Use ARM64 system image on Apple Silicon Macs: `system-images;android-34;google_apis;arm64-v8a`
- Ensure hardware acceleration is enabled in BIOS/macOS settings

### Compass Not Working
- Magnetometer only works on physical devices
- Web version shows simulated compass for UI testing
- Grant location/sensor permissions when prompted

### ADB Not Found
```bash
export ANDROID_HOME=~/android-sdk
export PATH=$ANDROID_HOME/platform-tools:$PATH
```

## Build for Production

```bash
# Build APK
npm run build:android

# Build AAB for Play Store
eas build --platform android --profile production
```

## Next Steps

- Add location-based target calculation (direction to specific coordinates)
- Implement calibration prompts and tilt warnings
- Add haptic feedback when facing target direction
- Create custom app icon and splash screen
- Add settings page for target customization 