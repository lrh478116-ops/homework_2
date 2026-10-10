import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('C:/Users/22808/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const timeline = JSON.parse(readFileSync('delivery/timeline.json', 'utf8'));
const framesDirectory = path.resolve('delivery/frames-final'); mkdirSync(framesDirectory, { recursive: true });
const sourceManifest = Object.fromEntries(readdirSync('dist').map(file => [`dist/${file}`, createHash('sha256').update(readFileSync(`dist/${file}`)).digest('hex')]));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  const overlay = document.createElement('div'); overlay.id = 'video-caption';
  overlay.style.cssText = 'position:fixed;bottom:0;left:196px;right:0;background:#0b101af5;border-top:1px solid #526b35;color:#eff4e7;z-index:100;padding:14px 30px 18px;min-height:104px;pointer-events:none;';
  overlay.innerHTML = '<div id="video-title" style="color:#c4ef71;font-size:12px;margin-bottom:5px"></div><div id="video-subtitle" style="font-size:19px;line-height:1.65;max-width:1080px"></div>';
  document.body.appendChild(overlay);
});
const cdp = await page.context().newCDPSession(page);
const frames = []; let startTime = 0, lastFrame = -200, capturing = false;
cdp.on('Page.screencastFrame', async event => {
  await cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  if (!capturing) return;
  const time = (Date.now() - startTime) / 1000;
  if (time - lastFrame < .12) return;
  lastFrame = time;
  const name = `frame-${String(frames.length).padStart(5, '0')}.jpg`;
  writeFileSync(path.join(framesDirectory, name), Buffer.from(event.data, 'base64'));
  frames.push({ name, time });
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
async function seek(id) { await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
async function action(scene, fraction) {
  if (scene === 'trends') {
    if (fraction === 0) await seek('trends');
    if (fraction === 1) await page.locator('[data-year="2023"]').click();
    if (fraction === 2) await page.locator('[data-year="2024"]').click();
    if (fraction === 3) await page.locator('[data-year="2025"]').click();
  } else if (scene === 'mechanism') {
    if (fraction === 0) { await seek('mechanism'); await page.locator('[data-factor="people"]').click(); }
    if (fraction > 0) await page.locator(`[data-factor="${['people', 'tools', 'data', 'system'][fraction]}"]`).click();
  } else if (scene === 'industries') {
    if (fraction === 0) { await seek('industries'); await page.locator('[data-industry="manufacturing"]').click(); }
    if (fraction > 0) await page.locator(`[data-industry="${['manufacturing', 'service', 'science', 'agriculture'][fraction]}"]`).click();
  } else if (scene === 'lab') {
    if (fraction === 0) { await seek('lab'); await page.locator('#resetLab').click(); }
    if (fraction === 1) await page.locator('#coverage').fill('30');
    if (fraction === 2) await page.locator('#coverage').fill('90');
    if (fraction === 3) await page.locator('#resetLab').click();
  } else if (scene === 'negative') {
    if (fraction === 0) await page.locator('[data-preset="friction"]').click();
    if (fraction === 1) await page.locator('[data-preset="off"]').click();
    if (fraction === 2) await page.locator('#resetLab').click();
    if (fraction === 3) { await page.locator('.formula summary').click(); await seek('lab'); }
  } else if (scene === 'balance') {
    if (fraction === 0) await seek('balance');
    if (fraction === 1) await page.locator('.governance-item').nth(1).click();
    if (fraction === 2) await page.locator('.governance-item').nth(2).click();
    if (fraction === 3) await page.locator('.closing').scrollIntoViewIfNeeded();
  } else if (scene === 'sources') {
    if (fraction === 0) await page.locator('.source-open').first().click();
    if (fraction === 1) await page.locator('#source-iea').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    if (fraction === 2) { await page.locator('#closeSources').click(); await seek('overview'); }
    if (fraction === 3) await page.locator('#tourStart').click();
  }
}
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1440, maxHeight: 1100, everyNthFrame: 2 });
startTime = Date.now(); capturing = true;
for (const segment of timeline) {
  console.log(`Recording: ${segment.scene}`);
  const chapterStart = startTime + segment.start * 1000;
  await sleep(chapterStart - Date.now());
  const subtitles = segment.text.match(/[^。！？]+[。！？]?/g) || [segment.text];
  await page.evaluate(({ title, text }) => { document.querySelector('#video-title').textContent = title; document.querySelector('#video-subtitle').textContent = text; }, { title: segment.title, text: subtitles[0] });
  let charOffset = 0, actionIndex = 0;
  for (const subtitle of subtitles) {
    const localTime = charOffset / segment.text.length * (segment.duration - 1.5);
    await sleep(chapterStart + localTime * 1000 - Date.now());
    const fraction = Math.min(3, Math.floor(localTime / segment.duration * 4));
    while (actionIndex <= fraction) { await action(segment.scene, actionIndex); actionIndex++; }
    await page.evaluate(text => { document.querySelector('#video-subtitle').textContent = text; }, subtitle);
    charOffset += subtitle.length;
  }
  while (actionIndex < 4) { await action(segment.scene, actionIndex); actionIndex++; }
  await sleep(chapterStart + segment.duration * 1000 - Date.now());
}
capturing = false; await cdp.send('Page.stopScreencast');
const total = timeline.at(-1).start + timeline.at(-1).duration;
const list = [];
frames.forEach((f, i) => {
  list.push(`file '${f.name}'`, `duration ${Math.max(.02, (frames[i + 1]?.time ?? total) - (i === 0 ? 0 : f.time)).toFixed(4)}`);
});
list.push(`file '${frames.at(-1).name}'`);
writeFileSync(path.join(framesDirectory, 'concat.txt'), list.join('\n'));
writeFileSync('delivery/recording-manifest.json', JSON.stringify({ frames: frames.length, total, sourceManifest, viewport: { width: 1440, height: 1100 }, website: 'http://127.0.0.1:4173', capture: 'Chrome CDP actual webpage recording', timestamp: new Date().toISOString() }, null, 2));
await browser.close(); console.log(`Captured ${frames.length} actual webpage frames.`);
