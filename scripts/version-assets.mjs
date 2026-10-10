import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

// 先统一运行文件的换行，再依赖顺序计算版本；兼容 Windows Git 与 Pages。
for (const file of readdirSync('dist')) {
  const path = `dist/${file}`;
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('\r\n', '\n'));
}
const version = path => createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);
let app = readFileSync('dist/app.js', 'utf8');
for (const file of ['model.js', 'data.js']) {
  app = app.replace(new RegExp(`\\./${file.replace('.', '\\.')}([?]v=[a-f0-9]+)?`, 'g'), `./${file}?v=${version(`dist/${file}`)}`);
}
writeFileSync('dist/app.js', app);
let html = readFileSync('dist/index.html', 'utf8');
for (const file of ['app.js', 'styles.css', 'favicon.svg']) {
  html = html.replace(new RegExp(`\\./${file.replace('.', '\\.')}([?]v=[a-f0-9]+)?`, 'g'), `./${file}?v=${version(`dist/${file}`)}`);
}
writeFileSync('dist/index.html', html);
console.log('Versioned module imports and page assets using SHA-256 content keys.');
