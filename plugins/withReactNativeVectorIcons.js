/**
 * Expo config plugin: react-native-vector-icons ships icon fonts separately from
 * autolinking. Android needs fonts.gradle; iOS needs UIAppFonts (pod already bundles Fonts/*.ttf).
 */
const { withAppBuildGradle, withInfoPlist } = require('@expo/config-plugins');

const GRADLE_MARKER = 'react-native-vector-icons-fonts (expo config plugin)';

const RNVI_APP_FONTS = [
  'AntDesign.ttf',
  'Entypo.ttf',
  'EvilIcons.ttf',
  'Feather.ttf',
  'FontAwesome.ttf',
  'FontAwesome5_Brands.ttf',
  'FontAwesome5_Regular.ttf',
  'FontAwesome5_Solid.ttf',
  'FontAwesome6_Brands.ttf',
  'FontAwesome6_Regular.ttf',
  'FontAwesome6_Solid.ttf',
  'Foundation.ttf',
  'Ionicons.ttf',
  'MaterialIcons.ttf',
  'MaterialCommunityIcons.ttf',
  'SimpleLineIcons.ttf',
  'Octicons.ttf',
  'Zocial.ttf',
  'Fontisto.ttf',
];

function withAndroidVectorIconFonts(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      return cfg;
    }
    let { contents } = cfg.modResults;
    if (contents.includes(GRADLE_MARKER)) {
      return cfg;
    }
    contents += `\n// ${GRADLE_MARKER}\napply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")\n`;
    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withIosVectorIconFonts(config) {
  return withInfoPlist(config, (cfg) => {
    const existing = Array.isArray(cfg.modResults.UIAppFonts) ? cfg.modResults.UIAppFonts : [];
    cfg.modResults.UIAppFonts = [...new Set([...existing, ...RNVI_APP_FONTS])];
    return cfg;
  });
}

module.exports = function withReactNativeVectorIcons(config) {
  config = withAndroidVectorIconFonts(config);
  config = withIosVectorIconFonts(config);
  return config;
};

