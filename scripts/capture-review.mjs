import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/22808/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
mkdirSync('docs/screenshots', { recursive: true });
for (const id of ['trends', 'mechanism', 'industries', 'balance']) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `docs/screenshots/desktop-${id}.png` });
}
await page.setViewportSize({ width: 320, height: 844 });
for (const id of ['overview', 'mechanism', 'lab']) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `docs/screenshots/mobile-${id}.png` });
}
await browser.close();
