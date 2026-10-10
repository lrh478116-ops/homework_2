export const defaults = Object.freeze({ coverage: 70, quality: 80, review: 20 });
export const baseline = Object.freeze([
  Object.freeze({ name: '信息检索', minutes: 25, potential: 0.65 }),
  Object.freeze({ name: '分析与判断', minutes: 30, potential: 0.35 }),
  Object.freeze({ name: '内容生产', minutes: 30, potential: 0.60 }),
  Object.freeze({ name: '复核与交付', minutes: 15, potential: 0 }),
]);

export function simulate(params) {
  for (const key of ['coverage', 'quality', 'review']) {
    if (typeof params?.[key] !== 'number' || !Number.isFinite(params[key]) || params[key] < 0 || params[key] > 100) {
      throw new RangeError(`参数 ${key} 必须是 0–100 的有限数值`);
    }
  }
  const { coverage, quality, review } = params;
  const effective = (coverage / 100) * (quality / 100);
  const overhead = (coverage / 100) * (review / 100) * 30;
  const stages = baseline.map((stage, i) => ({
    name: stage.name,
    baseline: stage.minutes,
    minutes: stage.minutes * (1 - stage.potential * effective) + (i === 3 ? overhead : 0),
  }));
  const total = stages.reduce((sum, stage) => sum + stage.minutes, 0);
  return { params: { coverage, quality, review }, stages, total, saved: 100 - total, gain: (100 / total - 1) * 100, overhead };
}

export function toCSV(result) {
  const rows = [
    ['类型', '教学模拟：假设参数，不是实测或预测'],
    ['AI覆盖率(%)', result.params.coverage], ['数据质量(%)', result.params.quality], ['复核成本(%)', result.params.review],
    ['阶段', '传统流程(分钟)', 'AI协作流程(分钟)'],
    ...result.stages.map(x => [x.name, x.baseline.toFixed(2), x.minutes.toFixed(2)]),
    ['总耗时', '100.00', result.total.toFixed(2)], ['吞吐量变化(%)', '', result.gain.toFixed(2)],
  ];
  return '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}

// 保存参数后重新计算，不消费外部传入的 total 或 gain。
export function comparePlans(aParams, bParams) {
  const a = simulate(aParams);
  const b = simulate(bParams);
  return { a, b, timeDifference: a.total - b.total, gainDifference: b.gain - a.gain };
}

export function comparisonCSV({ a, b }) {
  const rows = [
    ['类型', '教学模拟：方案对比，不是实测或预测'],
    ['项目', '方案 A', '方案 B', '差异 B - A'],
    ...Object.entries({ coverage: 'AI覆盖率(%)', quality: '数据质量(%)', review: '复核成本(%)' }).map(([key, label]) => [label, a.params[key], b.params[key], b.params[key] - a.params[key]]),
    ...a.stages.map((stage, i) => [stage.name + '(分钟)', stage.minutes.toFixed(2), b.stages[i].minutes.toFixed(2), (b.stages[i].minutes - stage.minutes).toFixed(2)]),
    ['总耗时(分钟)', a.total.toFixed(2), b.total.toFixed(2), (b.total - a.total).toFixed(2)],
    ['吞吐量变化(%) / 差异(百分点)', a.gain.toFixed(2), b.gain.toFixed(2), (b.gain - a.gain).toFixed(2)],
  ];
  return '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
