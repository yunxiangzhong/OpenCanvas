const CANVAS_COLORS = ['#E8F7F4', '#EAF2FF', '#F1EDFF', '#FFF3D8', '#FFEDEC', '#EEF8EA', '#EDF7FF', '#F8EEF9']
const COVER_TYPES = 'abcdefghijklmnopqrstuvwxyz'.split('')

const DOMAIN_PROFILES = {
  ai_creator: {
    label: 'AI 学习',
    tests: [/claude|chatgpt|gemini|copilot|openai|anthropic|deepseek|ai|大模型|模型|提示词|agent|api|编程|工作流|自动化|skill/i],
    components: [
      ['基础认知', '先建立对主题的基本理解，明确它是什么、适合谁、解决什么问题。', ['概念', '入门', '能力']],
      ['安装入口', '梳理可用入口、账号登录、客户端和 API 接入方式。', ['入口', '安装', '登录']],
      ['核心能力', '拆解模型、工具或工作流最值得关注的能力边界。', ['能力', '边界', '效果']],
      ['实操方法', '把提问、配置、调用或使用步骤拆成可执行动作。', ['步骤', '实操', '教程']],
      ['工作流接入', '说明如何接入学习、写作、编程、资料整理或团队流程。', ['工作流', '流程', '复用']],
      ['工具对比', '和同类模型、工具或替代方案做横向比较。', ['对比', '替代', '选择']],
      ['常见问题', '覆盖限制、报错、价格、准确性、访问和安全等疑问。', ['问题', '限制', '验证']],
      ['进阶学习', '延伸到提示词、Agent、API、项目实践和质量评估。', ['进阶', '项目', '评估']]
    ]
  },
  football_creator: {
    label: '足球复盘',
    tests: [/足球|皇马|曼城|梅西|c罗|英超|西甲|欧冠|世界杯|比赛|战术|阵型|球员|教练|转会|进球|football|soccer|real madrid|mancity/i],
    components: [
      ['比赛背景', '说明赛事阶段、双方状态、伤停、排名和赛前预期。', ['比赛', '背景', '状态']],
      ['战术布置', '拆解阵型、压迫、防守站位、进攻套路和边路安排。', ['战术', '阵型', '压迫']],
      ['球员表现', '观察关键球员的跑动、对抗、传射、防守和决策。', ['球员', '表现', '关键人']],
      ['关键回合', '还原进球、失误、扑救、换人和争议判罚等节点。', ['回合', '进球', '失误']],
      ['教练调整', '分析换人、阵型变化、压迫强度和临场策略。', ['教练', '换人', '调整']],
      ['数据对比', '对比射门、控球、预期进球、传球区域和对抗数据。', ['数据', '控球', '射门']],
      ['赛后争议', '整理判罚、战术选择、球员评价和舆论分歧。', ['争议', '判罚', '舆论']],
      ['后续赛程', '延伸到晋级形势、体能、联赛和下一场安排。', ['赛程', '晋级', '后续']]
    ]
  },
  history_creator: {
    label: '历史探索',
    tests: [/历史|文明|朝代|王朝|战争|考古|法老|金字塔|古埃及|罗马|希腊|冷战|二战|制度/i],
    components: [
      ['时代背景', '补齐事件或文明所处的时代环境、地理条件和社会矛盾。', ['时代', '背景', '环境']],
      ['人物关系', '梳理关键人物、阶层、国家或组织之间的关系。', ['人物', '关系', '势力']],
      ['事件脉络', '按时间线拆解发生、发展、转折和结果。', ['事件', '时间线', '转折']],
      ['制度结构', '分析政治制度、经济结构、社会组织和权力分配。', ['制度', '结构', '权力']],
      ['文化信仰', '理解宗教、思想、礼制、文化观念对历史走向的影响。', ['文化', '信仰', '思想']],
      ['考古发现', '关注文物、遗址、墓葬、文献如何补充或修正叙事。', ['考古', '文物', '证据']],
      ['历史争议', '整理不同解释、学术争议和常见误读。', ['争议', '误读', '观点']],
      ['延展阅读', '推荐继续理解的主题、书籍、纪录片或后续问题。', ['阅读', '延展', '资料']]
    ]
  },
  knowledge_creator: {
    label: '知识内容',
    tests: [/读书|心理|商业|认知|社会观察|科普|知识|观点|概念|学习|方法论|情绪|职场|蛤蟆先生|心理医生/i],
    components: [
      ['核心观点', '提炼视频最重要的判断、主张和结论。', ['观点', '主张', '结论']],
      ['背景知识', '补充概念来源、研究背景、作者语境和相关材料。', ['背景', '来源', '语境']],
      ['概念解释', '把关键概念、术语和容易混淆的点解释清楚。', ['概念', '术语', '理解']],
      ['论证逻辑', '拆解作者如何从证据、案例和推理走到结论。', ['论证', '证据', '逻辑']],
      ['案例补充', '寻找能印证、反驳或扩展观点的具体案例。', ['案例', '印证', '反例']],
      ['现实应用', '把观点转化到学习、工作、关系、商业或生活场景。', ['应用', '现实', '实践']],
      ['争议讨论', '整理不同观点、反方意见和可能的误用。', ['争议', '反方', '误用']],
      ['延展阅读', '延伸到书籍、论文、课程、人物和相关主题。', ['阅读', '资料', '延展']]
    ]
  },
  general: {
    label: '综合主题',
    tests: [],
    components: [
      ['核心线索', '先抓住视频主题、重要信息和继续探索的入口。', ['主题', '线索', '重点']],
      ['背景补充', '补齐理解视频所需的上下文、人物和环境。', ['背景', '语境', '人物']],
      ['细节拆解', '把关键细节、过程和判断依据拆开看。', ['细节', '过程', '依据']],
      ['相关案例', '寻找相似案例、延伸事件或可参考对象。', ['案例', '参考', '相似']],
      ['延展方向', '继续探索相邻主题、后续问题和进阶资料。', ['延展', '后续', '资料']]
    ]
  }
}

