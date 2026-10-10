import { sources, adoption, investments, cases, caseSteps } from './data.js?v=6f98d801c736';
import { simulate, defaults, toCSV, comparePlans, comparisonCSV } from './model.js?v=17b70893aff0';

const $ = (s, base = document) => base.querySelector(s);
const $$ = (s, base = document) => [...base.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const iconPaths = {
  factory: '<path d="M3 21V10l6 3V7l6 3V3h4v18H3Z"/><path d="M6 17h2m3 0h2m3 0h1"/>',
  message: '<path d="M21 12a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 9h8M8 13h5"/>',
  atom: '<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"/>',
  book: '<path d="M12 5c-3-2-7-2-10-1v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v16"/>',
  leaf: '<path d="M20 3C8 2 2 9 6 16c6 7 15 1 14-13Z"/><path d="M3 22 16 9"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;

function toast(text) {
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { $('#toast').hidden = true; }, 3200);
}
function download(filename, body, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('已导出当前数据，文件中保留来源与口径。');
}

// 数据 → 年份选择 → SVG 与解读；所有标记都来自同一 reviewed snapshot。
function renderAdoption(year = 2025) {
  const current = adoption.find(x => x.year === year);
  const points = adoption.map((r, i) => ({ ...r, x: 55 + i * 180, y: 210 - r.value * 1.8 }));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  $('#adoptionChart').innerHTML = `<svg viewBox="0 0 480 245" role="img" aria-label="受访组织AI采用率：2023年55%，2024年78%，2025年88%。当前选择${year}年。"><defs><linearGradient id="adoptGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#245cce" stop-opacity=".17"/><stop offset="1" stop-color="#245cce" stop-opacity="0"/></linearGradient></defs>${[0, 25, 50, 75, 100].map(v => `<line x1="48" y1="${210 - v * 1.8}" x2="443" y2="${210 - v * 1.8}" stroke="#dce3ec" stroke-dasharray="3 5"/><text x="30" y="${214 - v * 1.8}" fill="#526176" font-size="12" text-anchor="end">${v}</text>`).join('')}<path d="${path} L415,210 L55,210 Z" fill="url(#adoptGradient)"/><path d="${path}" fill="none" stroke="#245cce" stroke-width="2.5"/>${points.map(p => `<g><circle cx="${p.x}" cy="${p.y}" r="${p.year === year ? 8 : 5}" fill="${p.year === year ? '#245cce' : '#ffffff'}" stroke="#245cce" stroke-width="2"/><text x="${p.x}" y="${p.y - 17}" font-size="${p.year === year ? 16 : 12}" text-anchor="middle" fill="${p.year === year ? '#245cce' : '#526176'}">${p.value}%</text><text x="${p.x}" y="232" font-size="12" text-anchor="middle" fill="#526176">${p.year}</text></g>`).join('')}</svg>`;
  $$('[data-year]').forEach(b => { const active = Number(b.dataset.year) === year; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
  $('#adoptionValue').textContent = `${current.value}%`;
  const narrative = { 2023: '技术进入组织，仍需要找到合适的业务场景。', 2024: '比 2023 年提高 23 个百分点，应用明显扩散。', 2025: '使用 AI 与全面实现商业价值之间，仍有距离。' };
  $('#adoptionInsight').textContent = `${year} 年，${current.value}% 的受访组织报告使用 AI。${narrative[year]}`;
}
$$('[data-year]').forEach(b => b.addEventListener('click', () => renderAdoption(Number(b.dataset.year))));
renderAdoption();
$('#investmentChart').innerHTML = investments.map(r => `<div class="investment-row"><div class="bar-top"><span>${r.name}</span><strong>${r.value.toFixed(2)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${r.value / 300 * 100}%" role="img" aria-label="${r.name}2025年私人AI投资${r.value}十亿美元"></div></div></div>`).join('');

const factors = {
  people: { number: '01 · 劳动者', title: '劳动者：从重复执行到创造与判断', text: 'AI 辅助检索、生成和分析，使劳动者把更多时间用于定义问题、验证结果与跨领域创新。能力的跃升来自工具与专业知识的结合。', chain: ['知识辅助', '经验共享', '判断与创新'], condition: '劳动者能够核查结果，并在关键任务中保留决策与接管能力。' },
  tools: { number: '02 · 劳动资料', title: '劳动资料：从固定工具到智能协作系统', text: '模型、智能软件与机器人拓展了生产工具的能力。它们能够感知状态、生成方案、辅助执行，让工具成为可反馈的协作系统。', chain: ['状态感知', '方案生成', '执行与反馈'], condition: '输出进入真实工作流与执行系统，并受到业务约束和安全验证。' },
  data: { number: '03 · 劳动对象', title: '劳动对象：让数据成为可用的生产要素', text: '图像、文本、传感信息与实验记录可以被分析与组合，形成新的知识和服务。数据的价值取决于质量、授权、适用性与使用方式。', chain: ['数据治理', '信息提取', '知识与服务'], condition: '数据来源合法、及时可靠，与具体任务匹配；不能把数据规模等同于价值。' },
  system: { number: '04 · 要素协同', title: '要素协同：让局部能力形成系统收益', text: 'AI 连接人员、设备、数据与组织流程，辅助减少信息延迟、优化资源配置。系统的瓶颈与复核成本决定局部提速能否转化为整体收益。', chain: ['流程连接', '资源配置', '价值闭环'], condition: '流程、责任和指标共同更新，并用真实质量、成本与产出评估收益。' },
};
function selectFactor(key) {
  const r = factors[key];
  $('#factorNumber').textContent = r.number; $('#factorTitle').textContent = r.title; $('#factorText').textContent = r.text; $('#factorCondition').textContent = r.condition;
  $('#factorChain').innerHTML = r.chain.map((v, i) => `${i ? '<i>→</i>' : ''}<span>${v}</span>`).join('');
  $$('[data-factor]').forEach(b => { const active = b.dataset.factor === key; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
}
$$('[data-factor]').forEach(b => b.addEventListener('click', () => selectFactor(b.dataset.factor)));
selectFactor('people');

$('#industryTabs').innerHTML = cases.map((c, i) => `<button data-industry="${c.id}" id="tab-${c.id}" role="tab" aria-selected="${i === 0}" aria-controls="industryContent" tabindex="${i === 0 ? 0 : -1}">${icon(c.icon)}${c.name}</button>`).join('');
let currentIndustry;
function selectIndustry(id) {
  const c = cases.find(x => x.id === id);
  currentIndustry = c;
  $$('[data-industry]').forEach(b => { const active = b.dataset.industry === id; b.classList.toggle('selected', active); b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
  $('#industryContent').setAttribute('aria-labelledby', `tab-${id}`);
  $('#industryContent').innerHTML = `<div class="industry-story"><div><span class="micro">${c.name} · 作用机制</span><h3>${c.title}</h3><p class="industry-description">${c.description}</p><div class="case-evidence">${c.example}<button data-source="${c.source}">查看依据与局限 ↗</button></div></div><div><div class="before-after"><div><span>传统生产方式</span><ul>${c.before.map(v => `<li>${v}</li>`).join('')}</ul></div><div><span class="after-title">AI 协作方式</span><ul>${c.after.map(v => `<li>${v}</li>`).join('')}</ul></div></div><div class="case-meta"><div><span>输入要素</span>${c.input}</div><div><span>潜在价值</span>${c.outcome}</div></div></div></div><div class="industry-flow"><div class="flow-label">点击步骤查看作用与核查点 · 机制示意，不代表已部署系统</div><div class="flow-line">${c.nodes.map((n, i) => `<button class="flow-node" data-step="${i}" aria-pressed="false"><span>${i + 1}</span>${n}</button>`).join('')}</div><div class="step-detail" aria-live="polite"><h4 id="stepTitle"></h4><p id="stepPurpose"></p><p id="stepCheck"></p></div><p class="flow-boundary">应用边界：${c.boundary}</p></div>`;
  selectStep(0);
}
function selectStep(index) {
  const [purpose, check] = caseSteps[currentIndustry.id][index];
  $('#stepTitle').textContent = `第 ${index + 1} 步：${currentIndustry.nodes[index]}`;
  $('#stepPurpose').textContent = `作用：${purpose}`;
  $('#stepCheck').textContent = `核查点：${check}`;
  $$('[data-step]').forEach(b => { const selected = Number(b.dataset.step) === index; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
}
$('#industryContent').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (b) selectStep(Number(b.dataset.step)); });
$$('[data-industry]').forEach((b, i, buttons) => {
  b.addEventListener('click', () => selectIndustry(b.dataset.industry));
  b.addEventListener('keydown', e => {
    let index;
    if (e.key === 'ArrowRight') index = (i + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') index = (i + buttons.length - 1) % buttons.length;
    else if (e.key === 'Home') index = 0;
    else if (e.key === 'End') index = buttons.length - 1;
    else return;
    e.preventDefault(); buttons[index].focus(); selectIndustry(buttons[index].dataset.industry);
  });
});
selectIndustry('manufacturing');

let currentSimulation;
const plans = { A: null, B: null };
function updateLab() {
  try {
    const params = Object.fromEntries(Object.keys(defaults).map(k => {
      const raw = $(`#${k}Number`).value;
      if (!raw.trim() || !Number.isInteger(Number(raw))) throw new RangeError('三个参数均需填写 0–100 的整数。');
      return [k, Number(raw)];
    }));
    currentSimulation = simulate(params);
  } catch (error) {
    currentSimulation = null;
    $('#labError').textContent = error.message; $('#labError').hidden = false;
    for (const k of Object.keys(defaults)) {
      const raw = $(`#${k}Number`).value;
      const value = Number(raw);
      const valid = Boolean(raw.trim()) && Number.isInteger(value) && value >= 0 && value <= 100;
      $(`#${k}Output`).textContent = valid ? `${value}%` : '—';
      $(`#${k}Number`).setAttribute('aria-invalid', String(!valid));
    }
    $$('[data-preset]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    for (const id of ['totalTime', 'savedTime', 'throughput']) $(`#${id}`).textContent = '—';
    $('#workflowChart').replaceChildren();
    $('#labInsight').textContent = '当前参数无效。请修正输入后再计算、保存或导出。';
    $('#labInsight').classList.add('warning');
    for (const id of ['exportLab', 'savePlanA', 'savePlanB']) $(`#${id}`).disabled = true;
    return;
  }
  $('#labError').hidden = true;
  for (const id of ['exportLab', 'savePlanA', 'savePlanB']) $(`#${id}`).disabled = false;
  const r = currentSimulation;
  const params = r.params;
  for (const k of Object.keys(params)) { $(`#${k}`).value = params[k]; $(`#${k}Output`).textContent = `${params[k]}%`; $(`#${k}Number`).setAttribute('aria-invalid', 'false'); }
  $$('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(Object.keys(defaults).every(k => params[k] === presets[b.dataset.preset][k]))));
  // 固定 0–50 分钟刻度，防止控件变化时通过缩放掩盖实际耗时。
  $('#workflowChart').innerHTML = r.stages.map((s, i) => `<div class="workflow-stage"><div class="stage-head"><span>${i + 1}. ${s.name}</span><span>${s.baseline.toFixed(1)} → ${s.minutes.toFixed(1)} 分钟</span></div><div class="stage-bars"><div class="stage-track"><div class="stage-bar" style="width:${s.baseline / 50 * 100}%" role="img" aria-label="传统${s.name} ${s.baseline}分钟"></div></div><div class="stage-track"><div class="stage-bar ai ${s.minutes > s.baseline ? 'overhead' : ''}" style="width:${s.minutes / 50 * 100}%" role="img" aria-label="AI协作${s.name} ${s.minutes.toFixed(1)}分钟"></div></div></div></div>`).join('') + '<p class="source-note">统一刻度：0–50 分钟。蓝色为 AI 协作耗时，橙色标出新增复核负担。</p>';
  $('#totalTime').innerHTML = `${r.total.toFixed(1)}<small>分钟</small>`;
  $('#savedTime').innerHTML = `${r.saved.toFixed(1)}<small>分钟</small>`;
  $('#throughput').textContent = `${r.gain > 0 ? '+' : ''}${r.gain.toFixed(1)}%`;
  $('#throughput').classList.toggle('negative', r.gain < 0); $('#savedTime').classList.toggle('negative', r.saved < 0);
  $('#labInsight').classList.toggle('warning', r.gain < 0);
  $('#labInsight').textContent = params.coverage === 0 ? '关闭 AI 后，工作流回到 100 分钟基线。没有 AI 参与，也不会额外增加复核负担。' : r.gain < 0 ? `当前假设下，复核负担超过节时收益，整体效率下降 ${Math.abs(r.gain).toFixed(1)}%。引入 AI 需要同时改造流程与治理。` : r.gain === 0 ? '当前假设下没有净收益。数据质量、适用任务与复核成本共同决定 AI 能否提高整体效率。' : `当前假设下节省 ${r.saved.toFixed(1)} 分钟，同时间可完成的工作量提高 ${r.gain.toFixed(1)}%。这是教学模型结果，不能作为真实企业预测。`;
}
function setLab(params) { for (const k of Object.keys(defaults)) { $(`#${k}`).value = params[k]; $(`#${k}Number`).value = params[k]; } updateLab(); }
Object.keys(defaults).forEach(k => {
  $(`#${k}`).addEventListener('input', () => { $(`#${k}Number`).value = $(`#${k}`).value; updateLab(); });
  $(`#${k}Number`).addEventListener('input', updateLab);
});
$('#resetLab').addEventListener('click', () => setLab(defaults));
const presets = { healthy: { coverage: 85, quality: 95, review: 10 }, friction: { coverage: 100, quality: 20, review: 95 }, off: { coverage: 0, quality: 80, review: 20 } };
$$('[data-preset]').forEach(b => b.addEventListener('click', () => setLab(presets[b.dataset.preset])));
$('#exportLab').addEventListener('click', () => { if (currentSimulation) download('AI生产力-当前教学模拟.csv', toCSV(currentSimulation)); });
function renderPlans() {
  for (const id of ['A', 'B']) {
    const p = plans[id];
    $(`#plan${id}Params`).textContent = p ? `覆盖率 ${p.coverage}% · 质量 ${p.quality}% · 复核成本 ${p.review}%` : '尚未保存参数';
    const r = p ? simulate(p) : null;
    $(`#plan${id}Result`).textContent = r ? `${r.total.toFixed(1)} 分钟 · 吞吐量 ${r.gain > 0 ? '+' : ''}${r.gain.toFixed(1)}%` : '未保存';
  }
  const ready = Boolean(plans.A && plans.B);
  $('#exportComparison').disabled = !ready;
  $('.comparison-table tbody').replaceChildren();
  if (!ready) { $('#comparisonInsight').textContent = '先保存方案 A，调整参数后再保存方案 B，即可查看对比。'; return; }
  const { a, b, timeDifference } = comparePlans(plans.A, plans.B);
  $('#comparisonInsight').textContent = Math.abs(timeDifference) < .005 ? '两方案的总耗时相同。请继续检查阶段分配和参数差异。' : `当前教学假设下，方案 ${timeDifference > 0 ? 'B' : 'A'} 更快，耗时相差 ${Math.abs(timeDifference).toFixed(1)} 分钟。`;
  const rows = a.stages.map((s, i) => [s.name, s.minutes, b.stages[i].minutes, '分钟']);
  rows.push(['总耗时', a.total, b.total, '分钟'], ['吞吐量变化', a.gain, b.gain, '%']);
  $('.comparison-table tbody').innerHTML = rows.map(([name, av, bv, unit]) => `<tr><td>${name}</td><td>${av.toFixed(1)} ${unit}</td><td>${bv.toFixed(1)} ${unit}</td><td>${bv - av > 0 ? '+' : ''}${(bv - av).toFixed(1)} ${unit === '%' ? '个百分点' : unit}</td></tr>`).join('');
}
for (const id of ['A', 'B']) $(`#savePlan${id}`).addEventListener('click', () => { if (currentSimulation) { plans[id] = { ...currentSimulation.params }; renderPlans(); } });
$('#clearPlans').addEventListener('click', () => { plans.A = plans.B = null; renderPlans(); });
$('#exportComparison').addEventListener('click', () => { if (plans.A && plans.B) download('AI生产力-两方案教学对比.csv', comparisonCSV(comparePlans(plans.A, plans.B))); });
renderPlans();
updateLab();

$('#energyChart').innerHTML = `<svg viewBox="0 0 450 230" role="img" aria-label="全球数据中心年耗电，2025年约485TWh，2030年中心情景预测约950TWh；包括非AI负载。">${[0, 250, 500, 750, 1000].map(v => `<line x1="55" x2="430" y1="${195 - v * .17}" y2="${195 - v * .17}" stroke="#dce3ec" stroke-dasharray="3 5"/><text x="42" y="${199 - v * .17}" fill="#526176" font-size="12" text-anchor="end">${v}</text>`).join('')}<rect x="109" y="112.55" width="80" height="82.45" rx="3" fill="#245cce"/><rect x="294" y="33.5" width="80" height="161.5" rx="3" fill="#245cce0d" stroke="#245cce" stroke-dasharray="5 4"/><text x="149" y="100" fill="#245cce" font-size="22" text-anchor="middle">485</text><text x="334" y="24" fill="#245cce" font-size="22" text-anchor="middle">950</text><text x="149" y="221" fill="#526176" font-size="11" text-anchor="middle">2025 · 估计</text><text x="334" y="221" fill="#526176" font-size="11" text-anchor="middle">2030 · 预测</text></svg>`;
$$('.governance-item').forEach(b => b.addEventListener('click', () => {
  const open = b.classList.toggle('open'); b.setAttribute('aria-expanded', String(open)); $('.accordion-mark', b).textContent = open ? '−' : '+';
}));

// 来源面板与 CSV 共用同一来源表，记录可追溯。
function renderSources(focusId) {
  const query = $('#sourceSearch').value.trim().toLowerCase();
  const rows = sources.filter(s => `${s.name} ${s.category} ${s.year} ${s.detail} ${s.caveat}`.toLowerCase().includes(query));
  $('#sourceCount').textContent = `找到 ${rows.length} / ${sources.length} 个来源`;
  $('#sourceEmpty').hidden = rows.length > 0;
  $('#sourceList').innerHTML = rows.map(s => `<article class="source-card ${s.id === focusId ? 'focused' : ''}" id="source-${s.id}"><div><h3>${s.name}</h3><span class="tag">${s.category} · ${s.year}</span></div><p>${s.detail}</p><p class="caveat">口径与局限：${s.caveat}</p><a href="${s.url}" target="_blank" rel="noopener noreferrer">阅读原始来源 ↗</a></article>`).join('');
}
$('#sourceSearch').addEventListener('input', () => renderSources());
$('#clearSourceSearch').addEventListener('click', () => { $('#sourceSearch').value = ''; renderSources(); $('#sourceSearch').focus(); });
function showSources(focusId) {
  $('#sourceSearch').value = '';
  renderSources(focusId);
  $('#sourceDialog').showModal();
  if (focusId) requestAnimationFrame(() => $(`#source-${focusId}`).scrollIntoView({ block: 'center', behavior: 'instant' }));
}
document.addEventListener('click', e => {
  const source = e.target.closest('[data-source]');
  if (source) showSources(source.dataset.source);
  if (e.target.closest('.source-open')) showSources();
});
$('#closeSources').addEventListener('click', () => $('#sourceDialog').close());
$('#sourceDialog').addEventListener('click', e => { if (e.target === $('#sourceDialog')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
function exportData() {
  const rows = [
    ['指标', '年份/日期', '地区/人群', '值', '单位', '证据类型', '来源', '口径与局限'],
    ...adoption.map(x => ['组织AI采用率', x.year, '受访组织', x.value, '%', '调查汇总', sources.find(s => s.id === x.source).url, '不同年份调查样本可能变化']),
    ...investments.map(x => ['私营AI投资', 2025, x.name, x.value, '十亿美元', '报告汇总', sources[0].url, '非全部国家/地区；不含全部政府投入']),
    ['客服生产率平均提升', '2023-11工作论文', '5179名客服人员', 14, '%', '场景研究', sources.find(x => x.id === 'nber').url, '每小时解决问题数；不外推为全行业'],
    ['新手及低技能客服生产率提升', '2023-11工作论文', '研究中的新手及低技能客服', 34, '%', '场景研究', sources.find(x => x.id === 'nber').url, '研究版本绑定；不是所有劳动者'],
    ['固定MMLU阈值API价格', '2022-11', 'GPT-3.5水平', 20, '美元/百万token', '技术价格比较', sources.find(x => x.id === 'cost').url, '固定阈值；不同模型；不含整体部署成本'],
    ['固定MMLU阈值API价格', '2024-10', 'GPT-3.5水平', .07, '美元/百万token', '技术价格比较', sources.find(x => x.id === 'cost').url, '固定阈值；不同模型；不含整体部署成本'],
    ['数据中心年耗电', 2025, '全球数据中心', 485, 'TWh', '估计', sources.find(x => x.id === 'iea').url, '包括非AI负载'],
    ['数据中心年耗电', 2030, '全球数据中心', 950, 'TWh', '中心情景预测', sources.find(x => x.id === 'iea').url, '预测存在不确定性；包括非AI负载'],
    ['中国工业机器人安装量', 2024, '中国', 295000, '台（约）', 'IFR资料报告汇总', sources[0].url, '机器人并不都使用AI'],
    ['中国工业机器人安装全球份额', 2024, '中国占全球', 54, '%', 'IFR资料报告汇总', sources[0].url, '机器人并不都使用AI'],
  ];
  download('智变-公开来源数据快照.csv', '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n'));
}
$('#exportData').addEventListener('click', exportData); $('#exportDataDialog').addEventListener('click', exportData);

const tour = [
  { id: 'overview', title: '01 · 理解核心问题', text: '从数据与模型到人机协作，再到可衡量的生产价值。三个事实说明不同变化，来源与适用边界都能查看。' },
  { id: 'trends', title: '02 · 用数据理解技术扩散', text: '切换 2023—2025 年调查，观察组织采用率。比较私人投资，思考投入为何需要转化为真实业务价值。' },
  { id: 'mechanism', title: '03 · 探索四个价值引擎', text: '点击劳动者、劳动资料、劳动对象和要素协同。查看技术如何进入流程，以及价值真正发生的条件。' },
  { id: 'industries', title: '04 · 走进六个产业场景', text: '选择产业，再点击五步流程中的任一步。查看这一环节的作用，以及如何核查真实执行和效果。' },
  { id: 'lab', title: '05 · 亲手验证收益与边界', text: '使用滑块或数字输入设置参数，保存方案 A 和 B 并比较。尝试负收益和关闭 AI，理解整体效率的条件。' },
  { id: 'balance', title: '06 · 衡量更完整的价值', text: '区分能源估计与未来预测，理解绿色发展、人才成长和可信治理。打开证据库，追溯每个真实数字。' },
];
let tourIndex = 0;
function renderTour() {
  const t = tour[tourIndex]; $('#tourPanel').hidden = false;
  $('#tourTitle').textContent = t.title; $('#tourText').textContent = t.text; $('#tourCount').textContent = `${tourIndex + 1} / ${tour.length}`;
  $('#tourPrev').disabled = tourIndex === 0; $('#tourNext').textContent = tourIndex === tour.length - 1 ? '完成导览 ✓' : '下一步 →';
  $$('.section').forEach(s => s.classList.toggle('tour-highlight', s.id === t.id));
  $(`#${t.id}`).scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
}
function closeTour() { $('#tourPanel').hidden = true; $$('.tour-highlight').forEach(s => s.classList.remove('tour-highlight')); $('#tourStart').focus({ preventScroll: true }); }
$('#tourStart').addEventListener('click', () => { tourIndex = 0; renderTour(); });
$('#tourNext').addEventListener('click', () => { if (tourIndex === tour.length - 1) closeTour(); else { tourIndex++; renderTour(); } });
$('#tourPrev').addEventListener('click', () => { if (tourIndex > 0) { tourIndex--; renderTour(); } });
$('#tourClose').addEventListener('click', closeTour);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#tourPanel').hidden) closeTour(); });
$('.menu-toggle').addEventListener('click', () => { const open = $('.topbar').classList.toggle('menu-open'); $('.menu-toggle').setAttribute('aria-expanded', String(open)); });
$$('.topbar nav a').forEach(a => a.addEventListener('click', () => { $('.topbar').classList.remove('menu-open'); $('.menu-toggle').setAttribute('aria-expanded', 'false'); }));
const sections = $$('.section');
let scrollQueued = false;
function updateNavigation() {
  const range = document.documentElement.scrollHeight - innerHeight;
  $('#scrollProgress').style.width = `${range > 0 ? scrollY / range * 100 : 0}%`;
  const active = sections.filter(s => s.getBoundingClientRect().top < innerHeight * .35).at(-1) || sections[0];
  $$('.rail a').forEach(a => { const isActive = a.hash === `#${active.id}`; a.classList.toggle('active', isActive); if (isActive) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  scrollQueued = false;
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateNavigation); } }, { passive: true }); updateNavigation();
