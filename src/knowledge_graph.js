import { slideRecommend } from './slide_recommend.js'

const STOP_WORDS = ['帮我', '生成', '整理', '知识画布', '学习路线图', '学习路线', '的', '和', '到']

const BRANCH_META = {
  核心理解: { icon: '01', desc: '定义、边界、概念和入门观看路径。' },
  工具接入: { icon: '02', desc: 'API、工具调用、上下文和系统集成。' },
  'Agent 机制': { icon: '03', desc: '记忆、任务拆解、自动行动和可靠性。' },
  工作流复用: { icon: '04', desc: '把知识转成可复用流程和日常生产力。' },
  工程协作: { icon: '05', desc: '面向研发、验证和项目协作的 AI 使用方式。' },
  知识库: { icon: '06', desc: '检索、RAG 和长期知识沉淀。' },
  模型选择: { icon: '07', desc: '不同模型在成本、上下文和能力上的分工。' },
  可靠性: { icon: '08', desc: '评测、回归和可信输出。' },
  产品方法: { icon: '09', desc: '从意图、标签和图谱视角理解产品。' },
  工具生态: { icon: '10', desc: 'Webhook、脚本、自动化平台与外部工具。' },
  远端延伸: { icon: '11', desc: '离中心主题更远，但能打开新方向。' },
  治理边界: { icon: '12', desc: '安全、权限、隐私和使用边界。' }
}

const BRANCH_LAYOUT = [
  { x: 66, y: 132 },
  { x: 258, y: 128 },
  { x: 45, y: 314 },
  { x: 260, y: 322 },
  { x: 96, y: 496 },
  { x: 242, y: 518 }
]

const VIDEO_LAYOUT = [
  { x: 38, y: 218 },
  { x: 210, y: 216 },
  { x: 18, y: 396 },
  { x: 212, y: 414 },
  { x: 104, y: 586 },
  { x: 184, y: 646 },
  { x: 26, y: 646 },
  { x: 228, y: 570 },
  { x: 118, y: 58 },
  { x: 170, y: 746 }
]

export function buildKnowledgeGraph(query, preferences = {}, videos = []) {
  const allVideos = videos.length ? videos : getGlobalVideos()
  const activeTags = normalizeTags(preferences.activeTags)
  const disabledTags = normalizeTags(preferences.disabledTags)
  const customTags = normalizeTags(preferences.customTags)
  const hiddenVideoIds = new Set(preferences.hiddenVideoIds || [])
  const watchProgress = preferences.watchProgress || {}
  const scoredVideos = allVideos
    .filter((video) => !hiddenVideoIds.has(video.id))
    .map((video) => scoreVideoForQuery(video, query, activeTags, disabledTags, watchProgress))
    .sort((a, b) => b.score - a.score || a.knowledge.distanceLevel - b.knowledge.distanceLevel)
    .slice(0, 15)

  const layoutVideos = layoutGraphNodes(scoredVideos)
  const graphTags = deriveGraphTags(query, layoutVideos, activeTags, customTags, disabledTags)
  const branches = buildBranches(layoutVideos)
  const watchedCount = layoutVideos.filter((video) => video.playback.status === 'watched').length
  const watchingCount = layoutVideos.filter((video) => video.playback.status === 'watching').length
  const progress = layoutVideos.length
    ? Math.round(((watchedCount + watchingCount * 0.45) / layoutVideos.length) * 100)
    : 0

  return {
    id: preferences.id || `canvas-${stableId(query, graphTags)}`,
    title: deriveCanvasTitle(query, graphTags),
    topic: cleanQuery(query),
    sourceLabel: preferences.sourceLabel || '主题生成',
    description: `围绕 ${cleanQuery(query)} 从核心概念、工具接入、工作流和远端延伸组织视频。`,
    progress,
    watched: watchedCount,
    total: layoutVideos.length,
    tags: graphTags,
    branches,
    nodes: branches,
    videos: layoutVideos,
    hiddenVideoIds: [...hiddenVideoIds],
    createdAt: preferences.createdAt || new Date().toISOString()
  }
}

export function scoreVideoForQuery(video, query, activeTags = [], disabledTags = [], watchProgress = {}) {
  const clean = cleanQuery(query)
  const tokens = tokenize(clean)
  const tagSet = normalizeTags(video.tags)
  const text = [video.title, video.desc, video.summary, video.knowledge.description, ...video.tags]
    .join(' ')
    .toLowerCase()
  let score = video.knowledge.relevanceScore - video.knowledge.distanceLevel * 6

  tokens.forEach((token) => {
    if (!token) return
    if (text.includes(token.toLowerCase())) score += 18
  })

  normalizeTags(activeTags).forEach((tag) => {
    if (tagSet.includes(tag)) score += 20
  })

  normalizeTags(disabledTags).forEach((tag) => {
    if (tagSet.includes(tag)) score -= 36
  })

  const progress = watchProgress[video.id] || video.playback || { progress: 0, status: 'unseen' }
  const adjustedDistance = score >= 120 ? 0 : score >= 92 ? 1 : score >= 68 ? 2 : score >= 44 ? 3 : 4

  return {
    ...video,
    score,
    distanceLevel: adjustedDistance,
    playback: {
      progress: clampProgress(progress.progress),
      status: progress.status || progressStatus(progress.progress)
    }
  }
}

