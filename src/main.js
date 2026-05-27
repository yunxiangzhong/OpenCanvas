import { slideRecommend } from './slide_recommend.js'
import {
  buildKnowledgeGraph,
  cleanQuery,
  resolvePlayableVideo,
  updateWatchProgress
} from './knowledge_graph.js'
import { createKnowledgeCanvasApp } from './knowledgeCanvasApp.js'

const app = document.querySelector('#app')
const STORAGE_KEY = 'tikcanvas.savedCanvases'
const WATCH_PROGRESS_KEY = 'tikcanvas.watchProgress'
const TAG_PREFERENCES_KEY = 'tikcanvas.tagPreferences'
const DEFAULT_CANVAS_QUERY = '帮我生成 Claude 的知识画布'
const exampleQueries = ['帮我生成 Claude 的知识画布', 'Claude API Agent 自动化', 'Codex Agent 工程协作', 'Claude 到 IoT']

const defaultTagPreferences = {
  activeTags: ['Claude', 'API', 'Agent'],
  disabledTags: [],
  customTags: []
}

const state = {
  view: 'canvas',
  canvasMode: 'landing',
  previousView: 'canvas',
  selectedVideo: slideRecommend[0],
  canvasQuery: DEFAULT_CANVAS_QUERY,
  isPlaying: false,
  hiddenVideoIds: [],
  savedCanvases: loadSavedCanvases(),
  watchProgress: loadWatchProgress(),
  tagPreferences: loadTagPreferences(),
  currentCanvas: null
}

state.currentCanvas = buildCurrentGraph({ id: 'canvas-default', save: false })

let canvasAppInstance = null

function render() {
  app.className = `app-shell view-${state.view}`
  if (state.view === 'video') {
    if (canvasAppInstance) {
      canvasAppInstance.destroy?.()
      canvasAppInstance = null
    }
    app.innerHTML = `
      <section class="phone-frame video-mode">
        ${renderVideoPage()}
      </section>
    `
    bindEvents()
    return
  }

  if (state.view === 'canvas') {
    app.innerHTML = `
      <section class="phone-frame">
        ${renderStatusBar()}
        ${renderHomeNav()}
        <main class="phone-content canvas-mode-content">
          <div class="knowledge-canvas-page is-embedded">
            <div class="knowledge-canvas-app" id="knowledgeCanvasApp"></div>
            <div class="toast" id="knowledgeCanvasToast" role="status" aria-live="polite"></div>
          </div>
        </main>
      </section>
    `
    
    const appEl = document.querySelector('#knowledgeCanvasApp')
    const phoneEl = document.querySelector('.phone-frame')
    const toastEl = document.querySelector('#knowledgeCanvasToast')
    
    if (appEl && phoneEl && toastEl) {
      if (!canvasAppInstance) {
        canvasAppInstance = createKnowledgeCanvasApp({
          app: appEl,
          phoneEl: phoneEl,
          toastEl: toastEl,
          embedded: true,
          entryVideo: state.selectedVideo ? {
            id: state.selectedVideo.id,
            title: state.selectedVideo.title,
            author: state.selectedVideo.author?.nickname || '',
            description: state.selectedVideo.desc || state.selectedVideo.summary || '',
            tags: state.selectedVideo.tags || [],
            category: state.selectedVideo.knowledge?.branch || '',
            poster: state.selectedVideo.video?.cover?.url_list?.[0] || ''
          } : null,
          onExit: () => {
            canvasAppInstance?.destroy?.()
            canvasAppInstance = null
            state.view = 'recommend'
            render()
          }
        })
      }
    }
    bindEvents()
    return
  }

  if (canvasAppInstance) {
    canvasAppInstance.destroy?.()
    canvasAppInstance = null
  }

  app.innerHTML = `
    <section class="phone-frame">
      ${renderStatusBar()}
      ${renderHomeNav()}
      <main class="phone-content">
        ${renderRecommendPage()}
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
      <button class="search-button" type="button" aria-label="搜索" data-action="focus-search"></button>
    </header>
  `
}

function renderRecommendPage() {
  const videos = getRecommendedVideos()
  return `
    <section class="recommend-preview">
      <div class="feed-summary">
        <small>根据当前画布推送</small>
        <h1>${escapeHtml(state.currentCanvas.title)}</h1>
        <p>${escapeHtml(state.currentCanvas.tags.slice(0, 4).join(' / '))}</p>
      </div>
      <div class="preview-grid">
        <div class="preview-column">
          ${videos.filter((_, index) => index % 2 === 0).map(renderRecommendCard).join('')}
        </div>
        <div class="preview-column">
          ${videos.filter((_, index) => index % 2 === 1).map(renderRecommendCard).join('')}
        </div>
      </div>
    </section>
  `
}

