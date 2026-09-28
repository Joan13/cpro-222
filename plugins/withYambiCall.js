const {
  withAndroidManifest,
  withInfoPlist,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const ANDROID_PERMISSIONS = [
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.MANAGE_OWN_CALLS',
];

function withYambiCallAndroid(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Ensure permissions
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    const existingPerms = new Set(
      manifest['uses-permission'].map((p) => p.$?.['android:name'])
    );
    for (const perm of ANDROID_PERMISSIONS) {
      if (!existingPerms.has(perm)) {
        manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    }

    // Ensure application components
    const application = manifest.application?.[0];
    if (application) {
      // 1. Declare IncomingCallActivity
      if (!application.activity) {
        application.activity = [];
      }
      const hasIncomingActivity = application.activity.some(
        (a) => a.$?.['android:name'] === 'com.yambi.call.IncomingCallActivity'
      );
      if (!hasIncomingActivity) {
        application.activity.push({
          $: {
            'android:name': 'com.yambi.call.IncomingCallActivity',
            'android:showWhenLocked': 'true',
            'android:turnScreenOn': 'true',
            'android:showForAllUsers': 'true',
            'android:excludeFromRecents': 'true',
            'android:launchMode': 'singleTop',
            'android:theme': '@android:style/Theme.NoTitleBar.Fullscreen',
            'android:exported': 'false',
          },
        });
      }

      // 2. Declare YambiCallService
      if (!application.service) {
        application.service = [];
      }
      const hasCallService = application.service.some(
        (s) => s?.$?.['android:name'] === 'com.yambi.call.YambiCallService'
      );
      if (!hasCallService) {
        application.service.push({
          $: {
            'android:name': 'com.yambi.call.YambiCallService',
            'android:foregroundServiceType': 'phoneCall',
            'android:exported': 'false',
          },
        });
      }
    }

    return cfg;
  });
}

function withYambiCallIOS(config) {
  return withInfoPlist(config, (cfg) => {
    const infoPlist = cfg.modResults;
    if (!infoPlist.UIBackgroundModes) {
      infoPlist.UIBackgroundModes = [];
    }
    const modes = new Set(infoPlist.UIBackgroundModes);
    modes.add('voip');
    modes.add('audio');
    modes.add('remote-notification');
    infoPlist.UIBackgroundModes = Array.from(modes);
    return cfg;
  });
}

function withYambiCall(config) {
  config = withYambiCallAndroid(config);
  config = withYambiCallIOS(config);
  return config;
}

module.exports = createRunOncePlugin(withYambiCall, 'yambi-call', '1.0.0');
