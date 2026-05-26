import { slideRecommend } from './slide_recommend.js'

const app = document.querySelector('#app')
const STORAGE_KEY = 'tikcanvas.savedCanvases'
const DEFAULT_CANVAS_QUERY = 'Codex 学习路线图'
const exampleQueries = ['帮我整理 Codex 的学习路线图', '帮我生成 Claude 的知识画布']

const state = {
  view: 'canvas',
  canvasMode: 'landing',
  previousView: 'canvas',
  selectedVideo: slideRecommend[0],
  canvasQuery: DEFAULT_CANVAS_QUERY,
  agentEnabled: true,
  isPlaying: false,
  savedCanvases: loadSavedCanvases(),
  currentCanvas: buildCanvasFromTopic(DEFAULT_CANVAS_QUERY, { id: 'canvas-default', save: false })
}

function render() {
  app.className = `app-shell view-${state.view}`
  if (state.view === 'video') {
    app.innerHTML = `
      <section class="phone-frame video-mode">
        ${renderVideoPage()}
      </section>
    `
    bindEvents()
    return
  }

  app.innerHTML = `
    <section class="phone-frame">
      ${renderStatusBar()}
      ${renderHomeNav()}
      <main class="phone-content">
        ${state.view === 'canvas' ? renderCanvasPage() : renderRecommendPage()}
      </main>
    </section>
  `
  bindEvents()
}

function renderStatusBar() {
  return `
    <div class="status-bar">
      <strong>15:42</strong>
      <div class="status-icons" aria-hidden="true">
        <span class="signal"></span>
        <span>5G</span>
        <span class="battery">5</span>
      </div>
    </div>
  `
}

function renderHomeNav() {
  return `
    <header class="home-nav">
      <button class="icon-button" type="button" aria-label="菜单">
        <span></span><span></span><span></span>
      </button>
      <nav class="home-tabs" aria-label="首页频道">
        <button class="${state.view === 'recommend' ? 'active' : ''}" type="button" data-view="recommend">热门</button>
        <button class="${state.view === 'canvas' ? 'active' : ''}" type="button" data-view="canvas">知识画布</button>
      </nav>
      <button class="search-button" type="button" aria-label="搜索"></button>
    </header>
  `
}

function renderRecommendPage() {
  return `
    <section class="recommend-preview">
      <div class="preview-grid">
        <div class="preview-column">
          ${slideRecommend.filter((_, index) => index % 2 === 0).map(renderRecommendCard).join('')}
        </div>
        <div class="preview-column">
          ${slideRecommend.filter((_, index) => index % 2 === 1).map(renderRecommendCard).join('')}
        </div>
      </div>
    </section>
  `
}

function renderRecommendCard(video) {
  const originalIndex = slideRecommend.findIndex((item) => item.id === video.id)
  const className = originalIndex % 5 === 1 ? 'preview-card tall' : originalIndex % 5 === 0 ? 'preview-card compact' : 'preview-card'
  return `
    <article class="${className}" data-video-id="${escapeAttribute(video.id)}" tabindex="0" role="button">
      <div class="poster-wrap poster-${originalIndex + 1}">
        <div class="poster-fallback">
          <span>${escapeHtml(video.title)}</span>
          <small>${formatDuration(video.duration)}</small>
        </div>
        <div class="metrics">
          <span>♡ ${formatNumber(video.statistics.digg_count)}</span>
          <span>${formatDuration(video.duration)}</span>
        </div>
      </div>
      <div class="title">${escapeHtml(video.desc)}</div>
      <div class="meta">
        <span class="avatar">${escapeHtml(video.author.nickname.slice(0, 1))}</span>
        <span class="author">${escapeHtml(video.author.nickname)}</span>
        <span class="more">···</span>
      </div>
    </article>
  `
}

function renderCanvasPage() {
  if (state.canvasMode === 'board') return renderCanvasBoard()
  if (state.canvasMode === 'library') return renderCanvasLibrary()
  return renderCanvasLanding()
}