function renderRecommendCard(video) {
  const sourceVideo = resolvePlayableVideo(video, slideRecommend)
  const progress = getVideoProgress(video.id)
  const className = video.rank % 5 === 1 ? 'preview-card compact' : video.rank % 4 === 0 ? 'preview-card tall' : 'preview-card'
  return `
    <article class="${className}" data-video-id="${escapeAttribute(video.id)}" tabindex="0" role="button">
      <div class="poster-wrap poster-${sourceIndex(sourceVideo) + 1}">
        <video src="${escapeAttribute(sourceVideo.video.play_addr.url_list[0])}" muted playsinline preload="metadata"></video>
        <div class="poster-fallback">
          <span>${escapeHtml(video.title)}</span>
          <small>${formatDuration(video.duration)}</small>
        </div>
        <div class="metrics">
          <span>${escapeHtml(statusText(progress.status))}</span>
          <span>${formatDuration(video.duration)}</span>
        </div>
      </div>
      <div class="title">${escapeHtml(video.desc)}</div>
      <div class="meta">
        <span class="avatar">${escapeHtml(video.author.nickname.slice(0, 1))}</span>
        <span class="author">${escapeHtml(video.author.nickname)}</span>
        <span class="more">${Math.round(video.score || video.knowledge.relevanceScore)}</span>
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
        <p>TikCanvas 精选</p>
        <h1>把碎片视频整理成一张可探索的知识画布</h1>
        <span>搜索一个主题，系统会把强相关视频放在中心，把远端知识放到外圈，像 Figma 一样保存和继续探索。</span>
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
        <button class="agent-toggle active" type="button" data-action="enter-current-canvas">Canvas</button>
        <button class="start-button" type="submit">生成</button>
        <div class="query-chips">
          ${exampleQueries.map((query) => `<button type="button" data-query="${escapeAttribute(query)}">${escapeHtml(shorten(query, 15))}</button>`).join('')}
        </div>
      </form>
      <div class="canvas-home-actions">
        <button class="primary" type="button" data-action="new-canvas">重排画布</button>
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
          <p>${escapeHtml(canvas.topic)} · ${canvas.progress}% explored</p>
        </div>
        <button type="button" class="canvas-pill" data-action="save-current-canvas">保存</button>
      </div>
      <div class="canvas-workbench">
        <div class="canvas-tool-panel">
          <div>
            <small>TAG WEIGHTS</small>
            <h2>标签控制画布分布</h2>
          </div>
          <div class="tag-panel">
            ${getAvailableTags().map(renderTagChip).join('')}
          </div>
          <form class="tag-form" data-tag-form>
            <input type="text" name="tag" placeholder="新增标签" aria-label="新增标签">
            <button type="submit">+</button>
          </form>
        </div>
        <div class="canvas-board">
          <svg class="canvas-lines" viewBox="0 0 390 820" aria-hidden="true">
            ${renderCanvasLines(canvas)}
          </svg>
          <article class="canvas-center">
            <span class="center-plus">${canvas.progress}%</span>
            <h2>${escapeHtml(canvas.topic)}</h2>
            <p>${escapeHtml(canvas.description)}</p>
            <div class="center-tags">
              ${canvas.tags.slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
            </div>
          </article>
          ${canvas.branches.map(renderCanvasNode).join('')}
          ${canvas.videos.map(renderCanvasVideoChip).join('')}
        </div>
      </div>
    </section>
  `
}

function renderTagChip(tag) {
  const active = state.tagPreferences.activeTags.includes(tag)
  const disabled = state.tagPreferences.disabledTags.includes(tag)
  return `
    <span class="tag-chip ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}">
      <button type="button" data-tag-toggle="${escapeAttribute(tag)}">${escapeHtml(tag)}</button>
      <button type="button" data-tag-remove="${escapeAttribute(tag)}" aria-label="删除 ${escapeAttribute(tag)}">×</button>
    </span>
  `
}

function renderCanvasLines(canvas) {
  const center = { x: 195, y: 380 }
  const branchLines = canvas.branches.map((node) =>
    `<path d="M${center.x} ${center.y} C${center.x} ${node.y}, ${node.x} ${center.y}, ${node.x + 42} ${node.y + 32}" />`
  )
  const videoLines = canvas.videos.slice(0, 12).map((video) =>
    `<path class="${video.distanceLevel >= 3 ? 'soft-line' : ''}" d="M${center.x} ${center.y} C${center.x + (video.x - center.x) * 0.2} ${video.y}, ${video.x} ${center.y}, ${video.x + 78} ${video.y + 36}" />`
  )
  return [...branchLines, ...videoLines].join('')
}

