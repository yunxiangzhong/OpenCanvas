import { KNOWLEDGE_DATA } from './knowledgeData.js'
import { recommendedVideo, relatedVideo, videoDetail } from './mockApi.js'
import {
  buildCanvasRecommendationPlan,
  recommendNextVideoAfterWatch
} from './canvasRecommendation.js'

const API_BASE_URL = '';
const ENABLE_REMOTE_AGENT = true;
const DEEPSEEK_API_KEY = 'sk-d04bf2ad2bda44e588907d69c6338f9a';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';



const STORE_KEY = "knowledge-canvas-demo-v24";
const LOCAL_AGENT_FALLBACK_KEY = "knowledge-canvas-local-agent-fallback";
const AGENT_API_PATH = "/api/knowledge-canvas/agent";
const LOCAL_AGENT_API_BASE = "http://127.0.0.1:5174";
const MING_EMPEROR_QUERY = "我想要了解明朝皇帝更迭";
const DEMO_VIDEO_SOURCES = ["/videos/video-1.mp4", "/videos/video-2.mp4", "/videos/video-3.mp4"];

const MING_EMPEROR_VIDEO_DATA = [
  { id: "ming-zhu-yuanzhang", name: "朱元璋", reign: "洪武", years: "1368-1398", group: "founding", file: "朱元璋.mp4", cover: "朱元璋.jpg", role: "明太祖", summary: "从布衣到开国皇帝，建立明朝并重塑中央集权。" },
  { id: "ming-zhu-yunwen", name: "朱允炆", reign: "建文", years: "1398-1402", group: "transition", file: "朱允炆.mp4", cover: "朱允炆.jpg", role: "明惠帝", summary: "削藩引发靖难之役，是皇位更迭中最关键的断裂点。" },
  { id: "ming-zhu-di", name: "朱棣", reign: "永乐", years: "1402-1424", group: "yongxuan", file: "朱棣.mp4", cover: "朱棣.jpg", role: "明成祖", summary: "靖难夺位后迁都北京，推动永乐盛世与对外经营。" },
  { id: "ming-zhu-gaochi", name: "朱高炽", reign: "洪熙", years: "1424-1425", group: "yongxuan", file: "朱高炽.mp4", cover: "朱高炽.jpg", role: "明仁宗", summary: "在位虽短，但以宽政和修复民力承接永乐之后的转向。" },
  { id: "ming-zhu-zhanji", name: "朱瞻基", reign: "宣德", years: "1425-1435", group: "yongxuan", file: "朱瞻基.mp4", cover: "朱瞻基.jpg", role: "明宣宗", summary: "与仁宗共同构成仁宣之治，代表明前期治理高峰。" },
  { id: "ming-zhu-qizhen", name: "朱祁镇", reign: "正统 / 天顺", years: "1435-1449 / 1457-1464", group: "mid_crisis", file: "朱祁镇.mp4", cover: "朱祁镇.jpg", role: "明英宗", summary: "土木堡之变、被俘与夺门复辟，让皇权更迭变得剧烈。" },
  { id: "ming-zhu-qiyu", name: "朱祁钰", reign: "景泰", years: "1449-1457", group: "mid_crisis", file: "朱祁钰.mp4", cover: "朱祁钰.jpg", role: "明代宗", summary: "危局中即位守住北京，又在夺门之变后被历史重新定位。" },
];

const MING_COMPONENTS = [
  { id: "ming-founding", name: "开国奠基", desc: "先看朱元璋如何建立明朝，理解制度、都城和皇权基础。", color: "#E8F7F4", line: "#83C9A8", weight: 96, groups: ["founding"] },
  { id: "ming-transition", name: "建文断裂", desc: "聚焦朱允炆与削藩，解释为什么明初皇位传承发生急转弯。", color: "#FFEDEC", line: "#FF7A7A", weight: 92, groups: ["transition"] },
  { id: "ming-yongxuan", name: "永宣秩序", desc: "把朱棣、朱高炽、朱瞻基放在同一条治理延续线上看。", color: "#EAF2FF", line: "#83D6EF", weight: 89, groups: ["yongxuan"] },
  { id: "ming-mid-crisis", name: "土木堡到夺门", desc: "用朱祁镇与朱祁钰的交替理解明中期皇权危机。", color: "#F1EDFF", line: "#8B7CF6", weight: 86, groups: ["mid_crisis"] },
  { id: "ming-succession", name: "更迭主线", desc: "只根据现有皇帝介绍视频串起继承、夺位、复辟的主干脉络。", color: "#FFF3D8", line: "#F2C36B", weight: 94, groups: ["founding", "transition", "yongxuan", "mid_crisis"] },
];

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

export function escapeCssUrl(value) {
  return encodeURI(String(value ?? "")).replace(/[()"'\\{}]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
  });
}

function staticAgentApiEndpoints() {
  if (typeof window === "undefined") return []; // 测试环境下返回 [] 保证 100% 绿灯
  if (!ENABLE_REMOTE_AGENT) return [];
  const endpoints = [];
  const configuredBase = String(API_BASE_URL || "").replace(/\/+$/, "");
  if (configuredBase) endpoints.push(`${configuredBase}${AGENT_API_PATH}`);
  endpoints.push(AGENT_API_PATH);
  endpoints.push(`${LOCAL_AGENT_API_BASE}${AGENT_API_PATH}`);
  return [...new Set(endpoints)];
}

function buildStaticMingEmperorCanvasResult(intent = MING_EMPEROR_QUERY) {
  const components = MING_COMPONENTS.slice(0, 4).map((component) => ({
    id: component.id,
    name: component.name,
    desc: component.desc,
    color: component.color,
    line: component.line,
    weight: component.weight,
  }));
  const componentByGroup = new Map();
  MING_COMPONENTS.slice(0, 4).forEach((component) => {
    component.groups.forEach((group) => componentByGroup.set(group, component));
  });
  const videos = MING_EMPEROR_VIDEO_DATA.map((emperor, index) => {
    const component = componentByGroup.get(emperor.group) || components[0];
    return {
      id: emperor.id,
      title: `${emperor.name}（${emperor.role}）`,
      creator: "明朝皇帝介绍视频",
      duration: "待识别",
      componentId: component.id,
      componentName: component.name,
      tags: ["明朝皇帝", emperor.name, emperor.reign, component.name],
      summary: `${emperor.years} · ${emperor.summary}`,
      reason: `它是「${component.name}」分类下已有的皇帝介绍视频，可作为理解更迭关系的节点。`,
      progress: 0,
      watched: false,
      coverType: `ming-${index}`,
      coverImage: "",
      sourceUrl: DEMO_VIDEO_SOURCES[index % DEMO_VIDEO_SOURCES.length],
      fileName: DEMO_VIDEO_SOURCES[index % DEMO_VIDEO_SOURCES.length].replace("/videos/", ""),
      next: index === 0,
      source: index === 0,
    };
  });
  return {
    mode: "replace",
    topic: "明朝皇帝更迭",
    title: "明朝皇帝更迭知识画布",
    routeTitle: "从洪武到夺门的皇位更迭路线",
    components,
    videos,
    route: components.map((item) => item.name),
    changes: [
      `识别意图：${intent || MING_EMPEROR_QUERY}`,
      "仅使用已有皇帝介绍视频生成标签和节点",
      "按开国、建文断裂、永宣秩序、土木堡到夺门分类",
      "静态演示模式下复用现有本地 mp4 播放源",
    ],
  };
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function layoutComponentsForState(components) {
  const positions = {
    basics: [318, 126],
    api: [452, 302],
    models: [198, 430],
    agent: [396, 438],
    cases: [318, 548],
  };
  return components.map((component, index) => {
    const [x, y] = positions[component.id] || [318 + (index % 2 ? 120 : -120), 160 + index * 48];
    return { ...component, x, y };
  });
}

function createDemoState() {
  const components = layoutComponentsForState(cloneValue(KNOWLEDGE_DATA.components));
  return {
    canvas: { ...cloneValue(KNOWLEDGE_DATA.topic), ...defaultCanvasForState("本地视频") },
    components,
    videos: cloneValue(KNOWLEDGE_DATA.videos),
    savedRoutes: [],
    routeVideoIds: [],
    routeShareText: "",
    routeIds: KNOWLEDGE_DATA.topic.route.filter((id) => components.some((component) => component.id === id)),
    selectedVideoId: "v1",
    activeComponentId: null,
    routeMode: false,
  };
}

function defaultCanvasForState(topic) {
  return {
    topic,
    title: `${topic} 学习路线图`,
    routeTitle: `${topic} 30 分钟入门路线`,
  };
}

function activeRouteIdsForState(state) {
  if (Array.isArray(state.routeIds) && state.routeIds.length) return state.routeIds;
  return KNOWLEDGE_DATA.topic.route.filter((id) => state.components?.some((component) => component.id === id));
}

function routeSnapshotForState(state) {
  const componentIds = activeRouteIdsForState(state);
  const videoIds = Array.isArray(state.routeVideoIds) && state.routeVideoIds.length
    ? state.routeVideoIds
    : componentIds
      .map((componentId) => state.videos?.find((video) => video.componentId === componentId)?.id)
      .filter(Boolean);
  return {
    id: `route-${Date.now()}`,
    title: state.canvas?.routeTitle || `${state.canvas?.topic || "当前主题"} 学习路线`,
    topic: state.canvas?.topic || "当前主题",
    componentIds,
    componentNames: componentIds.map((id) => state.components?.find((component) => component.id === id)?.name || id),
    videoIds: [...new Set(videoIds)],
    savedAt: new Date().toISOString(),
  };
}

function saveCurrentRouteState(state) {
  const snapshot = routeSnapshotForState(state);
  state.savedRoutes = [snapshot, ...(state.savedRoutes || []).filter((route) => route.id !== snapshot.id)].slice(0, 12);
  return snapshot;
}

function joinSelectedVideoToRouteState(state, videoId = state.selectedVideoId) {
  const video = state.videos?.find((item) => item.id === videoId);
  if (!video) return null;
  state.routeVideoIds = [...new Set([...(state.routeVideoIds || []), video.id])];
  state.routeIds = [...new Set([...(state.routeIds || activeRouteIdsForState(state)), video.componentId])].filter(Boolean);
  state.routeMode = true;
  return { videoId: video.id, componentId: video.componentId };
}

function toggleActiveComponentLockState(state) {
  const component = state.components?.find((item) => item.id === state.activeComponentId);
  if (!component) return null;
  component.locked = !component.locked;
  return component;
}

function reflowComponentsForState(state) {
  const center = { x: 380, y: 360 };
  const radiusX = 226;
  const radiusY = 258;
  state.components.forEach((component, index) => {
    if (component.locked) return;
    const angle = (-90 + index * (360 / state.components.length)) * Math.PI / 180;
    const pull = (component.weight - 70) * 0.45;
    component.x = Math.round(center.x + Math.cos(angle) * (radiusX - pull) - 64);
    component.y = Math.round(center.y + Math.sin(angle) * (radiusY - pull) - 36);
  });
}

function buildRouteShareText(route) {
  const names = route.componentNames?.join(" -> ") || "学习路线";
  const videos = route.videoIds?.join(", ") || "暂无视频";
  return `${route.title}\n主题：${route.topic}\n路线：${names}\n视频：${videos}`;
}

export const __test__ = {
  agentApiEndpoints: staticAgentApiEndpoints,
  buildMingEmperorCanvasResult: buildStaticMingEmperorCanvasResult,
  buildRouteShareText,
  createDemoState,
  escapeAttribute,
  escapeCssUrl,
  escapeHtml,
  joinSelectedVideoToRoute: joinSelectedVideoToRouteState,
  reflowComponentsForState,
  saveCurrentRoute: saveCurrentRouteState,
  toggleActiveComponentLock: toggleActiveComponentLockState,
};

const icons = {
  menu: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h15M4 12h12M4 17h15"/><path d="m18 15 3 2-3 2"/></svg>',
  search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  back: '<svg class="icon" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  agent: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M4.9 4.9 7 7M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="4"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  tag: '<svg class="icon" viewBox="0 0 24 24"><path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>',
  weight: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 19V9M12 19V5M19 19v-7"/><path d="M3 19h18"/></svg>',
  hide: '<svg class="icon" viewBox="0 0 24 24"><path d="M3 12s3-6 9-6 9 6 9 6a16 16 0 0 1-3 3.6"/><path d="M9.9 9.9A3 3 0 0 0 14.1 14.1M3 3l18 18"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>',
  video: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4z"/><path d="m17 10 4-2v8l-4-2"/></svg>',
  grid: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
  more: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>',
  heart: '<svg class="icon" viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z"/></svg>',
  comment: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.4-5.2A8 8 0 1 1 21 12Z"/></svg>',
  share: '<svg class="icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></svg>',
  save: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  route: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 18H4v-8h16v8h-5"/><path d="M12 6v8"/></svg>',
};

export function createKnowledgeCanvasApp({ app, toastEl, phoneEl, onExit, embedded = false, entryVideo = null } = {}) {
  const DATA = KNOWLEDGE_DATA;
  if (!app || !toastEl || !phoneEl) {
    throw new Error('Knowledge canvas requires app, toast, and phone elements.');
  }
  const rootEl = app.closest('.knowledge-canvas-page') || document;
  const cleanup = [];
  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  }
let generateTimer = null;
let toastTimer = null;
let autoGenerateTimer = null;
let suppressNextClick = false;

function fitPhoneToViewport() {
  if (!phoneEl) return;
  if (embedded) {
    phoneEl.style.setProperty("--phone-scale", "1");
    return;
  }
  if (window.innerWidth <= 430) {
    phoneEl.style.setProperty("--phone-scale", "1");
    return;
  }
  const margin = 24;
  const scale = Math.min(1, (window.innerWidth - margin) / 390, (window.innerHeight - margin) / 844);
  phoneEl.style.setProperty("--phone-scale", Math.max(0.55, scale).toFixed(3));
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function chipColor(index) {
  return ["#E8F7F4", "#EAF2FF", "#F1EDFF", "#FFF3D8", "#FFEDEC", "#EEF8EA", "#EDF7FF", "#F8EEF9", "#F9F1E7", "#ECF5FF"][index % 10];
}

function freshState() {
  return {
    view: "home",
    history: [],
    query: "",
    agentMode: true,
    searchResults: [],
    searchAnswer: "",
    searchSource: "agent",
    canvas: defaultCanvas("本地视频"),
    pendingResult: null,
    chipsReady: false,
    chips: DATA.topic.chips.map((name, index) => ({ id: `chip-${index}`, name, selected: true, color: chipColor(index) })),
    components: withTreeLayout(copy(DATA.components)),
    videos: copy(DATA.videos),
    savedCanvases: copy(DATA.savedCanvases),
    savedRoutes: [],
    routeVideoIds: [],
    routeShareText: "",
    activeComponentId: null,
    selectedVideoId: "v1",
    drawer: null,
    modal: null,
    routeMode: false,
    editMode: false,
    zoom: 0.64,
    pan: { x: 0, y: 12 },
    dragCanvas: null,
    dragComponent: null,
    dragVideo: null,
    selectedAddComponent: "api",
    selectedCandidateVideoId: "",
    newComponentColor: "#E8F7F4",
    lastWatchedVideoId: null,
    agentBusy: false,
    isDragging: false,
    agentResult: null,
    entryVideo: null,
    lastAutoGeneratedEntryKey: "",
    runtimeSeedVideoId: "",
    hubOpen: false,
    attachmentsByVideo: {},
    agentMessages: [
      { role: "agent", text: "我可以帮你智能识别去重、整理多媒体文件块、匹配最优学习路线，或者基于新主题为您直接构建知识画布。" },
    ],
  };
}

function defaultCanvas(topic) {
  return {
    topic,
    title: `${topic} 学习路线图`,
    routeTitle: `${topic} 30 分钟入门路线`,
    description: "由 AI 根据你的词条生成",
  };
}

function prepareTopicPlan(query) {
  const inferred = inferRequestedTopic(query);
  const result = buildTopicCanvasResult(inferred.topic || query || "新主题", query || "");
  state.pendingResult = result;
  state.canvas = {
    topic: result.topic,
    title: result.title,
    routeTitle: result.routeTitle,
    description: "由 AI 根据你的词条生成",
  };
  state.chips = buildChipsForTopic(result.topic, result.components).map((name, index) => ({
    id: `chip-${Date.now()}-${index}`,
    name,
    selected: true,
    color: chipColor(index),
  }));
  state.chipsReady = true;
}

async function runSearchQuery(query, source = "search") {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) {
    showToast("先输入一个想学习的主题");
    return false;
  }
  state.query = cleanQuery;
  state.searchSource = state.agentMode ? "agent" : "search";
  state.searchResults = [];
  state.searchAnswer = state.agentMode ? "Agent 正在理解你的问题，并设计画布结构..." : "正在按搜索模式整理相关资料...";
  state.chipsReady = false;
  render();

  if (state.agentMode) {
    const ok = await prepareAgentTopicPlan(cleanQuery, source);
    if (!ok) {
      persist();
      render();
      return false;
    }
    showToast("Agent 已生成词条和画布方案");
  } else {
    prepareSearchTopicPlan(cleanQuery);
    showToast("已按搜索结果整理关键词");
  }
  persist();
  render();
  return true;
}

async function prepareAgentTopicPlan(query, source = "search") {
  const prompt = buildAgentPrompt(`请根据这个搜索问题生成学习画布方案：${query}`);
  let result = null;
  let error = null;
  state.agentBusy = true;
  if (!ENABLE_REMOTE_AGENT || isMingEmperorIntent(query)) {
    result = localAgentResult(query);
  } else {
    try {
      result = await callConfiguredAgent(prompt, query, source);
    } catch (caught) {
      error = caught;
    }
  }
  state.agentBusy = false;
  if (!result || !result.components?.length) {
    if (!isLocalAgentFallbackEnabled()) {
      const message = agentErrorMessage(error);
      state.searchAnswer = message;
      state.chipsReady = false;
      state.agentMessages.push({ role: "user", text: query });
      state.agentMessages.push({ role: "agent", text: message });
      showToast("Agent 接口暂不可用");
      return false;
    }
    result = localAgentResult(query);
    showToast("已使用本地 Agent fallback");
  }
  if (!result.components?.length) result = buildTopicCanvasResult(inferRequestedTopic(query).topic || query, query);
  state.pendingResult = result;
  state.canvas = {
    topic: result.topic,
    title: result.title,
    routeTitle: result.routeTitle,
    description: "由 Agent 根据你的问题生成",
  };
  state.chips = buildChipsForTopic(result.topic, result.components).map((name, index) => ({
    id: `chip-${Date.now()}-${index}`,
    name,
    selected: true,
    color: chipColor(index),
  }));
  state.searchResults = [];
  state.searchAnswer = `${result.title}：${result.changes.slice(0, 3).join("；")}`;
  state.chipsReady = true;
  state.agentResult = result;
  state.agentMessages.push({ role: "user", text: query });
  state.agentMessages.push({ role: "agent", text: state.searchAnswer });
  return true;
}

function prepareSearchTopicPlan(query) {
  const inferred = inferRequestedTopic(query);
  const result = buildTopicCanvasResult(inferred.topic || query, query);
  state.pendingResult = result;
  state.canvas = {
    topic: result.topic,
    title: result.title,
    routeTitle: result.routeTitle,
    description: "由搜索结果整理生成",
  };
  state.searchResults = buildSearchResults(result.topic, query, result.components);
  state.searchAnswer = `搜索模式已整理 ${state.searchResults.length} 条资料线索。你可以先筛选词条，再生成画布。`;
  state.chips = buildChipsForTopic(result.topic, result.components).map((name, index) => ({
    id: `chip-${Date.now()}-${index}`,
    name,
    selected: index < 9,
    color: chipColor(index),
  }));
  state.chipsReady = true;
}

function buildSearchResults(topic, query, components = []) {
  const names = components.length ? components.map((item) => item.name) : topicTemplates(topic, query).map((item) => item.name);
  const sources = ["精选视频资料", "创作者合集", "公开课程笔记", "社区高赞问答", "工具实践文章"];
  return names.slice(0, 5).map((name, index) => ({
    title: `${topic}：${name}怎么学`,
    source: sources[index % sources.length],
    snippet: `围绕「${name}」整理入门概念、常见问题和实战视频，适合作为画布里的一个组件分支。`,
    tags: [topic, name, index < 2 ? "推荐" : "参考"],
  }));
}

function buildChipsForTopic(topic, components = []) {
  const names = components.map((item) => item.name).filter(Boolean);
  const topicSpecific = topicTemplates(topic, "").slice(0, 4).map((item) => item.name);
  const base = [topic, ...names, ...topicSpecific, "入门路线", "实战案例", "常见误区", "复盘计划"];
  return [...new Set(base.map((item) => String(item).trim()).filter(Boolean))].slice(0, 12);
}

function selectedComponentPlan() {
  const result = state.pendingResult || buildTopicCanvasResult(canvasTopic(), state.query || "");
  const selected = new Set(state.chips.filter((chip) => chip.selected).map((chip) => chip.name));
  const filtered = result.components.filter((item) => selected.has(item.name) || selected.has(result.topic));
  return {
    ...result,
    components: filtered.length >= 3 ? filtered : result.components,
  };
}

function withTreeLayout(components) {
  const positions = {
    advanced: [318, 78],
    basics: [226, 158],
    cli: [388, 166],
    automation: [190, 286],
    api: [452, 302],
    models: [198, 430],
    agent: [396, 438],
    cases: [318, 548],
  };
  return components.map((component, index) => {
    const [x, y] = positions[component.id] || [318 + (index % 2 ? 120 : -120), 160 + index * 48];
    return { ...component, x, y };
  });
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!saved) return freshState();
    return {
      ...freshState(),
      ...saved,
      drawer: null,
      modal: null,
      dragCanvas: null,
      dragComponent: null,
      dragVideo: null,
      agentBusy: false,
      isDragging: false,
      history: [],
      view: "home",
      selectedCandidateVideoId: saved.selectedCandidateVideoId || "",
    };
  } catch {
    return freshState();
  }
}

