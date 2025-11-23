const fs = require('fs');
const path = require('path');

const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AARgMCAwQyqgAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(base64Png, 'base64');

const assetsDir = path.resolve(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

const files = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'favicon.png',
];

for (const file of files) {
  const target = path.join(assetsDir, file);
  fs.writeFileSync(target, pngBuffer);
  console.log('Wrote', target);
}