function renderCanvasLibrary() {
  const items = state.savedCanvases.length ? state.savedCanvases : [state.currentCanvas]
  return `
    <section class="canvas-library">
      <div class="library-header">
        <button class="canvas-back-button" type="button" data-action="canvas-landing" aria-label="返回画布首页">‹</button>
        <div>
          <p>我的画布</p>
          <h1>继续上次的知识谱系</h1>
        </div>
      </div>
      <div class="library-list">
        ${items.map((canvas) => `
          <article class="library-card" data-canvas-id="${escapeAttribute(canvas.id)}" tabindex="0" role="button">
            <small>${escapeHtml(canvas.sourceLabel || '主题生成')}</small>
            <h2>${escapeHtml(canvas.title)}</h2>
            <p>已探索 ${canvas.progress || 0}% · 已看 ${canvas.watched || 0} / ${canvas.total || 0} 个视频</p>
            <div>${(canvas.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

function renderCanvasNode(node) {
  return `
    <article class="canvas-node" style="left:${node.x}px; top:${node.y}px">
      <span class="done">${escapeHtml(node.icon)}</span>
      <h3>${escapeHtml(node.name)}</h3>
      <p>${escapeHtml(node.desc)}</p>
      <div>${node.tags.map((tag) => `<small>${escapeHtml(tag)}</small>`).join('')}</div>
    </article>
  `
}

function renderCanvasVideoChip(video) {
  const sourceVideo = resolvePlayableVideo(video, slideRecommend)
  const progress = getVideoProgress(video.id)
  const progressPercent = Math.round(progress.progress * 100)
  return `
    <article
      class="canvas-video-chip distance-${video.distanceLevel}"
      style="left:${video.x}px; top:${video.y}px"
      data-open-video="${escapeAttribute(video.id)}"
      tabindex="0"
      role="button"
    >
      <button class="node-remove" type="button" data-delete-video="${escapeAttribute(video.id)}" aria-label="删除节点">×</button>
      <div class="chip-cover poster-${sourceIndex(sourceVideo) + 1}">
        <video src="${escapeAttribute(sourceVideo.video.play_addr.url_list[0])}" muted playsinline preload="metadata"></video>
        <b>${escapeHtml(video.relevanceLabel)} · ${Math.round(video.score)}</b>
      </div>
      <div class="chip-body">
        <small>${escapeHtml(video.tags.slice(0, 3).join(' / '))}</small>
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.knowledge.description)}</p>
        <div class="node-progress">
          <span style="width:${progressPercent}%"></span>
        </div>
        <code>${escapeHtml(statusText(progress.status))} · ${progressPercent}%</code>
      </div>
    </article>
  `
}

function renderVideoPage() {
  const video = state.selectedVideo || slideRecommend[0]
  const progress = getVideoProgress(video.id)
  const progressPercent = Math.round(progress.progress * 100)
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
          <span>${escapeHtml(state.currentCanvas.title)}</span>
          <b>${escapeHtml(statusText(progress.status))}</b>
        </div>
      </header>
      <button class="video-play-toggle ${state.isPlaying ? 'is-playing' : ''}" type="button" data-action="toggle-video-play" aria-label="播放或暂停">
        ${state.isPlaying ? 'Ⅱ' : '▶'}
      </button>
      <aside class="video-actions" aria-label="视频操作">
        <button type="button">♡<small>${formatNumber(video.statistics.digg_count)}</small></button>
        <button type="button">评<small>158</small></button>
        <button type="button">进<small>${progressPercent}%</small></button>
        <button type="button">图<small>画布</small></button>
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
        <div class="watch-meter"><span style="width:${progressPercent}%"></span></div>
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

  app.querySelectorAll('[data-video-id], [data-open-video]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.videoId || card.dataset.openVideo
      const video = slideRecommend.find((item) => item.id === id) || state.currentCanvas.videos.find((item) => item.id === id)
      if (!video) return
      openVideo(video, state.view)
    })
  })

  app.querySelectorAll('[data-delete-video]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      deleteVideoNode(button.dataset.deleteVideo)
    })
  })

  app.querySelectorAll('[data-canvas-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const canvas = state.savedCanvases.find((item) => item.id === card.dataset.canvasId) || state.currentCanvas
      state.canvasQuery = canvas.topic || state.canvasQuery
      state.hiddenVideoIds = canvas.hiddenVideoIds || []
      state.currentCanvas = canvas.branches && canvas.videos ? canvas : buildCurrentGraph({ id: canvas.id, createdAt: canvas.createdAt })
      state.canvasMode = 'board'
      render()
    })
  })

  app.querySelectorAll('[data-query]').forEach((button) => {
    button.addEventListener('click', () => generateCanvasFromQuery(button.dataset.query))
  })

  app.querySelectorAll('[data-tag-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleTag(button.dataset.tagToggle))
  })

  app.querySelectorAll('[data-tag-remove]').forEach((button) => {
    button.addEventListener('click', () => removeTag(button.dataset.tagRemove))
  })

  const canvasForm = app.querySelector('[data-canvas-form]')
  if (canvasForm) {
    const input = canvasForm.querySelector('input')
    input?.addEventListener('input', () => {
      state.canvasQuery = input.value
    })
    canvasForm.addEventListener('submit', (event) => {
      event.preventDefault()
      generateCanvasFromQuery(input?.value || state.canvasQuery)
    })
  }

  const tagForm = app.querySelector('[data-tag-form]')
  if (tagForm) {
    tagForm.addEventListener('submit', (event) => {
      event.preventDefault()
      const value = new FormData(tagForm).get('tag')
      addTag(value)
    })
  }

  const player = app.querySelector('.detail-video')
  if (player) {
    player.addEventListener('play', () => setVideoPlaying(true))
    player.addEventListener('pause', () => setVideoPlaying(false))
    player.addEventListener('ended', () => recordVideoProgress(1))
    player.addEventListener('timeupdate', () => {
      if (!Number.isFinite(player.duration) || player.duration <= 0) return
      recordVideoProgress(player.currentTime / player.duration)
    })
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
    refreshCurrentGraph()
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
    const videos = getRecommendedVideos()
    const index = videos.findIndex((item) => item.id === state.selectedVideo?.id)
    const next = videos[(index + 1 + videos.length) % videos.length] || videos[0]
    openVideo(next, 'video')
    return
  }
  if (action === 'toggle-video-play') {
    const player = app.querySelector('.detail-video')
    if (player) togglePlayer(player)
    return
  }
  if (action === 'enter-current-canvas') {
    state.canvasMode = 'board'
    render()
    return
  }
  if (action === 'new-canvas') {
    generateCanvasFromQuery(state.canvasQuery)
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
    return
  }
  if (action === 'focus-search') {
    state.view = 'canvas'
    state.canvasMode = 'landing'
    render()
    app.querySelector('[data-canvas-form] input')?.focus()
  }
}

