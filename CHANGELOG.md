# 更新日志 (Changelog)

本项目遵循 [Semantic Versioning (语义化版本 2.0.0)](https://semver.org/lang/zh-CN/) 规范。

---

## [1.1.0] - 2026-09-30

### 🚀 重大特性与架构升级 (Major Features & Architecture)
- **📐 角度微调标尺 (Fine-Angle Horizon Leveling Ruler)**：
  - 支持 **$-45^\circ \sim +45^\circ$** 高精度地平线校平微调，与 $90^\circ$ 步进旋转完全正交解耦，合成为全局总偏转角；
  - 拥有 **$0^\circ$ 磁吸回弹对齐 (Magnetic Snap)**，在微调接近水平线时提供精准贴合与触觉级控制体验；
  - 在微信小程序端采用专属标尺刻度滑动设计，支持单指拖拽即时响应。
- **🧮 智能防露白自适应缩放算法 (Smart Auto-Zoom Bounding)**：
  - 彻底攻克任意倾角旋转时图片边界内缩露出黑底/白底的几何难题；
  - 基于投影包络边界纯数学推导：
    $$W_{\text{proj}} = W_{\text{crop}} \cdot |\cos\theta| + H_{\text{crop}} \cdot |\sin\theta|$$
    $$H_{\text{proj}} = W_{\text{crop}} \cdot |\sin\theta| + H_{\text{crop}} \cdot |\cos\theta|$$
  - 控制器在微调倾角时实时计算最小无露白缩放比 $S_{\min}(\theta)$，动态提升当前缩放比，确保选区在全角度旋转下 $100\%$ 被图片像素充实，无瑕疵出图。
- **🎨 双层实时滤镜系统 (Dual-Layer Filter Pipeline)**：
  - **预览层 60 FPS GPU 加速**：依托 CSS 原生滤镜（`contrast`、`brightness`、`grayscale`、`sepia`、`hue-rotate`），滑动调节零卡顿；
  - **导出层 Canvas 2D 真实着色对齐**：导出流水线优先调用硬件级 `ctx.filter`，并在不支持的环境下自动降级至 CPU 级像素着色器（Fallback Shader），保证导出图与界面预览所见即所得；
  - 内置 6 款预设色彩风格：原图 (`normal`)、黑白经典 (`bw`)、复古胶片 (`vintage`)、鲜活色彩 (`vivid`)、清冷冷调 (`cool`)、温暖落日 (`warm`)。
- **⚡ 零开销选区数据导出与云端裁剪直传 (Zero-Overhead Crop Data & Cloud CDN Cropping)**：
  - 新增 `getCropData()` 方法，耗时 **$< 0.1\text{ms}$**，直接返回规范化选区参数（归一化矩形、物理像素矩形、总旋转偏转角、镜像翻转标志及当前滤镜选项）；
  - 开箱即用支持主流云存储 CDN 裁剪指令生成：
    - **阿里云 OSS** (`image/crop,x_...,y_...,w_...,h_...`)
    - **腾讯云 COS** (`imageMogr2/cut/...x...x...x...`)
    - **七牛云** (`imageMogr2/crop/...x...+...+...`)
  - 极大降低大图在移动端 Canvas 渲染的显存与 CPU 压力，实现“前端只做交互确定选区，实际切图由 CDN 边缘节点零时延处理”的高端架构。
- **✨ 沉浸式手势辅助线与触感震动反馈 (Immersive UX)**：
  - `showGrid` 属性新增 `'touch'` 模式：手指触控操作图片或选区时网格丝滑渐显（Fade-in），松手后延迟 400ms 平滑淡出（Fade-out），大幅降低常驻参考线对视觉审美的干扰；
  - `enableHaptic` 触感震动反馈：在旋转步进、达到最大/最小缩放极限阻尼及标尺磁吸时触发微震动，带来实体相机般的操控质感。
- **🛡️ 内存与生命周期深度治理 (Memory Leak Prevention)**：
  - 在微信小程序 `detached` 生命周期中对 Canvas 2D 导出驱动执行主动资源注销与句柄置空 (`driver.destroy()`)，杜绝多页面跳转重复挂载导致的小程序显存持续泄漏；
  - 完善导出互斥锁与异常拦截。
- **📐 扩展主流社交画幅预设**：
  - 新增 `4:5` (小红书/Instagram 竖版封面)、`9:16` (抖音/视频号短视频全屏) 及 `3:2` (单反相机标准画幅) 快速切换。

---

## [1.0.3] - 2026-09-29

### 🐛 缺陷修复 (Bug Fixes)
- **微信小程序 WAService 运行时 npm 相对路径解析修复**：
  - 修复微信小程序在运行 `omni-crop/weixin` 组件时抛出 `Error: module 'miniprogram_npm/omni-crop/core.js' is not defined, require args is '../core'` 的缺陷。
  - 原因：微信小程序基础库运行时（WAService）对于相对模块路径 `require('../core')` 不会自动解析目录下的隐式 `index.js`，导致找不到 `core.js`。
  - 修复：
    1. 将 `src/weixin/index.ts` 中的依赖引入显式更新为 `require('../core/index')` 和 `require('../exporter/index')`；
    2. 在构建流水线 `scripts/build.js` 中自动生成根级 `dist/core.js` 与 `dist/exporter.js` 兼容代理入口，实现双重防御；
    3. 同步更新 `examples/miniprogram-demo` 中的 `miniprogram_npm` 产物，确保导入即跑，零报错。

---

## [1.0.2] - 2026-09-29

### 🚀 架构重大升级 (Major Architectural Improvements)
- **🎯 模式 B 自由拉伸选区与 8 触控锚点体系**：
  - 裁剪框正式支持 **8 个触控手柄**：4 个角锚点（双轴变形）+ 4 条边中点锚点（单轴变形）；
  - **32px 隐式热区放大 (Touch Area Inflation)**：线条视觉上保持精细细腻，但通过伪元素将每个锚点的不可见触控热区扩展至 32px × 32px，彻底解决移动端手指难以精准点中的操作痛点；
  - **WXS 60 FPS 选区驱动**：拖拽锚点过程中在视图层直接计算并调用 `box.setStyle({ width, height })`，全程 **0 次跨线程通信**，保持满帧 60 FPS 丝滑响应；
  - **智能边界阻尼衰减与弹簧回弹 (Spring Physics)**：拉伸越界时自动计算衰减阻尼，松手后弹性平滑收敛回合法选区边界。
- **🟣 真·圆形抗锯齿裁切与透明通道保护**：
  - 当 `cropShape === 'round'` 时，Canvas 2D 导出引擎自动应用硬件级 `ctx.arc(...)` + `ctx.clip()` 执行圆形抗锯齿蒙版；
  - 圆形头像导出时自动强制默认使用 `PNG` 格式，完整保留透明 Alpha 通道，绝无黑边或白色填充底色瑕疵。
- **🛡️ 导出并发互斥锁 (Mutex Lock)**：
  - 在导出流水线注入驱动级并发锁 `_isExporting` 与组件级防重逻辑，防止用户快速连击造成并发重入与显存雪崩崩溃。
- **📦 现代双格式构建流水线 (Dual ESM/CJS Output)**：
  - 重构 `scripts/build.js`，实现双格式无缝产出：**ESM (`.mjs`)** + **CommonJS (`.js`)** + **TypeScript 类型定义 (`.d.ts`)**；
  - 全面支持 Vite、Webpack 5、Rollup、Taro 3、uni-app、Next.js 的原生 ESM 解析与按需 Tree-shaking；
  - 严格定义 `package.json` 的 `exports` 字段映射，对齐现代 npm 规范。
- **🧹 源码纯洁化与测试加固**：
  - 彻底清理误留在 `src/core/` 目录下的 `.js`、`.d.ts`、`.map` 历史编译产物；
  - 新增 Exporter Pipeline 测试套件，全量 18 项单元测试通过。

---

## [1.0.1] - 2026-09-24

### 🎨 视觉与文档 (Documentation & Visuals)
- **全新高保真实机截图**：重构并替换了 README 顶部的简易占位图，引入全新移动端实机全景裁剪视觉大图，真实展示：
  - 微信小程序深色沉浸式主题与标准胶囊导航栏；
  - 4:3 比例高分辨率风光图选区、细腻 3×3 九宫格辅助参考线与四角调整手柄；
  - 100% 对齐设计稿的精细化缩放滑动条（`–` `[slider]` `+` `⟳ 重置`）；
  - 比例、形状、几何旋转/翻转面板与底部「导出高质量裁剪图」主按钮；
  - `60 FPS` 硬件加速状态标章。
- **SEO 与社交分享优化**：在 `docs/index.html` 中补齐 Open Graph 与 Twitter Card 社交大图元数据（`og:image`、`og:title`、`twitter:card`）。
- **更新日志规范化**：建立标准 `CHANGELOG.md`，规范化版本发布跟踪。

### 🛠️ 构建与 CI/CD (Build & CI/CD)
- **跨平台构建兼容**：重构 `scripts/build.js` 中的 TypeScript 编译器解析逻辑，支持在 macOS、Linux (GitHub Actions Ubuntu 运行器) 及不同 Node 路径下自适应调用 `tsc`，修复 CI 环境下的构建报错。
- **依赖配置补全**：将 `typescript` 正式收录至 `devDependencies`，保证纯净容器环境安装与发版构建的一致性。
- **GitHub Pages 自动化**：配置并打通 GitHub Pages 官方自动化工作流（`enablement: true`），实现向主分支推送文档时自动零配置静态托管。
- **仓库元数据补全**：在 `package.json` 中补齐 `author`、`repository`、`homepage` 及 `bugs` 等标准化开源元数据字段。

---

## [1.0.0] - 2026-09-20

### 🚀 首次里程碑发布 (Initial Release)
- **⚡ 60 FPS 极速手势引擎**：
  - 小程序端采用 **WXS (WeiXin Script)** 视图层脚本直接计算并驱动底层 Transform 矩阵，彻底终结传统方案中频繁跨线程 `this.setData()` 造成的严重丢帧与手势迟滞。
  - 双指捏合缩放（Pinch-to-zoom）以两指几何中心平滑展开，支持滑动杆双向双控。
- **📦 单一包与 Subpath 导出架构**：
  - 彻底合并 monorepo 分包结构，归一为统一包名 **`omni-crop`**（无 `@` 作用域前缀）。
  - 提供现代标准 Subpath 导入：
    - `omni-crop/weixin`：微信原生小程序自定义组件（WXML + WXSS + WXS + Canvas 2D）
    - `omni-crop/taro`：Taro 3 多端组件（React / Vue）
    - `omni-crop/uni-app`：uni-app Vue 3 SFC 与 `useOmniCrop()` 组合式 Hook
    - `omni-crop/react-native`：React Native Reanimated 3 Worklet + Gesture Handler
    - `omni-crop/core`：无依赖纯数学仿射矩阵与无 DOM 状态机核心
    - `omni-crop/exporter`：独立 Canvas 2D 导出流水线与 EXIF 解析引擎
    - `omni-crop`：Web React 基础根入口
- **🎨 新版 Canvas 2D 离屏导出流水线**：
  - 基于微信新版硬件加速 Canvas 2D 接口重构，告别旧版 Canvas 接口黑屏与卡死缺陷；
  - 内置零依赖二进制 EXIF 读取器，自动纠偏相机拍摄的方向偏转（Orientation 1~8）；
  - 支持高 DPR 超采样物理级高清渲染；
  - 内置保比例下采样（Downsampling）算法（默认 `maxResolution: 4096`），彻底杜绝 iOS 显存 OOM 闪退。
- **📐 双模裁剪与几何变换**：
  - 模式 A（固定居中框，移动缩放底层图）与模式 B（底图固定，自由缩放拉伸裁剪框）；
  - 任意角度旋转与 90° 步进旋转；
  - 水平/垂直镜像翻转（Flip Horizontal / Vertical）；
  - 智能边界吸附与物理防露白算法（`restrictPosition`）。
- **📱 配套工程与在线文档**：
  - 提供开箱即用的小程序完整工程 [`examples/miniprogram-demo`](./examples/miniprogram-demo)；
  - 提供官方在线文档与免安装交互演练场 [https://agions.github.io/omni-crop/](https://agions.github.io/omni-crop/)。
