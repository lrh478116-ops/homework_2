import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePlans, comparisonCSV, simulate, defaults } from '../dist/model.js';

test('对比由两组参数重算，不消费伪造的结果', () => {
  const a = { ...defaults, total: 1, gain: 9999 };
  const b = { coverage: 100, quality: 20, review: 95, total: 1 };
  const r = comparePlans(a, b);
  assert.deepEqual(r.a, simulate(defaults));
  assert.deepEqual(r.b, simulate(b));
  assert.equal(r.timeDifference, r.a.total - r.b.total);
});
test('缺失方案、非法参数拒绝，不回退到默认', () => {
  for (const b of [null, {}, { ...defaults, review: 101 }]) assert.throws(() => comparePlans(defaults, b), /参数/);
});
test('两方案CSV记录独立参数、阶段和结果', () => {
  const r = comparePlans(defaults, { coverage: 0, quality: 80, review: 20 });
  const csv = comparisonCSV(r);
  assert.ok(csv.includes(r.a.total.toFixed(2)) && csv.includes('100.00'));
  assert.match(csv, /教学模拟/); assert.match(csv, /方案 A/); assert.match(csv, /方案 B/);
});