function generateCanvasFromQuery(rawQuery) {
  state.canvasQuery = normalizeQuery(rawQuery)
  state.hiddenVideoIds = []
  state.currentCanvas = buildCurrentGraph()
  saveCanvas(state.currentCanvas)
  state.canvasMode = 'board'
  state.view = 'canvas'
  render()
}

function generateCanvasFromVideo(video) {
  const selected = video || slideRecommend[0]
  state.selectedVideo = selected
  state.canvasQuery = `${selected.title} 学习路线`
  ensureTags(selected.tags.slice(0, 2))
  state.hiddenVideoIds = []
  state.currentCanvas = buildCurrentGraph({ sourceLabel: '从视频生成' })
  saveCanvas(state.currentCanvas)
  state.canvasMode = 'board'
}

function buildCurrentGraph(options = {}) {
  return buildKnowledgeGraph(
    state.canvasQuery,
    {
      ...state.tagPreferences,
      ...options,
      hiddenVideoIds: state.hiddenVideoIds,
      watchProgress: state.watchProgress
    },
    slideRecommend
  )
}

function refreshCurrentGraph() {
  const createdAt = state.currentCanvas?.createdAt
  state.currentCanvas = buildCurrentGraph({ id: state.currentCanvas?.id, createdAt })
}

function getRecommendedVideos() {
  const ids = new Set(state.currentCanvas.videos.map((video) => video.id))
  const rest = slideRecommend.filter((video) => !ids.has(video.id))
  return [...state.currentCanvas.videos, ...rest.map((video, index) => ({ ...video, rank: state.currentCanvas.videos.length + index + 1 }))]
}

