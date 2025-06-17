#!/bin/bash

echo "=== Debugging DarshanamCompass App Crash ==="
echo "Make sure your phone is connected via USB with Developer Options enabled"
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device detected!"
    echo "Please:"
    echo "1. Enable Developer Options (Settings → About → Tap Build Number 7 times)"
    echo "2. Enable USB Debugging (Settings → Developer Options → USB Debugging)"
    echo "3. Connect phone via USB and accept debugging prompt"
    exit 1
fi

echo "📱 Device connected! Starting crash debugging..."
echo ""
echo "🔍 Clearing logcat buffer..."
adb logcat -c

echo "📝 Starting logcat monitoring..."
echo "Now open the DarshanamCompass app on your phone..."
echo ""
echo "=== CRASH LOGS (Press Ctrl+C to stop) ==="

# Monitor for crashes related to our app
adb logcat -s "AndroidRuntime:E" "System.err:W" "ActivityManager:I" "*:F" | grep -i -E "(darshanam|compass|amardattadola|FATAL|crash|exception)" 