export function layoutGraphNodes(scoredVideos) {
  return scoredVideos.map((video, index) => {
    const point = VIDEO_LAYOUT[index % VIDEO_LAYOUT.length]
    const distanceOffset = video.distanceLevel * 8
    return {
      ...video,
      x: point.x + distanceOffset,
      y: point.y + distanceOffset,
      rank: index + 1,
      relevanceLabel: video.distanceLevel <= 1 ? '强相关' : video.distanceLevel <= 3 ? '扩展' : '远端'
    }
  })
}

export function deriveCanvasTitle(query, activeTags = []) {
  const clean = cleanQuery(query)
  const tags = normalizeTags(activeTags)
  const hasLocalVideo = ['本地视频', 'video-1', 'video-2', 'video-3'].some((token) => includesAny([clean, ...tags], token))
  const hasClaude = includesAny([clean, ...tags], 'Claude')
  const hasCodex = includesAny([clean, ...tags], 'Codex')
  if (hasLocalVideo) return '本地视频素材'
  if (hasClaude) return 'AI Claude'
  if (hasCodex && tags.includes('Agent')) return 'Codex Agent'
  if (hasCodex) return 'Codex 路线'
  if (tags.length >= 2) return `${tags[0]} ${tags[1]}`
  return `${clean.slice(0, 12)} 画布`
}

export function updateWatchProgress(currentProgress, videoId, rawProgress) {
  const progress = clampProgress(rawProgress)
  return {
    ...currentProgress,
    [videoId]: {
      progress,
      status: progressStatus(progress)
    }
  }
}

export function resolvePlayableVideo(video, videos = []) {
  if (!video) return null
  const sourceId = video.playableSourceId || video.id
  const source = videos.find((item) => item.id === sourceId)
  if (!source) return video
  return {
    ...video,
    video: source.video,
    duration: video.duration || source.duration
  }
}

export function cleanQuery(value) {
  let query = String(value || '').trim() || '本地视频素材'
  STOP_WORDS.forEach((word) => {
    query = query.replaceAll(word, ' ')
  })
  return query.replace(/\s+/g, ' ').trim() || '本地视频'
}

function buildBranches(videos) {
  const branchNames = [...new Set(videos.map((video) => video.knowledge.branch))].slice(0, 6)
  return branchNames.map((name, index) => {
    const point = BRANCH_LAYOUT[index % BRANCH_LAYOUT.length]
    const meta = BRANCH_META[name] || { icon: String(index + 1).padStart(2, '0'), desc: '由相关视频自动归纳出的学习分支。' }
    const branchVideos = videos.filter((video) => video.knowledge.branch === name)
    const score = Math.round(branchVideos.reduce((sum, video) => sum + video.score, 0) / branchVideos.length)
    return {
      id: `branch-${index + 1}-${slugify(name)}`,
      name,
      icon: meta.icon,
      desc: meta.desc,
      tags: [...new Set(branchVideos.flatMap((video) => video.tags))].slice(0, 3),
      score,
      videoCount: branchVideos.length,
      x: point.x,
      y: point.y
    }
  })
}

function deriveGraphTags(query, videos, activeTags, customTags, disabledTags) {
  const disabled = new Set(normalizeTags(disabledTags))
  const fromVideos = videos.flatMap((video) => video.tags)
  const seed = [...normalizeTags(customTags), ...normalizeTags(activeTags), ...tokenize(cleanQuery(query)), ...fromVideos]
  return [...new Set(seed.filter((tag) => tag && !disabled.has(tag) && tag.length <= 12))].slice(0, 8)
}

function tokenize(value) {
  const text = String(value || '').replace(/[，。,.!?？：:；;]/g, ' ')
  const words = text.split(/\s+/).filter(Boolean)
  const compactTokens = ['本地视频', 'video-1', 'video-2', 'video-3', 'Claude', 'Codex', 'Agent', 'API', 'AI', 'IoT', 'RAG', 'Prompt'].filter((token) =>
    text.toLowerCase().includes(token.toLowerCase())
  )
  return [...new Set([...compactTokens, ...words])]
}

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean))]
}

function includesAny(items, token) {
  return items.some((item) => String(item).toLowerCase().includes(token.toLowerCase()))
}

function clampProgress(value) {
  return Math.max(0, Math.min(1, Number(value || 0)))
}

function progressStatus(progress) {
  if (progress >= 0.9) return 'watched'
  if (progress > 0) return 'watching'
  return 'unseen'
}

function stableId(query, tags) {
  return slugify(`${cleanQuery(query)}-${tags.join('-')}`).slice(0, 48)
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getGlobalVideos() {
  return globalThis.__tikcanvasVideos || slideRecommend
}