function getAvailableTags() {
  const tags = [
    ...state.tagPreferences.customTags,
    ...state.tagPreferences.activeTags,
    ...state.currentCanvas.tags,
    ...slideRecommend.flatMap((video) => video.tags)
  ]
  return [...new Set(tags)].slice(0, 22)
}

function toggleTag(tag) {
  if (!tag) return
  const active = new Set(state.tagPreferences.activeTags)
  const disabled = new Set(state.tagPreferences.disabledTags)
  if (active.has(tag)) {
    active.delete(tag)
    disabled.add(tag)
  } else {
    disabled.delete(tag)
    active.add(tag)
  }
  state.tagPreferences.activeTags = [...active]
  state.tagPreferences.disabledTags = [...disabled]
  persistTagPreferences()
  refreshCurrentGraph()
  render()
}

function addTag(value) {
  const tag = String(value || '').trim()
  if (!tag) return
  state.tagPreferences.customTags = [...new Set([tag, ...state.tagPreferences.customTags])].slice(0, 8)
  ensureTags([tag])
  persistTagPreferences()
  refreshCurrentGraph()
  render()
}

function removeTag(tag) {
  if (!tag) return
  state.tagPreferences.activeTags = state.tagPreferences.activeTags.filter((item) => item !== tag)
  state.tagPreferences.customTags = state.tagPreferences.customTags.filter((item) => item !== tag)
  state.tagPreferences.disabledTags = [...new Set([tag, ...state.tagPreferences.disabledTags])]
  persistTagPreferences()
  refreshCurrentGraph()
  render()
}

function ensureTags(tags) {
  const active = new Set(state.tagPreferences.activeTags)
  tags.filter(Boolean).forEach((tag) => active.add(tag))
  state.tagPreferences.activeTags = [...active]
  state.tagPreferences.disabledTags = state.tagPreferences.disabledTags.filter((tag) => !active.has(tag))
  persistTagPreferences()
}

function deleteVideoNode(videoId) {
  state.hiddenVideoIds = [...new Set([videoId, ...state.hiddenVideoIds])]
  refreshCurrentGraph()
  render()
}

function openVideo(video, sourceView) {
  const playable = resolvePlayableVideo(video, slideRecommend)
  state.selectedVideo = playable
  state.previousView = sourceView === 'video' ? state.previousView : sourceView
  state.view = 'video'
  state.isPlaying = false
  render()
}

function recordVideoProgress(progress) {
  if (!state.selectedVideo?.id) return
  state.watchProgress = updateWatchProgress(state.watchProgress, state.selectedVideo.id, progress)
  saveWatchProgress()
}

function saveCanvas(canvas) {
  const next = [canvas, ...state.savedCanvases.filter((item) => item.id !== canvas.id)].slice(0, 8)
  state.savedCanvases = next
  setStorage(STORAGE_KEY, next)
}

function loadSavedCanvases() {
  const parsed = getStorage(STORAGE_KEY, [])
  return Array.isArray(parsed) ? parsed : []
}

function saveWatchProgress() {
  setStorage(WATCH_PROGRESS_KEY, state.watchProgress)
}

function loadWatchProgress() {
  const parsed = getStorage(WATCH_PROGRESS_KEY, {})
  return parsed && typeof parsed === 'object' ? parsed : {}
}

function persistTagPreferences() {
  setStorage(TAG_PREFERENCES_KEY, state.tagPreferences)
}

function loadTagPreferences() {
  const parsed = getStorage(TAG_PREFERENCES_KEY, defaultTagPreferences)
  return {
    activeTags: Array.isArray(parsed.activeTags) ? parsed.activeTags : defaultTagPreferences.activeTags,
    disabledTags: Array.isArray(parsed.disabledTags) ? parsed.disabledTags : [],
    customTags: Array.isArray(parsed.customTags) ? parsed.customTags : []
  }
}

function getStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function setStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can be unavailable in some embedded previews.
  }
}

function getVideoProgress(videoId) {
  return state.watchProgress[videoId] || { progress: 0, status: 'unseen' }
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

function sourceIndex(video) {
  return Math.max(0, slideRecommend.findIndex((item) => item.id === (video?.playableSourceId || video?.id))) % 3
}

function normalizeQuery(value) {
  const query = String(value || '').trim()
  return query || DEFAULT_CANVAS_QUERY
}

function shorten(value, maxLength) {
  const text = String(value)
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function statusText(status) {
  if (status === 'watched') return '已看'
  if (status === 'watching') return '观看中'
  return '未看'
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

window.__tikcanvasVideos = slideRecommend
cleanQuery(DEFAULT_CANVAS_QUERY)
render()
