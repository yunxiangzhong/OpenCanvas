const localVideos = [
  {
    id: 'video-1',
    file: 'video-1.mp4',
    cover: 'cover-1.svg',
    duration: 346743,
    digg: 0,
    tags: ['本地视频', '素材 1'],
    branch: '本地素材',
    relevanceScore: 96,
    distanceLevel: 0
  },
  {
    id: 'video-2',
    file: 'video-2.mp4',
    cover: 'cover-2.svg',
    duration: 277037,
    digg: 0,
    tags: ['本地视频', '素材 2'],
    branch: '待整理',
    relevanceScore: 88,
    distanceLevel: 1
  },
  {
    id: 'video-3',
    file: 'video-3.mp4',
    cover: 'cover-3.svg',
    duration: 494516,
    digg: 0,
    tags: ['本地视频', '素材 3'],
    branch: '待整理',
    relevanceScore: 80,
    distanceLevel: 2
  }
]

function makeLocalVideo(item, index) {
  const title = `本地视频 ${index + 1}`
  const sourceUrl = `/videos/${item.file}`
  const coverUrl = `/covers/${item.cover}`
  return {
    id: item.id,
    aweme_id: item.id,
    desc: `${title}：${item.file}`,
    title,
    author: {
      nickname: '本地素材',
      avatar: ''
    },
    video: {
      play_addr: { url_list: [sourceUrl] },
      cover: { url_list: [coverUrl] }
    },
    playableSourceId: item.id,
    duration: item.duration,
    statistics: {
      digg_count: item.digg
    },
    tags: item.tags,
    summary: `来自本地 videos/${item.file}，当前 Demo 未声明具体内容主题。`,
    playback: {
      progress: 0,
      status: 'unseen'
    },
    knowledge: {
      branch: item.branch,
      relevanceScore: item.relevanceScore,
      distanceLevel: item.distanceLevel,
      relatedTags: item.tags,
      description: `真实可播放文件：${sourceUrl}`
    }
  }
}

export const slideRecommend = localVideos.map(makeLocalVideo)
