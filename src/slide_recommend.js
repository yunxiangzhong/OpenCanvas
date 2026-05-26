const realSources = {
  'video-1': {
    video: { play_addr: { url_list: ['/videos/video-1.mp4'] }, cover: { url_list: ['/covers/cover-1.jpg'] } }
  },
  'video-2': {
    video: { play_addr: { url_list: ['/videos/video-2.mp4'] }, cover: { url_list: ['/covers/cover-2.jpg'] } }
  },
  'video-3': {
    video: { play_addr: { url_list: ['/videos/video-3.mp4'] }, cover: { url_list: ['/covers/cover-3.jpg'] } }
  }
}

function makeVideo({
  id,
  desc,
  title,
  author,
  source,
  duration,
  digg,
  tags,
  summary,
  branch,
  relevanceScore,
  distanceLevel,
  description
}) {
  return {
    id,
    aweme_id: id,
    desc,
    title,
    author: {
      nickname: author,
      avatar: ''
    },
    ...realSources[source],
    playableSourceId: source,
    duration,
    statistics: {
      digg_count: digg
    },
    tags,
    summary,
    playback: {
      progress: 0,
      status: 'unseen'
    },
    knowledge: {
      branch,
      relevanceScore,
      distanceLevel,
      relatedTags: tags,
      description
    }
  }
}

