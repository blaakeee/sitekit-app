const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withGoogleServicesVersion(config, version = '4.5.0') {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      config.modResults.contents = config.modResults.contents.replace(
        /classpath 'com\.google\.gms:google-services:\d+\.\d+\.\d+'/,
        `classpath 'com.google.gms:google-services:${version}'`
      );
    }
    return config;
  });
};