export function buildCanvasRecommendationPlan(seedVideo, videos = []) {
  const seed = normalizeVideo(seedVideo)
  const pool = uniqueVideos([seed, ...videos.map(normalizeVideo)]).filter((video) => video.id)
  const domain = inferContentDomain(seed)
  const profile = DOMAIN_PROFILES[domain] || DOMAIN_PROFILES.general
  const topic = pickTopic(seed, profile.label)
  const components = profile.components.map(([name, desc, keywords], index) => {
    const component = {
      id: `runtime-${stableId(name)}`,
      name,
      color: CANVAS_COLORS[index % CANVAS_COLORS.length],
      line: ['#83C9A8', '#83D6EF', '#8B7CF6', '#F2C36B', '#FF7A7A', '#69BFE7', '#C28AD8', '#70D6A3'][index % 8],
      weight: 92 - index * 4,
      locked: false,
      excluded: false,
      desc
    }
    const ranked = rankVideosForComponent({ seed, pool, component: { ...component, keywords }, domain })
    return { component, ranked }
  })

  const resultVideos = []
  const usedVideoIds = new Set([seed.id])
  components.forEach(({ component, ranked }, componentIndex) => {
    ranked
      .filter((item) => !usedVideoIds.has(item.video.id))
      .slice(0, 4)
      .forEach((item, videoIndex) => {
        usedVideoIds.add(item.video.id)
        resultVideos.push(toCanvasVideo(item.video, component, {
          score: item.score,
          reason: item.reason,
          coverType: COVER_TYPES[(componentIndex * 4 + videoIndex) % COVER_TYPES.length],
          next: resultVideos.length === 0
        }))
      })
  })

  const sourceComponent = components[0]?.component
  if (sourceComponent && seed.id) {
    resultVideos.unshift(toCanvasVideo(seed, sourceComponent, {
      score: 1,
      reason: '这是当前刷到的视频，作为本轮知识画布的起点。',
      coverType: 'a',
      source: true,
      watched: Boolean(seed.watched || seed.progress >= 100),
      progress: Number(seed.progress || 0)
    }))
  }

  const finalComponents = components.map((item) => item.component)

  return {
    mode: 'replace',
    topic,
    title: `${topic} 学习路线图`,
    routeTitle: `${topic} 30 分钟入门路线`,
    components: finalComponents,
    route: finalComponents.slice(0, 4).map((item) => item.name),
    videos: resultVideos,
    changes: [`识别当前视频主题：${topic}`, `匹配 ${finalComponents.length} 个探索组件`, `按相关度推荐 ${resultVideos.length} 条视频`]
  }
}