function renderCanvasLanding() {
  const canvas = state.currentCanvas
  return `
    <section class="canvas-home">
      <div class="canvas-hero">
        <p>精选知识画布</p>
        <h1>把碎片视频整理成一张可探索的学习画布</h1>
        <span>从搜索主题或当前视频开始，AI 生成组件节点，再把视频挂到对应分支。</span>
      </div>
      <article class="current-canvas-card">
        <div>
          <small>当前画布</small>
          <h2>${escapeHtml(canvas.title)}</h2>
          <p>已探索 ${canvas.progress}% · 已看 ${canvas.watched} / ${canvas.total} 个视频</p>
        </div>
        <button type="button" data-action="enter-current-canvas">进入</button>
        <div class="canvas-skeleton" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
      </article>
      <form class="canvas-compose-card" data-canvas-form>
        <label class="canvas-input-wrap">
          <span class="input-mark" aria-hidden="true"></span>
          <input type="text" value="${escapeAttribute(state.canvasQuery)}" placeholder="你想整理什么主题" aria-label="你想整理什么主题">
        </label>
        <button class="agent-toggle ${state.agentEnabled ? 'active' : ''}" type="button" data-action="toggle-agent">Agent</button>
        <button class="start-button" type="submit">开始</button>
        <div class="query-chips">
          ${exampleQueries.map((query) => `<button type="button" data-query="${escapeAttribute(query)}">${escapeHtml(shorten(query, 14))}</button>`).join('')}
        </div>
      </form>
      <div class="canvas-home-actions">
        <button class="primary" type="button" data-action="new-canvas">生成新画布</button>
        <button type="button" data-action="show-library">我的画布</button>
        <button type="button" data-action="canvas-from-video">从视频进入</button>
      </div>
    </section>
  `
}

function renderCanvasBoard() {
  const canvas = state.currentCanvas
  return `
    <section class="knowledge-canvas-page">
      <div class="canvas-toolbar">
        <button class="canvas-back-button" type="button" data-action="canvas-landing" aria-label="返回画布首页">‹</button>
        <div>
          <h1>${escapeHtml(canvas.title)}</h1>
          <p>已探索 ${canvas.progress}% · 已看 ${canvas.watched} / ${canvas.total} 个视频</p>
        </div>
        <button type="button" class="canvas-pill" data-action="save-current-canvas">保存</button>
      </div>
      <div class="canvas-board">
        <svg class="canvas-lines" viewBox="0 0 360 610" aria-hidden="true">
          <path d="M180 302 C128 248 85 196 72 134" />
          <path d="M180 302 C226 236 266 176 295 146" />
          <path d="M180 302 C126 370 92 448 78 516" />
          <path d="M180 302 C230 358 276 432 288 516" />
          <path class="soft-line" d="M180 302 C164 396 170 492 188 566" />
        </svg>
        <article class="canvas-center">
          <span class="center-plus">✦</span>
          <h2>${escapeHtml(canvas.topic)}</h2>
          <p>${escapeHtml(canvas.description)}</p>
          <div class="center-tags">
            ${canvas.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </article>
        ${canvas.components.map(renderCanvasNode).join('')}
        ${canvas.videos.map(renderCanvasVideoChip).join('')}
      </div>
    </section>
  `
}

