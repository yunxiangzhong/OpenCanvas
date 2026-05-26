import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildKnowledgeGraph,
  deriveCanvasTitle,
  resolvePlayableVideo,
  updateWatchProgress
} from '../src/knowledge_graph.js'
import { slideRecommend } from '../src/slide_recommend.js'

test('buildKnowledgeGraph ranks Claude API and Agent videos near the center', () => {
  const graph = buildKnowledgeGraph('帮我生成 Claude 的知识画布', {
    activeTags: ['Claude', 'API', 'Agent'],
    hiddenVideoIds: [],
    watchProgress: {}
  })

  assert.equal(graph.title, 'AI Claude')
  assert.ok(graph.tags.includes('Claude'))
  assert.ok(graph.tags.includes('API'))
  assert.ok(graph.videos.length >= 8)
  assert.equal(graph.videos[0].distanceLevel, 0)
  assert.ok(graph.videos[0].score >= graph.videos.at(-1).score)
  assert.ok(graph.videos.slice(0, 4).some((video) => video.tags.includes('Agent')))
})

test('disabled tags reduce matching videos and move IoT further away', () => {
  const withIot = buildKnowledgeGraph('Claude 到 IoT', {
    activeTags: ['Claude', 'IoT'],
    hiddenVideoIds: [],
    watchProgress: {}
  })
  const withoutIot = buildKnowledgeGraph('Claude 到 IoT', {
    activeTags: ['Claude'],
    disabledTags: ['IoT'],
    hiddenVideoIds: [],
    watchProgress: {}
  })

  const iotWith = withIot.videos.find((video) => video.tags.includes('IoT'))
  const iotWithout = withoutIot.videos.find((video) => video.tags.includes('IoT'))

  assert.ok(iotWith)
  assert.ok(iotWithout)
  assert.ok(iotWith.score > iotWithout.score)
  assert.ok(iotWithout.distanceLevel >= iotWith.distanceLevel)
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

test('resolvePlayableVideo maps simulated videos to one of the real mp4 sources', () => {
  const simulated = slideRecommend.find((video) => video.id === 'video-claude-api-patterns')
  const playable = resolvePlayableVideo(simulated, slideRecommend)

  assert.ok(playable)
  assert.match(playable.video.play_addr.url_list[0], /^\/videos\/video-[123]\.mp4$/)
})

test('deriveCanvasTitle keeps short AI generated titles stable', () => {
  assert.equal(deriveCanvasTitle('帮我生成 Claude 的知识画布', ['Claude', 'API']), 'AI Claude')
  assert.equal(deriveCanvasTitle('Codex 学习路线图', ['Codex', 'Agent']), 'Codex Agent')
})
