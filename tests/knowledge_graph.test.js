import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  buildKnowledgeGraph,
  deriveCanvasTitle,
  resolvePlayableVideo,
  updateWatchProgress
} from '../src/knowledge_graph.js'
import { slideRecommend } from '../src/slide_recommend.js'
import { KNOWLEDGE_DATA } from '../src/knowledgeData.js'
import { __test__ as knowledgeCanvasTest } from '../src/knowledgeCanvasApp.js'

test('buildKnowledgeGraph ranks real local videos near the center', () => {
  const graph = buildKnowledgeGraph('整理本地视频素材', {
    activeTags: ['本地视频'],
    hiddenVideoIds: [],
    watchProgress: {}
  })

  assert.equal(graph.title, '本地视频素材')
  assert.ok(graph.tags.includes('本地视频'))
  assert.equal(graph.videos.length, 3)
  assert.equal(graph.videos[0].distanceLevel, 0)
  assert.ok(graph.videos[0].score >= graph.videos.at(-1).score)
  assert.ok(graph.videos.every((video) => video.title.startsWith('本地视频')))
})

test('disabled tags reduce matching local videos', () => {
  const withLocalVideo = buildKnowledgeGraph('整理本地视频素材', {
    activeTags: ['本地视频'],
    hiddenVideoIds: [],
    watchProgress: {}
  })
  const withoutLocalVideo = buildKnowledgeGraph('整理本地视频素材', {
    activeTags: [],
    disabledTags: ['本地视频'],
    hiddenVideoIds: [],
    watchProgress: {}
  })

  const localWith = withLocalVideo.videos.find((video) => video.tags.includes('本地视频'))
  const localWithout = withoutLocalVideo.videos.find((video) => video.tags.includes('本地视频'))

  assert.ok(localWith)
  assert.ok(localWithout)
  assert.ok(localWith.score > localWithout.score)
  assert.ok(localWithout.distanceLevel >= localWith.distanceLevel)
})

test('watch progress marks videos as unseen watching or watched', () => {
  assert.deepEqual(updateWatchProgress({}, 'video-1', 0.1), {
    'video-1': { progress: 0.1, status: 'watching' }
  })
  assert.deepEqual(updateWatchProgress({}, 'video-1', 0.92), {
    'video-1': { progress: 0.92, status: 'watched' }
  })
  assert.deepEqual(updateWatchProgress({}, 'video-1', 0), {
    'video-1': { progress: 0, status: 'unseen' }
  })
})

test('resolvePlayableVideo uses the real local mp4 sources', () => {
  const playable = resolvePlayableVideo(slideRecommend[1], slideRecommend)

  assert.ok(playable)
  assert.match(playable.video.play_addr.url_list[0], /^\/videos\/video-[123]\.mp4$/)
})

test('deriveCanvasTitle keeps short AI generated titles stable', () => {
  assert.equal(deriveCanvasTitle('整理本地视频素材', ['本地视频']), '本地视频素材')
  assert.equal(deriveCanvasTitle('查看 video-1', ['video-1']), '本地视频素材')
})

test('static cover assets referenced by demo videos exist', () => {
  for (const video of slideRecommend.slice(0, 3)) {
    const coverPath = video.video.cover.url_list[0]
    assert.match(coverPath, /^\/covers\/cover-[123]\.svg$/)
    assert.equal(existsSync(join(process.cwd(), coverPath.replace(/^\/+/, ''))), true, `${coverPath} should exist`)
  }
})

test('demo video catalogs do not claim missing Claude or Codex content', () => {
  const text = JSON.stringify({
    recommend: slideRecommend,
    canvasVideos: KNOWLEDGE_DATA.videos,
    components: KNOWLEDGE_DATA.components,
    topic: KNOWLEDGE_DATA.topic
  })

  assert.doesNotMatch(text, /Claude|Codex|Prompt|Agent 记忆|API 自动化/i)
  assert.equal(slideRecommend.length, 3)
  assert.equal(KNOWLEDGE_DATA.videos.length, 3)
})

test('Ming emperor static canvas uses existing demo media paths', () => {
  const result = knowledgeCanvasTest.buildMingEmperorCanvasResult('我想要了解明朝皇帝更迭')

  assert.ok(result.videos.length > 0)
  for (const video of result.videos) {
    assert.doesNotMatch(video.sourceUrl, /^\/media\//)
    assert.match(video.sourceUrl, /^\/videos\/video-[123]\.mp4$/)
    assert.equal(video.coverImage, '')
  }
})

test('static demo does not call remote agent endpoints by default', () => {
  assert.deepEqual(knowledgeCanvasTest.agentApiEndpoints(), [])
})

test('knowledge canvas HTML helpers escape user controlled text and attributes', () => {
  assert.equal(
    knowledgeCanvasTest.escapeHtml('<img src=x onerror=alert(1)>'),
    '&lt;img src=x onerror=alert(1)&gt;'
  )
  assert.equal(
    knowledgeCanvasTest.escapeAttribute('" data-x="bad'),
    '&quot; data-x=&quot;bad'
  )
  assert.equal(
    knowledgeCanvasTest.escapeCssUrl('/covers/a")}.svg'),
    '/covers/a%22%29%7D.svg'
  )
})

test('route actions update durable canvas state instead of only showing toast', () => {
  const state = knowledgeCanvasTest.createDemoState()
  state.routeIds = ['local']
  state.selectedVideoId = 'v1'
  state.activeComponentId = 'local'

  const joined = knowledgeCanvasTest.joinSelectedVideoToRoute(state)
  assert.equal(joined.videoId, 'v1')
  assert.deepEqual(state.routeVideoIds, ['v1'])

  const savedRoute = knowledgeCanvasTest.saveCurrentRoute(state)
  const restored = JSON.parse(JSON.stringify(state))
  assert.equal(restored.savedRoutes[0].id, savedRoute.id)
  assert.deepEqual(restored.savedRoutes[0].videoIds, ['v1'])

  const component = state.components.find((item) => item.id === 'local')
  const before = { x: component.x, y: component.y }
  knowledgeCanvasTest.toggleActiveComponentLock(state)
  assert.equal(component.locked, true)
  component.weight += 40
  knowledgeCanvasTest.reflowComponentsForState(state)
  assert.deepEqual({ x: component.x, y: component.y }, before)

  const shareText = knowledgeCanvasTest.buildRouteShareText(savedRoute)
  assert.match(shareText, /本地视频/)
  assert.match(shareText, /v1/)
})