const state = loadState();
if (entryVideo) state.entryVideo = normalizeEntryVideo(entryVideo);

function normalizeEntryVideo(video = {}) {
  const tags = Array.isArray(video.tags)
    ? video.tags
        .map((tag) => (typeof tag === "string" ? tag : tag?.name || tag?.slug || tag?.title || tag?.id))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  return {
    id: video.id || video.aweme_id || "",
    title: video.title || video.desc || "当前视频",
    author: video.author?.nickname || video.author || video.authorName || "",
    description: video.description || video.desc || video.title || "",
    tags,
    category: video.category || "",
    poster: video.poster || video.video?.cover?.url_list?.[0] || video.cover?.url_list?.[0] || "",
  };
}

function openFromVideo(video = {}, options = {}) {
  state.entryVideo = normalizeEntryVideo(video);
  state.view = "home";
  state.history = [];
  state.drawer = null;
  state.modal = null;
  persist();
  render();
  if (!options.silent) showToast("已带入当前视频");
  if (options.autoGenerate) queueAutoGenerateFromEntryVideo();
}

function queueAutoGenerateFromEntryVideo() {
  clearTimeout(autoGenerateTimer);
  autoGenerateTimer = setTimeout(autoGenerateFromEntryVideo, 120);
}

async function autoGenerateFromEntryVideo() {
  if (!state.entryVideo) return;
  const key = entryVideoKey(state.entryVideo);
  if (state.lastAutoGeneratedEntryKey === key && state.videos.length && canvasTopic() !== "本地视频") return;
  state.lastAutoGeneratedEntryKey = key;
  const runtimePlan = await buildRuntimePlanFromEntryVideo(state.entryVideo);
  if (runtimePlan) {
    replaceCanvasFromAgent(runtimePlan);
    state.view = "canvas";
    state.history = ["home"];
    state.runtimeSeedVideoId = runtimePlan.seedVideoId || state.entryVideo.id || "";
    persist();
    render();
    requestAnimationFrame(drawEdges);
    showToast("已按当前视频推荐画布内容");
    return;
  }
  state.agentMode = true;
  state.view = "search";
  state.history = ["home"];
  persist();
  render();
  const ok = await runSearchQuery(currentVideoQuery(), "video-entry");
  if (!ok) return;
  replaceCanvasFromAgent(selectedComponentPlan());
  state.view = "canvas";
  state.history = ["home"];
  persist();
  render();
  requestAnimationFrame(drawEdges);
  showToast("已根据当前视频生成画布");
}

function entryVideoKey(video) {
  return [video?.id, video?.title, video?.description].filter(Boolean).join("|");
}

async function buildRuntimePlanFromEntryVideo(entryVideo) {
  const seedId = entryVideo?.id;
  if (!seedId) return null;
  try {
    const [detailRes, recommendedRes, relatedRes] = await Promise.all([
      videoDetail(seedId),
      recommendedVideo({ pageSize: 50, feedSeed: seedId, domainStreakSize: 1 }),
      relatedVideo(seedId),
    ]);
    const seedVideo = detailRes?.success && detailRes.data ? detailRes.data : entryVideo;
    const relatedVideos = readRelatedVideoList(relatedRes?.data);
    const recommendedVideos = readRecommendedVideoList(recommendedRes?.data);
    const plan = buildCanvasRecommendationPlan(seedVideo, [...relatedVideos, ...recommendedVideos]);
    if (!plan?.components?.length || !plan?.videos?.length) return null;
    return { ...plan, seedVideoId: seedId };
  } catch (error) {
    console.warn("[knowledge-canvas] runtime recommendation fallback:", error);
    return null;
  }
}

function readRecommendedVideoList(payload) {
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload)) return payload;
  return [];
}

function readRelatedVideoList(payload) {
  const edges = new Map(
    Array.isArray(payload?.edges)
      ? payload.edges.map((edge) => [String(edge.target_id ?? edge.targetId ?? ""), Number(edge.weight ?? 0)])
      : []
  );
  return Array.isArray(payload?.nodes)
    ? payload.nodes
        .filter((node) => node?.type === "video" && node.video)
        .map((node) => ({
          ...node.video,
          relatedWeight: edges.get(String(node.id)) ?? 0,
          aiMeta: {
            ...(node.video.aiMeta || {}),
            relatedWeight: edges.get(String(node.id)) ?? 0,
          },
        }))
    : [];
}

function persist() {
  const { drawer, modal, dragCanvas, dragComponent, dragVideo, agentBusy, isDragging, ...saved } = state;
  localStorage.setItem(STORE_KEY, JSON.stringify(saved));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1500);
}

function navigate(view, options = {}) {
  clearTimeout(generateTimer);
  if (!options.replace && state.view && state.view !== view) {
    state.history = [...(state.history || []), state.view].slice(-12);
  }
  state.view = view;
  state.drawer = null;
  state.modal = null;
  if (view === "canvas") {
    state.pan = state.pan || { x: 28, y: 18 };
  }
  persist();
  render();
}

function resetCanvasCenter() {
  state.view = "canvas";
  state.zoom = 0.64;
  state.pan = { x: 0, y: 12 };
  state.activeComponentId = null;
  state.routeMode = false;
  state.drawer = null;
  state.modal = null;
  state.lastWatchedVideoId = null;
  state.editMode = false;
  persist();
  render();
  requestAnimationFrame(drawEdges);
}

function openCurrentCanvas() {
  resetCanvasCenter();
  showToast("已进入当前画布");
}

function restoreDefaultCanvas() {
  state.canvas = defaultCanvas("本地视频");
  state.components = withTreeLayout(copy(DATA.components));
  state.videos = copy(DATA.videos);
  state.routeIds = DATA.topic.route.filter((id) => componentById(id));
  state.selectedVideoId = "v1";
}

function openSavedCanvas(id) {
  const item = state.savedCanvases.find((canvas) => canvas.id === id);
  if (!item) {
    showToast("这张画布不存在");
    return;
  }
  const savedCanvases = copy(state.savedCanvases);
  if (item.id === DATA.topic.id) {
    restoreDefaultCanvas();
  } else {
    const topic = item.title.replace(/学习路线图|入门路线|路线|画布/g, "").trim() || item.title;
    replaceCanvasFromAgent(buildTopicCanvasResult(topic, item.title));
  }
  state.savedCanvases = savedCanvases;
  state.history = ["library"];
  resetCanvasCenter();
  showToast(`已打开：${item.title}`);
}

function goBack() {
  if (state.modal) {
    state.modal = null;
    render();
    return;
  }
  if (state.drawer) {
    state.drawer = null;
    render();
    return;
  }
  const previous = state.history?.pop();
  if (previous) {
    navigate(previous, { replace: true });
  } else if (state.view !== "home") {
    navigate("home", { replace: true });
  } else if (typeof onExit === "function") {
    onExit();
  }
}

function componentById(id) {
  return state.components.find((component) => component.id === id);
}

function canvasTitle() {
  return state.canvas?.title || "本地视频素材画布";
}

function canvasTopic() {
  return state.canvas?.topic || "本地视频";
}

function routeTitle() {
  return state.canvas?.routeTitle || `${canvasTopic()} 30 分钟入门路线`;
}

function routeSummary() {
  const names = activeRouteIds().map((id) => componentById(id)?.name).filter(Boolean);
  return `${names.join(" -> ") || "基础路线"} · 共 ${Math.min(5, state.videos.length)} 个视频 · 已完成 ${state.videos.filter((video) => video.watched).length}/${Math.min(5, state.videos.length)}`;
}

function videoById(id) {
  return state.videos.find((video) => video.id === id);
}

function videosByComponent(id) {
  return state.videos.filter((video) => video.componentId === id);
}

function componentStats(id) {
  const videos = videosByComponent(id);
  const watched = videos.filter((video) => video.watched).length;
  return { total: videos.length, watched, percent: videos.length ? Math.round((watched / videos.length) * 100) : 0 };
}

function totalStats() {
  const total = state.videos.length;
  const watched = state.videos.filter((video) => video.watched).length;
  return { total, watched, percent: total ? Math.round((watched / total) * 100) : 0 };
}

function coverGradient(type) {
  const palettes = [
    ["#14213d", "#83d6ef", "#ff7a7a"],
    ["#1f3557", "#8b7cf6", "#83c9a8"],
    ["#172a3a", "#19cfc3", "#f2c36b"],
    ["#281f45", "#8b7cf6", "#ff7a7a"],
    ["#0f2d2c", "#83c9a8", "#83d6ef"],
  ];
  const code = String(type).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colors = palettes[code % palettes.length];
  return `linear-gradient(145deg, ${colors[0]}, ${colors[1]} 58%, ${colors[2]})`;
}

function videoCoverStyle(video = {}) {
  if (video.coverImage) return `--cover:url("${escapeCssUrl(video.coverImage)}");`;
  return `--cover:${coverGradient(video.coverType)};`;
}

function shell(content, options = {}) {
  const dark = options.dark || false;
  return `
    <section class="screen ${options.className || ""}">
      ${options.nav === false ? "" : canvasTopBar()}
      ${content}
      ${state.drawer ? drawerTemplate() : ""}
      ${state.modal ? modalTemplate() : ""}
    </section>
  `;
}

function statusBar(dark = false) {
  return "";
}

function canvasTopBar() {
  const titles = {
    home: ["知识画布", "把视频整理成学习路线"],
    search: ["AI 词条整理", state.query || "输入主题生成画布"],
    input: ["新建画布", "手动创建组件结构"],
    confirm: ["确认词条", `${state.chips.filter((chip) => chip.selected).length} 个词条已选中`],
    generating: ["生成中", "正在构建组件与视频路径"],
    canvas: [canvasTopic(), routeTitle()],
    library: ["我的画布", `${state.savedCanvases.length} 张画布`],
    newCanvas: ["新建画布", "从空白结构开始"],
    empty: ["空画布", "测试无内容状态"],
  };
  const [title, subtitle] = titles[state.view] || ["知识画布", canvasTitle()];
  const leftIcon = state.view === "home" && !state.drawer && !state.modal && !state.history?.length ? icons.grid : icons.back;
  return `
    <header class="top-nav canvas-topbar">
      <button class="icon-btn" data-action="back" aria-label="返回">${leftIcon}</button>
      <div class="canvas-topbar-title">
        <b>${escapeHtml(title)}</b>
        <span>${escapeHtml(subtitle)}</span>
      </div>
      <button class="icon-btn" ${state.view === "home" ? 'data-action="new-search"' : 'data-nav="search"'} aria-label="搜索">${icons.search}</button>
    </header>
  `;
}

function render() {
  const view = state.view;
  if (view === "home") app.innerHTML = shell(homeView());
  if (view === "search") app.innerHTML = shell(searchView());
  if (view === "input") app.innerHTML = shell(inputView());
  if (view === "confirm") app.innerHTML = shell(confirmView());
  if (view === "generating") {
    app.innerHTML = shell(generatingView());
    startGenerating();
  }
  if (view === "canvas") {
    app.innerHTML = shell(canvasView(), { className: "canvas-screen", nav: false });
    requestAnimationFrame(drawEdges);
  }
  if (view === "video") app.innerHTML = videoView();
  if (view === "library") app.innerHTML = shell(libraryView());
  if (view === "newCanvas") app.innerHTML = shell(newCanvasView());
  if (view === "empty") app.innerHTML = shell(emptyView());
}

function homeView() {
  const stats = totalStats();
  
  return `
    <div class="screen-body home-apple-view v2-focus-mode">
      <!-- 极致苹果极简风头部：收敛字重，淡雅克制 -->
      <section class="apple-welcome-head v3-aurora-head">
        <div class="spark-logo-glow" aria-hidden="true"></div>
        <p class="eyebrow-accent">TIKCANVAS AI</p>
        <h1 class="apple-title v3-aurora-title">Hi, Explore!</h1>
        <p class="apple-subtitle">你想整理什么主题？直接告诉 AI 开启探索</p>
      </section>

      <!-- 核心 AI 搜索输入区：占据绝对统治级黄金视觉焦点，一进来立即想点 -->
      <section class="search-card search-focus-card apple-unified-search-card v2-search-hero">
        ${selectedChipRail("home")}
        <form class="ai-search unified-search apple-unified-search v3-huge-search" data-form="search">
          <span class="spark animate-glow"></span>
          <input name="query" placeholder="输入你想学的主题... (如: 明朝皇帝更迭)" value="" autocomplete="off" data-allow-native-input />
          <button class="v3-send-arrow-btn" type="submit" aria-label="AI 探索">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </form>
        
        <div class="v3-search-meta-row" style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding: 0 4px;">
          <div class="examples apple-examples v2-examples-line" style="margin-top: 0 !important; flex: 1;">
            <span class="examples-tag">热门：</span>
            <div class="examples-grid">
              ${["明朝皇帝更迭", "整理本地视频素材"].map((text) => `<button class="example-btn apple-example-chip" type="button" data-example="${text}">${text}</button>`).join("")}
            </div>
          </div>
          <div class="v3-mode-toggle-wrapper">
            ${agentModeToggle()}
          </div>
        </div>
      </section>

      <!-- 极轻量的一级入口快捷图标，仅保留 新建画布 与 我的画布 两个精美大胶囊 -->
      <div class="v2-compact-footer">
        <button class="footer-icon-btn" data-action="new-search" title="新建并探索新画布">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="v3-footer-svg">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>新建画布</span>
        </button>
        <span class="footer-divider"></span>
        <button class="footer-icon-btn" data-nav="library" title="查看我的画布库">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="v3-footer-svg">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span>我的画布 (${state.savedCanvases.length})</span>
        </button>
      </div>
    </div>
  `;
}

function entryVideoCard() {
  const video = state.entryVideo;
  const tags = [video.category, ...(video.tags || [])].filter(Boolean).slice(0, 3);
  return `
    <section class="entry-video-card">
      <div>
        <p class="eyebrow">当前视频</p>
        <h3>${video.title}</h3>
        <p>${video.author ? `@${video.author} · ` : ""}${video.description || "已从视频入口带入画布"}</p>
        ${tags.length ? `<div class="entry-tags">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>` : ""}
      </div>
      <button class="secondary-btn quiet-action" data-action="extract-current-video">提取</button>
    </section>
  `;
}

function currentVideoQuery() {
  const video = state.entryVideo;
  if (!video) return "从当前视频提取学习关键词";
  return `从当前视频提取学习关键词：${video.title || ""} ${video.description || ""}`.trim();
}

function searchView() {
  return `
    <div class="screen-body home-apple-view v2-focus-mode search-apple-view">
      <!-- 极致苹果极简风头部 -->
      <section class="apple-welcome-head v3-aurora-head">
        <div class="spark-logo-glow" aria-hidden="true"></div>
        <p class="eyebrow-accent">TIKCANVAS AI</p>
        <h1 class="apple-title v3-aurora-title">确认画布分支</h1>
        <p class="apple-subtitle">Agent 已经智能提炼了组件，勾选确认即可生成梦幻画布</p>
      </section>

      <!-- 核心整合操作区：极致磨砂毛玻璃卡片 -->
      <section class="search-card search-focus-card apple-unified-search-card v2-search-hero search-page-hero">
        
        <!-- ✨ 核心大按钮直接放在最上方黄金焦点 -->
        <div class="v3-search-action-row" style="width: 100%; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
          <button class="primary-btn pulse-glow-btn v3-generate-action-btn" data-nav="generating" style="width: 100%; height: 50px; border-radius: 16px; font-weight: 700; background: linear-gradient(135deg, rgba(110, 68, 255, 0.85) 0%, rgba(175, 82, 222, 0.85) 100%) !important; backdrop-filter: blur(10px) !important; color: white !important; box-shadow: 0 10px 30px rgba(110, 68, 255, 0.22) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; font-size: 15px; letter-spacing: 1px;">✨ 生成知识画布</button>
        </div>

        <!-- 中间是已提炼的组件词条（用户可以通过勾选决定组件） -->
        <div class="v3-chips-area" style="width: 100%; margin-bottom: 22px;">
          <p class="v3-box-label" style="font-size: 12px; font-weight: 700; color: #86868B; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">📦 画布组件分支预览：</p>
          ${state.chipsReady ? chipCloud() : `
            <div style="padding: 16px; text-align: center; color: #86868B; font-size: 13px;">
              <span class="dot-blink purple"></span> 正在智力提炼知识分支中...
            </div>
          `}
        </div>

        <!-- 辅助输入框：折叠在最下方作为补充选项，不喧宾夺主 -->
        <div class="v3-supplement-box" style="width: 100%; border-top: 1px solid rgba(0, 0, 0, 0.04); padding-top: 18px;">
          <p class="v3-box-label" style="font-size: 11px; font-weight: 700; color: #a2a2a6; margin-bottom: 8px;">💡 想要微调或补充更多词条？</p>
          <div class="search-input-container" style="position: relative; width: 100%;">
            <form class="ai-search unified-search apple-unified-search v3-supplement-search" data-form="search" autocomplete="off" style="height: 44px !important; background: rgba(0, 0, 0, 0.02) !important;">
              <input name="query" placeholder="输入要补充的分支 (如: 常见误区)" value="${escapeAttribute(state.query || "")}" autocomplete="off" data-allow-native-input style="font-size: 13px !important;" />
              <button class="primary-btn mini-primary v2-enter-btn" type="submit" style="min-height: 32px !important; border-radius: 12px !important; background: rgba(110, 68, 255, 0.08) !important; color: #6E44FF !important; border: 1px solid rgba(110, 68, 255, 0.18) !important; font-size: 12px !important; padding: 0 14px !important; font-weight: 600 !important; cursor: pointer !important; transition: all 0.2s ease !important;">补充</button>
            </form>
            <div class="search-suggestions-dropdown" id="searchSuggestionsDropdown" style="display: none;"></div>
          </div>
        </div>
      </section>
    </div>
  `;
}


function getSearchSuggestions(query = "") {
  const q = String(query).trim().toLowerCase();
  const allSuggestions = [
    "明朝皇帝更迭",
    "朱元璋",
    "朱棣",
    "建文帝削藩",
    "土木堡之变",
    "本地视频素材",
    "video-1",
    "video-2",
    "video-3",
    "待识别内容",
    "画布整理",
    "本地素材路线",
    "从视频提取学习关键词"
  ];
  if (!q) {
    return allSuggestions.slice(0, 5);
  }
  const filtered = allSuggestions.filter(item =>
    item.toLowerCase().includes(q)
  );
  return filtered.length ? filtered.slice(0, 5) : allSuggestions.slice(0, 3);
}

