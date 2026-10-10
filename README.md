# 智变 · AI 新质生产力观察站

一个中文交互可视化网站，解释人工智能如何通过劳动者能力、工具升级、数据要素与组织协同推动新质生产力。采用无需构建的 HTML / CSS / JavaScript，不依赖 CDN、远程字体或商业 API。

## 本地预览

在此目录打开终端：

```powershell
node scripts/serve.mjs
```

浏览器打开 http://127.0.0.1:4173 。由于使用 ES modules，请通过 HTTP 服务访问，不要直接双击 HTML。也可以使用 VS Code Live Server，以 `dist` 为根目录。

## 内容

- 380 个节点的 Canvas 网络球体（概念视觉，非观测数据）。
- 2023–2025 AI 采用率 SVG 图表与年份选择。
- 地区私人投资对比与推理成本对照。
- 四要素价值引擎及可点击解释。
- 六产业场景、传统/协作对比及五步反馈流程。
- 三参数生产力实验、负收益情景、关闭 AI 控制与 CSV 导出。
- 能源估计/预测对比、治理展开面板、来源证据库。
- 六步讲解导览、键盘导航与移动端适配。

## 数据与公式

来源保存在 `dist/data.js`，网页证据库包含统计口径与局限。生产力模型在 `dist/model.js`。实验系数是教学假设，不是实测或企业预测；所有滑块、可见结果与导出使用同一计算对象。

## 验证

```powershell
node --test tests/model.test.mjs
node scripts/check.mjs
# 启动预览服务后，在另一个终端执行；需安装或环境提供 playwright
node tests/browser.mjs
```

若具有 npm，也可以用 `npm test`、`npm run check`、`npm run test:browser`。浏览器测试需要 Playwright 和 Chromium；已提供当前 Codex 环境路径作为本机验证兼容项。其他电脑执行 `npm install --no-save playwright` 与 `npx playwright install chromium` 后运行。

## 上传到 homework_2 / GitHub Pages

仓库： https://github.com/lrh478116-ops/homework_2 。遵照“先写在本地，之后上传 GitHub”，完成本地实现和验证后已上传并通过 GitHub Pages 发布。

网站：https://lrh478116-ops.github.io/homework_2/ 。发布的资源逐项与本地 SHA-256 核对，公网正式入口的交互验证保存在 `docs/browser-verification-production.json`；完整提交文件与 commit 校验在本地“交付文件”目录。

将本目录内容放到仓库根目录，保留 `dist`、`tests`、`scripts`、`package.json` 与 `.github/workflows/pages.yml`。

```powershell
git init -b main
git add .
git commit -m "Build AI productivity visualization website"
git remote add origin https://github.com/lrh478116-ops/homework_2.git
git push -u origin main
```

在 GitHub 仓库的 Settings → Pages → Build and deployment，将 Source 设为 **GitHub Actions**，再运行 Deploy to GitHub Pages workflow。发布成功后提交 GitHub 返回的 Pages 链接；不能把仓库地址或预期 URL 当成已部署网址。

所有资源均使用相对路径，兼容 `/homework_2/` 子路径。
