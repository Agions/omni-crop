# 更新日志 (Changelog)

本项目遵循 [Semantic Versioning (语义化版本 2.0.0)](https://semver.org/lang/zh-CN/) 规范。

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
