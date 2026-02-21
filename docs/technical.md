# ZenBreath 技术文档

## 1. 实现概览
当前版本采用单文件前端实现：`ZenBreath.html`，包含结构、样式和脚本。  
核心技术：
- UI 样式：Tailwind CDN + 自定义 CSS。
- 动画与渲染：CSS Transition/Keyframes + Canvas 粒子。
- 音频：Web Audio API（环境噪声实时合成 + 阶段提示音）。
- 状态驱动：原生 JavaScript 状态机。

## 2. 逻辑架构
- UI 层  
  设置弹层、模式按钮、时长按钮、环境音按钮、音量控制、开始按钮。

- 会话引擎层  
  负责会话启停、相位切换、倒计时、总时长推进。

- 视觉引擎层  
  背景双层切换、语录刷新、呼吸球/光环缩放、粒子模式转换。

- 音频引擎层  
  环境音生成、滤波、音量包络、相位提示音合成。

## 3. 关键状态变量
- `isSessionActive`：会话是否运行中。
- `durations`：四段秒数配置（`inhale/hold1/exhale/hold2`）。
- `remainingSessionTime`：剩余秒数。
- `endlessMode`：是否无尽模式。
- `currentAmbientType`：当前环境音类型。
- `particleMode`：粒子行为模式（`idle/attract/repel/scatterWait`）。

## 4. 核心流程
### 4.1 启动流程
1. 初始化背景图与粒子系统。
2. 环境音类型随机设定并同步到 UI（尚未创建音频上下文）。
3. 用户点击开始后才初始化 `AudioContext`（符合浏览器自动播放策略）。

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
2. 会话中改配置时，系统先停会话，避免状态错位。
3. 关闭面板并点击开始后，按最新配置重新启动。

## 5. 音频架构与实现
### 5.1 环境音
- 使用 `AudioBufferSourceNode` 循环噪声缓冲区。
- 使用 `BiquadFilterNode` 区分五种音色：
- `earth`: lowpass 140Hz
- `water`: lowpass 550Hz
- `fire`: bandpass 800Hz
- `wind`: lowpass + 控制速率频率摆动
- `void`: highpass 3500Hz
- 使用 `GainNode` 承担总音量与平滑启停。

### 5.2 提示音
- 吸气：短促上扬水滴音。
- 吐气：低频鼓面下潜音。
- 屏息：双振荡器轻微失谐，营造钵音拍频。

### 5.3 稳定性关键点
- 切换环境音前先安全停止并断开旧节点，避免脏连接。
- 噪声样本做 `Number.isFinite` 检查和 `[-1,1]` 限幅，避免滤波器输入异常。
- `wind` 改为控制速率调制，避免 audio-rate 快速参数自动化导致 `Biquad bad state`。

## 6. 视觉架构
- 背景：双层 `bg-layer` 交替淡入淡出 + Ken Burns 推拉。
- 遮罩：统一暗色氛围层，根据相位动态透明度变化。
- 粒子：Canvas 200 粒子，按相位切换物理行为。
- 呼吸核心：人形 SVG + 光环 + 中央文本倒计时。

## 7. 已知约束
- 代码集中在单文件，不利于单元测试和模块复用。
- 依赖 Tailwind CDN，适合原型与本地调试，不适合严格生产部署。
- 音频体验受浏览器自动播放策略与设备输出链影响。

## 8. 建议的工程化演进
1. 按模块拆分为 `ui/session/audio/visual` 四个脚本文件。
2. 引入 `qa` 测试开关（只在测试模式暴露内部状态只读接口）。
3. 建立 `npm` 脚本统一执行 lint + e2e + 报告导出。
4. 增加基础错误遥测（控制台错误收集 + 会话状态快照）。
