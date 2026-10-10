import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('C:/Users/22808/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const repo = 'lrh478116-ops/homework_2';
const runId = process.env.GITHUB_RUN_ID;
assert.ok(runId, 'Set GITHUB_RUN_ID to a completed workflow run.');
const run = JSON.parse(execFileSync('gh', ['run', 'view', runId, '--repo', repo, '--json', 'status,conclusion,headSha,url'], { encoding: 'utf8' }));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(run.headSha, head, 'Deployment run must match pushed local HEAD');
assert.equal(run.status, 'completed'); assert.equal(run.conclusion, 'success');
const pages = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/pages`], { encoding: 'utf8' }));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext();
const sourceManifest = {};
for (const file of readdirSync('dist')) {
  const localHash = createHash('sha256').update(readFileSync(`dist/${file}`)).digest('hex');
  const response = await context.request.get(`${pages.html_url}${file}?verify=${head}`);
  assert.equal(response.status(), 200, `Published resource ${file}`);
  const remoteHash = createHash('sha256').update(await response.body()).digest('hex');
  assert.equal(remoteHash, localHash, `Stale or divergent published source: ${file}`);
  sourceManifest[`dist/${file}`] = localHash;
}
await browser.close();
mkdirSync('delivery', { recursive: true });
writeFileSync('delivery/deployment-verification.json', JSON.stringify({ time: new Date().toISOString(), repository: repo, commit: head, runId, workflow: run, websiteURL: pages.html_url, public: pages.public, httpsEnforced: pages.https_enforced, sourceManifest, result: 'passed' }, null, 2));
console.log(`PASS: successful deployment for ${head}, all ${Object.keys(sourceManifest).length} public assets exactly match local SHA-256.`);