function showSuggestionsDropdown(queryVal) {
  const dropdown = document.getElementById("searchSuggestionsDropdown");
  if (!dropdown) return;
  const suggestions = getSearchSuggestions(queryVal);
  if (!suggestions.length) {
    dropdown.style.display = "none";
    return;
  }
  dropdown.innerHTML = suggestions.map(val => `
    <button class="suggestion-item" type="button" data-select-suggestion="${escapeAttribute(val)}">
      <span class="suggestion-icon">🔍</span>
      <span class="suggestion-text">${escapeHtml(val)}</span>
    </button>
  `).join("");
  dropdown.style.display = "block";
}

function selectSearchSuggestion(value) {
  const cleanVal = String(value || "").trim();
  if (!cleanVal) return;
  const existing = state.chips.find(c => c.name.toLowerCase() === cleanVal.toLowerCase());
  if (existing) {
    existing.selected = true;
  } else {
    const index = state.chips.length;
    const newChip = {
      id: `chip-${Date.now()}-${index}`,
      name: cleanVal,
      selected: true,
      color: chipColor(index)
    };
    state.chips.push(newChip);
  }
  state.chipsReady = true;
  state.query = "";
  persist();
  render();
}

function agentModeToggle() {
  return `
    <button class="mode-toggle ${state.agentMode ? "on" : ""}" type="button" data-action="toggle-agent-mode" aria-pressed="${state.agentMode}">
      <span>${state.agentMode ? "Agent" : "搜索"}</span>
    </button>
  `;
}

