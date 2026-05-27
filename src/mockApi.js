import { slideRecommend } from './slide_recommend.js'

function normalizeMockVideo(video) {
  const sourceUrl = video.video?.play_addr?.url_list?.[0] || '';
  const coverImage = video.video?.cover?.url_list?.[0] || '';
  return {
    ...video,
    sourceUrl,
    coverImage,
    creator: video.author?.nickname || '知识创作者',
    description: video.desc || video.summary || '',
    progress: video.playback?.progress ? Math.round(video.playback.progress * 100) : 0,
    watched: video.playback?.status === 'watched',
  }
}

export async function videoDetail(id) {
  const found = slideRecommend.find(v => v.id === id);
  if (!found) return { success: false, msg: 'Video not found' };
  return {
    success: true,
    data: normalizeMockVideo(found)
  };
}

export async function recommendedVideo(params) {
  return {
    success: true,
    data: {
      list: slideRecommend.map(normalizeMockVideo)
    }
  };
}

export async function relatedVideo(id) {
  // Mock related video responses using a weighted score
  const nodes = slideRecommend.map(v => ({
    type: 'video',
    id: v.id,
    video: normalizeMockVideo(v)
  }));

  const edges = slideRecommend.map(v => ({
    target_id: v.id,
    weight: v.id === id ? 1.0 : (v.knowledge?.branch === slideRecommend.find(item => item.id === id)?.knowledge?.branch ? 0.8 : 0.3)
  }));

  return {
    success: true,
    data: {
      nodes,
      edges
    }
  };
}
