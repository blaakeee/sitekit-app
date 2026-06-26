const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFoojayFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const settingsFile = path.resolve(
        config.modRequest.projectRoot,
        'node_modules/@react-native/gradle-plugin/settings.gradle.kts'
      );

      if (fs.existsSync(settingsFile)) {
        let content = fs.readFileSync(settingsFile, 'utf8');
        if (content.includes('"0.5.0"')) {
          content = content.replace('"0.5.0"', '"1.0.0"');
          fs.writeFileSync(settingsFile, content, 'utf8');
        }
      }

      return config;
    },
  ]);
};