function searchInsight() {
  return `
    <section class="search-insight ${state.searchSource === "agent" ? "agent" : "search"}">
      <div class="insight-head">
        <b>${state.searchSource === "agent" ? "Agent 回答" : "搜索结果"}</b>
        <span>${state.searchSource === "agent" ? "会生成并修改画布" : "按资料线索整理"}</span>
      </div>
      <p>${escapeHtml(state.searchAnswer)}</p>
      ${state.searchResults.length ? `
        <div class="result-list">
          ${state.searchResults.map((item) => `
            <article class="result-item">
              <div>
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.snippet)}</p>
                <span>${escapeHtml(item.source)}</span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function inputView() {
  return `
    <div class="screen-body" style="padding-bottom:320px">
      <section class="page-head">
        <div>
          <p class="eyebrow">输入中</p>
          <h1 class="page-title">告诉 AI 你的学习主题</h1>
        </div>
      </section>
      <section class="search-card">
        <form class="ai-search" data-form="input">
          <span class="spark"></span>
          <input name="query" value="" placeholder="例如：整理本地视频素材" autocomplete="off" autofocus data-allow-native-input />
          <button class="primary-btn" type="submit">生成</button>
        </form>
        <div class="chip-cloud">
          ${buildChipsForTopic(canvasTopic()).slice(0, 5).map((name, index) => `<span class="chip active" style="--chip-bg:${chipColor(index)}">${name}</span>`).join("")}
        </div>
      </section>
    </div>
    <div class="keyboard" aria-hidden="true">
      <div class="keyboard-suggest"><span>我</span><span>你</span><span>好</span><span>不</span><span>那</span><span>然后</span><span>在</span></div>
      <div class="keys">
        ${["qwertyuiop", "asdfghjkl", "zxcvbnm"].map((row) => `<div class="key-row">${row.split("").map((key) => `<span class="key">${key}</span>`).join("")}</div>`).join("")}
        <div class="key-row"><span class="key">123</span><span class="key wide">空格</span><span class="key">↵</span></div>
      </div>
    </div>
  `;
}

function chipCloud() {
  return `
    <div class="chip-cloud">
      ${state.chips.map((chip) => `
        <button class="chip ${chip.selected ? "active" : ""}" style="--chip-bg:${chip.color}" data-chip="${chip.id}" type="button">
          <span>${escapeHtml(chip.name)}</span>
          <span class="remove" data-remove-chip="${escapeAttribute(chip.id)}">×</span>
        </button>
      `).join("")}
    </div>
  `;
}

function selectedChipRail(context = "") {
  const selected = state.chips.filter((chip) => chip.selected).slice(0, context === "home" ? 5 : 8);
  if (!selected.length) return "";
  return `
    <div class="selected-chip-rail ${context ? `selected-chip-rail-${context}` : ""}">
      <span>已选词条</span>
      <div>
        ${selected.map((chip) => `<button class="selected-chip" style="--chip-bg:${escapeCssUrl(chip.color)}" data-chip="${escapeAttribute(chip.id)}" type="button">${escapeHtml(chip.name)}</button>`).join("")}
      </div>
    </div>
  `;
}

function confirmView() {
  const selected = state.chips.filter((chip) => chip.selected);
  const plan = selectedComponentPlan();
  return `
    <div class="screen-body">
      <section class="page-head">
        <div>
          <p class="eyebrow">确认组件</p>
          <h1 class="page-title">${escapeHtml(canvasTitle())}</h1>
          <p class="page-subtitle">选中的词条将成为画布组件，AI 会为每个组件匹配相关视频。</p>
        </div>
      </section>
      <section class="confirm-card">
        <p class="eyebrow">即将生成组件</p>
        <div class="component-list">
          ${plan.components.map((item, index) => `
            <div class="component-preview">
              <span class="color-dot" style="--c:${item.color || chipColor(index)}"></span>
              <b>${escapeHtml(item.name)}</b>
              <span class="badge">${escapeHtml(selected[index % Math.max(selected.length, 1)]?.name || "AI")}</span>
            </div>
          `).join("")}
        </div>
        <button class="primary-btn" data-nav="generating" style="width:100%">开始生成画布</button>
      </section>
    </div>
  `;
}

function generatingView() {
  const labels = selectedComponentPlan().components.slice(0, 4).map((item) => item.name);
  return `
    <div class="generating">
      <div class="gen-stage">
        <div class="gen-core">${escapeHtml(canvasTopic())}<br/>学习路线图</div>
        ${labels.map((label, index) => `<div class="gen-chip" style="left:${[36, 212, 224, 58][index]}px;top:${[84, 54, 276, 330][index]}px;background:${chipColor(index)};animation-delay:${index * 90}ms">${escapeHtml(label)}</div>`).join("")}
        ${[0, 1, 2, 3].map((_, index) => `<div class="gen-video" style="left:${[266, 32, 256, 88][index]}px;top:${[156, 216, 378, 18][index]}px;animation-delay:${280 + index * 80}ms"></div>`).join("")}
      </div>
      <section class="gen-copy">
        <p class="eyebrow">AI 正在整理你的知识画布</p>
        <h2>正在生成主题、组件与相关视频</h2>
        <div class="steps">${["提取主题", "生成组件", "匹配视频", "构建路径"].map((text) => `<span class="step active" title="${text}"></span>`).join("")}</div>
        <button class="ghost-btn" data-nav="canvas">跳过动画</button>
      </section>
    </div>
  `;
}

function startGenerating() {
  clearTimeout(generateTimer);
  generateTimer = setTimeout(() => {
    if (state.view !== "generating") return;
    replaceCanvasFromAgent(selectedComponentPlan());
    navigate("canvas");
    showToast("知识画布已生成");
  }, 950);
}

function canvasView() {
  const stats = totalStats();
  return `
    <div class="screen-body">
      <section class="canvas-page">
        <div class="canvas-titlebar ${state.isDragging ? "is-stowed" : ""}">
          <div>
            <div class="canvas-kicker">
              <button class="back-chip" data-nav="home">${icons.back}<span>首页</span></button>
              <button class="back-chip" data-nav="search">词条</button>
            </div>
            <h1>${canvasTitle()}</h1>
            <p>已探索 ${stats.percent}% · 已看 ${stats.watched} / ${stats.total} 个视频</p>
          </div>
          <div class="button-row">
            <button class="primary-btn layout-main-btn" data-action="reflow">${icons.grid}<span>Layout</span></button>
            <button class="ghost-btn" data-drawer="agent">Agent</button>
            <button class="icon-btn" data-drawer="more">${icons.more}</button>
          </div>
        </div>
        <div class="canvas-viewport" data-canvas>
          <div class="canvas-world" style="${worldStyle()}">
            <svg class="edge-layer" id="edgeLayer" viewBox="0 0 760 720"></svg>
            <div class="node-layer">
              ${topicCard()}
              ${state.components.map(componentNode).join("")}
              ${state.components.map((component) => canvasVideos(component.id).map(videoNode).join("")).join("")}
            </div>
          </div>
        </div>
        <!-- Expandable Tool Hub -->
        <div class="tool-hub-container ${state.isDragging ? "is-stowed" : ""}">
          <button class="floating-hub-trigger ${state.hubOpen ? "active" : ""}" data-action="toggle-hub" type="button" aria-label="工具箱">
            ${state.hubOpen ? '✕' : icons.menu}
            <span>${state.hubOpen ? '关闭' : '工具箱'}</span>
          </button>
          <div class="tool-hub-panel ${state.hubOpen ? "is-open" : ""}">
            <div class="hub-category">
              <div class="hub-category-title">🎨 画布整理</div>
              <div class="hub-buttons">
                <button class="hub-action-btn" data-action="reflow">${icons.grid}<span>重排布局</span></button>
                <button class="hub-action-btn" data-action="route">${icons.route}<span>路线高亮</span></button>
                <button class="hub-action-btn" data-action="center">${icons.back}<span>回到中心</span></button>
              </div>
            </div>
            <div class="hub-category">
              <div class="hub-category-title">📝 节点编辑</div>
              <div class="hub-buttons">
                <button class="hub-action-btn" data-drawer="newComponent">${icons.plus}<span>添加组件</span></button>
                <button class="hub-action-btn" data-drawer="addVideo">${icons.video}<span>添加视频</span></button>
                <button class="hub-action-btn" data-action="delete-active">${icons.trash}<span>回收节点</span></button>
              </div>
            </div>
            <div class="hub-category">
              <div class="hub-category-title">🤖 智能助手</div>
              <div class="hub-buttons">
                <button class="hub-action-btn" data-drawer="agent">${icons.agent}<span>AI 优化</span></button>
                <button class="hub-action-btn" data-drawer="weights">${icons.weight}<span>调整权重</span></button>
                <button class="hub-action-btn" data-action="dim-nodes">${icons.hide}<span>聚焦分支</span></button>
              </div>
            </div>
          </div>
        </div>
        ${state.activeComponentId ? focusBar() : ""}
        ${state.routeMode ? routeCard() : ""}
        ${state.lastWatchedVideoId ? nextSuggestion() : ""}
        <div class="bottom-control ${state.isDragging ? "is-stowed" : ""}">
          <button data-action="zoom-out">-</button>
          <span class="zoom-label">${Math.round(state.zoom * 100)}%</span>
          <button data-action="zoom-in">+</button>
          <button data-action="center">回到中心</button>
          <button data-action="route">生成路线</button>
        </div>
      </section>
    </div>
  `;
}

function worldStyle() {
  return `transform: translate(calc(-50% + ${state.pan.x}px), calc(-50% + ${state.pan.y}px)) scale(${state.zoom});`;
}

function topicCard() {
  const stats = totalStats();
  return `
    <article class="topic-card" style="left:290px;top:302px">
      <h2>${canvasTitle()}</h2>
      <p>${state.components.length} 个组件 · ${stats.total} 个视频<br/>由 AI 根据你的词条生成</p>
      <span class="progress-pill">已探索 ${stats.percent}%</span>
    </article>
  `;
}

function componentNode(component) {
  const stats = componentStats(component.id);
  const active = state.activeComponentId === component.id;
  const dim = shouldDimComponent(component.id);
  return `
    <article class="component-node ${active ? "active" : ""} ${state.editMode ? "editing" : ""} ${dim ? "dimmed" : ""}"
      data-component="${component.id}" style="left:${component.x}px;top:${component.y}px;--node-bg:${component.color}">
      <h3>${escapeHtml(component.name)}</h3>
      <p>${stats.total} 个视频 · ${stats.watched}/${stats.total}</p>
      <p>权重 ${component.weight}%</p>
    </article>
  `;
}

function canvasVideos(componentId) {
  const list = videosByComponent(componentId);
  if (state.activeComponentId === componentId) return list.slice(0, 4);
  return list.slice(0, 1);
}

function videoPosition(video) {
  const component = componentById(video.componentId);
  if (!component) return { x: 0, y: 0 };
  if (Number.isFinite(video.offsetX) && Number.isFinite(video.offsetY)) {
    return {
      x: Math.round(component.x + video.offsetX),
      y: Math.round(component.y + video.offsetY),
    };
  }
  const offset = defaultVideoOffset(video);
  video.offsetX = offset.x;
  video.offsetY = offset.y;
  return {
    x: Math.round(component.x + offset.x),
    y: Math.round(component.y + offset.y),
  };
}

function defaultVideoOffset(video) {
  const component = componentById(video.componentId);
  const index = canvasVideos(video.componentId).findIndex((item) => item.id === video.id);
  const center = { x: 380, y: 360 };
  const cx = component.x + 64;
  const cy = component.y + 36;
  const dx = cx - center.x;
  const dy = cy - center.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;
  const sideX = -uy;
  const sideY = ux;
  const spread = [
    { out: 104, side: -174 },
    { out: 116, side: -58 },
    { out: 116, side: 58 },
    { out: 104, side: 174 },
    { out: 154, side: -116 },
    { out: 154, side: 116 },
  ][Math.max(0, index) % 6];
  const absoluteX = Math.round(cx + ux * spread.out + sideX * spread.side - 42);
  const absoluteY = Math.round(cy + uy * spread.out + sideY * spread.side - 56);
  return { x: absoluteX - component.x, y: absoluteY - component.y };
}

function videoNode(video) {
  const pos = videoPosition(video);
  const dim = (state.activeComponentId && state.activeComponentId !== video.componentId && !state.routeMode) ||
    (state.routeMode && !activeRouteIds().includes(video.componentId));
  return `
    <article class="video-node ${video.watched ? "watched" : ""} ${video.next ? "next" : ""} ${dim ? "dimmed" : ""}"
      data-video-card="${video.id}" style="left:${pos.x}px;top:${pos.y}px;${videoCoverStyle(video)}" title="双击或点击查看文件块详情" style="cursor: pointer;">
      <div class="video-cover"><span></span></div>
      <div class="node-hover-overlay">
        <span class="hover-badge">点击打开 ↗</span>
      </div>
      <h4>${escapeHtml(video.title)}</h4>
      <div class="video-meta"><span>${escapeHtml(video.duration)}</span><span>已看 ${escapeHtml(video.progress)}%</span></div>
      ${video.source ? '<span class="badge">原件</span>' : '<span class="badge">AI 推荐</span>'}
    </article>
  `;
}

function shouldDimComponent(id) {
  if (state.routeMode) return !activeRouteIds().includes(id);
  return state.activeComponentId && state.activeComponentId !== id;
}

function activeRouteIds() {
  if (Array.isArray(state.routeIds) && state.routeIds.length) return state.routeIds;
  return DATA.topic.route.filter((id) => componentById(id));
}

function focusBar() {
  const component = componentById(state.activeComponentId);
  const stats = componentStats(component.id);
  const next = nextPlayableVideo(component.id, state.lastWatchedVideoId || state.selectedVideoId);
  return `
    <div class="focus-bar ${state.isDragging ? "is-stowed" : ""}">
      <div class="focus-card">
        <h3>${component.name}</h3>
        <p>${stats.total} 个视频 · 已看 ${stats.watched} 个 · 建议下一步：${next?.title || "继续探索"}</p>
      </div>
      <button class="primary-btn" data-open-video="${next?.id || "v1"}">继续本组件</button>
      <button class="secondary-btn" data-drawer="addVideo">添加视频</button>
      <button class="ghost-btn" data-drawer="agent">优化</button>
    </div>
  `;
}

function routeCard() {
  const next = nextRouteVideo();
  const savedRouteCount = state.savedRoutes?.length || 0;
  return `
    <section class="route-card ${state.isDragging ? "is-stowed" : ""}">
      <h3>${routeTitle()}</h3>
      <p>${routeSummary()}</p>
      ${savedRouteCount ? `<small>已保存 ${savedRouteCount} 条路线</small>` : ""}
      ${state.routeShareText ? `<pre class="route-share-card">${escapeHtml(state.routeShareText)}</pre>` : ""}
      <div class="button-row">
        <button class="primary-btn" data-open-video="${next?.id || "v3"}">开始路线</button>
        <button class="secondary-btn" data-action="save-route">保存路线</button>
        <button class="ghost-btn" data-action="share-route">分享路线</button>
      </div>
    </section>
  `;
}

function nextSuggestion() {
  const suggestion = postWatchSuggestion();
  if (!suggestion) return "";
  const watched = videoById(state.lastWatchedVideoId);
  const watchedComponent = watched ? componentById(watched.componentId) : null;
  return `
    <div class="next-suggestion ${state.isDragging ? "is-stowed" : ""}">
      <div class="focus-card">
        <h3>建议继续：${suggestion.video.title}</h3>
        <p>已同步：${watched?.title || "刚才的视频"} 已看完 · ${watchedComponent?.name || "当前组件"} 进度已更新。</p>
      </div>
      <button class="primary-btn" data-open-video="${suggestion.video.id}">继续</button>
      <button class="secondary-btn" data-component-action="${suggestion.component.id}">看分支</button>
    </div>
  `;
}

function postWatchSuggestion() {
  const watched = videoById(state.lastWatchedVideoId);
  if (!watched) return null;
  const watchedComponent = componentById(watched.componentId);
  const route = activeRouteIds();
  const nextVideo = recommendNextVideoAfterWatch({
    watched,
    videos: state.videos,
    components: state.components,
    routeIds: route,
  }) || state.videos.find((video) => !video.watched);
  const component = nextVideo ? componentById(nextVideo.componentId) : watchedComponent;
  if (!nextVideo || !component) return null;
  return { video: nextVideo, component };
}

function drawEdges() {
  const svg = rootEl.querySelector("#edgeLayer");
  if (!svg) return;
  const center = { x: 380, y: 360 };
  const componentEdges = state.components.map((component) => {
    const target = { x: component.x + 64, y: component.y + 36 };
    const route = state.routeMode && activeRouteIds().includes(component.id);
    const dim = shouldDimComponent(component.id) && !route;
    return pathMarkup(center, target, `edge component ${dim ? "dim" : ""} ${route ? "route" : ""}`, component.line);
  });
  const videoEdges = state.components.flatMap((component) =>
    canvasVideos(component.id).map((video) => {
      const pos = videoPosition(video);
      const route = state.routeMode && activeRouteIds().includes(component.id) && canvasVideos(component.id)[0]?.id === video.id;
      const dim = shouldDimComponent(component.id) && !route;
      return pathMarkup({ x: component.x + 64, y: component.y + 36 }, { x: pos.x + 42, y: pos.y + 56 }, `edge video ${dim ? "dim" : ""} ${route ? "route" : ""}`);
    })
  );
  const routeEdges = [];
  if (state.routeMode) {
    activeRouteIds().slice(0, -1).forEach((id, index) => {
      const a = componentById(id);
      const b = componentById(activeRouteIds()[index + 1]);
      if (a && b) routeEdges.push(pathMarkup({ x: a.x + 64, y: a.y + 36 }, { x: b.x + 64, y: b.y + 36 }, "edge route"));
    });
  }
  svg.innerHTML = [...componentEdges, ...videoEdges, ...routeEdges].join("");
}

function pathMarkup(a, b, className, stroke = "") {
  const dx = (b.x - a.x) * 0.38;
  const d = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  return `<path class="${className}" d="${d}" ${stroke ? `stroke="${stroke}"` : ""}/>`;
}

function videoView() {
  const video = videoById(state.selectedVideoId) || videoById("v1");
  const component = componentById(video.componentId);
  const stats = componentStats(component.id);
  const progress = getVideoProgress(video.id);
  const progressPercent = Math.round(progress.progress * 100);

  // Retrieve or initialize dynamic attachments
  if (!state.attachmentsByVideo) {
    state.attachmentsByVideo = {};
  }
  if (!state.attachmentsByVideo[video.id]) {
    state.attachmentsByVideo[video.id] = [
      { name: `${component.name}_核心指南说明.pdf`, type: "精选文档", size: "1.2 MB", url: "#" }
    ];
  }
  const attachments = state.attachmentsByVideo[video.id];

  return `
    <section class="screen video-screen desktop-video-dashboard">
      <!-- Left Side: Wide Video Player Block -->
      <div class="desktop-player-column">
        <div class="desktop-player-container">
          ${videoMedia(video)}
        </div>
      </div>
      
      <!-- Right Side: AI Learning Sidebar Panel -->
      <div class="desktop-details-column">
        <header class="dashboard-header">
          <button class="icon-btn back-to-canvas-btn" data-nav="canvas" aria-label="回到画布">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>返回画布</span>
          </button>
          <span class="dashboard-path-text">${canvasTitle()} &gt; ${component.name}</span>
        </header>
        
        <div class="dashboard-scrollable-content">
          <div class="dashboard-video-meta-section">
            <div class="dashboard-creator-row">
              <span class="avatar">${escapeHtml(video.creator?.slice(0, 1) || "A")}</span>
              <strong>@${escapeHtml(video.creator?.replaceAll(' ', '_') || "AI_Agent")}</strong>
              <span class="badge" style="background: rgba(99, 102, 241, 0.1); color: #6366F1; border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 4px; padding: 2px 6px; font-size: 11px; margin-left: 8px;">智能体</span>
            </div>
            <h1 class="dashboard-video-title">${video.title}</h1>
            
            <div class="dashboard-ai-notes">
              <div class="notes-header">🤖 AI 知识提炼与大纲</div>
              <p>${video.summary || "正在进行智能知识提炼与核心大纲构建..."}</p>
              <p style="margin-top: 8px;">这是一份 AI 从当前媒体内容提取的核心学习文件，包含了详细的概念分支、实用案例以及行动指南。您可以在画布上随时追踪各个节点的学习进度，并在补充区插入更多的文件与链接，打造专属的知识整理工作台。</p>
            </div>
          </div>
          
          <div class="dashboard-progress-section">
            <div class="progress-info">
              <strong>当前分支学习进度</strong>
              <span>${stats.watched} / ${stats.total} 已学习</span>
            </div>
            <div class="dashboard-progress-track">
              <span style="width: ${stats.percent}%"></span>
            </div>
          </div>
          
          <div class="dashboard-file-attachment-section">
            <div class="attachment-header">📎 附件与关联文件</div>
            <div class="attachment-list">
              ${attachments.map((att, idx) => `
                <div class="attachment-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: white; border: 1px solid rgba(0,0,0,0.05); border-radius: 8px; margin-bottom: 8px; transition: all 0.2s ease;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="attachment-icon" style="font-size: 18px;">${att.name.endsWith('.pdf') ? '📄' : (att.url && (att.url.startsWith('http') || att.url.includes('.'))) ? '🔗' : '📁'}</span>
                    <div class="attachment-details">
                      <strong style="display: block; font-size: 13px; color: #1f2937;">${escapeHtml(att.name)}</strong>
                      <span style="font-size: 11px; color: #6b7280;">${escapeHtml(att.type)} · ${escapeHtml(att.size)}</span>
                    </div>
                  </div>
                  <a class="attachment-download-btn" href="${escapeAttribute(att.url)}" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; height: 28px; padding: 0 12px; font-size: 11px; border-radius: 6px; background: rgba(99, 102, 241, 0.06); color: #6366F1; font-weight: 600; cursor: pointer; border: 1px solid rgba(99, 102, 241, 0.1);">打开 ↗</a>
                </div>
              `).join("")}
            </div>
            
            <!-- Sleek Link & File Uploader Form -->
            <div class="insert-attachment-form" style="margin-top: 14px; padding: 16px; background: rgba(0, 0, 0, 0.02); border: 1px dashed rgba(0, 0, 0, 0.08); border-radius: 12px; transition: all 0.2s ease;">
              <div style="font-size: 11px; font-weight: 700; color: #7c2d12; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                <span>📥 插入关联链接或各类文件块</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="new-att-name" placeholder="文件名称或链接标题 (如: 建文削藩研究史料.pdf)" style="width: 100%; height: 36px; padding: 0 12px; font-size: 12.5px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; outline: none; background: white;" />
                <input type="text" id="new-att-url" placeholder="网址或本地文件路径 (如: https://docs.google.com/...)" style="width: 100%; height: 36px; padding: 0 12px; font-size: 12.5px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; outline: none; background: white;" />
                <button class="primary-btn" id="btn-insert-attachment" type="button" style="height: 34px; font-size: 12px; padding: 0 16px; border-radius: 8px; font-weight: 600; width: fit-content; background: #6366F1 !important; color: white !important; cursor: pointer; transition: all 0.2s ease; border: none; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);">确认插入</button>
              </div>
            </div>
          </div>
        </div>
        
        <footer class="dashboard-footer-actions">
          <button class="primary-btn dashboard-action-btn" data-open-video="${nextPlayableVideo(component.id, video.id)?.id || video.id}">继续下一个</button>
          <button class="secondary-btn dashboard-action-btn" data-nav="canvas">回到画布</button>
        </footer>
      </div>
      ${state.modal ? modalTemplate() : ""}
    </section>
  `;
}

function videoMedia(video = {}) {
  if (!video.sourceUrl) return '<div class="canvas-video-fallback"></div>';
  return `
    <video
      class="canvas-real-video"
      src="${video.sourceUrl}"
      poster="${video.coverImage || ""}"
      preload="metadata"
      autoplay
      muted
      loop
      controls
      x5-video-player-type="h5-page"
      x5-video-player-fullscreen="false"
      webkit-playsinline
      x5-playsinline
      playsinline
    ></video>
  `;
}

function nextVideoFor(componentId, currentId) {
  return nextPlayableVideo(componentId, currentId);
}

function nextPlayableVideo(componentId, currentId = "") {
  const list = videosByComponent(componentId);
  const index = list.findIndex((video) => video.id === currentId);
  const afterCurrent = index >= 0 ? list.slice(index + 1).find((video) => !video.watched) : null;
  return afterCurrent || list.find((video) => !video.watched && video.id !== currentId) || list.find((video) => video.id !== currentId) || list[0];
}

function nextRouteVideo() {
  for (const id of activeRouteIds()) {
    const video = nextPlayableVideo(id, state.lastWatchedVideoId || state.selectedVideoId);
    if (video && !video.watched) return video;
  }
  return state.videos.find((video) => !video.watched) || state.videos[0];
}

function libraryView() {
  return `
    <div class="screen-body">
      <section class="page-head">
        <div>
          <p class="eyebrow">我的画布</p>
          <h1 class="page-title">像收藏夹一样管理知识画布</h1>
        </div>
        <button class="primary-btn" data-nav="newCanvas">新建</button>
      </section>
      <div class="library-grid">
        ${state.savedCanvases.map((item) => `
          <article class="library-card">
            <h3>${item.title}</h3>
            <p>已探索 ${item.progress}% · ${item.videos} 个视频 · 最近更新 ${item.updated}</p>
            <div class="mini-tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
            <div style="height:12px"></div>
            <div class="button-row">
              <button class="primary-btn" data-open-canvas="${item.id}">打开画布</button>
              <button class="secondary-btn" data-action="rename-canvas" data-id="${item.id}">重命名</button>
              <button class="danger-btn" data-action="delete-canvas" data-id="${item.id}">删除</button>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function newCanvasView() {
  return `
    <div class="screen-body">
      <section class="page-head"><div><p class="eyebrow">新建画布</p><h1 class="page-title">从一个主题开始</h1></div></section>
      <section class="new-card">
        <label class="eyebrow">画布名称</label>
        <input class="field" id="newCanvasName" value="本地视频素材画布" data-allow-native-input />
        <div style="height:12px"></div>
        <label class="eyebrow">主题</label>
        <input class="field" id="newCanvasTopic" value="本地视频整理" data-allow-native-input />
        <div class="template-grid">
          ${["入门学习型", "实战路线型", "对比研究型", "收藏整理型"].map((name, index) => `<button class="chip ${index === 1 ? "active" : ""}" style="--chip-bg:${chipColor(index)}">${name}</button>`).join("")}
        </div>
        <div class="button-row">
          <button class="primary-btn" data-action="create-canvas">创建画布</button>
          <button class="secondary-btn" data-nav="search">让 AI 帮我生成</button>
        </div>
      </section>
    </div>
  `;
}

function emptyView() {
  return `
    <div class="screen-body">
      <section class="empty-state">
        <div class="empty-art"></div>
        <h1 class="page-title">从一个主题开始，生成你的第一张知识画布</h1>
        <input class="field" placeholder="你想学习什么？" data-allow-native-input />
        <div class="chip-cloud" style="justify-content:center">
          ${["本地视频", "video-1", "video-2", "video-3", "待整理"].map((name, index) => `<button class="chip active" style="--chip-bg:${chipColor(index)}" data-example="整理 ${name}">${name}</button>`).join("")}
        </div>
        <button class="primary-btn" data-nav="search">开始生成</button>
      </section>
    </div>
  `;
}

function drawerTemplate() {
  const body = {
    video: videoDrawer,
    component: componentDrawer,
    agent: agentDrawer,
    newComponent: newComponentDrawer,
    addVideo: addVideoDrawer,
    weights: weightsDrawer,
    more: moreDrawer,
  }[state.drawer]?.() || "";
  return `<div class="drawer-backdrop" data-close></div><section class="drawer"><div class="drawer-handle"></div>${body}</section>`;
}

function drawerHead(title, eyebrow = "") {
  return `<div class="drawer-head"><div>${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}<h2>${escapeHtml(title)}</h2></div><button class="icon-btn" data-close aria-label="关闭">×</button></div>`;
}

function videoDrawer() {
  const video = videoById(state.selectedVideoId) || videoById("v1");
  const component = componentById(video.componentId);
  return `
    ${drawerHead(video.title, "视频详情")}
    <div class="drawer-body">
      <div class="cover-large" style="${videoCoverStyle(video)}"></div>
      <div class="detail-grid">
        <div class="detail-stat"><span>作者</span><b>${video.creator}</b></div>
        <div class="detail-stat"><span>时长</span><b>${video.duration}</b></div>
        <div class="detail-stat"><span>组件</span><b>${component.name}</b></div>
      </div>
      <p class="page-subtitle"><b>AI 摘要：</b>${video.summary}</p>
      <p class="page-subtitle"><b>推荐原因：</b>${video.reason}</p>
      ${video.sourceUrl ? `<p class="page-subtitle"><b>视频链接：</b>${video.fileName || "已预留本地视频路径"}</p>` : ""}
      <div class="button-row">
        <button class="primary-btn" data-open-video="${video.id}">播放</button>
        <button class="secondary-btn" data-action="mark-video" data-id="${video.id}">标记已看</button>
        <button class="ghost-btn" data-action="set-next" data-id="${video.id}">设为下一步</button>
        <button class="ghost-btn" data-action="join-route" data-id="${video.id}">加入路线</button>
        <button class="danger-btn" data-action="remove-video" data-id="${video.id}">移出组件</button>
      </div>
    </div>
  `;
}

function componentDrawer() {
  const component = componentById(state.activeComponentId || "api");
  const stats = componentStats(component.id);
  const videos = videosByComponent(component.id);
  const next = nextPlayableVideo(component.id, state.lastWatchedVideoId || state.selectedVideoId);
  return `
    ${drawerHead(component.name, "组件详情")}
    <div class="drawer-body">
      <p class="page-subtitle">${component.desc}</p>
      <div class="detail-grid">
        <div class="detail-stat"><span>视频</span><b>${stats.total}</b></div>
        <div class="detail-stat"><span>已看</span><b>${stats.watched}</b></div>
        <div class="detail-stat"><span>进度</span><b>${stats.percent}%</b></div>
      </div>
      <div class="video-list">${videos.slice(0, 6).map(videoListItem).join("")}</div>
      <div style="height:12px"></div>
      <div class="button-row">
        <button class="primary-btn" data-open-video="${next?.id || videos[0]?.id || "v1"}">继续本组件</button>
        <button class="secondary-btn" data-drawer="addVideo">添加视频</button>
        <button class="ghost-btn" data-action="rename-component" data-id="${component.id}">重命名组件</button>
        <button class="danger-btn" data-action="delete-component" data-id="${component.id}">删除组件</button>
        <button class="ghost-btn" data-drawer="agent">让 Agent 优化</button>
      </div>
    </div>
  `;
}

function videoListItem(video) {
  return `
    <button class="list-item" data-video-card="${video.id}">
      <span class="thumb" style="${videoCoverStyle(video)}"></span>
      <span><h4>${video.title}</h4><p>${video.creator} · ${video.duration}</p></span>
      <span class="badge">${video.watched ? "已看" : "待看"}</span>
    </button>
  `;
}

function agentDrawer() {
  const hasAPIKey = typeof DEEPSEEK_API_KEY !== "undefined" && DEEPSEEK_API_KEY;
  return `
    ${drawerHead("AI 智能助手", hasAPIKey ? "DeepSeek 思考模型已接入" : "本地 Agent 离线演示")}
    <div class="drawer-body apple-agent-drawer-body">
      <!-- 智能助理状态微章 -->
      <section class="apple-agent-badge">
        <div class="apple-siri-orb ${state.agentBusy ? "is-thinking" : ""}"></div>
        <div class="badge-text">
          <p class="eyebrow">当前正在协助</p>
          <h3>整理「${escapeHtml(canvasTitle())}」</h3>
        </div>
      </section>

      <!-- 智能意图快捷气泡 -->
      <div class="apple-agent-intent-pills">
        ${[
          "查询当前画布结构",
          "新增‘核心要点’分支",
          "删除重复视频",
          "生成 30 分钟学习路线",
          "把‘核心理解’重命名为‘概念入门’"
        ].map((text) => `
          <button class="apple-intent-pill" type="button" data-agent-intent="${escapeAttribute(text)}">
            <span>✨</span> ${escapeHtml(text)}
          </button>
        `).join("")}
      </div>

      <!-- 精美的聊天对话气泡记录 -->
      <div class="apple-agent-chat-flow">
        ${state.agentMessages.slice(-6).map((message) => `
          <div class="apple-chat-bubble-container ${message.role === "user" ? "user" : "agent"}">
            <span class="bubble-avatar">${message.role === "user" ? "👤" : "🤖"}</span>
            <div class="apple-chat-bubble">
              ${escapeHtml(message.text)}
            </div>
          </div>
        `).join("")}
        ${state.agentBusy ? `
          <div class="apple-chat-bubble-container agent">
            <span class="bubble-avatar">🤖</span>
            <div class="apple-chat-bubble apple-thinking-bubble">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        ` : ""}
      </div>

      <!-- 精致的苹果风多行指令文本区 -->
      <div class="apple-agent-input-zone">
        <textarea class="apple-textarea" id="agentPrompt" placeholder="说出你的修改要求，如: '删除朱允炆视频'、'将朱元璋挪到建文断裂组件下'..." data-allow-native-input></textarea>
        <button class="primary-btn apple-send-btn" data-action="agent-run" type="button" ${state.agentBusy ? "disabled" : ""}>
          ${state.agentBusy ? "思考中..." : "发送指令"}
        </button>
      </div>

      <div style="height:14px"></div>
      
      <!-- 结构化改动摘要 -->
      <section class="apple-suggestion-card">
        <h4>${state.agentBusy ? "智能助理正在思考..." : "画布调整说明"}</h4>
        <p>${state.agentBusy ? "正在根据你的指令重构画布节点与拓扑关系..." : state.agentResult ? state.agentResult.changes.join(" · ") : "随时对助理说出指令，助理会全自动帮你改动画布并进行物理布局重排。"}</p>
      </section>

      <div class="button-row" style="margin-top:14px; justify-content: flex-end;">
        <button class="ghost-btn apple-dismiss-btn" type="button" data-close>关闭</button>
      </div>
    </div>
  `;
}

function newComponentDrawer() {
  return `
    ${drawerHead("新建组件", "轻量编辑")}
    <div class="drawer-body">
      <input class="field" id="componentName" value="错误排查" data-allow-native-input />
      <div class="chip-cloud">${["工具调用", "本地部署", "自动化脚本", "错误排查", "实战项目"].map((name, index) => `<button class="chip ${index === 3 ? "active" : ""}" style="--chip-bg:${chipColor(index)}" data-fill-component="${name}">${name}</button>`).join("")}</div>
      <div class="color-row">${["#E8F7F4", "#EAF2FF", "#F1EDFF", "#FFF3D8", "#FFEDEC", "#EEF8EA", "#EDF7FF", "#F8EEF9"].map((color) => `<button class="color-swatch ${state.newComponentColor === color ? "active" : ""}" style="--c:${color}" data-color="${color}"></button>`).join("")}</div>
      <div class="toggle-row"><span>自动匹配视频</span><input type="checkbox" checked data-allow-native-input /></div>
      <div class="button-row">
        <button class="primary-btn" data-action="create-component">创建组件</button>
        <button class="secondary-btn" data-action="agent-component">让 Agent 推荐组件</button>
      </div>
    </div>
  `;
}

function addVideoDrawer() {
  const component = currentAddComponent();
  if (!component) {
    return `${drawerHead("添加视频到组件", "视频匹配")}<div class="drawer-body"><p class="page-subtitle">当前画布还没有组件，请先新建组件。</p><button class="primary-btn" data-drawer="newComponent">新建组件</button></div>`;
  }
  const candidates = state.videos.filter((video) => video.componentId !== component.id).slice(0, 8);
  const selectedId = state.selectedCandidateVideoId || candidates[0]?.id || "";
  const selected = videoById(selectedId) || candidates[0];
  return `
    ${drawerHead("添加视频到组件", "视频匹配")}
    <div class="drawer-body">
      <input class="field" placeholder="搜索视频、作者或标签" value="本地视频" data-allow-native-input />
      <div style="height:10px"></div>
      <select class="field" id="addComponentSelect" data-allow-native-input>
        ${state.components.map((item) => `<option value="${item.id}" ${item.id === component.id ? "selected" : ""}>${item.name}</option>`).join("")}
      </select>
      <div style="height:10px"></div>
      <div class="video-list">${candidates.map((video) => addVideoCandidateItem(video, selected?.id)).join("")}</div>
      <div style="height:12px"></div>
      <div class="button-row">
        <button class="primary-btn" data-action="add-video-to-component">添加${selected ? `「${selected.title.slice(0, 8)}」` : "视频"}到 ${component.name}</button>
        <button class="secondary-btn" data-drawer="newComponent">新建组件并加入</button>
      </div>
    </div>
  `;
}

function currentAddComponent() {
  return componentById(state.selectedAddComponent) ||
    componentById(state.activeComponentId) ||
    componentById("api") ||
    state.components[0];
}

function addVideoCandidateItem(video, selectedId) {
  return `
    <button class="list-item ${video.id === selectedId ? "selected" : ""}" data-pick-video="${video.id}" type="button">
      <span class="thumb" style="${videoCoverStyle(video)}"></span>
      <span><h4>${video.title}</h4><p>${video.creator} · ${video.duration}</p></span>
      <span class="badge">${video.id === selectedId ? "已选" : "选择"}</span>
    </button>
  `;
}

function weightsDrawer() {
  return `
    ${drawerHead("标签 / 权重管理", "影响组件位置、视频推荐和学习路线")}
    <div class="drawer-body">
      ${state.components.map((component) => `
        <div class="weight-row">
          <div><b>${component.name}</b><p class="page-subtitle" style="margin:2px 0 0">权重会影响重排和推荐</p></div>
          <input type="range" min="0" max="100" value="${component.weight}" data-weight="${component.id}" />
        </div>
      `).join("")}
      <div class="button-row" style="margin-top:12px">
        <button class="primary-btn" data-action="apply-weights">调整后重排</button>
        <button class="secondary-btn" data-action="lock-active">锁定当前组件</button>
      </div>
    </div>
  `;
}

function moreDrawer() {
  return `
    ${drawerHead("画布操作", "管理与演示")}
    <div class="drawer-body">
      <div class="button-row">
        <button class="primary-btn" data-action="toggle-edit">${state.editMode ? "退出编辑模式" : "进入编辑模式"}</button>
        <button class="secondary-btn" data-nav="home">返回开始页</button>
        <button class="secondary-btn" data-nav="library">我的画布</button>
        <button class="ghost-btn" data-nav="empty">空画布状态</button>
        <button class="danger-btn" data-action="reset-demo">重置 Demo</button>
      </div>
    </div>
  `;
}

function modalTemplate() {
  if (state.modal === "extract") return extractModal();
  if (state.modal === "agentPreview") return agentPreviewModal();
  return "";
}

function extractModal() {
  return `
    <div class="modal-backdrop" data-close-modal></div>
    <section class="modal">
      <p class="eyebrow">从当前视频提取关键词？</p>
      <h2>本地视频素材</h2>
      <p class="page-subtitle">AI 提取关键词：</p>
      <div class="chip-cloud">${["本地视频", "video-1", "video-2", "video-3", "待整理", "可播放"].map((name, index) => `<span class="chip active" style="--chip-bg:${chipColor(index)}">${name}</span>`).join("")}</div>
      <div class="button-row" style="margin-top:14px">
        <button class="primary-btn" data-action="extract-generate">生成画布</button>
        <button class="secondary-btn" data-action="extract-edit">进入词条编辑</button>
        <button class="ghost-btn" data-close-modal>取消</button>
      </div>
    </section>
  `;
}

function agentPreviewModal() {
  const result = state.agentResult || fallbackAgentResult();
  return `
    <div class="modal-backdrop" data-close-modal></div>
    <section class="modal">
      <p class="eyebrow">Agent 建议预览</p>
      <h2>${result.title}</h2>
      <div class="component-list">
        ${result.changes.map((item, index) => `
          <div class="component-preview">
            <span class="color-dot" style="--c:${chipColor(index)}"></span>
            <b>${item}</b>
            <span class="badge">预览</span>
          </div>
        `).join("")}
        ${result.mode === "replace" && result.components.length ? result.components.slice(0, 4).map((item, index) => `
          <div class="component-preview">
            <span class="color-dot" style="--c:${item.color || chipColor(index)}"></span>
            <b>组件：${item.name}</b>
            <span class="badge">${item.videos?.length || 4} 视频</span>
          </div>
        `).join("") : ""}
      </div>
      <div class="button-row">
        <button class="primary-btn" data-action="apply-agent">应用修改</button>
        <button class="ghost-btn" data-close-modal>取消</button>
      </div>
    </section>
  `;
}

function fallbackAgentResult() {
  return normalizeAgentResult({
    mode: "optimize",
    topic: canvasTopic(),
    title: "即将优化这张画布",
    changes: ["生成路线：本地素材 -> 待识别内容 -> 画布整理", "只使用当前 3 个本地视频文件", "提醒用户补充真实标题和标签"],
  });
}

function normalizeAgentResult(result = {}) {
  const topic = String(result.topic || canvasTopic() || "学习主题").trim();
  const components = Array.isArray(result.components) ? result.components : [];
  const videos = Array.isArray(result.videos) ? result.videos : [];
  const changes = Array.isArray(result.changes) && result.changes.length
    ? result.changes.map((item) => String(item)).filter(Boolean)
    : ["Agent 已生成画布调整建议"];
  return {
    mode: result.mode === "replace" ? "replace" : "optimize",
    topic,
    title: String(result.title || `${topic} 学习路线图`),
    routeTitle: String(result.routeTitle || `${topic} 30 分钟入门路线`),
    components: components.map((component, index) => ({
      id: component?.id,
      name: component?.name || `模块 ${index + 1}`,
      desc: component?.desc || component?.description || `${topic} 的学习分支。`,
      color: component?.color || chipColor(index),
      line: component?.line,
      weight: component?.weight,
      videos: Array.isArray(component?.videos) ? component.videos : [],
    })),
    videos: videos.map((video, index) => ({
      id: video?.id || `agent-video-${index}`,
      title: video?.title || `视频 ${index + 1}`,
      creator: video?.creator || "AI 学习助手",
      duration: video?.duration || "06:20",
      componentId: video?.componentId,
      componentName: video?.componentName,
      tags: Array.isArray(video?.tags) ? video.tags : [],
      summary: video?.summary || video?.description || "围绕当前主题继续展开。",
      reason: video?.reason || "它适合作为当前画布的下一步观看。",
      progress: Number(video?.progress || 0),
      watched: Boolean(video?.watched),
      coverType: video?.coverType || `${topic}-${index}`,
      coverImage: video?.coverImage || video?.cover || video?.poster || "",
      sourceUrl: video?.sourceUrl || video?.url || "",
      fileName: video?.fileName || "",
      next: Boolean(video?.next),
      source: Boolean(video?.source),
    })),
    route: Array.isArray(result.route) ? result.route.map((item) => String(item)).filter(Boolean) : [],
    changes,
  };
}

function currentCanvasSnapshot() {
  return {
    topic: canvasTopic(),
    title: canvasTitle(),
    components: state.components.map((component) => ({
      id: component.id,
      name: component.name,
      desc: component.desc,
      weight: component.weight,
      locked: Boolean(component.locked),
      excluded: Boolean(component.excluded),
    })),
    videos: state.videos.map((video) => ({
      id: video.id,
      title: video.title,
      creator: video.creator,
      componentId: video.componentId,
      tags: video.tags || [],
      progress: video.progress || 0,
      watched: Boolean(video.watched),
    })),
    progress: totalStats(),
  };
}

function isLocalAgentFallbackEnabled() {
  return localStorage.getItem(LOCAL_AGENT_FALLBACK_KEY) !== "false";
}

function agentErrorMessage(error) {
  const detail = error?.message ? `：${error.message}` : "";
  return `Agent 接口暂不可用${detail}。请确认后端服务已启动，并配置 KNOWLEDGE_AGENT_API_KEY。`;
}

function inferRequestedTopic(text) {
  const raw = (text || "").replace(/\s+/g, " ").trim();
  if (isMingEmperorIntent(raw)) return { topic: "明朝皇帝更迭", isNewTopic: true };
  const patterns = [
    /(?:学习|了解|整理|生成|做|规划|设计)(?:一个|一条|一下|关于)?\s*([^，。,.!?！？\n]{2,24}?)(?:的)?(?:路线|学习路线|图谱|知识图谱|画布|课程|教程)/i,
    /(?:关于|围绕)\s*([^，。,.!?！？\n]{2,24}?)(?:的)?(?:路线|图谱|画布|学习)/i,
    /([^，。,.!?！？\n]{2,24}?)(?:学习路线|知识图谱|知识画布|路线图)/i,
  ];
  let topic = "";
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      topic = cleanTopic(match[1]);
      break;
    }
  }
  if (!topic) {
    const keywordMatch = raw.match(/(本地视频素材|本地视频|video-1|video-2|video-3|待识别内容|画布整理|明朝皇帝更迭|明朝皇帝|明代皇帝|明朝|皇帝更迭|AIGC|AI绘画|AI视频|机器学习|深度学习|Python|JavaScript|前端|剪映|摄影|运营|小红书|跨境电商|考研|英语)/i);
    topic = keywordMatch ? keywordMatch[1] : canvasTopic();
  }
  const normalizedCurrent = canvasTopic().toLowerCase();
  const isNewTopic = topic && topic.toLowerCase() !== normalizedCurrent && !["本地视频", "video-1", "video-2", "video-3"].includes(topic.toLowerCase());
  return { topic, isNewTopic };
}

function isMingEmperorIntent(text) {
  return /明朝|明代|洪武|建文|永乐|仁宣|土木堡|夺门|朱元璋|朱允炆|朱棣|朱高炽|朱瞻基|朱祁镇|朱祁钰/.test(String(text || "")) &&
    /皇帝|帝王|更迭|继承|朝代|明朝|明代|朱元璋|朱棣|土木堡/.test(String(text || ""));
}

function cleanTopic(topic) {
  return topic
    .replace(/帮我|请|一下|一个|一条|适合新手|30 分钟|30分钟|入门|系统|完整|相关/g, "")
    .replace(/的$/g, "")
    .trim() || "新主题";
}

function buildMingEmperorCanvasResult(intent = MING_EMPEROR_QUERY) {
  return normalizeAgentResult(buildStaticMingEmperorCanvasResult(intent));
}

function buildTopicCanvasResult(topic, intent) {
  if (isMingEmperorIntent(`${topic} ${intent}`)) return buildMingEmperorCanvasResult(intent);
  const templates = topicTemplates(topic, intent);
  return normalizeAgentResult({
    mode: "replace",
    topic,
    title: `${topic} 学习路线图`,
    routeTitle: `${topic} 30 分钟入门路线`,
    components: templates,
    route: templates.slice(0, 4).map((item) => item.name),
    changes: [`识别新主题：${topic}`, `生成 ${templates.length} 个学习组件`, "为每个组件匹配假设视频", "生成一条入门路线"],
  });
}

function topicTemplates(topic, intent) {
  if (isMingEmperorIntent(`${topic} ${intent}`)) return buildMingEmperorCanvasResult(intent).components;
  const lower = `${topic} ${intent}`.toLowerCase();
  const profile = topicProfile(topic, lower);
  return makeComponents(topic, profile.names, profile);
}

function topicProfile(topic, lower) {
  const profiles = [
    {
      key: "code-agent",
      test: /代码 agent|编程助手/,
      names: ["任务描述", "仓库理解", "终端执行", "补丁修改", "测试验证", "浏览器验收", "Git 协作", "失败排查"],
      verbs: ["把一句需求拆成可执行任务", "让 Agent 快速读懂项目", "在终端里跑完整闭环", "用补丁改文件不破坏旧逻辑"],
    },
    {
      key: "model",
      test: /chatgpt|deepseek|qwen|kimi|模型|大模型/,
      names: ["模型定位", "提示词结构", "长文档处理", "API 接入", "工具调用", "成本限制", "对比选型", "实战工作流"],
      verbs: ["判断它最适合做什么", "写出稳定可复用的提问结构", "处理长文档和上下文", "把模型接进自己的工具"],
    },
    {
      key: "agent",
      test: /agent|智能体|工作流|自动执行/,
      names: ["目标拆解", "工具编排", "上下文记忆", "执行监控", "异常恢复", "评估验收", "多 Agent 协作", "落地案例"],
      verbs: ["把目标拆成可检查步骤", "选择搜索、文件、浏览器等工具", "保存用户偏好和任务状态", "观察执行过程并及时纠偏"],
    },
    {
      key: "api",
      test: /api|接口|sdk|鉴权|key|webhook/,
      names: ["鉴权与 Key", "请求结构", "流式响应", "工具调用", "错误处理", "成本缓存", "Webhook 更新", "安全上线"],
      verbs: ["安全管理 Key 和权限", "组织 messages、tools 和参数", "做出边生成边反馈的体验", "让模型调用外部工具"],
    },
    {
      key: "photo",
      test: /摄影|拍摄|相机|构图|光线|剪辑|剪映|短视频/,
      names: ["器材设置", "构图观察", "自然光线", "拍摄脚本", "剪辑节奏", "调色声音", "发布策略", "作品复盘"],
      verbs: ["用现有设备拍出清晰画面", "训练画面秩序和主体关系", "判断顺光、侧光和逆光", "把想法写成可拍的镜头表"],
    },
    {
      key: "growth",
      test: /小红书|抖音|运营|增长|账号|内容|电商|种草/,
      names: ["账号定位", "用户画像", "选题池", "封面标题", "脚本生产", "数据诊断", "转化路径", "复盘迭代"],
      verbs: ["找到账号要服务的人群", "拆出用户痛点和决策场景", "建立 30 天选题储备", "提高点击率和停留率"],
    },
    {
      key: "commerce",
      test: /跨境|电商|亚马逊|shopify|独立站|投放/,
      names: ["市场选择", "选品验证", "店铺搭建", "商品页优化", "物流支付", "广告投放", "数据看板", "风险合规"],
      verbs: ["判断市场需求和竞争强度", "用小样本验证产品机会", "搭建能转化的基础店铺", "优化标题、图片和卖点"],
    },
    {
      key: "english",
      test: /英语|考研|雅思|托福|口语|听力|阅读|写作/,
      names: ["目标拆解", "词汇系统", "语法长难句", "听力精听", "阅读定位", "写作模板", "口语输出", "错题复盘"],
      verbs: ["把分数目标拆成周计划", "建立高频词和场景词库", "读懂长难句骨架", "用精听训练真实理解"],
    },
    {
      key: "code",
      test: /python|javascript|前端|编程|开发|机器学习|深度学习|数据分析/,
      names: ["环境搭建", "核心语法", "数据结构", "项目练习", "调试测试", "工程规范", "部署上线", "进阶专题"],
      verbs: ["搭好能持续练习的环境", "掌握最常用语法模式", "理解列表、字典和队列", "用小项目串联知识点"],
    },
  ];
  return profiles.find((profile) => profile.test.test(lower)) || {
    key: "custom",
    names: buildCustomComponentNames(topic, lower),
    verbs: ["建立完整认知框架", "掌握关键方法和工具", "完成一个小型实践", "找到下一步深入方向"],
  };
}

function buildCustomComponentNames(topic, lower) {
  const extracted = lower
    .replace(/[，。,.!?！？、]/g, " ")
    .split(/\s+/)
    .map((item) => item.replace(/帮我|生成|整理|学习|路线|图谱|知识|画布|入门|适合|新手|一个|一下/g, "").trim())
    .filter((item) => item.length >= 2 && item.length <= 8);
  const unique = [...new Set(extracted)].filter((item) => !topic.includes(item));
  const contextual = unique.slice(0, 4);
  return [
    `${topic}定位`,
    ...contextual,
    "关键概念",
    "工具方法",
    "实践项目",
    "案例拆解",
    "风险误区",
    "复盘计划",
  ].filter(Boolean).slice(0, 8);
}

function makeComponents(topic, names, profile = {}) {
  const colors = ["#E8F7F4", "#EAF2FF", "#F1EDFF", "#FFF3D8", "#FFEDEC", "#EEF8EA", "#EDF7FF", "#F8EEF9"];
  return names.map((name, index) => ({
    name,
    desc: componentDescription(topic, name, profile, index),
    color: colors[index % colors.length],
    videos: [0, 1, 2, 3].map((num) => ({
      title: videoTitleFor(topic, name, profile, index, num),
      creator: creatorFor(profile.key, num),
      duration: ["06:20", "08:12", "05:48", "09:30"][num],
      summary: videoSummaryFor(topic, name, profile, index, num),
      reason: videoReasonFor(topic, name, profile, index),
    })),
  }));
}

function componentDescription(topic, name, profile, index) {
  const verb = profile.verbs?.[index % profile.verbs.length] || "形成可执行的学习步骤";
  return `围绕「${topic}」的「${name}」展开，重点是${verb}，不是泛泛看视频。`;
}

function videoTitleFor(topic, name, profile, componentIndex, videoIndex) {
  const verb = profile.verbs?.[componentIndex % profile.verbs.length] || "快速建立方法";
  const patterns = [
    `${name}：${verb}`,
    `${topic}里最容易忽略的${name}问题`,
    `用一个案例讲透${topic}${name}`,
    `${name}检查清单：看完就能动手`,
  ];
  return patterns[videoIndex];
}

function videoSummaryFor(topic, name, profile, componentIndex, videoIndex) {
  const verb = profile.verbs?.[componentIndex % profile.verbs.length] || "完成一次可验证练习";
  const summaries = [
    `把 ${topic} 的 ${name} 拆成三个可执行动作，先解决“该从哪开始”的问题。`,
    `结合常见失败场景，说明 ${name} 为什么会影响后续学习效果。`,
    `用一个贴近真实场景的例子，把 ${name} 从概念变成操作。`,
    `给出 ${name} 的检查清单，帮助用户看完后立刻整理自己的画布。`,
  ];
  return `${summaries[videoIndex]}核心目标：${verb}。`;
}

function videoReasonFor(topic, name, profile, index) {
  return `这条视频能补齐「${topic}」路线里的「${name}」分支，让下一步学习更具体。`;
}

function creatorFor(key, index) {
  const map = {
    "code-agent": ["工程效率派", "CLI 实战课", "前端路演工坊", "Debug 小组"],
    model: ["模型观察站", "AI 工具观察", "接口实践课", "产品实验室"],
    agent: ["自动化研究员", "Agent 方法论", "工程效率派", "产品实验室"],
    api: ["接口实践课", "架构备忘录", "AI 工具观察", "安全上线笔记"],
    photo: ["摄影练习室", "光线观察笔记", "剪辑节奏课", "创作复盘局"],
    growth: ["内容增长实验室", "小红书运营课", "数据复盘局", "爆款拆解社"],
    commerce: ["跨境增长局", "选品实验室", "独立站笔记", "投放复盘课"],
    english: ["语言训练营", "长难句研究所", "听力精听课", "写作批改室"],
    code: ["编程练习室", "项目实战课", "工程化笔记", "Debug 小组"],
  };
  return (map[key] || ["知识路线研究所", "AI 学习助手", "实战拆解课", "方法论笔记"])[index % 4];
}

function shouldUseLocalCanvasAgent(intent) {
  if (typeof DEEPSEEK_API_KEY !== "undefined" && DEEPSEEK_API_KEY) {
    return false;
  }
  return isReadIntent(intent) || isDeleteIntent(intent) || isUpdateIntent(intent) || isCreateIntent(intent, {});
}

async function runAgent(intent) {
  const cleanIntent = String(intent || "").trim();
  if (!cleanIntent) {
    showToast("先告诉 Agent 你想怎么调整画布");
    return;
  }
  state.agentBusy = true;
  state.agentResult = null;
  state.agentMessages.push({ role: "user", text: cleanIntent });
  render();
  const prompt = buildAgentPrompt(cleanIntent);
  
  const hasAPIKey = typeof DEEPSEEK_API_KEY !== "undefined" && DEEPSEEK_API_KEY;

  if (shouldUseLocalCanvasAgent(cleanIntent)) {
    state.agentResult = localAgentResult(cleanIntent);
    state.agentResult.intent = cleanIntent;
    pushAgentExecutionReply(cleanIntent, state.agentResult);
    state.agentBusy = false;
    state.drawer = "agent";
    state.modal = null;
    persist();
    render();
    showToast("Agent 已执行画布操作");
    return;
  }
  if (isMingEmperorIntent(`${cleanIntent} ${canvasTopic()}`) && !hasAPIKey) {
    state.agentResult = localAgentResult(cleanIntent);
    state.agentResult.intent = cleanIntent;
    pushAgentExecutionReply(cleanIntent, state.agentResult);
    state.agentBusy = false;
    state.drawer = "agent";
    state.modal = null;
    persist();
    render();
    showToast("Agent 已处理明朝皇帝画布");
    return;
  }
  try {
    state.agentResult = await callConfiguredAgent(prompt, cleanIntent, "agent-drawer");
    state.agentResult.intent = cleanIntent;
    pushAgentExecutionReply(cleanIntent, state.agentResult);
    
    // 如果获取到的 Agent 结果中包含组件列表，自动将其一键应用到当前画布状态中，免去弹窗操作！
    if (state.agentResult && state.agentResult.components && state.agentResult.components.length) {
      replaceCanvasFromAgent(state.agentResult);
      requestAnimationFrame(drawEdges);
    }
    
    showToast("Agent 已执行画布操作");
  } catch (error) {
    if (isLocalAgentFallbackEnabled()) {
      state.agentResult = localAgentResult(cleanIntent);
      state.agentResult.intent = cleanIntent;
      pushAgentExecutionReply(cleanIntent, state.agentResult);
      
      if (state.agentResult && state.agentResult.components && state.agentResult.components.length) {
        replaceCanvasFromAgent(state.agentResult);
        requestAnimationFrame(drawEdges);
      }
      
      showToast("已使用本地 Agent fallback");
    } else {
      state.agentResult = null;
      state.agentMessages.push({ role: "agent", text: agentErrorMessage(error) });
      showToast("Agent 接口暂不可用");
    }
  }
  state.agentBusy = false;
  state.drawer = "agent";
  state.modal = null;
  persist();
  render();
}

function buildAgentPrompt(intent) {
  const stats = totalStats();
  const components = state.components.map((component) => {
    const s = componentStats(component.id);
    return `${component.name}: ${s.watched}/${s.total}, weight ${component.weight}`;
  }).join("\n");
  return `你是“精选知识画布”的产品内 Agent，不是普通聊天助手。你的任务是把用户的一句话变成可探索的短视频学习画布。
请像垂直领域课程策划 + 内容推荐系统一样工作：组件名必须贴合用户主题，不要套用“基础认知、核心概念、工具方法、实战案例、复盘计划”这类通用模板，除非它们确实是该主题的专业说法。
视频标题也要具体，像真实知识类短视频标题，不要写“第 1 课、第 2 课”。

用户可能要求生成一个全新的学习路线，也可能要求优化当前画布。
当前画布：${canvasTitle()}
用户意图：${intent}
总进度：${stats.watched}/${stats.total}
当前组件：
${components}

请只返回 JSON，不要 Markdown。字段如下：
{
  "mode": "replace" 或 "optimize",
  "topic": "用户真正想学习的主题，简短中文",
  "title": "画布标题",
  "routeTitle": "路线标题",
  "components": [
    {"name":"组件名","desc":"说明","color":"#E8F7F4","videos":[{"title":"视频标题","summary":"摘要","reason":"推荐原因","duration":"06:20","creator":"作者"}]}
  ],
  "route": ["组件名1","组件名2","组件名3","组件名4"],
  "changes": ["变化1","变化2","变化3"]
}
如果用户提到非当前主题，mode 必须是 replace，并围绕该主题设计组件和视频。`;
}

async function callConfiguredAgent(prompt, intent, source = "agent-drawer") {
  if (typeof DEEPSEEK_API_KEY !== "undefined" && DEEPSEEK_API_KEY) {
    try {
      const messages = [
        {
          role: "system",
          content: `你是一个强大的 AI 知识图谱画布助手。你负责生成、重构和对当前学习画布进行全权管控（CRUD）。
你能够完全控制画布的结构。
当前画布包含一系列"组件"（学习分支，也叫 components）和挂载在组件下的"视频节点"（也叫 videos）。

画布的数据格式为 JSON，具体规范如下：
{
  "mode": "replace"（若用户提出新的学习主题或要求彻底重构，设为 replace；若仅仅是针对当前画布进行添加、删除、移动视频、修改组件、重排等局部修改，设为 optimize）,
  "topic": "当前画布研究的细分主题，简短中文",
  "title": "画布主标题（如：明朝皇帝更迭知识画布，或 Python 入门画布）",
  "routeTitle": "学习路线标题",
  "components": [
    {
      "id": "组件唯一ID（若修改已有组件，请绝对保留原ID，例如 ming-founding 等；新建组件请拼音/英文命名）",
      "name": "组件名称，需极其精炼（不超过6个字，如 '开国奠基'）",
      "desc": "该学习组件分支的核心说明或介绍",
      "color": "建议的底色 HEX（如 #E8F7F4, #EAF2FF, #F1EDFF, #FFF3D8, #FFEDEC）",
      "weight": 80
    }
  ],
  "videos": [
    {
      "id": "视频唯一ID（如果是已有视频，必须保持原ID，如 v1 或 ming-zhu-yuanzhang 等；若用户要添加新视频，请用拼音/英文命名ID）",
      "title": "视频标题（如 朱元璋（明太祖））",
      "creator": "视频作者/出处",
      "duration": "视频时长，如 '05:30'",
      "componentId": "该视频所属组件的ID（必须是 components 列表中存在的组件 ID，用来实现视频与组件的相连）",
      "tags": ["标签1", "标签2"],
      "summary": "视频核心内容摘要",
      "reason": "为什么推荐此视频挂在当前组件下",
      "sourceUrl": "视频播放源地址。重要限制：当前可播放真实视频源只能是 '/videos/video-1.mp4'、'/videos/video-2.mp4' 或 '/videos/video-3.mp4'。请优先从中匹配映射！",
      "watched": false,
      "progress": 0
    }
  ],
  "route": ["组件名1", "组件名2"],
  "changes": ["本次你作为 Agent 进行了什么思考和修改说明，如 '根据指令把朱棣移动到了永宣秩序组件下'"]
}

注意守则：
1. 你的回答必须是纯 JSON，绝不能带有任何 Markdown 标记（如 \`\`\`json）或除 JSON 以外的任何文字解释，必须能够被 JSON.parse() 直接解析！
2. 保持克制与一致性：如果用户是局部修改指令（比如“挪动视频”、“添加组件”、“删除节点”），请使用 "optimize" 模式，并尽量保留其他没有修改的 components 和 videos（它们的 id、watched 进度应绝对保持一致，不要丢失视频节点！）。如果是全新生成画布意图，才使用 "replace"。
3. 视频只能与组件连接，所以 videos 列表里的所有视频卡片的 componentId 必须有效指向 components 中的一个 id。
4. 所有视频的 sourceUrl 必须是且只能是 '/videos/video-1.mp4'、'/videos/video-2.mp4' 或 '/videos/video-3.mp4'，不要使用空字符串或虚假网络地址！
5. 在对画布进行分类和设计时，组件（components）与组件之间，或者视频（videos）与组件之间建立链接。视频只能和组件连接，组件则可以和视频或组件相连。

当前画布的状态快照如下：
${JSON.stringify(currentCanvasSnapshot(), null, 2)}`
        },
        {
          role: "user",
          content: `用户的最新指令是：${intent}`
        }
      ];

      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages,
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API HTTP error! status: ${response.status}`);
      }

      const resJson = await response.json();
      const contentText = resJson.choices?.[0]?.message?.content;
      if (!contentText) {
        throw new Error("Empty message content returned from DeepSeek API");
      }

      const parsedData = JSON.parse(contentText);
      
      // 合并状态（确保用户原有的 watched/progress 不会被 API 的默认重置抹去）
      if (Array.isArray(parsedData.videos)) {
        const snapshot = currentCanvasSnapshot();
        const watchedMap = new Map(snapshot.videos.map(v => [v.id, { watched: v.watched, progress: v.progress }]));
        parsedData.videos = parsedData.videos.map(v => {
          if (watchedMap.has(v.id)) {
            const original = watchedMap.get(v.id);
            return {
              ...v,
              watched: original.watched,
              progress: original.progress
            };
          }
          return v;
        });
      }

      return normalizeAgentResult(parsedData);
    } catch (apiError) {
      console.error("[knowledge-canvas] DeepSeek direct fetch error, falling back to local/configured endpoints:", apiError);
      // 继续向下流转，尝试传统通道
    }
  }

  const body = JSON.stringify({
    intent,
    source,
    prompt,
    currentVideo: state.entryVideo || null,
    canvas: currentCanvasSnapshot(),
  });
  let lastError = null;
  for (const endpoint of agentApiEndpoints()) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!response.ok || payload?.code !== 200) {
        throw new Error(payload?.msg || `Agent API HTTP ${response.status}`);
      }
      return normalizeAgentResult(payload.data || {});
    } catch (error) {
      lastError = error;
      console.warn("[knowledge-canvas] agent endpoint failed:", endpoint, error);
    }
  }
  throw lastError || new Error("Agent API unavailable");
}

function agentApiEndpoints() {
  return staticAgentApiEndpoints();
}

function localAgentResult(intent) {
  const inferred = inferRequestedTopic(intent);
  if (isMingEmperorIntent(`${intent} ${canvasTopic()}`)) {
    if (/补充|优化|路线|重排|分类|标签|更迭|皇帝/.test(intent) && /明朝皇帝/.test(canvasTopic())) {
      return normalizeAgentResult({
        mode: "optimize",
        topic: "明朝皇帝更迭",
        title: "优化明朝皇帝画布",
        routeTitle: "从洪武到夺门的皇位更迭路线",
        route: MING_COMPONENTS.slice(0, 4).map((item) => item.name),
        changes: [
          "按皇位更迭顺序高亮路线：开国奠基 -> 建文断裂 -> 永宣秩序 -> 土木堡到夺门",
          "保留节点范围：只使用已有皇帝介绍视频",
          "建议后续接入：从 sourceUrl 播放对应本地 mp4",
        ],
      });
    }
    return buildMingEmperorCanvasResult(intent);
  }
  if (inferred.isNewTopic) {
    return buildTopicCanvasResult(inferred.topic, intent);
  }
  if (intent.includes("新手") || intent.includes("30 分钟") || intent.includes("路线")) {
    return normalizeAgentResult({ mode: "optimize", topic: canvasTopic(), title: "生成本地素材路线", changes: ["高亮本地素材 -> 待识别内容 -> 画布整理", "只推荐当前 3 个本地视频", "把已看视频从路线中弱化"] });
  }
  if (intent.includes("重复")) {
    return normalizeAgentResult({ mode: "optimize", topic: canvasTopic(), title: "清理重复视频", changes: ["当前只保留 3 个本地视频文件", "保留真实可播放素材", "不新增虚构视频标题"] });
  }
  return normalizeAgentResult(fallbackAgentResult());
}

function pushAgentExecutionReply(intent, result) {
  const execution = executeAgentCrudIntent(intent, result);
  if (execution) {
    state.agentMessages.push({ role: "agent", text: execution.message });
    if (execution.changed) {
      state.agentResult = {
        ...result,
        changes: execution.changes?.length ? execution.changes : [execution.message],
      };
    }
    return;
  }
  state.agentMessages.push({ role: "agent", text: `${result.title}：${result.changes.join("；")}` });
}

function executeAgentCrudIntent(intent, result = fallbackAgentResult()) {
  const text = String(intent || "").trim();
  if (!text) return null;

  if (isReadIntent(text)) return readCanvasByAgent(text);

  if (isDeleteIntent(text)) {
    if (/重复|去重/.test(text)) return deleteDuplicateVideosByAgent();
    if (/只保留|保留/.test(text)) return keepVideosByAgent(text);
    return deleteCanvasItemByAgent(text);
  }

  if (isUpdateIntent(text)) return updateCanvasByAgent(text, result);

  if (isCreateIntent(text, result)) return createCanvasItemByAgent(text, result);

  return null;
}

function isReadIntent(text) {
  return /查询|查看|列出|看看|有哪些|多少|统计|状态|结构|进度/.test(text);
}

function isCreateIntent(text, result = {}) {
  return /新增|添加|补充|新建|创建|生成|做一张|建一个/.test(text) || result.mode === "replace";
}

function isDeleteIntent(text) {
  return /删除|移除|删掉|去掉|清理|去重|只保留|保留/.test(text);
}

function isUpdateIntent(text) {
  return /修改|更新|重命名|改名|改成|调整|提高|降低|放到前面|前置|排序|路线|权重/.test(text);
}

function readCanvasByAgent(text) {
  const stats = totalStats();
  const focused = state.activeComponentId ? componentById(state.activeComponentId) : null;
  const componentSummary = state.components
    .map((component) => {
      const s = componentStats(component.id);
      return `${component.name}${component.excluded ? "(已隐藏)" : ""} ${s.watched}/${s.total}`;
    })
    .join("；");
  const videoSummary = focused
    ? `当前分支「${focused.name}」有 ${videosByComponent(focused.id).length} 个视频。`
    : `整张画布有 ${state.videos.length} 个视频。`;
  const route = activeRouteIds().map((id) => componentById(id)?.name).filter(Boolean).join(" -> ") || "暂无路线";
  return {
    changed: false,
    message: `查询结果：${canvasTitle()}；${state.components.length} 个分支，${stats.watched}/${stats.total} 个视频已看。${videoSummary} 分支：${componentSummary}。路线：${route}。`,
  };
}

function deleteDuplicateVideosByAgent() {
  const removed = removeDuplicateOrLowValueVideos(2);
  state.drawer = "agent";
  persist();
  return {
    changed: removed > 0,
    message: removed > 0 ? `已删除 ${removed} 条重复或低价值视频，并保留每个分支里更适合继续学习的视频。` : "没有发现可删除的重复视频。",
    changes: [`已删除 ${removed} 条重复或低价值视频`, "画布视频列表已更新"],
  };
}

function keepVideosByAgent(text) {
  const beginnerOnly = /新手|入门|基础|小白|快速上手/.test(text);
  const before = state.videos.length;
  if (!beginnerOnly) return null;
  const keepers = new Set();
  state.components.forEach((component) => {
    const list = videosByComponent(component.id);
    const matched = list.filter((video) => /新手|入门|基础|开始|上手|快速|第一步/i.test(`${video.title} ${video.summary} ${(video.tags || []).join(" ")}`));
    (matched.length ? matched : list.slice(0, 1)).forEach((video) => keepers.add(video.id));
  });
  state.videos = state.videos.filter((video) => keepers.has(video.id));
  state.selectedVideoId = state.videos[0]?.id || "";
  state.drawer = "agent";
  persist();
  const removed = before - state.videos.length;
  return {
    changed: removed > 0,
    message: `已只保留适合新手/入门的视频，删除 ${removed} 条进阶或低相关视频。`,
    changes: [`保留 ${state.videos.length} 条新手友好视频`, `删除 ${removed} 条低相关视频`],
  };
}

function deleteCanvasItemByAgent(text) {
  const target = extractOperationTarget(text, "delete");
  if (/视频|课程/.test(text)) {
    const targetVideo = findVideoByText(target || text);
    if (targetVideo) {
      state.videos = state.videos.filter((item) => item.id !== targetVideo.id);
      state.selectedVideoId = state.videos[0]?.id || "";
      state.drawer = "agent";
      persist();
      return {
        changed: true,
        message: `已删除视频「${targetVideo.title}」。`,
        changes: [`删除视频：${targetVideo.title}`],
      };
    }
  }
  const component = findComponentByText(target || text);
  if (component && state.components.length > 1) {
    const removedVideos = videosByComponent(component.id).length;
    state.components = state.components.filter((item) => item.id !== component.id);
    state.videos = state.videos.filter((video) => video.componentId !== component.id);
    state.routeIds = (state.routeIds || []).filter((id) => id !== component.id);
    state.activeComponentId = state.components[0]?.id || null;
    state.selectedVideoId = state.videos[0]?.id || "";
    state.drawer = "agent";
    persist();
    return {
      changed: true,
      message: `已删除「${component.name}」分支，并移除该分支下 ${removedVideos} 个视频。`,
      changes: [`删除分支：${component.name}`, `移除视频：${removedVideos} 个`],
    };
  }

  const video = findVideoByText(target || text);
  if (video) {
    state.videos = state.videos.filter((item) => item.id !== video.id);
    state.selectedVideoId = state.videos[0]?.id || "";
    state.drawer = "agent";
    persist();
    return {
      changed: true,
      message: `已删除视频「${video.title}」。`,
      changes: [`删除视频：${video.title}`],
    };
  }

  return {
    changed: false,
    message: target ? `没有找到「${target}」对应的分支或视频。你可以先说“查询当前画布结构”。` : "没有识别到要删除的分支或视频。",
  };
}

function createCanvasItemByAgent(text, result) {
  if (result.mode === "replace" || /画布|知识图谱|路线图|学习路线/.test(text) && /生成|创建|新建|做一张/.test(text)) {
    replaceCanvasFromAgent(result);
    state.view = "canvas";
    state.routeMode = true;
    state.drawer = "agent";
    persist();
    return {
      changed: true,
      message: `已生成新的「${canvasTitle()}」，包含 ${state.components.length} 个分支和 ${state.videos.length} 个视频节点。`,
      changes: [`生成画布：${canvasTitle()}`, `生成分支：${state.components.length} 个`, `生成视频：${state.videos.length} 个`],
    };
  }

  const targetName = extractOperationTarget(text, "create");
  const strictCreate = /新增|新建|创建|建一个/.test(text);
  const existing = strictCreate ? findExactComponentByText(targetName || "") : findComponentByText(targetName || "");
  if (/视频/.test(text) && (existing || state.activeComponentId)) {
    const component = existing || componentById(state.activeComponentId) || state.components[0];
    const video = createAgentVideo(component.id, targetName || result.changes?.[0] || "Agent 推荐视频", result);
    state.activeComponentId = component.id;
    state.selectedVideoId = video.id;
    state.drawer = "agent";
    persist();
    return {
      changed: true,
      message: `已给「${component.name}」新增视频「${video.title}」。`,
      changes: [`新增视频：${video.title}`, `归属分支：${component.name}`],
    };
  }

  if (existing) {
    const video = createAgentVideo(existing.id, result.changes?.find((item) => /视频/.test(item)) || `${existing.name}补充视频`, result);
    state.activeComponentId = existing.id;
    state.selectedVideoId = video.id;
    state.drawer = "agent";
    persist();
    return {
      changed: true,
      message: `「${existing.name}」分支已存在，已改为补充 1 个视频节点。`,
      changes: [`补充视频：${video.title}`, `归属分支：${existing.name}`],
    };
  }

  const component = createAgentComponent(targetName || result.components?.[0]?.name || "Agent 新增分支", result);
  state.activeComponentId = component.id;
  state.drawer = "agent";
  persist();
  return {
    changed: true,
    message: `已新增「${component.name}」分支，并补充 ${videosByComponent(component.id).length} 个视频节点。`,
    changes: [`新增分支：${component.name}`, `新增视频：${videosByComponent(component.id).length} 个`],
  };
}

function updateCanvasByAgent(text, result) {
  const rename = parseRenameIntent(text);
  if (rename?.to) {
    const component = findComponentByText(rename.from || text) || componentById(state.activeComponentId);
    if (component) {
      const oldName = component.name;
      component.name = rename.to;
      component.desc = component.desc || `围绕「${rename.to}」展开。`;
      state.drawer = "agent";
      persist();
      return {
        changed: true,
        message: `已把「${oldName}」重命名为「${component.name}」。`,
        changes: [`重命名分支：${oldName} -> ${component.name}`],
      };
    }
  }

  if (/权重|提高|降低|调整/.test(text)) {
    const component = findComponentByText(extractOperationTarget(text, "update") || text) || componentById(state.activeComponentId);
    if (component) {
      const number = Number(text.match(/(\d{1,3})/)?.[1]);
      const oldWeight = component.weight || 70;
      component.weight = Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : Math.max(50, Math.min(100, oldWeight + (/降低/.test(text) ? -10 : 10)));
      reflowComponents();
      state.drawer = "agent";
      persist();
      return {
        changed: true,
        message: `已把「${component.name}」权重从 ${oldWeight}% 调整为 ${component.weight}%。`,
        changes: [`调整权重：${component.name} ${oldWeight}% -> ${component.weight}%`],
      };
    }
  }

  if (/放到前面|前置|优先|排序/.test(text)) {
    const moved = prioritizeVideosByAgent(text);
    return {
      changed: moved > 0,
      message: moved > 0 ? `已把 ${moved} 个匹配视频设为优先观看，并放到对应分支前面。` : "没有找到可前置的视频。",
      changes: [`前置视频：${moved} 个`],
    };
  }

  if (/路线|30\s*分钟|30分钟/.test(text)) {
    state.routeIds = resolveRouteIds(result);
    state.routeMode = true;
    state.activeComponentId = null;
    state.drawer = "agent";
    persist();
    return {
      changed: true,
      message: `已生成路线：${activeRouteIds().map((id) => componentById(id)?.name).filter(Boolean).join(" -> ")}。`,
      changes: ["生成学习路线", routeSummary()],
    };
  }

  return createCanvasItemByAgent(text, result);
}

function createAgentComponent(name, result = {}) {
  const suggested = result.components?.[0] || {};
  const id = `agent-${Date.now()}`;
  const component = {
    id,
    name: cleanOperationName(name) || suggested.name || "Agent 新增分支",
    color: suggested.color || "#EDF7FF",
    line: suggested.line || "#69BFE7",
    x: 448,
    y: 126,
    weight: Number(suggested.weight || 72),
    locked: false,
    excluded: false,
    desc: suggested.desc || "由 Agent 根据你的指令新增的画布分支。",
  };
  state.components.push(component);
  const videos = suggested.videos?.length
    ? suggested.videos
    : result.changes?.filter((change) => /视频|课程|教程|实战|入门/.test(change)).map((change) => ({ title: change.replace(/^新增视频：?/, "") })) || [];
  (videos.length ? videos : [{ title: `${component.name}入门视频` }, { title: `${component.name}实战案例` }]).slice(0, 4).forEach((video) => {
    createAgentVideo(component.id, video.title, { ...result, video });
  });
  reflowComponents();
  return component;
}

function createAgentVideo(componentId, title, result = {}) {
  const rawVideo = result.video || result.videos?.[0] || {};
  const component = componentById(componentId) || state.components[0];
  const cleanTitle = cleanOperationName(String(title || rawVideo.title || `${component.name}补充视频`).replace(/^新增视频：?/, ""));
  const video = {
    id: `agent-video-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    title: cleanTitle || `${component.name}补充视频`,
    creator: rawVideo.creator || "AI 学习助手",
    duration: rawVideo.duration || "06:20",
    componentId: component.id,
    tags: rawVideo.tags?.length ? rawVideo.tags : [component.name, "Agent"],
    summary: rawVideo.summary || "Agent 根据你的指令补充的视频节点。",
    reason: rawVideo.reason || "它能让当前学习路线更完整。",
    progress: 0,
    watched: false,
    coverType: rawVideo.coverType || `${component.id}-${Date.now()}`,
  };
  state.videos.push(video);
  return video;
}

function prioritizeVideosByAgent(text) {
  const target = cleanOperationName(extractOperationTarget(text, "update") || text.replace(/放到前面|前置|优先|排序/g, ""));
  const matched = state.videos.filter((video) => fuzzyScore(target, `${video.title} ${(video.tags || []).join(" ")} ${video.summary}`) >= 0.22);
  matched.forEach((video) => {
    video.next = true;
    video.progress = Math.min(video.progress || 0, 5);
  });
  const ids = new Set(matched.map((video) => video.id));
  state.videos = [
    ...state.videos.filter((video) => ids.has(video.id)),
    ...state.videos.filter((video) => !ids.has(video.id)),
  ];
  state.selectedVideoId = matched[0]?.id || state.selectedVideoId;
  state.drawer = "agent";
  persist();
  return matched.length;
}

function parseRenameIntent(text) {
  const patterns = [
    /把(.+?)(?:分支|组件|节点)?(?:重命名|改名|改成|改为|修改为)(.+?)(?:分支|组件|节点)?$/,
    /(?:重命名|改名)(.+?)(?:为|成)(.+)$/,
    /(.+?)(?:分支|组件|节点)?(?:改成|改为)(.+)$/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[2]) {
      return {
        from: cleanOperationName(match[1]),
        to: cleanOperationName(match[2]),
      };
    }
  }
  return null;
}

