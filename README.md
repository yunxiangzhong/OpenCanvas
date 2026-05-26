# TikCanvas Static Demo

轻量静态 demo：推荐双列首页 + 黑松客精选画布。

## 文件

- `index.html`：唯一入口。
- `src/main.js`：推荐页和画布页交互。
- `src/styles.css`：移动端静态样式。
- `src/slide_recommend.js`：3 条视频占位数据。
- `videos/`：放置 `video-1.mp4`、`video-2.mp4`、`video-3.mp4`。

## 本地预览

```bash
npm run dev
```

默认地址是 `http://127.0.0.1:4173`。也可以用任意静态服务打开当前目录。

## 部署

这是纯静态站点，可直接部署到 Vercel。无需后端接口，也无需构建步骤。
