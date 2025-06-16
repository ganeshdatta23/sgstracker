#!/bin/bash

# Darshanam Compass Android Test Script

echo "🧭 Darshanam Compass - Android Test Setup"
echo "========================================="

# Set up environment
export ANDROID_HOME=~/android-sdk
export JAVA_HOME=~/java/Contents/Home
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH

# Check if ARM64 system image is installed
echo "📱 Checking if ARM64 system image is available..."
if ! sdkmanager --list_installed | grep -q "system-images;android-34;google_apis;arm64-v8a"; then
    echo "⬇️  Installing ARM64 system image (better for Apple Silicon Macs)..."
    sdkmanager "system-images;android-34;google_apis;arm64-v8a"
fi

# Create ARM64 AVD if it doesn't exist
echo "🔧 Setting up Android Virtual Device..."
if ! avdmanager list avd | grep -q "DarshanamARM"; then
    echo "Creating ARM64 AVD..."
    avdmanager create avd -n DarshanamARM -k "system-images;android-34;google_apis;arm64-v8a" --device "pixel_3" --force --sdcard 2048M
fi

# Check if emulator is already running
if ! adb devices | grep -q "emulator"; then
    echo "🚀 Starting emulator..."
    emulator -avd DarshanamARM -netdelay none -netspeed full -no-snapshot-save -no-boot-anim &
    
    echo "⏳ Waiting for emulator to boot (this may take 2-3 minutes)..."
    
    # Wait for emulator to be ready
    while ! adb devices | grep -q "emulator"; do
        echo "   Still booting..."
        sleep 10
    done
    
    # Wait a bit more for full boot
    sleep 20
    echo "✅ Emulator is ready!"
else
    echo "✅ Emulator is already running!"
fi

# Set up Node.js environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "📦 Installing/updating dependencies..."
npm install

echo "🧭 Starting Darshanam Compass app..."
echo "   The app will install on the emulator and open automatically."
echo "   Use Ctrl+C to stop the development server when done."
echo ""

# Start the app
npm run android 