export function recommendNextVideoAfterWatch({ watched, videos = [], components = [], routeIds = [] }) {
  if (!watched) return null
  const watchedVideo = normalizeVideo(watched)
  const componentMap = new Map(components.map((component) => [component.id, component]))
  const routeIndex = routeIds.indexOf(watched.componentId)
  const candidates = videos
    .filter((video) => video.id !== watched.id && !video.watched)
    .map((video) => {
      const sameComponent = video.componentId === watched.componentId ? 0.34 : 0
      const routeDistance = routeIds.includes(video.componentId)
        ? Math.max(0, 0.26 - Math.abs(routeIds.indexOf(video.componentId) - routeIndex - 1) * 0.08)
        : 0
      const component = componentMap.get(video.componentId)
      const componentWeight = Math.max(0, Number(component?.weight || 0) / 100) * 0.12
      const textScore = textOverlapScore(watchedVideo, normalizeVideo(video)) * 0.22
      const progressScore = Number(video.progress || 0) > 0 ? 0.04 : 0.1
      const nextFlag = video.next ? 0.16 : 0
      return { video, score: sameComponent + routeDistance + componentWeight + textScore + progressScore + nextFlag }
    })
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.video || null
}

function rankVideosForComponent({ seed, pool, component, domain }) {
  const seedTags = new Set(seed.tags.map(normalizeText))
  const seedKeywords = extractKeywords(seed)
  return pool
    .filter((video) => video.id && video.id !== seed.id)
    .map((video) => {
      const text = normalizeText(`${video.title} ${video.description} ${video.category} ${video.tags.join(' ')}`)
      const keywordScore = component.keywords.reduce((sum, keyword) => sum + (text.includes(normalizeText(keyword)) ? 0.16 : 0), 0)
      const seedTagScore = video.tags.reduce((sum, tag) => sum + (seedTags.has(normalizeText(tag)) ? 0.12 : 0), 0)
      const seedKeywordScore = seedKeywords.reduce((sum, keyword) => sum + (text.includes(normalizeText(keyword)) ? 0.07 : 0), 0)
      const domainScore = inferContentDomain(video) === domain ? 0.14 : 0
      const titleScore = text.includes(normalizeText(component.name)) ? 0.2 : 0
      const relatedScore = Math.min(0.28, Number(video.relatedWeight || video.aiMeta?.relatedWeight || 0) * 0.28)
      const statsScore = statsScoreFor(video)
      const score = Math.min(1, 0.04 + relatedScore + domainScore + titleScore + keywordScore + seedTagScore + seedKeywordScore + statsScore)
      return {
        video,
        score,
        reason: reasonFor(component, video, score)
      }
    })
    .filter((item) => item.score > 0.1)
    .sort((a, b) => b.score - a.score)
}

function toCanvasVideo(video, component, options = {}) {
  return {
    id: video.id,
    title: video.title || '未命名视频',
    creator: video.creator || '知识创作者',
    duration: formatDuration(video.duration),
    componentId: component.id,
    tags: video.tags.slice(0, 6),
    summary: video.description || video.title || '围绕当前主题继续展开。',
    reason: options.reason || `它和「${component.name}」分支相关，适合作为下一步观看。`,
    progress: Number(options.progress ?? video.progress ?? 0),
    watched: Boolean(options.watched ?? video.watched),
    coverType: options.coverType || 'a',
    next: Boolean(options.next),
    source: Boolean(options.source),
    recommendationScore: Number(options.score || 0).toFixed(2)
  }
}

