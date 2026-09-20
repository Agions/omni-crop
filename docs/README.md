# OmniCrop 在线文档与交互演练场 (Docs & Live Studio)

本目录为 **OmniCrop** 的官方技术文档与免安装在线演练场页面。

---

## 🌟 在线访问
当本项目推送到 GitHub 后，GitHub Actions 会自动通过 `.github/workflows/deploy-pages.yml` 将当前目录部署至 GitHub Pages，网址格式通常为：
```
https://<your-username>.github.io/omni-crop/
```

---

## 💻 本地预览

无需安装任何打包工具，直接在浏览器中打开 `index.html` 即可：

### 方法 1：使用任意静态文件服务器（推荐）
```bash
# 使用 npx serve
npx serve docs

# 或使用 python3
python3 -m http.server 8080 -d docs
```
在浏览器打开 `http://localhost:8080` 即可实时体验完整的交互演练场（支持拖拽、双指捏合缩放、滑块精细控制、真实 Canvas 2D 导出与图片下载）。

### 方法 2：直接双击打开
直接双击打开 `docs/index.html` 即可离线浏览所有文档、API 字典及演练场。
