export const KNOWLEDGE_DATA = {
  topic: {
    id: "local-video-canvas",
    title: "本地视频素材画布",
    description: "只整理当前项目中真实存在的本地视频文件",
    chips: ["本地视频", "video-1", "video-2", "video-3", "待整理", "可播放"],
    route: ["local", "review", "organize"],
  },
  components: [
    {
      id: "local",
      name: "本地素材",
      color: "#E8F7F4",
      line: "#83C9A8",
      x: 238,
      y: 166,
      weight: 92,
      locked: false,
      excluded: false,
      desc: "项目 videos 目录中真实存在、可以播放的文件。"
    },
    {
      id: "review",
      name: "待识别内容",
      color: "#EAF2FF",
      line: "#83D6EF",
      x: 446,
      y: 318,
      weight: 82,
      locked: false,
      excluded: false,
      desc: "这些视频尚未提供真实标题、作者和主题标签，只能按文件名展示。"
    },
    {
      id: "organize",
      name: "画布整理",
      color: "#FFF3D8",
      line: "#F2C36B",
      x: 250,
      y: 460,
      weight: 76,
      locked: false,
      excluded: false,
      desc: "用户可以先观看本地素材，再手动补充真实标题和分类。"
    },
  ],
  videos: [
    {
      id: "v1",
      title: "本地视频 1",
      creator: "本地素材",
      duration: "05:47",
      componentId: "local",
      tags: ["本地视频", "video-1"],
      summary: "真实文件：videos/video-1.mp4。当前 Demo 没有该视频的真实主题元数据。",
      reason: "这是项目中真实存在的第一个本地视频文件。",
      progress: 0,
      watched: false,
      coverType: "local-1",
      coverImage: "/covers/cover-1.svg",
      sourceUrl: "/videos/video-1.mp4",
      fileName: "video-1.mp4",
      source: true,
      next: true
    },
    {
      id: "v2",
      title: "本地视频 2",
      creator: "本地素材",
      duration: "04:37",
      componentId: "review",
      tags: ["本地视频", "video-2"],
      summary: "真实文件：videos/video-2.mp4。当前 Demo 没有该视频的真实主题元数据。",
      reason: "这是项目中真实存在的第二个本地视频文件。",
      progress: 0,
      watched: false,
      coverType: "local-2",
      coverImage: "/covers/cover-2.svg",
      sourceUrl: "/videos/video-2.mp4",
      fileName: "video-2.mp4"
    },
    {
      id: "v3",
      title: "本地视频 3",
      creator: "本地素材",
      duration: "08:15",
      componentId: "organize",
      tags: ["本地视频", "video-3"],
      summary: "真实文件：videos/video-3.mp4。当前 Demo 没有该视频的真实主题元数据。",
      reason: "这是项目中真实存在的第三个本地视频文件。",
      progress: 0,
      watched: false,
      coverType: "local-3",
      coverImage: "/covers/cover-3.svg",
      sourceUrl: "/videos/video-3.mp4",
      fileName: "video-3.mp4"
    },
  ],
  savedCanvases: [
    { id: "local-video-canvas", title: "本地视频素材画布", tags: ["本地视频", "待整理"], videos: 3, progress: 0, updated: "刚刚" },
  ],
}

export default KNOWLEDGE_DATA
