const fs = require('fs');
const path = require('path');

const settingsFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts'
);

if (fs.existsSync(settingsFile)) {
  let content = fs.readFileSync(settingsFile, 'utf8');
  if (content.includes('"0.5.0"')) {
    content = content.replace('"0.5.0"', '"1.0.0"');
    fs.writeFileSync(settingsFile, content, 'utf8');
    console.log('Patched foojay-resolver-convention to 1.0.0');
  }
}
