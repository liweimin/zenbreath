# AGENTS.md

本文件用于在本项目中固化“默认协作与发布规则”。

## 1) 工作顺序（最少必要）
1. 先确认本轮目标与验收标准（参考 `docs/requirements.md`）。
2. 再改代码（功能与工程改动都可以）。
3. 同步更新相关文档：
   - 需求变更 -> `docs/requirements.md`
   - 实现/架构变更 -> `docs/technical.md`
   - 测试策略/用例变更 -> `docs/testing.md`
4. 跑测试并记录结果。
5. 更新 `docs/CHANGELOG.md`（先写在 `[Unreleased]`）。
6. 提交、打 tag、推送。

## 2) 测试门禁
- 本地回归必须通过：`npm run test:e2e`
- 线上 smoke 必须通过：`npm run test:online-smoke`
- 上线前仍需人工最小听感检查：`MT-01` ~ `MT-03`（见 `docs/testing.md`）

## 3) 发布检查
- 发布前执行 `docs/release-checklist.md`
- 发布后将 `CHANGELOG` 的 `[Unreleased]` 整理进对应版本块

## 4) 当前关键入口
- 主页面：`ZenBreath.html`
- 运行模块：`js/state.js`, `js/visual.js`, `js/audio.js`, `js/session.js`, `js/ui.js`, `js/main.js`
- 自动化：
  - 本地：`tests/qa.spec.js`
  - 线上：`tests/online-smoke.spec.js`
  - CI：`.github/workflows/online-smoke.yml`

## 5) 网络受限时（可选）
如外网不可达，可使用本机代理端口 `7897`：

```powershell
$env:HTTP_PROXY="http://127.0.0.1:7897"
$env:HTTPS_PROXY="http://127.0.0.1:7897"
```
