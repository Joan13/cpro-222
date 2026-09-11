#!/usr/bin/env bash

# Locate adb executable
ADB=$(which adb 2>/dev/null || echo "/home/joan/Downloads/genymotion/tools/adb")

echo "🚀 Building Android Debug APK..."
cd android && ./gradlew assembleDebug
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK build failed or file not found at $APK_PATH"
    exit 1
fi

DEVICES=$($ADB devices | grep -v "List" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo "⚠️ No active Android emulators or devices found."
    exit 1
fi

echo "📱 Found devices/emulators:"
echo "$DEVICES"

for DEV in $DEVICES; do
    echo "📲 Deploying & starting app on $DEV..."
    $ADB -s "$DEV" install -r "$APK_PATH"
    $ADB -s "$DEV" shell am start -n com.yambi.app/.MainActivity
done

echo "✅ App successfully launched on all available emulators!"
