# ZenBreath 技术文档

## 1. 实现概览
当前版本采用“单页面 + 多脚本模块”实现。  
核心技术：
- UI 样式：Tailwind CDN + 自定义 CSS。
- 动画与渲染：CSS Transition/Keyframes + Canvas 粒子。
- 音频：Web Audio API（环境噪声实时合成 + 阶段提示音）。
- 状态驱动：原生 JavaScript 状态机。

模块入口：
- `js/state.js`：共享状态、DOM 引用、兼容全局变量、`window.__qa__` 读模型
- `js/visual.js`：背景切换、语录、粒子系统
- `js/audio.js`：环境音引擎、提示音、音量控制
- `js/session.js`：四段相位状态机、倒计时、会话启停
- `js/ui.js`：设置面板和控件交互
- `js/main.js`：初始化编排

## 2. 逻辑架构
- UI 层  
  设置弹层、模式按钮、时长按钮、环境音按钮、音量控制、开始按钮。

- 会话引擎层  
  负责会话启停、相位切换、倒计时、总时长推进。

- 视觉引擎层  
  背景双层切换、语录刷新、呼吸球/光环缩放、粒子模式转换。

- 音频引擎层  
  环境音生成、滤波、音量包络、相位提示音合成。

- 观测层  
  `window.__qa__` 暴露只读健康数据，供自动化测试读取运行状态。

## 3. 关键状态变量
- `isSessionActive`：会话是否运行中。
- `durations`：四段秒数配置（`inhale/hold1/exhale/hold2`）。
- `remainingSessionTime`：剩余秒数。
- `endlessMode`：是否无尽模式。
- `currentAmbientType`：当前环境音类型。
- `currentAmbientEngine`：当前环境音引擎（`sample/synth`）。
- `cueMode`：提示音模式（`sample/synth`）。
- `ambientFilterNode`：当前环境音滤波节点引用。
- `particleMode`：粒子行为模式（`idle/attract/repel/scatterWait`）。
- `currentPhase`：当前呼吸相位。
- `countdownRemaining`：当前相位剩余秒数。
- `sessionStartedAt`：本次会话启动时间戳（用于本地统计）。
- `lastSettings`：上次有效设置快照（本地持久化）。
- `metrics`：当日统计（`date/sessions/totalSeconds`）。
- `lastAudioError`：音频或运行异常的最后错误快照。

## 4. 核心流程
### 4.1 启动流程
1. 初始化背景图与粒子系统。
2. 加载本地持久化配置与当日统计（`localStorage`）。
3. 应用上次设置并刷新“继续上次练习”按钮状态。
4. 环境音类型同步到 UI（尚未创建音频上下文）。
5. 用户点击开始后才初始化 `AudioContext`（符合浏览器自动播放策略）。

### 4.2 会话流程
1. 点击开始触发 `toggleSession()`。
2. 进入 `playPhase('inhale')`，按状态机推进到下一阶段。
3. 每阶段执行：
- 更新状态文本与倒计时。
- 应用视觉参数（缩放、透明度、遮罩等）。
- 切换粒子模式。
- 播放阶段提示音。
4. 全局计时器每秒减少 `remainingSessionTime`，到 0 触发 `endSession()`。

### 4.3 设置流程
1. 设置面板改动实时更新配置状态。
2. 每次改动会同步写入本地持久化（模式/时长/环境音/音量）。
3. 会话中改配置时，系统先停会话，避免状态错位。
4. 支持“继续上次练习”直接恢复并启动。

## 5. 音频架构与实现
### 5.1 环境音
- 默认优先使用本地自然采样素材：
  - `assets/audio/ambient/stream.mp3`
  - `assets/audio/ambient/light-rain.mp3`
  - `assets/audio/ambient/rain.mp3`
  - `assets/audio/ambient/wind.mp3`
  - `assets/audio/ambient/thunder-rain.mp3`
- 采样可用时：`AudioBufferSourceNode` 循环播放 + `GainNode` 统一音量包络与 crossfade。
- 采样不可用时：自动回退到合成噪声引擎（原滤波逻辑）。

### 5.2 提示音
- 支持两种提示音模式：
  - `sample`（默认）：真实采样素材
    - `assets/audio/cues/inhale_qing.wav`
    - `assets/audio/cues/hold_waterdrop.wav`
    - `assets/audio/cues/exhale_drum.wav`
  - `synth`：原合成提示音引擎（保留兜底）
- 设置面板新增“提示音风格”切换，状态随本地设置持久化。

### 5.3 稳定性关键点
- 切换环境音前先安全停止并断开旧节点，避免脏连接。
- 采样加载失败自动降级到合成引擎，避免会话启动失败。
- `file://` 本地测试场景下跳过采样 fetch，避免浏览器协议限制导致控制台报错。
- 合成噪声样本做 `Number.isFinite` 检查和 `[-1,1]` 限幅，避免滤波器输入异常。
- 合成 `wind` 使用控制速率调制，避免 audio-rate 快速参数自动化导致 `Biquad bad state`。
- 环境音切换采用短时 crossfade，并限制淡出队列仅保留最近一条，避免高频切换时节点堆积卡顿。

## 6. 视觉架构
- 背景：双层 `bg-layer` 交替淡入淡出 + Ken Burns 推拉。
- 遮罩：统一暗色氛围层，根据相位动态透明度变化。
- 粒子：Canvas 200 粒子，按相位切换物理行为。
- 呼吸核心：人形 SVG + 光环 + 中央文本倒计时。

## 7. 已知约束
- 当前仍是纯前端静态实现，无后端存储与鉴权。
- 依赖 Tailwind CDN，适合原型与本地调试，不适合严格生产部署。
- 音频体验受浏览器自动播放策略与设备输出链影响。

## 8. 建议的工程化演进
1. 从脚本模块继续演进到 ES Module + 构建工具（Vite）。
2. 将 `window.__qa__` 迁移为受控开关（仅测试环境暴露）。
3. 建立统一 CI 门禁：本地回归 + 线上 smoke + 人工最小验收。
4. 增加基础错误遥测（控制台错误收集 + 会话状态快照）。

## 9. 本地数据策略
- 存储位置：浏览器 `localStorage`。
- Key：
  - `zenbreath:lastSettings`：上次设置快照。
  - `zenbreath:dailyMetrics`：当日练习统计。
- 当日滚动：按 `YYYY-MM-DD` 归档，当日期变更时重置当日计数。
- 容错：读取失败或 JSON 异常时自动降级为默认值，不影响会话主流程。