function renderCanvasLibrary() {
  const items = state.savedCanvases.length ? state.savedCanvases : [state.currentCanvas]
  return `
    <section class="canvas-library">
      <div class="library-header">
        <button class="canvas-back-button" type="button" data-action="canvas-landing" aria-label="返回画布首页">‹</button>
        <div>
          <p>我的画布</p>
          <h1>继续上次的学习路线</h1>
        </div>
      </div>
      <div class="library-list">
        ${items.map((canvas) => `
          <article class="library-card" data-canvas-id="${escapeAttribute(canvas.id)}" tabindex="0" role="button">
            <small>${escapeHtml(canvas.sourceLabel)}</small>
            <h2>${escapeHtml(canvas.title)}</h2>
            <p>已探索 ${canvas.progress}% · 已看 ${canvas.watched} / ${canvas.total} 个视频</p>
            <div>${canvas.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

function renderCanvasNode(node, index) {
  return `
    <article class="canvas-node node-${index + 1}" style="left:${node.x}px; top:${node.y}px">
      <span class="done">${escapeHtml(node.icon)}</span>
      <h3>${escapeHtml(node.name)}</h3>
      <p>${escapeHtml(node.desc)}</p>
      <div>${node.tags.map((tag) => `<small>${escapeHtml(tag)}</small>`).join('')}</div>
    </article>
  `
}

function renderCanvasVideoChip(video, index) {
  const positionClass = `canvas-video-chip chip-${index + 1}`
  return `
    <article class="${positionClass}" data-open-video="${escapeAttribute(video.id)}" tabindex="0" role="button">
      <div class="chip-cover poster-${index + 1}">
        <video src="${escapeAttribute(video.video.play_addr.url_list[0])}" muted playsinline preload="metadata"></video>
        <b>${formatDuration(video.duration)}</b>
      </div>
      <div>
        <small>${escapeHtml(video.tags.slice(0, 2).join(' / '))}</small>
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.summary)}</p>
        <code>${escapeHtml(video.video.play_addr.url_list[0])}</code>
      </div>
    </article>
  `
}

function renderVideoPage() {
  const video = state.selectedVideo || slideRecommend[0]
  return `
    <section class="video-detail-page">
      <video
        class="detail-video"
        src="${escapeAttribute(video.video.play_addr.url_list[0])}"
        preload="metadata"
        playsinline
        webkit-playsinline
        controls
      ></video>
      <div class="video-gradient"></div>
      <header class="video-topbar">
        <button class="video-back" type="button" data-action="back-from-video" aria-label="返回">‹</button>
        <div class="video-search">
          <span>搜你想看的</span>
          <b>搜索</b>
        </div>
      </header>
      <button class="video-play-toggle ${state.isPlaying ? 'is-playing' : ''}" type="button" data-action="toggle-video-play" aria-label="播放或暂停">
        ${state.isPlaying ? 'Ⅱ' : '▶'}
      </button>
      <aside class="video-actions" aria-label="视频操作">
        <button type="button">♡<small>${formatNumber(video.statistics.digg_count)}</small></button>
        <button type="button">评<small>158</small></button>
        <button type="button">藏<small>收藏</small></button>
        <button type="button">享<small>分享</small></button>
      </aside>
      <section class="video-info-panel">
        <div class="creator-row">
          <span class="avatar">${escapeHtml(video.author.nickname.slice(0, 1))}</span>
          <strong>@${escapeHtml(video.author.nickname.replaceAll(' ', '_'))}</strong>
          <button type="button">关注</button>
        </div>
        <h1>${escapeHtml(video.desc)}</h1>
        <p>${escapeHtml(video.summary)}</p>
        <div class="video-tags">${video.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="video-path">${escapeHtml(video.video.play_addr.url_list[0])}</div>
        <div class="video-page-actions">
          <button class="light-action" type="button" data-action="next-video">继续下一个</button>
          <button class="canvas-action" type="button" data-action="open-canvas-from-video">进入知识画布</button>
        </div>
      </section>
    </section>
  `
}

function bindEvents() {
  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view
      render()
    })
  })
  app.querySelectorAll('[data-video-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const video = slideRecommend.find((item) => item.id === card.dataset.videoId)
      if (!video) return
      openVideo(video, 'recommend')
    })
  })
  app.querySelectorAll('[data-open-video]').forEach((card) => {
    card.addEventListener('click', () => {
      const video = slideRecommend.find((item) => item.id === card.dataset.openVideo)
      if (!video) return
      openVideo(video, 'canvas')
    })
  })
  app.querySelectorAll('[data-canvas-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const canvas = state.savedCanvases.find((item) => item.id === card.dataset.canvasId) || state.currentCanvas
      state.currentCanvas = canvas
      state.canvasMode = 'board'
      render()
    })
  })
  app.querySelectorAll('[data-query]').forEach((button) => {
    button.addEventListener('click', () => {
      state.canvasQuery = button.dataset.query
      generateCanvasFromQuery(state.canvasQuery)
    })
  })
  const form = app.querySelector('[data-canvas-form]')
  if (form) {
    const input = form.querySelector('input')
    input?.addEventListener('input', () => {
      state.canvasQuery = input.value
    })
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      generateCanvasFromQuery(input?.value || state.canvasQuery)
    })
  }
  const player = app.querySelector('.detail-video')
  if (player) {
    player.addEventListener('play', () => setVideoPlaying(true))
    player.addEventListener('pause', () => setVideoPlaying(false))
    player.addEventListener('ended', () => setVideoPlaying(false))
    player.addEventListener('click', (event) => {
      event.preventDefault()
      togglePlayer(player)
    })
  }
  app.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action))
  })
}

