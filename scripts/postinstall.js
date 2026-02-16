const fs = require('fs');
const path = require('path');
const destDir = path.join(__dirname, '..', 'node_modules', 'next', 'node_modules', 'postcss', 'node_modules');
const srcDir = path.join(__dirname, '..', 'node_modules', 'source-map-js');
const dest = path.join(destDir, 'source-map-js');
if (fs.existsSync(srcDir) && !fs.existsSync(dest)) {
  try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(srcDir, dest, { recursive: true });
  } catch (e) {
    // ignore
  }
}