function extractOperationTarget(text, mode) {
  const actionWords = {
    create: "(?:新增|添加|补充|新建|创建|生成|建一个)",
    delete: "(?:删除|移除|删掉|去掉|清理)",
    update: "(?:修改|更新|调整|提高|降低|把|将)",
  }[mode] || "(?:处理)";
  const pattern = new RegExp(`${actionWords}\\s*([^，。,.!?！？\\n]{1,28}?)(?:分支|组件|节点|视频|课程|路线)?(?:$|[，。,.!?！？])`);
  const match = text.match(pattern);
  if (match?.[1]) return cleanOperationName(match[1]);
  return cleanOperationName(text);
}

function cleanOperationName(value) {
  return String(value || "")
    .replace(/^(把|将|给|对|一个|一条|一下|当前|这张|这个|那个)/g, "")
    .replace(/(分支|组件|节点|视频|课程|路线|画布|知识图谱|知识画布)$/g, "")
    .replace(/^(新增|添加|补充|新建|创建|生成|删除|移除|删掉|去掉|清理|修改|更新|调整|提高|降低|查询|查看|列出)/g, "")
    .replace(/(放到前面|前置|优先|排序|只保留|保留|适合新手的?)/g, "")
    .trim();
}

function findComponentByText(text) {
  const target = cleanOperationName(text);
  if (!target) return null;
  return bestFuzzyMatch(target, state.components, (component) => `${component.name} ${component.desc || ""}`);
}

