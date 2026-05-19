/**
 * Yambi native config: app display name, Android deep links, release signing, BootSplash theme.
 */
const {
  withAndroidManifest,
  withAppBuildGradle,
  withGradleProperties,
  withInfoPlist,
  withStringsXml,
  AndroidConfig,
} = require('@expo/config-plugins');

const APP_NAME = 'Yambi';

const ANDROID_PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.READ_CONTACTS',
  'android.permission.WAKE_LOCK',
];

const CUSTOM_SCHEME_INTENT_FILTERS = [
  { host: 'expo-development-client' },
  { host: 'post' },
  { host: 'item' },
  { host: 'business' },
];

const HTTPS_INTENT_FILTERS = [
  { pathPrefix: '/post' },
  { pathPrefix: '/item' },
  { pathPrefix: '/business' },
];

function ensureAndroidPermissions(manifest) {
  if (!manifest.manifest['uses-permission']) {
    manifest.manifest['uses-permission'] = [];
  }
  const existing = new Set(
    manifest.manifest['uses-permission'].map((p) => p.$?.['android:name']),
  );
  for (const name of ANDROID_PERMISSIONS) {
    if (!existing.has(name)) {
      manifest.manifest['uses-permission'].push({ $: { 'android:name': name } });
    }
  }

  const queries = manifest.manifest.queries?.[0];
  if (queries && !queries.package?.some((p) => p.$?.['android:name'] === 'com.google.android.gms')) {
    queries.package = [...(queries.package || []), { $: { 'android:name': 'com.google.android.gms' } }];
  }
}

function addIntentFilter(activity, filter) {
  if (!activity['intent-filter']) {
    activity['intent-filter'] = [];
  }
  activity['intent-filter'].push(filter);
}

function intentFilterKey(filter) {
  const data = filter.data?.[0]?.$ || {};
  return `${data['android:scheme']}|${data['android:host'] || ''}|${data['android:pathPrefix'] || ''}`;
}

function getMainActivity(application) {
  const activities = application.activity;
  if (!Array.isArray(activities)) {
    return null;
  }
  return (
    activities.find((a) => a.$?.['android:name'] === '.MainActivity') ||
    activities.find((a) => String(a.$?.['android:name'] || '').endsWith('MainActivity')) ||
    null
  );
}

function ensureDeepLinkIntentFilters(androidManifest) {
  const app = androidManifest.manifest.application?.[0];
  if (!app) {
    return;
  }
  const activity = getMainActivity(app);
  if (!activity) {
    return;
  }
  const existing = new Set(
    (activity['intent-filter'] || []).map((f) => intentFilterKey(f)),
  );

  for (const { host } of CUSTOM_SCHEME_INTENT_FILTERS) {
    const key = `yambi|${host}|`;
    if (existing.has(key)) continue;
    addIntentFilter(activity, {
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [{ $: { 'android:scheme': 'yambi', 'android:host': host } }],
    });
    existing.add(key);
  }

  for (const { pathPrefix } of HTTPS_INTENT_FILTERS) {
    const key = `https|app.yambi.net|${pathPrefix}`;
    if (existing.has(key)) continue;
    addIntentFilter(activity, {
      $: { 'android:autoVerify': 'true' },
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [
        {
          $: {
            'android:scheme': 'https',
            'android:host': 'app.yambi.net',
            'android:pathPrefix': pathPrefix,
          },
        },
      ],
    });
    existing.add(key);
  }
}

function withYambiAndroidManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    ensureAndroidPermissions(cfg.modResults);
    ensureDeepLinkIntentFilters(cfg.modResults);
    return cfg;
  });
}

function withYambiAppName(config) {
  config = withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ _: APP_NAME, $: { name: 'app_name' } }],
      cfg.modResults,
    );
    return cfg;
  });
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.CFBundleDisplayName = APP_NAME;
    return cfg;
  });
  return config;
}

function withYambiReleaseSigning(config) {
  config = withGradleProperties(config, (cfg) => {
    const props = [
      ['MYAPP_UPLOAD_STORE_FILE', 'yambi.keystore'],
      ['MYAPP_UPLOAD_KEY_ALIAS', 'yambi-key-alias'],
      ['MYAPP_UPLOAD_STORE_PASSWORD', 'yambiYambi@12345'],
      ['MYAPP_UPLOAD_KEY_PASSWORD', 'yambiYambi@12345'],
    ];
    for (const [key, value] of props) {
      const idx = cfg.modResults.findIndex((item) => item.type === 'property' && item.key === key);
      if (idx >= 0) {
        cfg.modResults[idx].value = value;
      } else {
        cfg.modResults.push({ type: 'property', key, value });
      }
    }
    return cfg;
  });

  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      return cfg;
    }
    let { contents } = cfg.modResults;

    if (!contents.includes('signingConfigs.release')) {
      contents = contents.replace(
        /signingConfigs\s*\{\s*\n\s*debug\s*\{/,
        `signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile rootProject.file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
        debug {`,
      );
    }

    contents = contents.replace(
      /buildTypes\s*\{\s*\n\s*debug\s*\{\s*\n\s*signingConfig signingConfigs\.debug/g,
      'buildTypes {\n        debug {\n            signingConfig signingConfigs.release',
    );
    contents = contents.replace(
      /release\s*\{\s*\n(\s*)\/\/ Caution![\s\S]*?\n\s*signingConfig signingConfigs\.debug/g,
      'release {\n$1signingConfig signingConfigs.release',
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = function withYambiNative(config) {
  config = withYambiAppName(config);
  config = withYambiAndroidManifest(config);
  config = withYambiReleaseSigning(config);
  return config;
};