export const slideRecommend = [
  makeVideo({
    id: 'video-1',
    desc: 'Claude 是什么：从 Anthropic 到日常工作流',
    title: 'Claude 是什么',
    author: '黑松客 AI',
    source: 'video-1',
    duration: 462000,
    digg: 21400,
    tags: ['AI', 'Claude', '入门'],
    summary: '从模型定位、使用入口和适用场景理解 Claude。',
    branch: '核心理解',
    relevanceScore: 98,
    distanceLevel: 0,
    description: '建立 Claude 的基本认知，适合作为画布中心节点的第一层内容。'
  }),
  makeVideo({
    id: 'video-2',
    desc: 'Claude API 和 Agent 自动化：把模型接进工具',
    title: 'Claude API 工具调用',
    author: '黑松客实验室',
    source: 'video-2',
    duration: 538000,
    digg: 18600,
    tags: ['API', 'Agent', '自动化'],
    summary: '整理 API 接入、工具调用和自动化工作流的关键节点。',
    branch: '工具接入',
    relevanceScore: 94,
    distanceLevel: 0,
    description: '把 Claude 从聊天工具推进到可调用、可编排、可集成的工具层。'
  }),
  makeVideo({
    id: 'video-3',
    desc: 'Codex 与 Claude 协作边界：什么时候该用哪一个',
    title: 'Codex vs Claude',
    author: '黑松客精选',
    source: 'video-3',
    duration: 394000,
    digg: 12800,
    tags: ['Codex', 'Claude', '工作流'],
    summary: '对比两类 Agent 的适用任务，生成后续学习路线。',
    branch: '工作流复用',
    relevanceScore: 86,
    distanceLevel: 1,
    description: '帮助用户理解编程 Agent 与通用模型的分工。'
  }),
  makeVideo({
    id: 'video-claude-api-patterns',
    desc: 'Claude API 常见调用模式：Prompt、工具、上下文',
    title: 'Claude API 模式',
    author: '黑松客 API',
    source: 'video-2',
    duration: 426000,
    digg: 17120,
    tags: ['Claude', 'API', '上下文'],
    summary: '把请求结构、上下文窗口和工具调用拆成可复用模板。',
    branch: '工具接入',
    relevanceScore: 92,
    distanceLevel: 0,
    description: '适合作为 Claude 检索主题下的 API 分支主节点。'
  }),
  makeVideo({
    id: 'video-agent-memory',
    desc: 'Agent 记忆系统：从临时上下文到可复用知识库',
    title: 'Agent 记忆',
    author: '工作流研究所',
    source: 'video-1',
    duration: 502000,
    digg: 14200,
    tags: ['Agent', '记忆', '知识库'],
    summary: '解释短期上下文、长期记忆和项目知识如何协同。',
    branch: 'Agent 机制',
    relevanceScore: 88,
    distanceLevel: 1,
    description: '连接 Claude、Agent 和知识沉淀，是中心主题的第一圈延伸。'
  }),
  makeVideo({
    id: 'video-prompt-to-workflow',
    desc: '从 Prompt 到工作流：把一次提问变成稳定流程',
    title: 'Prompt 工作流化',
    author: '黑松客精选',
    source: 'video-3',
    duration: 365000,
    digg: 11200,
    tags: ['Prompt', '工作流', '自动化'],
    summary: '把一次性提示词拆成输入、检查点和复用模板。',
    branch: '工作流复用',
    relevanceScore: 78,
    distanceLevel: 1,
    description: '适合把 Claude 学习从概念扩展到日常生产力。'
  }),
  makeVideo({
    id: 'video-codex-project-handoff',
    desc: 'Codex 项目交接：让 AI 理解仓库、计划和验证',
    title: 'Codex 项目交接',
    author: '工程 Agent 笔记',
    source: 'video-3',
    duration: 448000,
    digg: 9800,
    tags: ['Codex', 'Agent', '验证'],
    summary: '讲解如何把需求、计划、测试和代码上下文交给编程 Agent。',
    branch: '工程协作',
    relevanceScore: 73,
    distanceLevel: 2,
    description: '从 Claude 主题自然延伸到开发协作和验证闭环。'
  }),
  makeVideo({
    id: 'video-rag-basics',
    desc: 'RAG 入门：把文档检索接进大模型回答',
    title: 'RAG 基础',
    author: 'AI 架构课',
    source: 'video-1',
    duration: 401000,
    digg: 13280,
    tags: ['AI', 'RAG', '知识库'],
    summary: '用检索增强生成解释知识库问答的基本链路。',
    branch: '知识库',
    relevanceScore: 70,
    distanceLevel: 2,
    description: '从 Claude 使用走向知识系统，是中距离扩展节点。'
  }),
  makeVideo({
    id: 'video-model-routing',
    desc: '模型路由：Claude、GPT、开源模型如何分工',
    title: '模型路由',
    author: '模型工程师 Leo',
    source: 'video-2',
    duration: 482000,
    digg: 10400,
    tags: ['AI', 'Claude', '模型路由'],
    summary: '按照任务类型、成本和上下文长度选择不同模型。',
    branch: '模型选择',
    relevanceScore: 68,
    distanceLevel: 2,
    description: '帮助用户把 Claude 放进更大的模型组合策略。'
  }),
  makeVideo({
    id: 'video-evals',
    desc: 'AI Evals：如何判断 Agent 真的变好了',
    title: 'Agent 评测',
    author: '可靠性实验室',
    source: 'video-2',
    duration: 516000,
    digg: 8900,
    tags: ['Agent', '评测', '可靠性'],
    summary: '从样例集、自动评分和回归验证理解 AI 评测。',
    branch: '可靠性',
    relevanceScore: 62,
    distanceLevel: 2,
    description: '从使用工具延伸到判断工具质量。'
  }),
  makeVideo({
    id: 'video-ai-product-thinking',
    desc: 'AI 产品经理：从搜索意图到知识画布',
    title: 'AI 产品思考',
    author: '产品画布',
    source: 'video-1',
    duration: 377000,
    digg: 7600,
    tags: ['AI', '产品', '知识画布'],
    summary: '解释为什么视频推荐可以从信息流升级为知识图谱。',
    branch: '产品方法',
    relevanceScore: 57,
    distanceLevel: 3,
    description: '贴近 TikCanvas 自身定位，适合做产品方法论分支。'
  }),
  makeVideo({
    id: 'video-automation-stack',
    desc: '自动化工具栈：Webhook、脚本和 Agent 如何串起来',
    title: '自动化工具栈',
    author: '低代码工程',
    source: 'video-3',
    duration: 433000,
    digg: 6900,
    tags: ['自动化', 'Webhook', '工具'],
    summary: '从触发器、任务编排和错误恢复理解自动化链路。',
    branch: '工具生态',
    relevanceScore: 49,
    distanceLevel: 3,
    description: '离 Claude 稍远，但能补齐 Agent 落地所需的外部工具。'
  }),
  makeVideo({
    id: 'video-edge-ai',
    desc: '端侧 AI：把模型能力带到本地设备',
    title: '端侧 AI',
    author: '硬件与模型',
    source: 'video-1',
    duration: 459000,
    digg: 6100,
    tags: ['AI', 'IoT', '端侧'],
    summary: '介绍端侧模型、隐私和低延迟场景。',
    branch: '远端延伸',
    relevanceScore: 36,
    distanceLevel: 4,
    description: '从云端 Agent 继续延伸到设备侧智能，相关性更低。'
  }),
  makeVideo({
    id: 'video-iot-agent',
    desc: 'IoT Agent：让设备根据上下文自动行动',
    title: 'IoT Agent',
    author: '智能硬件课',
    source: 'video-2',
    duration: 489000,
    digg: 5400,
    tags: ['IoT', 'Agent', '传感器'],
    summary: '把传感器、状态机和模型决策串成设备 Agent。',
    branch: '远端延伸',
    relevanceScore: 34,
    distanceLevel: 4,
    description: '这是从 Claude 到 IoT 的远端知识分支。'
  }),
  makeVideo({
    id: 'video-privacy-sandbox',
    desc: 'AI 隐私沙盒：数据边界、权限和本地化',
    title: 'AI 隐私沙盒',
    author: '安全架构师',
    source: 'video-3',
    duration: 352000,
    digg: 4800,
    tags: ['安全', '隐私', 'AI'],
    summary: '围绕权限、脱敏和本地处理理解 AI 产品安全边界。',
    branch: '治理边界',
    relevanceScore: 31,
    distanceLevel: 4,
    description: '作为较远端补充节点，帮助画布保留知识谱系外沿。'
  })
]