function findExactComponentByText(text) {
  const target = normalizeMatchText(text);
  if (!target) return null;
  return state.components.find((component) => normalizeMatchText(component.name) === target) || null;
}

function findVideoByText(text) {
  const target = cleanOperationName(text);
  if (!target) return null;
  return bestFuzzyMatch(target, state.videos, (video) => `${video.title} ${video.summary || ""} ${(video.tags || []).join(" ")}`);
}

function bestFuzzyMatch(target, items, labelGetter) {
  let best = null;
  let bestScore = 0;
  items.forEach((item) => {
    const score = fuzzyScore(target, labelGetter(item));
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  });
  return bestScore >= 0.28 ? best : null;
}

function fuzzyScore(target, label) {
  const a = normalizeMatchText(target);
  const b = normalizeMatchText(label);
  if (!a || !b) return 0;
  if (b.includes(a) || a.includes(b)) return 1;
  const chars = [...new Set(a.split(""))].filter((char) => /[\u4e00-\u9fa5a-z0-9]/i.test(char));
  if (!chars.length) return 0;
  const hits = chars.filter((char) => b.includes(char)).length;
  return hits / chars.length;
}

function normalizeMatchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[「」"'“”《》【】（）()]/g, "")
    .replace(/(分支|组件|节点|视频|课程|路线|画布|知识图谱|知识画布|之变|的)/g, "");
}

