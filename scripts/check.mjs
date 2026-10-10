import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

for (const file of readdirSync('dist').filter(x => x.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join('dist', file)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
const html = readFileSync('dist/index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
for (const href of [...html.matchAll(/href="#([^"]+)"/g)].map(x => x[1])) assert.ok(ids.includes(href), `Missing anchor ${href}`);
const css = readFileSync('dist/styles.css', 'utf8');
assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, 'CSS braces');
assert.ok(css.includes('prefers-reduced-motion'));
assert.ok(!/https?:\/\//.test(html), 'Runtime HTML must not require remote assets');
const version = file => createHash('sha256').update(readFileSync(`dist/${file}`)).digest('hex').slice(0, 12);
for (const file of ['app.js', 'styles.css', 'favicon.svg']) assert.ok(html.includes(`./${file}?v=${version(file)}`), `Stale asset version: ${file}; run node scripts/version-assets.mjs`);
const app = readFileSync('dist/app.js', 'utf8');
for (const file of ['model.js', 'data.js']) assert.ok(app.includes(`./${file}?v=${version(file)}`), `Stale module version: ${file}`);
console.log('PASS: JS syntax, IDs, anchors, CSS balance, reduced motion, self-contained runtime, content-bound cache versions.');
