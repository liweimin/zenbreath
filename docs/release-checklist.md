# 发布检查清单

## 1. 提交前
- 自动化测试通过：`npm run test:e2e`
- 检查文档更新：需求/技术/测试/发布说明/测试报告（遵循 `docs/DOCS-RULES.md`）
- 更新统一历史迭代文档：`docs/CHANGELOG.md`
- 检查忽略文件：`node_modules/`, `test-results/`, `.vercel/`

## 2. 版本控制
- 提交信息清晰
- 打版本标签（示例）：`v0.1.0`

## 3. GitHub
- 推送分支
- 推送标签
- 在仓库中确认文件与文档完整

## 4. Vercel
- 首次导入项目并连接 GitHub 仓库
- Production Branch 指向 `main`
- 确认首页路由到 `ZenBreath.html`

## 5. 上线后
- 打开页面并执行一次 smoke：
- 可进入会话
- 可切换五种环境音
- 无控制台关键错误
- 执行人工最小回归：`MT-01` ~ `MT-03`