function handleAction(action) {
  if (action === 'back-from-video') {
    state.view = state.previousView || 'canvas'
    state.isPlaying = false
    render()
    return
  }
  if (action === 'open-canvas-from-video') {
    generateCanvasFromVideo(state.selectedVideo || slideRecommend[0])
    state.previousView = 'canvas'
    state.view = 'canvas'
    state.isPlaying = false
    render()
    return
  }
  if (action === 'next-video') {
    const index = slideRecommend.findIndex((item) => item.id === state.selectedVideo?.id)
    const next = slideRecommend[(index + 1 + slideRecommend.length) % slideRecommend.length]
    openVideo(next, 'video')
    return
  }
  if (action === 'toggle-video-play') {
    const player = app.querySelector('.detail-video')
    if (player) togglePlayer(player)
    return
  }
  if (action === 'toggle-agent') {
    state.agentEnabled = !state.agentEnabled
    render()
    return
  }
  if (action === 'enter-current-canvas') {
    state.canvasMode = 'board'
    render()
    return
  }
  if (action === 'new-canvas') {
    generateCanvasFromQuery(DEFAULT_CANVAS_QUERY)
    return
  }
  if (action === 'canvas-from-video') {
    generateCanvasFromVideo(state.selectedVideo || slideRecommend[0])
    render()
    return
  }
  if (action === 'show-library') {
    state.canvasMode = 'library'
    render()
    return
  }
  if (action === 'canvas-landing') {
    state.canvasMode = 'landing'
    render()
    return
  }
  if (action === 'save-current-canvas') {
    saveCanvas(state.currentCanvas)
    state.canvasMode = 'library'
    render()
  }
}

function generateCanvasFromQuery(rawQuery) {
  const query = normalizeQuery(rawQuery)
  state.canvasQuery = query
  state.currentCanvas = buildCanvasFromTopic(query, { agentEnabled: state.agentEnabled })
  saveCanvas(state.currentCanvas)
  state.canvasMode = 'board'
  state.view = 'canvas'
  render()
}

function generateCanvasFromVideo(video) {
  const selected = video || slideRecommend[0]
  state.selectedVideo = selected
  state.canvasQuery = selected.title
  state.currentCanvas = buildCanvasFromTopic(`${selected.title} 学习路线`, {
    sourceVideo: selected,
    agentEnabled: state.agentEnabled,
    sourceLabel: '从视频生成'
  })
  saveCanvas(state.currentCanvas)
  state.canvasMode = 'board'
}

