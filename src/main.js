import { slideRecommend } from './slide_recommend.js'

const app = document.querySelector('#app')
const canvasNodes = [
  {
    title: '核心观点',
    text: '提炼这条视频最值得记住的一句话。'
  },
  {
    title: '背景线索',
    text: '补齐用户理解主题需要的前置信息。'
  },
  {
    title: '关键人物',
    text: '标记视频里出现的人物、机构或关系。'
  },
  {
    title: '延伸观看',
    text: '引导用户继续看下一条相关视频。'
  }
]

let selectedVideo = null

function renderRecommend() {
  selectedVideo = null
  app.className = 'app-shell is-home'
  app.innerHTML = `
    <section class="hero-panel">
      <div>
        <p class="eyebrow">TikCanvas demo</p>
        <h1>黑松客精选画布 Demo</h1>
        <p class="hero-copy">三条精选视频，一个轻量知识画布入口。</p>
      </div>
      <div class="hero-mark" aria-hidden="true">画布</div>
    </section>

    <section class="slide-recommend" aria-label="推荐视频">
      <div class="section-head">
        <h2>推荐</h2>
        <span>双列精选</span>
      </div>
      <div class="recommend-grid">
        ${slideRecommend.map(renderRecommendCard).join('')}
      </div>
    </section>
  `

  app.querySelectorAll('[data-video-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const nextVideo = slideRecommend.find((item) => item.id === card.dataset.videoId)
      if (nextVideo) renderCanvas(nextVideo)
    })
  })
}

function renderRecommendCard(video, index) {
  const coverClass = video.cover ? '' : `is-placeholder cover-${index + 1}`
  const coverContent = video.cover
    ? `<img src="${escapeAttribute(video.cover)}" alt="${escapeAttribute(video.title)} 封面" />`
    : `<span>${String(index + 1).padStart(2, '0')}</span>`

  return `
    <article class="recommend-card ${index === 1 ? 'is-tall' : ''}" data-video-id="${escapeAttribute(video.id)}" tabindex="0" role="button">
      <div class="poster ${coverClass}">
        ${coverContent}
      </div>
      <div class="card-body">
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.summary)}</p>
        <div class="tag-row">
          ${video.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="card-foot">
          <span>${escapeHtml(video.author)}</span>
          <strong>进入画布</strong>
        </div>
      </div>
    </article>
  `
}

function renderCanvas(video) {
  selectedVideo = video
  app.className = 'app-shell is-canvas'
  app.innerHTML = `
    <section class="canvas-view">
      <header class="canvas-header">
        <button class="back-button" type="button" data-action="back" aria-label="返回推荐">←</button>
        <div>
          <p class="eyebrow">Knowledge canvas</p>
          <h1>${escapeHtml(video.title)}</h1>
        </div>
      </header>

      <div class="canvas-stage">
        <article class="video-node main-node">
          <span class="node-label">当前视频</span>
          <h2>${escapeHtml(video.title)}</h2>
          <p>${escapeHtml(video.summary)}</p>
          <div class="tag-row is-center">
            ${video.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </article>
        ${canvasNodes.map((node, index) => renderCanvasNode(node, index)).join('')}
      </div>

      <footer class="video-slot">
        <span>视频坑位</span>
        <code>${escapeHtml(video.video)}</code>
      </footer>
    </section>
  `

  app.querySelector('[data-action="back"]').addEventListener('click', renderRecommend)
}

function renderCanvasNode(node, index) {
  return `
    <article class="canvas-node node-${index + 1}">
      <span class="node-dot"></span>
      <h3>${escapeHtml(node.title)}</h3>
      <p>${escapeHtml(node.text)}</p>
    </article>
  `
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
  if (event.key === 'Escape' && selectedVideo) renderRecommend()
  if (event.key === 'Enter') {
    const activeCard = document.activeElement?.closest?.('[data-video-id]')
    if (activeCard) activeCard.click()
  }
})

renderRecommend()