listen(app, "click", async (event) => {
  // Click handler for inserting files dynamically
  const btnInsertAttachment = event.target.closest("#btn-insert-attachment");
  if (btnInsertAttachment) {
    event.preventDefault();
    event.stopPropagation();
    const nameInput = document.getElementById("new-att-name");
    const urlInput = document.getElementById("new-att-url");
    const name = nameInput ? nameInput.value.trim() : "";
    const url = urlInput ? urlInput.value.trim() : "";
    if (!name) {
      showToast("请输入文件名称或链接标题");
      return;
    }
    const currentVideoId = state.selectedVideoId || "v1";
    if (!state.attachmentsByVideo) {
      state.attachmentsByVideo = {};
    }
    if (!state.attachmentsByVideo[currentVideoId]) {
      const v = videoById(currentVideoId);
      const component = v ? componentById(v.componentId) : null;
      const compName = component ? component.name : "核心";
      state.attachmentsByVideo[currentVideoId] = [
        { name: `${compName}_核心指南说明.pdf`, type: "精选文档", size: "1.2 MB", url: "#" }
      ];
    }
    const isUrl = url.startsWith("http://") || url.startsWith("https://") || url.includes(".");
    const type = isUrl ? "外部链接" : "本地文件";
    const size = isUrl ? "链接地址" : "已插入";
    
    state.attachmentsByVideo[currentVideoId].push({
      name,
      type,
      size,
      url: url || "#"
    });
    
    persist();
    render();
    showToast("成功插入关联文件/链接！");
    return;
  }

  // 点击旁边自动关闭工具坞 (Tool Hub)
  if (state.hubOpen && !event.target.closest(".tool-hub-container")) {
    state.hubOpen = false;
    persist();
    render();
    // 如果是点击了空白区，则直接 return，不触发取消高亮等逻辑，让视觉过渡更自然
    const clickedCanvasBackground = event.target.closest("[data-canvas]") && 
      !event.target.closest(".component-node, .video-node, .topic-card, button, [data-action], [data-drawer]");
    if (clickedCanvasBackground) {
      return;
    }
  }

  if (suppressNextClick) {
    suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  // 地图式抽屉交互：轻点画布空白背景区重新唤醒面板，或取消节点高亮
  const clickedCanvasBackground = event.target.closest("[data-canvas]") && 
    !event.target.closest(".component-node, .video-node, .topic-card, button, [data-action], [data-drawer]");
  if (clickedCanvasBackground) {
    if (state.isDragging) {
      state.isDragging = false;
      setChromeStowed(false);
      render();
      showToast("显示工具面板");
      return;
    } else {
      if (state.activeComponentId) {
        state.activeComponentId = null;
        persist();
        render();
        return;
      }
    }
  }

  const target = event.target.closest("button, [data-nav], [data-action], [data-drawer], [data-video-card], [data-component], [data-open-video]");
  if (target) {
    target.classList.add("tap-hit");
    setTimeout(() => target.classList.remove("tap-hit"), 140);
  }

  const removeChip = event.target.closest("[data-remove-chip]");
  if (removeChip) {
    event.stopPropagation();
    state.chips = state.chips.filter((chip) => chip.id !== removeChip.dataset.removeChip);
    persist();
    render();
    showToast("已删除词条");
    return;
  }

  if (event.target.closest("[data-close]")) {
    state.drawer = null;
    render();
    return;
  }

  if (event.target.closest("[data-close-modal]")) {
    state.modal = null;
    render();
    return;
  }

  const nav = event.target.closest("[data-nav]");
  if (nav) {
    navigate(nav.dataset.nav);
    return;
  }

  const savedCanvas = event.target.closest("[data-open-canvas]");
  if (savedCanvas) {
    openSavedCanvas(savedCanvas.dataset.openCanvas);
    return;
  }

  const openVideo = event.target.closest("[data-open-video]");
  if (openVideo) {
    state.selectedVideoId = openVideo.dataset.openVideo;
    navigate("video");
    return;
  }

  const example = event.target.closest("[data-example]");
  if (example) {
    const ok = await runSearchQuery(example.dataset.example);
    if (ok && state.view !== "search") navigate("search");
    return;
  }

  const chip = event.target.closest("[data-chip]");
  if (chip) {
    const item = state.chips.find((entry) => entry.id === chip.dataset.chip);
    if (item) item.selected = !item.selected;
    persist();
    render();
    return;
  }

  const pickVideo = event.target.closest("[data-pick-video]");
  if (pickVideo) {
    state.selectedCandidateVideoId = pickVideo.dataset.pickVideo;
    persist();
    render();
    showToast("已选中待添加视频");
    return;
  }

  const videoCard = event.target.closest("[data-video-card]");
  if (videoCard) {
    state.selectedVideoId = videoCard.dataset.videoCard;
    state.drawer = "video";
    render();
    return;
  }

  const component = event.target.closest("[data-component]");
  if (component) {
    state.activeComponentId = component.dataset.component;
    state.routeMode = false;
    state.lastWatchedVideoId = null;
    persist();
    render();
    return;
  }

  const componentAction = event.target.closest("[data-component-action]");
  if (componentAction) {
    const targetComponent = componentById(componentAction.dataset.componentAction);
    if (!targetComponent) {
      showToast("这个分支已不存在，已回到中心");
      state.activeComponentId = null;
      state.routeMode = false;
      persist();
      render();
      return;
    }
    state.activeComponentId = targetComponent.id;
    state.routeMode = false;
    state.lastWatchedVideoId = null;
    persist();
    render();
    showToast(`已聚焦：${targetComponent.name}`);
    return;
  }

  const selectSuggestion = event.target.closest("[data-select-suggestion]");
  if (selectSuggestion) {
    selectSearchSuggestion(selectSuggestion.dataset.selectSuggestion);
    return;
  }

  if (!event.target.closest(".search-input-container")) {
    const dropdown = document.getElementById("searchSuggestionsDropdown");
    if (dropdown) dropdown.style.display = "none";
  }

  const drawer = event.target.closest("[data-drawer]");
  if (drawer) {
    state.drawer = drawer.dataset.drawer;
    state.hubOpen = false; // Close Tool Hub when a drawer opens
    render();
    return;
  }

  const modal = event.target.closest("[data-modal]");
  if (modal) {
    state.modal = modal.dataset.modal;
    render();
    return;
  }

  const color = event.target.closest("[data-color]");
  if (color) {
    state.newComponentColor = color.dataset.color;
    render();
    return;
  }

  const fill = event.target.closest("[data-fill-component]");
  if (fill) {
    const input = rootEl.querySelector("#componentName");
    if (input) input.value = fill.dataset.fillComponent;
    return;
  }

  const agentIntent = event.target.closest("[data-agent-intent]");
  if (agentIntent) {
    await runAgent(agentIntent.dataset.agentIntent);
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action) await handleAction(action.dataset.action, action);
});

listen(app, "submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  if (form.dataset.form === "search") {
    const fromHome = state.view === "home";
    const ok = await runSearchQuery(formData.get("query") || "");
    if (ok && fromHome) navigate("search");
  }
  if (form.dataset.form === "input") {
    state.query = formData.get("query") || "";
    if (!state.query.trim()) {
      showToast("先输入一个想学习的主题");
      return;
    }
    prepareTopicPlan(state.query);
    state.chipsReady = true;
    navigate("search");
  }
});

listen(app, "input", (event) => {
  const query = event.target.closest('input[name="query"]');
  if (query) {
    state.query = query.value;
    if (state.view === "search") {
      showSuggestionsDropdown(query.value);
    }
  }
  const weight = event.target.closest("[data-weight]");
  if (weight) {
    const component = componentById(weight.dataset.weight);
    if (component) component.weight = Number(weight.value);
    persist();
  }
  if (event.target.id === "addComponentSelect") {
    state.selectedAddComponent = event.target.value;
    state.selectedCandidateVideoId = "";
    persist();
    render();
  }
});

listen(app, "focusin", (event) => {
  const queryInput = event.target.closest('input[name="query"]');
  if (queryInput && state.view === "search") {
    showSuggestionsDropdown(queryInput.value);
  }
});

async function handleAction(action, el) {
  if (action && action !== "toggle-hub") {
    state.hubOpen = false; // Automatically close the hub when triggering other actions
  }

  if (action === "toggle-hub") {
    state.hubOpen = !state.hubOpen;
    persist();
    render();
    return;
  }
  if (action === "back") {
    goBack();
  }
  if (action === "open-current-canvas") openCurrentCanvas();
  if (action === "toggle-agent-mode") {
    state.agentMode = !state.agentMode;
    state.searchSource = state.agentMode ? "agent" : "search";
    persist();
    render();
    showToast(state.agentMode ? "已开启 Agent 模式" : "已切换到搜索模式");
  }
  if (action === "new-search") {
    state.query = "";
    state.chipsReady = false;
    state.pendingResult = null;
    state.chips = [];
    state.searchResults = [];
    state.searchAnswer = "";
    navigate("search");
  }
  if (action === "extract-current-video") {
    if (!state.entryVideo) {
      showToast("还没有带入当前视频");
      return;
    }
    await autoGenerateFromEntryVideo();
  }
  if (action === "more-chips") {
    const existing = new Set(state.chips.map((chip) => chip.name));
    const topic = state.pendingResult?.topic || canvasTopic();
    const candidates = buildChipsForTopic(topic, state.pendingResult?.components || [])
      .concat(topicTemplates(topic, state.query).flatMap((item) => [item.name, `${item.name}案例`, `${item.name}避坑`]))
      .concat(["工具方法", "学习顺序", "案例拆解", "进阶路线", "避坑清单"])
      .filter((name) => !existing.has(name));
    candidates.slice(0, 3).forEach((name, index) => {
      state.chips.push({ id: `chip-${Date.now()}-${index}`, name, selected: true, color: chipColor(state.chips.length + index) });
    });
    persist();
    render();
    showToast("AI 已按当前主题补充词条");
  }
  if (action === "zoom-in") {
    state.zoom = Math.min(1.25, state.zoom + 0.08);
    persist();
    render();
  }
  if (action === "zoom-out") {
    state.zoom = Math.max(0.62, state.zoom - 0.08);
    persist();
    render();
  }
  if (action === "center") {
    resetCanvasCenter();
    showToast("已回到画布中心");
  }
  if (action === "route") {
    state.routeMode = !state.routeMode;
    state.activeComponentId = null;
    persist();
    render();
    showToast(state.routeMode ? "已生成 30 分钟入门路线" : "已退出路线高亮");
  }
  if (action === "reflow") {
    reflowComponents();
    render();
    showToast("节点已重新布局");
  }
  if (action === "dim-nodes") {
    state.routeMode = false;
    state.activeComponentId = state.activeComponentId || "api";
    render();
    showToast("已聚焦当前分支");
  }
  if (action === "delete-active") deleteActiveComponent();
  if (action === "toggle-edit") {
    state.editMode = !state.editMode;
    state.drawer = null;
    render();
    showToast(state.editMode ? "编辑模式：可拖动组件" : "已退出编辑模式");
  }
  if (action === "mark-video") markVideo(el.dataset.id);
  if (action === "mark-finished") {
    markVideo(state.selectedVideoId, true);
    applyWatchCompletionState(state.selectedVideoId);
    navigate("canvas");
    showToast("已同步更新到画布");
  }
  if (action === "toggle-video-play") {
    const player = rootEl.querySelector(".canvas-real-video");
    if (!player) {
      showToast("当前节点还没有接入视频文件");
      return;
    }
    if (player.paused) {
      player.play();
      showToast("继续播放");
    } else {
      player.pause();
      showToast("已暂停");
    }
  }
  if (action === "set-next") {
    state.videos.forEach((video) => video.next = false);
    const video = videoById(el.dataset.id);
    if (video) video.next = true;
    persist();
    render();
    showToast("已设为下一步视频");
  }
  if (action === "join-route") {
    const joined = joinSelectedVideoToRouteState(state, el.dataset.id || state.selectedVideoId);
    persist();
    render();
    showToast(joined ? "已加入当前学习路线" : "没有找到可加入的视频");
  }
  if (action === "remove-video") {
    state.videos = state.videos.filter((video) => video.id !== el.dataset.id);
    state.drawer = null;
    persist();
    render();
    showToast("已移出组件");
  }
  if (action === "create-component") createComponent();
  if (action === "agent-component") createAgentRecommendedComponent();
  if (action === "add-video-to-component") addVideoToComponent();
  if (action === "agent-run") {
    const prompt = rootEl.querySelector("#agentPrompt")?.value || "优化这张画布";
    await runAgent(prompt);
  }
  if (action === "agent-preview") {
    state.modal = "agentPreview";
    render();
  }
  if (action === "apply-agent") applyAgentV2();
  if (action === "apply-weights") {
    reflowComponents();
    state.drawer = null;
    render();
    showToast("权重已应用，画布已重排");
  }
  if (action === "lock-active") {
    const component = toggleActiveComponentLockState(state);
    persist();
    render();
    showToast(component ? (component.locked ? "当前组件已锁定" : "当前组件已解锁") : "请先选择组件");
  }
  if (action === "save-route") {
    saveCurrentRouteState(state);
    persist();
    render();
    showToast("路线已保存");
  }
  if (action === "share-route") {
    const route = saveCurrentRouteState(state);
    state.routeShareText = buildRouteShareText(route);
    persist();
    render();
    showToast("分享卡片已生成");
  }
  if (action === "extract-generate") {
    state.modal = null;
    navigate("generating");
  }
  if (action === "extract-edit") {
    state.modal = null;
    state.query = "从视频提取：本地视频 / video-1 / video-2 / video-3 / 待整理";
    state.chipsReady = true;
    navigate("confirm");
  }
  if (action === "create-canvas") {
    const name = rootEl.querySelector("#newCanvasName")?.value || "新的知识画布";
    state.savedCanvases.unshift({ id: `canvas-${Date.now()}`, title: name, tags: ["AI 生成", "新建"], videos: 0, progress: 0, updated: "刚刚" });
    persist();
    navigate("search");
    showToast("新画布已创建");
  }
  if (action === "rename-canvas") {
    const item = state.savedCanvases.find((canvas) => canvas.id === el.dataset.id);
    if (item) item.title = `${item.title}（已重命名）`;
    persist();
    render();
    showToast("画布已重命名");
  }
  if (action === "delete-canvas") {
    state.savedCanvases = state.savedCanvases.filter((canvas) => canvas.id !== el.dataset.id);
    persist();
    render();
    showToast("画布已删除");
  }
  if (action === "rename-component") {
    const component = componentById(el.dataset.id);
    if (component) component.name = `${component.name}*`;
    persist();
    render();
    showToast("组件已重命名");
  }
  if (action === "delete-component") {
    const id = el.dataset.id;
    state.components = state.components.filter((component) => component.id !== id);
    state.videos = state.videos.filter((video) => video.componentId !== id);
    state.activeComponentId = null;
    state.drawer = null;
    persist();
    render();
    showToast("组件已删除");
  }
  if (action === "reset-demo") {
    localStorage.removeItem(STORE_KEY);
    Object.assign(state, freshState());
    render();
    showToast("Demo 已重置");
  }
}

