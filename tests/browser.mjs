import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { simulate, defaults } from '../dist/model.js';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('C:/Users/22808/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const systemBrowser = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const browser = await chromium.launch({ headless: true, ...(systemBrowser ? { executablePath: systemBrowser } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.url().startsWith('http://127.0.0.1:4173') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
const checks = [];
function check(name) { checks.push(name); }
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.locator('#throughput').waitFor();
assert.equal(await page.locator('#throughput').textContent(), `+${simulate(defaults).gain.toFixed(1)}%`); check('正式入口消费模型，默认 DOM 与模型结果一致');
mkdirSync('docs/screenshots', { recursive: true });
await page.screenshot({ path: 'docs/screenshots/01-overview.png' });
for (const [year, value] of [[2023, 55], [2024, 78], [2025, 88]]) {
  await page.locator(`[data-year="${year}"]`).click();
  assert.equal(await page.locator('#adoptionValue').textContent(), `${value}%`);
  assert.ok((await page.locator('#adoptionChart svg').getAttribute('aria-label')).includes(`${year}年`));
} check('年份选择改变 SVG 选择状态与可见解读');
for (const key of ['people', 'tools', 'data', 'system']) {
  await page.locator(`[data-factor="${key}"]`).click();
  assert.equal(await page.locator(`[data-factor="${key}"]`).getAttribute('aria-pressed'), 'true');
  assert.ok(await page.locator('#factorText').textContent());
} check('四个价值要素可操作');
for (const id of ['manufacturing', 'service', 'science', 'energy', 'education', 'agriculture']) {
  await page.locator(`[data-industry="${id}"]`).click();
  assert.equal(await page.locator('#industryContent').getAttribute('aria-labelledby'), `tab-${id}`);
  assert.equal(await page.locator('.flow-node').count(), 5);
} check('全部六个行业更新正式场景与五节点流程');
await page.locator('[data-industry="manufacturing"]').click();
await page.locator('[data-industry="manufacturing"]').focus(); await page.keyboard.press('ArrowRight');
assert.equal(await page.locator('#tab-service').getAttribute('aria-selected'), 'true'); check('产业标签键盘导航');
for (const params of [{ coverage: 20, quality: 90, review: 10 }, { coverage: 90, quality: 40, review: 70 }]) {
  for (const [key, value] of Object.entries(params)) await page.locator(`#${key}`).fill(String(value));
  const expected = simulate(params);
  assert.equal(await page.locator('#throughput').textContent(), `${expected.gain > 0 ? '+' : ''}${expected.gain.toFixed(1)}%`);
  assert.ok((await page.locator('#totalTime').textContent()).startsWith(expected.total.toFixed(1)));
} check('三个真实滑块输入驱动正式模型、阶段条与最终吞吐量');
await page.locator('[data-preset="friction"]').click();
assert.ok((await page.locator('#throughput').textContent()).startsWith('-')); assert.ok(await page.locator('#labInsight.warning').count()); check('负向控制：复核过重产生负收益');
await page.locator('[data-preset="off"]').click();
assert.equal(await page.locator('#throughput').textContent(), '0.0%'); assert.equal(await page.locator('#totalTime').textContent(), '100.0分钟'); check('负向控制：关闭AI不会复用旧收益');
await page.locator('#quality').fill('0'); await page.locator('#review').fill('0'); await page.locator('#coverage').fill('100');
assert.equal(await page.locator('#totalTime').textContent(), '100.0分钟'); check('负向控制：零数据质量无虚构节时');
await page.locator('#resetLab').click(); assert.equal(await page.locator('#throughput').textContent(), `+${simulate(defaults).gain.toFixed(1)}%`); check('重置恢复默认，无 stale state');
await page.locator('#lab').scrollIntoViewIfNeeded(); await page.screenshot({ path: 'docs/screenshots/05-lab.png' });
await page.locator('#coverage').fill('30');
const [simulationDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#exportLab').click()]);
await simulationDownload.saveAs('docs/screenshots/browser-simulation.csv');
const exportedSimulation = readFileSync('docs/screenshots/browser-simulation.csv', 'utf8');
assert.ok(exportedSimulation.includes(simulate({ ...defaults, coverage: 30 }).total.toFixed(2)));
assert.ok(exportedSimulation.includes('教学模拟'));
check('当前模拟CSV真实下载且结果对应当前30%覆盖率');
await page.locator('[data-source="iea"]').first().click();
assert.ok(await page.locator('#sourceDialog').isVisible()); assert.ok(await page.locator('#source-iea.focused').count());
await page.keyboard.press('Escape'); assert.ok(!(await page.locator('#sourceDialog').isVisible())); check('来源面板定位与Escape退出');
await page.locator('.source-open').first().click();
assert.equal(await page.locator('.source-card').count(), 6);
const [dataDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#exportDataDialog').click()]);
await dataDownload.saveAs('docs/screenshots/browser-data.csv');
const exportedData = readFileSync('docs/screenshots/browser-data.csv', 'utf8');
assert.ok(exportedData.includes('950') && exportedData.includes('中心情景预测') && exportedData.includes('https://www.iea.org/'));
await page.locator('#closeSources').click(); check('六项来源与公开数据CSV下载，保留预测标签和原始URL');
await page.locator('#tourStart').click();
for (let i = 0; i < 6; i++) { assert.equal(await page.locator('#tourCount').textContent(), `${i + 1} / 6`); await page.locator('#tourNext').click(); }
assert.ok(!(await page.locator('#tourPanel').isVisible())); check('六步导览实际导航与结束');
for (const width of [1440, 1024, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 900 });
  const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert.ok(dimensions.page <= dimensions.viewport, `横向溢出 at ${width}: ${JSON.stringify(dimensions)}`);
  const collisions = await page.evaluate(() => {
    const center = document.querySelector('.engine-center').getBoundingClientRect();
    return [...document.querySelectorAll('.engine-node')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.left < center.right && r.right > center.left && r.top < center.bottom && r.bottom > center.top;
    }).map(el => el.dataset.factor);
  });
  assert.deepEqual(collisions, [], `价值引擎节点遮挡 at ${width}`);
}
await page.setViewportSize({ width: 390, height: 844 }); await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.locator('.menu-toggle').click(); assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true'); await page.locator('.topbar nav a[href="#lab"]').click(); assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: 'docs/screenshots/02-mobile.png', fullPage: true }); check('320–1440像素无整页横向溢出或引擎节点遮挡，移动导航可用');
assert.deepEqual(errors, []); check('浏览器无JS运行错误，无本地资源加载失败');
const sourceManifest = Object.fromEntries(readdirSync('dist').map(file => [`dist/${file}`, createHash('sha256').update(readFileSync(`dist/${file}`)).digest('hex')]));
writeFileSync('docs/browser-verification.json', JSON.stringify({ runId: randomUUID(), time: new Date().toISOString(), configuration: { browser: 'Chromium', reducedMotion: 'reduce', viewportWidths: [1440, 1024, 768, 390, 320], url: 'http://127.0.0.1:4173' }, sourceManifest, checks, errors, result: 'passed' }, null, 2));
console.log(`PASS: ${checks.length} browser checks`, checks);
await browser.close();
