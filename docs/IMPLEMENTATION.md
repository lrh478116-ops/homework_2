# 实现计划与变更说明

## 当前改版任务

用户新增要求：朴素实用、重点突出、交互强而实用；先设计思路，再框架，再页面。对应文件为 REDESIGN_DESIGN.md 与 REDESIGN_FRAMEWORK.md，均先于页面重写建立。

原始网站与旧资料记录在下文，属于历史实现，不能替代本轮验证。当前 acceptance 包含数字输入、失效状态阻断、A/B 独立参数快照和导出、产业步骤读取、来源搜索与可读性。静态 HTML/CSS/JS、历史数据、教学模型假设、原 GitHub Pages 仓库与来源边界保持既定契约。

新增 tests/compare.test.mjs 与 tests/redesign.mjs 在实现前分别因缺少 comparePlans 导出和 savePlanA 正式控件按预期失败。实现后执行两组模型测试与两套正式入口测试。浏览器验证曾因宿主机 Node 分配内存失败而中断；使用 --max-semi-space-size=4 --max-old-space-size=256 运行环境参数后原检查通过，不修改产品结果以规避失败。

## 只读审计（2026-10-10）
- 工作目录为空；当前目录、直接父目录与磁盘根目录未发现 AGENTS.md。遵守用户在会话提供的工程规则。
- 没有既有入口、设计、测试或报告，也不存在待修复缺陷。
- 用户最新要求：先在本地实现，之后上传 GitHub，并指定已建空仓库 homework_2。按顺序完成本地验收后上传 lrh478116-ops/homework_2，通过 GitHub Pages 发布。已创建的空 Sites 注册不作为交付链接，也不用于部署。

## Scope / requirements
1. 中文交互式展示网站，完整表达人工智能作为新质生产力的作用与意义。
2. 多种可视化具有不同解释用途：网络球体、趋势折线、横向比较、价值链图、产业流程、工作流实验、能源对比。
3. 所有真实数字绑定来源、年份、单位、统计口径；模拟显著标注并公开公式。
4. 能通过真实控件改变图表、场景或模拟结果；支持重置、CSV 导出、来源查看与讲解导览。
5. 自适应桌面与手机，键盘可用、减少动态偏好、无网络资源依赖。
6. 提供可上传 GitHub Pages 的源码、压缩包、亮点说明和不超过五分钟的有声演示视频（工具支持时实际生成）。

## 设计不变量与因果链
- 数据固定为经查证的历史快照，不宣传为实时监测；2023–2025 组织采用率是不同年度调查，不能作为同一企业队列追踪。
- 数据中心耗电包含非 AI 负载，不能全归因给 AI；2030 是预测。
- 客服研究仅说明特定任务的每小时解决问题数，不外推为所有行业或 GDP 增幅。
- 模拟：input → validated parameters → task time reduction / overhead → workflow stage durations → total minutes → throughput change → rendered DOM bars + accessible text + CSV。
- 无 AI / 无数据质量时不能继续复用上次有收益结果；非法输入必须明确失败。
- 所有产出统计经同一计算结果渲染与导出；不使用隐藏目标、外部 AI 推理或伪造实时指标。

## Non-goals / dependencies
- 不训练模型、不连接商业 API、不加入账号/数据库、不声称实现真实产业预测。
- 网页运行无依赖；验证使用 Node 内建测试和环境已有 Playwright。预览使用本地 HTTP 服务。
- 演示视频依赖 Windows 中文语音与视频编码工具；若工具不可用必须明确缺失。

## Acceptance / negative controls
- 当前请求逐项映射到实现与当前运行证据；入口必须真实消费模型与数据。
- 测试输入失败、AI 覆盖率为零、数据质量为零、高复核成本收益为负、重置不复用 stale state。
- 浏览器检查趋势切换、全部行业、三项滑块、重置、来源面板、CSV、导览、移动布局和零运行错误。
- 最终再读原始要求，完成 closure 与对抗性复审，然后运行 node --test tests/model.test.mjs / node scripts/check.mjs / node tests/browser.mjs。package.json 提供对应 npm scripts；本机没有 npm 命令，使用直接 Node 命令。

## 统一实施策略
先建立数据与计算契约及失败测试；再一次性实现展示结构与控件；最后检查数字口径、交互链路、响应式和交付材料。无既有缺陷，不做无关修补。

## 最终复审确认缺陷与统一修复
- P2：320 / 390 像素下价值引擎侧节点遮挡中央标签。位置：styles.css 的 engine-center / engine-node 移动断点。
- 直接证据：docs/screenshots/mobile-mechanism.png，中央“人工智能”文字两侧被覆盖。原浏览器检查只检测整页宽度，无法证明节点可读。
- 修复方向：移动端采用中央引擎在上、四节点在下的两列布局；中等屏幕缩小中央圆。新增各断点节点与中央标签的矩形重叠负向检查，确认修复前按预期失败后实施。
- 阻止本地页面正式 closure，未关闭前不打包最终源码。
