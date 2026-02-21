# ZenBreath v0.1.0 发布说明

发布日期：2026-02-21

## 版本目标
完成 ZenBreath 的最小可用上线闭环：需求定义、技术沉淀、自动化测试、发布准备。

## 主要变更
- 修复音频稳定性问题，避免环境音切换导致音频链路异常。
- 新增项目文档：
- `docs/requirements.md`
- `docs/technical.md`
- `docs/testing.md`
- `docs/test-report-2026-02-21.md`
- 新增自动化测试：
- `tests/qa.spec.js`（覆盖 `TC-001` 到 `TC-013`）
- `playwright.config.js`
- 新增工程文件：
- `.gitignore`
- `vercel.json`
- 更新 `package.json`：
- 增加版本信息
- 增加 `test:e2e` 相关脚本

## 测试状态
- 自动化：13/13 通过
- 人工最小回归：待执行 `MT-01` 至 `MT-03`

## 已知事项
- 当前仍使用 Tailwind CDN，适用于当前版本但不建议长期生产化依赖。

## 回滚建议
- 若线上出现异常，优先回滚到上一稳定 tag。
- 回滚后重点检查音频切换与会话状态机。
