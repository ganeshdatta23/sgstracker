#!/bin/bash

echo "=== Complete DarshanamCompass Crash Analysis ==="
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device detected!"
    echo "Please connect your phone with USB debugging enabled"
    exit 1
fi

echo "📱 Device connected!"
echo ""

# Get device info
echo "📊 Device Information:"
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
echo ""

# Check if app is installed
APP_PACKAGE="com.amardattadola.darshanamcompass"
if adb shell pm list packages | grep -q "$APP_PACKAGE"; then
    echo "✅ App is installed: $APP_PACKAGE"
else
    echo "❌ App not found. Please install the APK first."
    exit 1
fi

echo ""
echo "🧹 Clearing logs..."
adb logcat -c

echo "📝 Starting comprehensive logging..."
echo "Now open the app on your phone and wait for the crash..."
echo ""
echo "=== ALL CRASH LOGS ==="

# Capture all relevant logs
adb logcat | grep -i -E "(darshanam|compass|amardattadola|androidruntime|fatal|exception|error|crash|native|signal)" 