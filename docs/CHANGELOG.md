# CHANGELOG

所有版本迭代记录统一维护在本文件。  
规则：每次准备发布时先更新本文件，再打 tag。

## [Unreleased]

### Changed
- CI 线上 smoke 流程增强：自动触发时优先使用稳定生产域名，并在探活阶段遇到 `401` 自动回退到生产域名。
- 线上 smoke 增加重试与更稳健的日志过滤，降低外部网络波动导致的误报。

## [v0.2.0] - 2026-02-21

### Changed
- 研发层面重构：将页面运行逻辑从单大脚本拆分为模块化脚本：
  - `js/state.js`
  - `js/visual.js`
  - `js/audio.js`
  - `js/session.js`
  - `js/ui.js`
  - `js/main.js`
- 保持核心产品交互不变（呼吸流程、环境音选择、计时逻辑）。

### Added
- 新增只读健康探针 `window.__qa__`，用于自动化测试读取会话与音频状态。
- 新增 `TC-014` ~ `TC-016`，覆盖 `__qa__` 相关校验。

### Test
- 本地回归：`npm run test:e2e` 全通过（16 项）。
- 线上 smoke：`tests/online-smoke.spec.js` 可通过。

## [v0.1.1] - 2026-02-21

### Added
- 新增线上 smoke 自动化：
  - `tests/online-smoke.spec.js`
  - `.github/workflows/online-smoke.yml`
- 新增脚本命令：
  - `test:e2e`
  - `test:e2e:all`
  - `test:online-smoke`

### Changed
- Online Smoke 工作流触发与探活策略优化（部署成功触发、URL 就绪检查等）。

## [v0.1.0] - 2026-02-21

### Added
- 项目初始化与首个稳定版本发布。
- 基础文档体系：
  - `docs/requirements.md`
  - `docs/technical.md`
  - `docs/testing.md`
  - `docs/test-report-2026-02-21.md`
  - `docs/release-notes-v0.1.0.md`
  - `docs/release-checklist.md`
- 自动化测试框架与主用例：
  - `playwright.config.js`
  - `tests/qa.spec.js`

### Changed
- 修复并稳定化音频链路（包括环境音切换和滤波稳定性问题）。
