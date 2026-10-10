import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, defaults, baseline, toCSV } from '../dist/model.js';

test('正式模型在默认参数下产生阶段和最终结果', () => {
  const result = simulate(defaults);
  assert.equal(baseline.reduce((s, x) => s + x.minutes, 0), 100);
  assert.equal(result.stages.reduce((s, x) => s + x.minutes, 0), result.total);
  assert.ok(result.gain > 0);
  assert.ok(result.total < 100);
});
test('AI 覆盖率为零时不得保留收益或复核负担', () => {
  simulate(defaults);
  const result = simulate({ ...defaults, coverage: 0 });
  assert.equal(result.total, 100);
  assert.equal(result.gain, 0);
  assert.deepEqual(result.stages.map(x => x.minutes), baseline.map(x => x.minutes));
});
test('数据质量为零时不会仍然获得 AI 提速', () => {
  const result = simulate({ ...defaults, quality: 0, review: 0 });
  assert.equal(result.total, 100);
  assert.equal(result.gain, 0);
});
test('高复核成本可以让整体收益变负', () => {
  const result = simulate({ coverage: 100, quality: 5, review: 100 });
  assert.ok(result.total > 100);
  assert.ok(result.gain < 0);
});
test('越界、NaN、缺参数明确失败，不静默回退', () => {
  for (const bad of [{}, { ...defaults, coverage: -1 }, { ...defaults, quality: NaN }, { ...defaults, review: 101 }, { ...defaults, coverage: '50' }]) {
    assert.throws(() => simulate(bad), /参数/);
  }
});
test('不同输入改变真实阶段结构和输出，且重置无 stale state', () => {
  const a = simulate(defaults);
  const b = simulate({ ...defaults, quality: 20 });
  assert.notDeepEqual(a.stages, b.stages);
  assert.notEqual(a.total, b.total);
  assert.deepEqual(simulate(defaults), a);
});
test('导出沿用当前模型输入与结果，明确为教学模拟', () => {
  const r = simulate({ ...defaults, coverage: 30 });
  const csv = toCSV(r);
  assert.match(csv, /教学模拟/);
  assert.match(csv, /30/);
  assert.ok(csv.includes(r.total.toFixed(2)));
});
