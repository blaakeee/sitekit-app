#!/bin/bash
# Patch foojay-resolver-convention from 0.5.0 to 1.0.0 to fix Gradle 9.x compatibility
# See: https://github.com/facebook/react-native/issues/55781
SETTINGS_FILE="node_modules/@react-native/gradle-plugin/settings.gradle.kts"
if [ -f "$SETTINGS_FILE" ]; then
  sed -i.bak 's/"0.5.0"/"1.0.0"/g' "$SETTINGS_FILE"
  rm -f "${SETTINGS_FILE}.bak"
fi