function normalizeVideo(video = {}) {
  const rawTags = Array.isArray(video.tags) ? video.tags : []
  const tags = rawTags
    .map((tag) => (typeof tag === 'string' ? tag : tag?.name || tag?.slug || tag?.title || tag?.id))
    .filter(Boolean)
    .map(String)
  const stats = video.statistics || video.stats || {}
  return {
    ...video,
    id: String(video.aweme_id || video.id || video.videoId || ''),
    title: String(video.title || video.desc || video.description || '当前视频'),
    description: String(video.description || video.desc || video.title || ''),
    creator: String(video.creator || video.author?.nickname || video.authorName || video.author || ''),
    category: String(video.category || video.category_slug || ''),
    tags,
    duration: Number(video.duration || video.video?.duration || 0),
    statistics: stats,
    aiMeta: video.aiMeta || {},
    relatedWeight: Number(video.relatedWeight || video.aiMeta?.relatedWeight || 0),
    progress: Number(video.progress || 0),
    watched: Boolean(video.watched)
  }
}

function inferContentDomain(video) {
  const text = normalizeText(`${video.title} ${video.description} ${video.category} ${video.tags.join(' ')}`)
  for (const [domain, profile] of Object.entries(DOMAIN_PROFILES)) {
    if (profile.tests.some((pattern) => pattern.test(text))) return domain
  }
  return 'general'
}

function pickTopic(video, fallback) {
  const words = extractKeywords(video)
  return words.find((word) => word.length >= 2 && word.length <= 10) || fallback || '当前视频'
}

function extractKeywords(video) {
  const words = normalizeText(`${video.title} ${video.description} ${video.category} ${video.tags.join(' ')}`)
    .match(/[\u4e00-\u9fa5A-Za-z0-9]{2,16}/g) || []
  return [...new Set(words.map(decodeSlugKeyword).filter((word) => !/^[a-z-]+$/i.test(word)))].slice(0, 14)
}

function textOverlapScore(a, b) {
  const aWords = new Set(extractKeywords(a))
  if (!aWords.size) return 0
  const bText = normalizeText(`${b.title} ${b.description} ${b.tags.join(' ')}`)
  const hits = [...aWords].filter((word) => bText.includes(normalizeText(word))).length
  return Math.min(1, hits / Math.max(3, aWords.size))
}

function statsScoreFor(video) {
  const stats = video.statistics || {}
  return (
    Math.log10(1 + Number(stats.digg_count || stats.digg || 0)) * 0.03 +
    Math.log10(1 + Number(stats.collect_count || stats.collect || 0)) * 0.04 +
    Math.log10(1 + Number(stats.comment_count || stats.comment || 0)) * 0.02
  )
}

function reasonFor(component, video, score) {
  if (score >= 0.62) return `它和「${component.name}」高度相关，可以直接接在当前视频后继续刷。`
  if (video.relatedWeight > 0) return '它来自当前视频的相关关系，适合作为延展观看。'
  return `它能补齐「${component.name}」里的一个侧面。`
}

function uniqueVideos(videos) {
  const seen = new Set()
  return videos.filter((video) => {
    if (!video.id || seen.has(video.id)) return false
    seen.add(video.id)
    return true
  })
}

function formatDuration(duration) {
  const value = Number(duration)
  if (!Number.isFinite(value) || value <= 0) return '06:20'
  const totalSeconds = value > 1000 ? Math.round(value / 1000) : Math.round(value)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function normalizeText(value) {
  return decodeSlugKeyword(String(value || '')).toLowerCase().replace(/\s+/g, ' ').trim()
}

function decodeSlugKeyword(value) {
  return String(value || '')
    .replace(/ai-learning/gi, 'AI学习')
    .replace(/knowledge-base/gi, '知识库')
    .replace(/workflow/gi, '工作流')
    .replace(/prompt/gi, '提示词')
    .replace(/claude/gi, 'Claude')
    .replace(/chatgpt/gi, 'ChatGPT')
}

function stableId(value) {
  return String(value || 'node')
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}
