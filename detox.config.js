module.exports = {
  'ios.sim': {
    type: 'ios.simulator',
    binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Lumora.app',
    build: 'npx expo prebuild --clean && npx pod-install && xcodebuild -workspace ios/Lumora.xcworkspace -scheme Lumora -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
  },
  'android.emu': {
    type: 'android.emulator',
    binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    build: 'npx expo prebuild --clean && cd android && ./gradlew assembleDebug',
  },
};