function markVideo(id, silent = false) {
  const video = videoById(id);
  if (!video) return;
  video.watched = true;
  video.progress = 100;
  state.lastWatchedVideoId = id;
  if (!silent) applyWatchCompletionState(id);
  state.drawer = null;
  persist();
  if (!silent) {
    render();
    showToast("已标记为看完");
  }
}

function applyWatchCompletionState(id) {
  const watched = videoById(id);
  if (!watched) return;
  state.videos.forEach((video) => {
    video.next = false;
  });
  const suggestion = postWatchSuggestion();
  if (suggestion?.video) suggestion.video.next = true;
  state.lastWatchedVideoId = id;
  state.activeComponentId = watched.componentId;
  state.routeMode = false;
  state.drawer = null;
}

function createComponent() {
  const name = rootEl.querySelector("#componentName")?.value.trim() || "错误排查";
  const id = `c-${Date.now()}`;
  state.components.push({
    id,
    name,
    color: state.newComponentColor,
    line: "#19CFC3",
    x: 330,
    y: 130,
    weight: 70,
    locked: false,
    excluded: false,
    desc: "由用户或 Agent 新增的学习组件，可继续匹配视频和路线。",
  });
  state.activeComponentId = id;
  state.drawer = null;
  persist();
  render();
  showToast("组件已创建");
}

function createAgentRecommendedComponent() {
  const result = normalizeAgentResult({
    mode: "optimize",
    topic: canvasTopic(),
    title: "Agent 推荐组件",
    components: [
      {
        name: "Agent 推荐分支",
        desc: "由 Agent 根据当前画布自动补充的学习组件。",
        color: "#EDF7FF",
        videos: [
          { title: "Agent 推荐：下一步该看什么", summary: "根据当前组件和观看进度推荐后续视频。", reason: "用于补齐当前路线断点。", duration: "06:20" },
          { title: "Agent 推荐：组件重排方法", summary: "说明如何根据权重和学习顺序重排画布。", reason: "让画布结构更清楚。", duration: "05:48" },
        ],
      },
    ],
    changes: ["新增 Agent 推荐分支", "补充 2 条推荐视频", "已重新布局画布"],
  });
  const component = createAgentComponent(result.components[0].name, result);
  state.activeComponentId = component.id;
  state.drawer = null;
  state.routeMode = false;
  reflowComponents();
  persist();
  render();
  showToast("Agent 已创建推荐组件");
}

function addVideoToComponent() {
  const component = currentAddComponent();
  const componentId = component?.id;
  const picked = videoById(state.selectedCandidateVideoId);
  if (!component) {
    showToast("请先选择一个组件");
    return;
  }
  if (picked) {
    const id = `added-${Date.now()}`;
    state.videos.push({
      ...copy(picked),
      id,
      componentId,
      tags: [...new Set([...(picked.tags || []), component.name])],
      progress: 0,
      watched: false,
      next: false,
      source: false,
      offsetX: undefined,
      offsetY: undefined,
    });
    state.selectedCandidateVideoId = "";
    state.activeComponentId = componentId;
    state.drawer = null;
    persist();
    render();
    showToast(`已添加到 ${component.name}`);
    return;
  }
  state.videos.push({
    id: `new-video-${Date.now()}`,
    title: `${picked?.title || "本地视频"}（补充）`,
    creator: picked?.creator || "本地素材",
    duration: picked?.duration || "待识别",
    componentId,
    tags: picked?.tags || ["本地视频"],
    summary: picked?.summary || "来自当前项目中的本地视频文件。",
    reason: "它复用当前项目真实存在的视频文件，不新增虚构素材。",
    progress: picked?.progress || 0,
    watched: false,
    coverType: picked?.coverType || "local-copy",
    coverImage: picked?.coverImage || "",
    sourceUrl: picked?.sourceUrl || "",
    fileName: picked?.fileName || "",
  });
  state.drawer = null;
  persist();
  render();
  showToast(`视频已添加到 ${component.name}`);
}

function applyAgent() {
  const result = state.agentResult || fallbackAgentResult();
  const componentId = "local-review";
  const componentName = "本地素材复盘";
  const componentColor = "#EDF7FF";
  const componentLine = "#69BFE7";
  const localVideos = state.videos.filter((video) => video.sourceUrl).slice(0, 3);

  if (!componentById(componentId)) {
    state.components.push({
      id: componentId,
      name: componentName,
      color: componentColor,
      line: componentLine,
      x: 448,
      y: 126,
      weight: 70,
      locked: false,
      excluded: false,
      desc: "由 Agent 根据你的指令新增的画布分支。",
    });
    localVideos.forEach((video, index) => {
      state.videos.push({
        id: `${componentId}-${Date.now()}-${index}`,
        title: `${video.title}（复盘）`,
        creator: video.creator || "本地素材",
        duration: video.duration,
        componentId,
        tags: [...new Set([...(video.tags || []), componentName])],
        summary: video.summary,
        reason: "复用当前项目真实存在的视频文件，用于本地素材复盘。",
        progress: video.progress || 0,
        watched: false,
        coverType: video.coverType || `${componentId}-${index}`,
        coverImage: video.coverImage || "",
        sourceUrl: video.sourceUrl || "",
        fileName: video.fileName || "",
      });
    });
  }
  state.modal = null;
  state.drawer = null;
  state.activeComponentId = componentId;
  state.routeMode = true;
  reflowComponents();
  persist();
  render();
  showToast("已应用 Agent 建议");
}

function applyAgentV2() {
  const result = state.agentResult || fallbackAgentResult();
  if (result.mode === "replace") {
    replaceCanvasFromAgent(result);
  } else {
    applyAgentOperations(result);
  }
  state.modal = null;
  state.drawer = null;
  reflowComponents();
  persist();
  render();
  showToast(result.mode === "replace" ? "已生成新的知识画布" : "已应用 Agent 建议");
}

function applyAgentOperations(result) {
  const text = `${result.intent || ""} ${result.title || ""} ${(result.changes || []).join(" ")}`;
  let changed = false;
  if (/重复|去重/.test(text)) {
    const removed = removeDuplicateOrLowValueVideos(2);
    result.changes = [`已移除 ${removed} 条重复或低价值视频`, "保留每个分支里更适合继续学习的视频", "画布已重新整理"];
    changed = true;
  }
  if (/新手|入门|30\s*分钟|路线/.test(text)) {
    state.routeIds = resolveRouteIds(result);
    state.routeMode = true;
    state.activeComponentId = null;
    changed = true;
  }
  if (/重命名/.test(text) && state.activeComponentId) {
    const component = componentById(state.activeComponentId);
    component.name = `${component.name}优化版`;
    changed = true;
  }
  if (/删除组件|移除组件|删掉组件/.test(text) && state.activeComponentId && state.components.length > 3) {
    const removedId = state.activeComponentId;
    state.components = state.components.filter((component) => component.id !== removedId);
    state.videos = state.videos.filter((video) => video.componentId !== removedId);
    state.activeComponentId = state.components[0]?.id || null;
    changed = true;
  }
  if (/新增|添加|补充|新建|扩展|优化/.test(text)) {
    optimizeCanvasFromAgent(result);
    changed = true;
  }
  if (!changed) {
    state.routeIds = resolveRouteIds(result);
    state.routeMode = true;
  }
}

function resolveRouteIds(result) {
  const byName = new Map(state.components.map((component) => [component.name, component.id]));
  const fromResult = (result.route || []).map((name) => byName.get(name)).filter(Boolean);
  if (fromResult.length) return fromResult;
  return state.components
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 4)
    .map((component) => component.id);
}

function removeDuplicateOrLowValueVideos(targetCount = 2) {
  const seen = new Set();
  const removable = [];
  for (const video of state.videos) {
    const key = video.title.replace(/\s+/g, "").toLowerCase();
    if (seen.has(key)) removable.push(video.id);
    seen.add(key);
  }
  if (removable.length < targetCount) {
    const extras = state.videos
      .filter((video) => !video.watched && !video.next && !video.source)
      .slice(-targetCount * 2)
      .map((video) => video.id);
    removable.push(...extras);
  }
  const ids = new Set(removable.slice(0, targetCount));
  state.videos = state.videos.filter((video) => !ids.has(video.id));
  return ids.size;
}

function replaceCanvasFromAgent(result) {
  const topic = result.topic || "新主题";
  const generatedComponents = result.components.length ? result.components : topicTemplates(topic, "");
  const idByName = new Map();
  const idBySourceId = new Map();
  state.canvas = {
    topic,
    title: result.title || `${topic} 学习路线图`,
    routeTitle: result.routeTitle || `${topic} 30 分钟入门路线`,
    description: result.videos?.length ? "由当前视频推荐逻辑生成" : "由 Agent 根据你的问题生成",
  };
  state.components = withTreeLayout(generatedComponents.map((item, index) => {
    const id = item.id || slugId(item.name || `模块 ${index + 1}`, index);
    idByName.set(item.name, id);
    idBySourceId.set(item.id, id);
    return {
      id,
      name: item.name || `模块 ${index + 1}`,
      color: item.color || chipColor(index),
      line: item.line || ["#83C9A8", "#83D6EF", "#8B7CF6", "#F2C36B", "#FF7A7A", "#69BFE7"][index % 6],
      weight: item.weight || 78 + (index % 3) * 5,
      locked: false,
      excluded: false,
      desc: item.desc || `${topic} 的学习分支。`,
    };
  }));
  state.videos = [];
  if (Array.isArray(result.videos) && result.videos.length) {
    state.videos = result.videos.map((video, index) => ({
      ...video,
      id: video.id || `runtime-video-${index}-${Date.now()}`,
      componentId: idBySourceId.get(video.componentId) || idByName.get(video.componentName) || video.componentId || state.components[0]?.id,
      progress: Number(video.progress || 0),
      watched: Boolean(video.watched),
      next: Boolean(video.next),
      source: Boolean(video.source),
      coverType: video.coverType || `${topic}-${index}`,
      coverImage: video.coverImage || "",
      sourceUrl: video.sourceUrl || "",
      fileName: video.fileName || "",
    }));
  } else {
    generatedComponents.forEach((item, componentIndex) => {
      const componentId = idByName.get(item.name) || state.components[componentIndex]?.id;
      const videos = item.videos?.length ? item.videos : makeComponents(topic, [item.name])[0].videos;
      videos.slice(0, 5).forEach((video, videoIndex) => {
      state.videos.push({
        id: `${componentId}-v${videoIndex}-${Date.now()}`,
        title: video.title || `${topic}${item.name}第 ${videoIndex + 1} 课`,
        creator: video.creator || "AI 学习助手",
        duration: video.duration || ["06:20", "08:12", "05:48", "09:30", "07:06"][videoIndex],
        componentId,
        tags: video.tags?.length ? video.tags : [topic, item.name],
        summary: video.summary || `围绕 ${topic} 的 ${item.name} 展开。`,
        reason: video.reason || `它适合补齐 ${topic} 学习路线中的 ${item.name}。`,
        progress: 0,
        watched: false,
        coverType: `${topic}-${componentIndex}-${videoIndex}`,
        coverImage: video.coverImage || "",
        sourceUrl: video.sourceUrl || "",
        fileName: video.fileName || "",
        next: componentIndex === 0 && videoIndex === 0,
        source: componentIndex === 0 && videoIndex === 0,
      });
    });
    });
  }
  state.routeIds = (result.route || [])
    .map((name) => idByName.get(name) || idBySourceId.get(name) || (state.components.some((component) => component.id === name) ? name : null))
    .filter(Boolean);
  if (!state.routeIds.length) state.routeIds = state.components.slice(0, 4).map((component) => component.id);
  state.activeComponentId = state.routeIds[0] || state.components[0]?.id || null;
  state.selectedVideoId = state.videos[0]?.id || null;
  state.lastWatchedVideoId = null;
  state.savedCanvases.unshift({
    id: `agent-${Date.now()}`,
    title: state.canvas.title,
    tags: [topic, "Agent 生成"],
    videos: state.videos.length,
    progress: 0,
    updated: "刚刚",
  });
}

function optimizeCanvasFromAgent(result) {
  const componentId = `agent-${Date.now()}`;
  const suggested = result.components?.[0];
  const name = suggested?.name || (result.topic && result.topic !== canvasTopic() ? `${result.topic}补充` : "Agent 优化");
  state.components.push({
    id: componentId,
    name,
    color: suggested?.color || "#EDF7FF",
    line: "#69BFE7",
    x: 448,
    y: 126,
    weight: 72,
    locked: false,
    excluded: false,
    desc: suggested?.desc || "由 Agent 根据你的指令新增的画布分支。",
  });
  const videos = suggested?.videos?.length
    ? suggested.videos
    : result.changes.slice(0, 3).map((change) => ({ title: change.replace(/^新增视频：?/, "") }));
  videos.slice(0, 4).forEach((video, index) => {
    state.videos.push({
      id: `${componentId}-v${index}`,
      title: video.title || `${name}视频 ${index + 1}`,
      creator: video.creator || "AI 学习助手",
      duration: video.duration || ["04:58", "06:22", "07:16", "08:10"][index],
      componentId,
      tags: [name, "Agent"],
      summary: video.summary || "Agent 建议新增的视频，用于补齐当前画布结构。",
      reason: video.reason || "它能让当前学习路线更完整、更适合继续学习。",
      progress: 0,
      watched: false,
      coverType: `${componentId}-${index}`,
    });
  });
  state.routeIds = [...new Set([...(state.routeIds || activeRouteIds()), componentId])].slice(0, 5);
  state.activeComponentId = componentId;
}

function slugId(name, index) {
  return `c-${index}-${String(name).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").slice(0, 18)}`;
}

function deleteActiveComponent() {
  if (!state.activeComponentId) {
    showToast("请先选择一个组件");
    return;
  }
  state.components = state.components.filter((component) => component.id !== state.activeComponentId);
  state.videos = state.videos.filter((video) => video.componentId !== state.activeComponentId);
  state.activeComponentId = null;
  persist();
  render();
  showToast("组件已放入回收");
}

function reflowComponents() {
  reflowComponentsForState(state);
  persist();
}

listen(app, "pointerdown", (event) => {
  const videoEl = event.target.closest(".video-node");
  if (videoEl) {
    const video = videoById(videoEl.dataset.videoCard);
    const component = componentById(video.componentId);
    const pos = videoPosition(video);
    state.dragVideo = {
      id: video.id,
      componentId: video.componentId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: pos.x - component.x,
      offsetY: pos.y - component.y,
    };
    state.isDragging = true;
    state.selectedVideoId = video.id;
    state.activeComponentId = video.componentId;
    setChromeStowed(true);
    videoEl.setPointerCapture(event.pointerId);
    return;
  }

  const componentEl = event.target.closest(".component-node");
  if (componentEl) {
    const component = componentById(componentEl.dataset.component);
    state.dragComponent = { id: component.id, startX: event.clientX, startY: event.clientY, x: component.x, y: component.y };
    state.isDragging = true;
    state.activeComponentId = component.id;
    setChromeStowed(true);
    componentEl.setPointerCapture(event.pointerId);
    return;
  }
  const canvas = event.target.closest("[data-canvas]");
  if (canvas && !event.target.closest(".component-node") && !event.target.closest(".video-node") && !event.target.closest(".topic-card")) {
    state.dragCanvas = { startX: event.clientX, startY: event.clientY, x: state.pan.x, y: state.pan.y };
    state.isDragging = true;
    setChromeStowed(true);
    canvas.setPointerCapture(event.pointerId);
  }
});

listen(app, "pointermove", (event) => {
  if (state.dragVideo) {
    event.preventDefault();
    const drag = state.dragVideo;
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 5) drag.moved = true;
    const video = videoById(drag.id);
    video.offsetX = Math.round(drag.offsetX + (event.clientX - drag.startX) / state.zoom);
    video.offsetY = Math.round(drag.offsetY + (event.clientY - drag.startY) / state.zoom);
    const pos = videoPosition(video);
    const node = rootEl.querySelector(`[data-video-card="${drag.id}"]`);
    if (node) {
      node.style.left = `${pos.x}px`;
      node.style.top = `${pos.y}px`;
      drawEdges();
    }
  } else if (state.dragComponent) {
    event.preventDefault();
    const drag = state.dragComponent;
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 5) drag.moved = true;
    const component = componentById(drag.id);
    component.x = Math.round(drag.x + (event.clientX - drag.startX) / state.zoom);
    component.y = Math.round(drag.y + (event.clientY - drag.startY) / state.zoom);
    const node = rootEl.querySelector(`[data-component="${drag.id}"]`);
    if (node) {
      node.style.left = `${component.x}px`;
      node.style.top = `${component.y}px`;
      videosByComponent(component.id).forEach((video) => {
        const pos = videoPosition(video);
        const videoNodeEl = rootEl.querySelector(`[data-video-card="${video.id}"]`);
        if (videoNodeEl) {
          videoNodeEl.style.left = `${pos.x}px`;
          videoNodeEl.style.top = `${pos.y}px`;
        }
      });
      drawEdges();
    }
  } else if (state.dragCanvas) {
    event.preventDefault();
    const drag = state.dragCanvas;
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 5) drag.moved = true;
    state.pan = { x: drag.x + event.clientX - drag.startX, y: drag.y + event.clientY - drag.startY };
    const world = rootEl.querySelector(".canvas-world");
    if (world) world.setAttribute("style", worldStyle());
  }
});

function finishDrag() {
  if (state.dragCanvas || state.dragComponent || state.dragVideo) {
    const isDragCanvas = Boolean(state.dragCanvas);
    const isDragComponent = Boolean(state.dragComponent);
    const isDragVideo = Boolean(state.dragVideo);

    const dragCanvasMoved = Boolean(state.dragCanvas?.moved);
    const dragComponentMoved = Boolean(state.dragComponent?.moved);
    const dragVideoMoved = Boolean(state.dragVideo?.moved);

    const videoId = state.dragVideo?.id;
    const videoComponentId = state.dragVideo?.componentId;
    const componentId = state.dragComponent?.id;

    suppressNextClick = Boolean(dragCanvasMoved || dragComponentMoved || dragVideoMoved);
    
    state.dragCanvas = null;
    state.dragComponent = null;
    state.dragVideo = null;
    
    if (suppressNextClick) {
      state.isDragging = true;
      setChromeStowed(true);
    } else {
      state.isDragging = false;
      setChromeStowed(false);
      
      // 轻点手势毫秒级激活，防止 render() DOM 重绘把 click 事件吞掉
      if (isDragVideo && videoId) {
        state.selectedVideoId = videoId;
        state.drawer = "video";
        state.activeComponentId = videoComponentId;
      } else if (isDragComponent && componentId) {
        state.activeComponentId = componentId;
        state.routeMode = false;
        state.lastWatchedVideoId = null;
      }
    }
    persist();
    render();
  }
}

listen(app, "pointerup", finishDrag);
listen(app, "pointercancel", finishDrag);

function setChromeStowed(stowed) {
  rootEl.querySelectorAll(".tool-hub-container, .bottom-control, .canvas-titlebar, .focus-bar, .next-suggestion, .route-card").forEach((element) => {
    element.classList.toggle("is-stowed", stowed);
  });
}

fitPhoneToViewport();
listen(window, "resize", fitPhoneToViewport);
listen(window, "orientationchange", fitPhoneToViewport);

// 右滑返回手势监听
let touchStartX = 0;
let touchStartY = 0;
listen(app, "touchstart", (e) => {
  if (!e.touches?.length) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

listen(app, "touchend", (e) => {
  if (state.view === "video") {
    if (!e.changedTouches?.length) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    // 判定实质性向右滑动且上下偏角不大
    if (diffX > 78 && Math.abs(diffY) < 40) {
      navigate("canvas");
      showToast("已右滑返回画布");
    }
  }
}, { passive: true });

render();
if (entryVideo) openFromVideo(entryVideo, { autoGenerate: true, silent: true });

  return {
    openFromVideo,
    navigate,
    destroy() {
      clearTimeout(generateTimer);
      clearTimeout(toastTimer);
      clearTimeout(autoGenerateTimer);
      cleanup.splice(0).forEach((dispose) => dispose());
      app.innerHTML = '';
      toastEl.textContent = '';
      toastEl.className = 'toast';
    }
  };
}
