# TikCanvas Static Demo

轻量静态 demo：把“抖音精选”的视频观看方式，升级成可保存、可编辑、可重排的知识画布。

## 当前 MVP

- 默认进入 `知识画布`，用户可以输入主题生成一张画布。
- 画布会按相关性距离组织视频：中心是强相关内容，外圈是远端延伸内容。
- 标签会影响画布分布：可新增、启用/禁用、删除标签，节点会即时重排。
- 每个视频节点有标题、描述、标签、相关性、观看状态和进度条。
- 点击视频节点进入传统沉浸播放页；播放进度会写回画布。
- `我的画布`、标签偏好和观看进度都保存在浏览器 `localStorage`。

## 文件

- `index.html`：唯一入口。
- `src/main.js`：页面渲染、交互、localStorage 状态和视频播放页。
- `src/knowledge_graph.js`：知识图谱生成、标签评分、布局和观看进度纯函数。
- `src/slide_recommend.js`：15 条演示视频元数据，其中 3 条是真实 mp4 播放源。
- `src/styles.css`：移动端、Figma 工具感画布和沉浸播放页样式。
- `tests/knowledge_graph.test.js`：图谱排序、标签影响、播放源映射和进度状态测试。
- `videos/`：当前接入 `video-1.mp4`、`video-2.mp4`、`video-3.mp4`。
- `covers/`：可选放置 `cover-1.jpg`、`cover-2.jpg`、`cover-3.jpg`。

## 本地预览

```bash
npm run dev
```

默认地址是 `http://127.0.0.1:4173`。如果端口被占用，可以指定：

```bash
$env:PORT=4174; npm run dev
```

## 验证

```bash
npm run check
```

`check` 会做 JS 语法检查，并运行 Node 内置测试。

## 数据限制

这是纯静态 MVP，不接真实 AI、不接后端检索。新增的模拟视频会复用 3 个真实 mp4 播放源，但保留各自的知识标签、描述、相关性和进度状态。

## 部署

这是纯静态站点，可直接部署到 Vercel。无需后端接口，也无需构建步骤。