function buildCanvasFromTopic(rawTopic, options = {}) {
  const topic = normalizeQuery(rawTopic)
  const sourceVideo = options.sourceVideo || pickVideoForTopic(topic)
  const orderedVideos = orderVideos(sourceVideo)
  const title = topic.includes('路线') || topic.includes('画布') ? topic : `${topic} 知识画布`
  const agentEnabled = options.agentEnabled ?? true
  const baseTags = unique([
    ...sourceVideo.tags.slice(0, 2),
    topic.includes('Codex') ? 'Codex' : '学习路线',
    agentEnabled ? 'Agent' : '手动整理'
  ]).slice(0, 3)

  return {
    id: options.id || `canvas-${Date.now()}`,
    title,
    topic: topic.replace(/^帮我(整理|生成)\s*/, ''),
    sourceLabel: options.sourceLabel || '主题生成',
    description: `围绕 ${topic} 拆出概念、工具、流程和延伸观看路径。`,
    progress: options.progress || 5,
    watched: options.watched || Math.min(2, orderedVideos.length),
    total: options.total || 40,
    tags: baseTags,
    videos: orderedVideos,
    createdAt: options.createdAt || new Date().toISOString(),
    components: buildCanvasComponents(topic, orderedVideos)
  }
}

function buildCanvasComponents(topic, videos) {
  const cleanTopic = topic.replace(/^帮我(整理|生成)\s*/, '').replace(/的知识画布$/, '')
  const nodes = [
    {
      id: 'core',
      name: '核心概念',
      desc: `先把 ${cleanTopic} 的定义、边界和使用场景讲清楚。`,
      tags: ['入门', videos[0].tags[0]],
      icon: '✓',
      x: 18,
      y: 92
    },
    {
      id: 'tooling',
      name: '工具接入',
      desc: '整理 API、Agent、上下文和工具调用的关键连接点。',
      tags: ['API', 'Agent'],
      icon: '+',
      x: 230,
      y: 116
    },
    {
      id: 'workflow',
      name: '工作流复用',
      desc: '把视频里的方法沉淀到资料整理、写作和研发流程。',
      tags: ['自动化', '流程'],
      icon: '▶',
      x: 30,
      y: 414
    },
    {
      id: 'extend',
      name: '对比延伸',
      desc: '用相邻视频补齐差异、适用任务和后续观看顺序。',
      tags: ['对比', videos[2].tags[0]],
      icon: '◇',
      x: 228,
      y: 438
    }
  ]

  return nodes.map((node, index) => ({
    ...node,
    videoId: videos[index % videos.length].id
  }))
}

function pickVideoForTopic(topic) {
  const normalized = topic.toLowerCase()
  return slideRecommend.find((video) => {
    const haystack = [video.title, video.desc, video.summary, ...video.tags].join(' ').toLowerCase()
    return haystack.includes(normalized) || video.tags.some((tag) => normalized.includes(tag.toLowerCase()))
  }) || slideRecommend[0]
}

function orderVideos(firstVideo) {
  const first = firstVideo || slideRecommend[0]
  return [first, ...slideRecommend.filter((video) => video.id !== first.id)]
}

function openVideo(video, sourceView) {
  state.selectedVideo = video
  state.previousView = sourceView === 'video' ? state.previousView : sourceView
  state.view = 'video'
  state.isPlaying = false
  render()
}

function saveCanvas(canvas) {
  const next = [canvas, ...state.savedCanvases.filter((item) => item.id !== canvas.id)].slice(0, 6)
  state.savedCanvases = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage can be unavailable in some embedded previews.
  }
}

function loadSavedCanvases() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function togglePlayer(player) {
  if (player.paused) {
    player.play().catch(() => setVideoPlaying(false))
  } else {
    player.pause()
  }
}

function setVideoPlaying(isPlaying) {
  state.isPlaying = isPlaying
  const button = app.querySelector('.video-play-toggle')
  if (!button) return
  button.classList.toggle('is-playing', isPlaying)
  button.textContent = isPlaying ? 'Ⅱ' : '▶'
}

function normalizeQuery(value) {
  const query = String(value || '').trim()
  return query || DEFAULT_CANVAS_QUERY
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function shorten(value, maxLength) {
  const text = String(value)
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function formatNumber(value) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return String(value)
}

function formatDuration(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0) / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;')
}

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return
  const activeCard = document.activeElement?.closest?.('[data-video-id], [data-open-video], [data-canvas-id]')
  if (activeCard) activeCard.click()
})

render()
