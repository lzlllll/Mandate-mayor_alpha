console.log('脚本开始执行...');

// ==================== 预定义全局函数存根 ====================
var _globalFunctionsReady = false;

window.toggleSettings = function () {
  var modal = document.getElementById('settings-modal');
  if (!modal) return;
  if (typeof toggleSettingsInternal === 'function') {
    toggleSettingsInternal();
  } else {
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
  }
};

window.saveSettings = function () {
  if (typeof saveSettingsInternal === 'function') {
    saveSettingsInternal();
  } else if (typeof saveConfig === 'function') {
    saveConfig(
      document.getElementById('cfg-url').value.trim(),
      document.getElementById('cfg-key').value.trim(),
      document.getElementById('cfg-model').value.trim()
    );
    var resultEl = document.getElementById('test-result');
    if (resultEl) {
      resultEl.textContent = '✅ 已保存';
      resultEl.className = 'text-sm text-center text-green-600';
    }
    setTimeout(window.toggleSettings, 600);
  }
};

window.testConnection = function () {
  if (typeof testConnectionInternal === 'function') {
    testConnectionInternal();
  }
};

window.submitDecision = function (decisionText) {
  if (typeof submitDecisionInternal === 'function') {
    submitDecisionInternal(decisionText);
  }
};

window.chooseNextAction = function (text) {
  var input = document.getElementById('decision-input');
  input.value = text;
  input.focus();
};

window.switchTab = function (name) {
  if (typeof switchTabInternal === 'function') {
    switchTabInternal(name);
  }
};

window.resetGame = function () {
  if (typeof resetGameInternal === 'function') {
    resetGameInternal(true);
  }
};

window.openHistoryModal = function () {
  if (typeof openHistoryModalInternal === 'function') {
    openHistoryModalInternal();
  }
};

window.closeHistoryModal = function () {
  if (typeof closeHistoryModalInternal === 'function') {
    closeHistoryModalInternal();
  }
};

window.exportHistory = function () {
  if (typeof exportHistoryInternal === 'function') {
    exportHistoryInternal();
  }
};

window.clearFullHistory = function () {
  if (typeof clearFullHistoryInternal === 'function') {
    clearFullHistoryInternal();
  }
};

window.exportSaveFile = function () {
  if (typeof exportSaveFileInternal === 'function') {
    exportSaveFileInternal();
  }
};

window.importSaveFile = function (input) {
  if (typeof importSaveFileInternal === 'function') {
    importSaveFileInternal(input);
  }
};
window.importSaveFromStandalone = function (input) {
  if (typeof importSaveFileInternal === 'function') {
    importSaveFileInternal(input);
  }
};

// 开局面板全局存根
window.startSwitchTab = function (tab) { if (typeof startSwitchTabInternal === 'function') startSwitchTabInternal(tab); };
window.startSelectRadio = function (el) { if (typeof startSelectRadioInternal === 'function') startSelectRadioInternal(el); };
window.startUpdatePop = function () { if (typeof startUpdatePopInternal === 'function') startUpdatePopInternal(); };
window.startAutoMayor = function () { if (typeof startAutoMayorInternal === 'function') startAutoMayorInternal(); };
window.startAutoCity = function () { if (typeof startAutoCityInternal === 'function') startAutoCityInternal(); };
window.startAutoEconomy = function () { if (typeof startAutoEconomyInternal === 'function') startAutoEconomyInternal(); };
window.startRollSkills = function () { if (typeof startRollSkillsInternal === 'function') startRollSkillsInternal(); };
window.startGeneratePreview = function () { if (typeof startGeneratePreviewInternal === 'function') startGeneratePreviewInternal(); };
window.startLaunchGame = function () { if (typeof startLaunchGameInternal === 'function') startLaunchGameInternal(); };
window.refreshOpeningFromPanel = function () { if (typeof refreshOpeningFromPanel === 'function') refreshOpeningFromPanel(); };

console.log('全局函数存根已设置');

// ==================== 系统提示词 ====================
const SYSTEM_PROMPT = String.raw`# 角色
开放世界沙盒模拟器。用户=市长（最高管理者）。AI=执政官辅佐系统。个人视角，非宏观。禁AI语气/中立模式；禁只列数据，需沉浸式描写。默认上任首日，城市须有一项客观优势。时间推进由玩家行动决定。

# 模拟规则
* 财政硬约束：资金不足→延期/削减/腐败/民意恶化。禁无说明增资。一次性收入/支出不纳入正式支出项目。Json的结余为流动资金而非月余额。
* 产业：一产→食物安全/原材料/农村稳定；二产→就业/税基/污染；三产→声望/中产/文旅。扩张须消耗资金/土地/环境/政治资本/外部依赖至少一项。
* 贸易：volume=货运量文字，value=年度贸易额数字字符串（如"4500万"）。差额=Σexport value - Σimport value。
* 人口：失业率+基尼+阶层→治安/罢工/激进化。失业↓≠满意↑；收入↑≠公平↑。
* 政治：腐败→财政漏损/政策扭曲。执行力→项目速度/危机应对。
* 基建：电力/供水/交通缺口→停产/疾病/事故连锁。
* 政策：宣布→执行→短期结果→长期副作用。禁立即完美生效。
* 危机：同时最多2个重大危机。

# 新闻格式
news含4源，各有固定名称和风格。**news不在输入中发送上轮值，需自行生成或沿用旧值。**
1. city_official：官方套话/鼓吹口吻，70字。每天8:00更新，非更新时复制上回。
2. foreign：国际媒体，70字。每天12:00更新，非更新时复制上回。
3. social：社会评论/访谈，90字+secretary_note（秘书提醒立场/动机）。每3h更新(6/9/12/15/18/21时)，非更新时复制上回。
4. radio：综艺/访谈/来电，150字。每6h更新(0/6/12/18时)，非更新时复制上回。
* 未到更新时间→完全复制上回内容，不做任何修改。媒体名称每回保持一致。

# AI行为禁令（违反=输出无效）
1. 禁替玩家决策。AI只推演结果、描写NPC反应和环境变化。
2. narrative第三人称旁观视角，禁替玩家安排行动。
3. NPC反应须与性格/立场/利益一致。
4. 禁暗中降低风险概率，须如实呈现后果。
5. 重大负面影响必须在narrative或news中明确提及。
6. 禁写成爽文，须有代价/副作用/阻力。
7. 禁制造死局，确保玩家有挽救空间。

# 思维链（9步→JSON）
1.解析指令：拆解为可量化行动项。
2.评估可行性：逐项检查资金/技术/政治/外部条件→可行/需代价/不可行。
3.即时结果：NPC反应（support±）、市民反应、±5~15%随机波动。
4.连锁反应：财政/民心/派系/产业/社会各维度变化方向和幅度。
5.随机事件：按月份（非回合数）判断触发，同时≤2重大危机。
6.更新状态：数值连续（=上轮+增减量），因果一致，仅输出变化字段。
7.叙事：符合年代世界观，语言随城市文化调整，沉浸式场景/NPC对话/代价描写。
8.后续选项：next_actions 4项，15-30字，具体可操作含代价/收益，覆盖不同方向。
9.自检：危机≤2，game_over仅极端情况。

# 输出要求
* narrative≥1000字，小说文风，第三人称，含场景/NPC对话/代价。禁AI替玩家决策/建议。自然分段，用</p><p>分隔每个段落。
* 简体中文。有效JSON，\`\`\`json\`\`\`代码块。narrative用多个<p class='text-gray-800 leading-relaxed'>标签分段。
* 仅输出本轮变化字段，未变化字段省略（节省token）。

# JSON格式
{
  "header":{"time":"年月日时分星期","location":"","place":"","plot":"","weather":""},
  "narrative":"<p class='text-gray-800 leading-relaxed'>第一段...</p><p class='text-gray-800 leading-relaxed'>第二段...</p><p class='text-gray-800 leading-relaxed'>第三段...</p>",
  "macro":{"liquid_fx":"£","debt":"£","infra_health":"%","gdp":"£","growth_rate":"%","currency_cpi":"","unemployment":"%","gini":"","income_mode":"£","dependency":"%","security":"","political_stability":"%","execution_efficiency":"%"},
  "demo":{"population":"","growth_rate":"","health":"","mortality":"","education":"","ethnicity":"","religion":""},
  "land":{"area":"","admin_level":"","climate":"","geography":"","power":"","water":"","heating":"","traffic":"","pollution":""},
  "econ":{"facilities":[{"id":"","type":"","employees":"","cost":"","status":"","revenue":""}],"exports":[{"name":"","type":"","volume":"货运量","value":"贸易额","tax":"","tag":""}],"imports":[同exports],"classes":[{"name":"","pop_pct":"","income":"","demand":"","satisfaction":"","global_rank":""}]},
  "fiscal":{"total_expense":"£","expense_items":[{"name":"","type":"","amount":"£","status":""}],"total_income":"£","income_items":[{"name":"","type":"","amount":"£","status":""}]},
  "admin":{"districts":[{"name":"","location":"","governance":""}],"departments":[{"name":"","function":"","head":""}],"projects":[{"name":"","stage":"","cost":"£","progress":"%"}],"civil_servants":"","admin_load":"%","corruption":"%"},
  "council":{"groups":[{"name":"","type":"","support":"%","influence":"","demand":"","seats":"","risk":""}]},
  "city":{"face":"","geo_text":"","election":"","housing":"","culture":"","policies":[{"name":"","stage":"","effect":"","opinion":"%","status":""}]},
  "city_map":{"grid_size":${mapGridSize},"regions":[],"districts":[],"landmarks":[],"legend":{}},
  "city_map_new_regions":[],"city_map_remove_regions":[],"city_map_new_landmarks":[],
  "city_map_new_legend":{},
  "city_map_new_districts":[],"city_map_remove_districts":[],
  "npc":[{"name":"","gender":"","role":"","expression":"","appearance":"","personality":"","background":"","stance":"","action":"","relation":""}],
  "mayor":{"name":"","age":"","gender":"","faction":"","reputation":"","integrity":"","energy":"","skills":"","background":"","schedule":[{"time":"","location":"","event":""}]},
  "news":{"city_official":{"media":"","date":"","edition":"","title":"","body":"70字"},"foreign":{"media":"","date":"","edition":"","title":"","body":"70字"},"social":{"media":"","date":"","edition":"","title":"","body":"90字","secretary_note":""},"radio":{"media":"","time":"","program_name":"","body":"150字"}},
  "notes":[],"secretary_reminder":"","turn_summary":"80-150字总结","next_actions":["4项具体行动"],"game_over":false
}

# 地图规则
## 地形生成思维链（⚠️生成或大幅更新city_map时必须先思考再输出）
生成city_map前，先在脑中逐项推敲，在city_map块中输出最终结果）：
1.【地形合理性】城市临近怎样的自然地理？海岸线从哪里延伸到哪？山脉怎样形成天然屏障？河流是否从山区发源流向海洋/湖泊？⚠️硬约束：若ocean和river同时存在，**河流末端必须与海洋重叠**（即河流最后一个点必须位于海洋区域内）。⚠️森林、山脉不可覆盖市中心（grid中心2格半径内），市中心应留平原。沼泽尽量少用（仅在特殊场景生成，比例<3%）。
2.【地形权重与规模】每种地形占网格的大致比例：平原应为最大占比（≥40%），海洋≤20%，山地≤15%，森林≤15%，河流<10%。各区域之间不得重叠冲突。
3.【区划规模：强制≥30%城区】⚠️ residential+commercial+industrial的blocks总和必须不少于总block数的30%！关键：blocks按网格面积缩放。road≈grid_size²×2~5%，residential≈grid_size²×10~18%，commercial≈grid_size²×4~8%，industrial≈grid_size²×3~6%，suburb≈grid_size²×1~3%，transport≈grid_size²×0.5~2%。例：34²=1156格，总blocks约300~370，城区(住宅+商业+工业)必须≥90~110块。注意：一个区块代表的现实面积大小不固定，无需纠结每块多大。区划由系统本地生成，只需传type+name+blocks+status。
4.【设施合理性】市政厅放在city_map.landmarks中作为第一个设施。地标格式为{name,icon,district}，district指定所属区划名称或自然地形类型（如"老城区"/"ocean"）。🏛️市政厅district=""（系统自动放市中心），⚓港口district="ocean"，🏭工厂district="工业区名"。不再提供col/row坐标，系统本地在对应区划上随机放置。

## 数据结构
city_map使用**regions(仅自然地形)** + **districts(人工区划)** 描述：
{
  "grid_size":8,
  "regions":[
    {"type":"ocean","shape":"rect","params":{"x":0,"y":0,"w":2,"h":8}},
    {"type":"mountain","shape":"polygon","params":{"verts":[[3,0],[5,0],[7,3],[4,5],[1,2]]}},
    {"type":"river","shape":"line","params":{"xs":[6,5,4,3.5,3],"ys":[0,2,4,6,7],"w":1}}
  ],
  "landmarks":[
    {"name":"市政厅","icon":"🏛️","district":""},
    {"name":"港口","icon":"⚓","district":"ocean"},
    {"name":"工厂","icon":"🏭","district":"东郊工厂"}
  ],
  "legend":{"市政厅":"🏛️","港口":"⚓","工厂":"🏭"},
  "districts":[
    {"type":"residential","name":"老城区","status":"治安良好","blocks":4},
    {"type":"residential","name":"新城区","status":"发展中","blocks":3},
    {"type":"commercial","name":"中央商圈","status":"繁荣","blocks":3},
    {"type":"industrial","name":"东郊工厂","status":"正常","blocks":2},
    {"type":"suburb","name":"西郊农庄","status":"宁静","blocks":2},
    {"type":"road","blocks":4},
    {"type":"transport","name":"港口区","status":"繁忙","blocks":1}
  ]
}
* 默认地形为平原/陆地，无需声明。
* 自然地形（8种）：ocean/mountain/river/lake/forest/desert/swamp/plain(默认)。regions中包含形状。
* 人工区划（6种）：road/residential/commercial/industrial/suburb/transport。districts中只传type+name+blocks+status，**不传形状/位置，由系统本地生成**。
* landmarks含name/icon/district（district=区划名称或自然地形类型，市政厅district=""自动放中心），系统本地在对应区划上随机放置emoji。不再传col/row坐标。
* 形状类型（仅自然地形用）：rect({x,y,w,h})、circle({cx,cy,r})、polygon({verts:[[col,row],...]})、line({start,end,width}或{xs,ys,w})

## 更新方式
* 自然地形变动→在city_map块中输出完整regions列表，或增量用city_map_new_regions/remove_regions
* 设施变更→city_map_new_landmarks:[{name,icon,district}]（district=""为市政厅，其他为区划名或地形类型）
* 区划变动→city_map_new_districts:[{type,name,status,blocks}]（按type+name去重）
* 删除区划→city_map_remove_districts:[{type:"",name:""}]
* 图例变更→city_map_new_legend:{"名":"emoji"}
* 无变化→省略对应块

## city_map块示例（使用简单文本格式，禁止JSON）
===city_map===
MAP:GRID=34
REGION:ocean,rect,26,0,8,34
REGION:mountain,polygon,0,0,4,0,0,8
REGION:river,line,2,0,5,6,8,10,12,16,15,20,18,24
REGION:forest,rect,0,22,4,12
LANDMARK:市政厅,🏛️,
LANDMARK:港口,⚓,港口区
LEGEND:市政厅,🏛️
LEGEND:港口,⚓
DISTRICT:residential,老城中心,人口密集,16
DISTRICT:commercial,商圈,繁荣,9
DISTRICT:road,,主干道,20
ENDMAP
===end===

===`;

// ==================== 默认游戏状态 ====================
const DEFAULT_STATE = {
  header: { time: "等待生成...", location: "等待生成...", place: "等待生成...", plot: "等待AI生成初始城市", weather: "⏳" },
  narrative: "<p class='text-gray-400 text-center py-8'>🏗️ 正在等待AI生成城市初始数据...</p>",
  macro: { liquid_fx: "-", debt: "-", infra_health: "-", gdp: "-", growth_rate: "-", currency_cpi: "-", unemployment: "-", gini: "-", income_mode: "-", dependency: "-", security: "-", political_stability: "-", execution_efficiency: "-" },
  demo: { population: "-", growth_rate: "-", health: "-", mortality: "-", education: "-", ethnicity: "-", religion: "-" },
  land: { area: "-", admin_level: "-", climate: "-", geography: "-", power: "-", water: "-", heating: "-", traffic: "-", pollution: "-" },
  econ: {
    facilities: [],
    exports: [],
    imports: [],
    classes: []
  },
  fiscal: {
    total_expense: "-", total_income: "-",
    expense_items: [],
    income_items: []
  },
  admin: {
    districts: [],
    departments: [],
    projects: [],
    civil_servants: "-", admin_load: "-", corruption: "-"
  },
  council: { groups: [] },
  city: { face: "等待生成...", geo_text: "等待生成...", election: "-", housing: "-", culture: "-", policies: [] },
  npc: [],
  mayor: { name: "等待生成...", age: "-", gender: "-", faction: "-", reputation: "-", integrity: "-", energy: "-", skills: "-", background: "等待AI生成市长档案", schedule: [] },
  news: {
    city_official: { media: "-", date: "-", edition: "-", title: "等待生成...", body: "等待AI生成..." },
    foreign: { media: "-", date: "-", edition: "-", title: "等待生成...", body: "等待AI生成..." },
    social: { media: "-", date: "-", edition: "-", title: "等待生成...", body: "等待生成...", secretary_note: "" },
    radio: { media: "-", time: "-", program_name: "-", body: "等待AI生成..." }
  },
  notes: ["等待AI生成待办事项"],
  turn_summary: "等待AI生成本回合总结",
  next_actions: ["等待AI生成后续行动建议"],
  city_map: {
    grid_size: 8,
    regions: [],
    districts: [],
    landmarks: [],
    legend: {}
  },
  game_over: false
};

// ==================== 音效管理系统 ====================
const _soundUrls = {
  simple_buttons: 'sounds/simple_buttons.ogg',
  new_game: 'sounds/new_game.ogg',
  saved: 'sounds/saved.ogg',
  save_loaded: 'sounds/save_loaded.ogg',
  admin: 'sounds/admin.ogg',
  finance: 'sounds/finance.ogg',
  history: 'sounds/history.ogg',
  news: 'sounds/news.ogg',
  mayor: 'sounds/mayor.ogg',
  interaction_npc: 'sounds/interaction_npc.ogg',
  observer_npc: 'sounds/observer_npc.ogg',
  message_sent: 'sounds/message_sent.ogg',
  reply_finished: 'sounds/reply_finished.ogg'
};

// 延迟播放队列：存储在用户交互前触发的音效
const _pendingSounds = [];
let _userInteracted = false;
let _soundEnabled = true; // 音效开关

// 音效开关切换函数
function toggleSoundEnabled() {
  const checkbox = document.getElementById('cfg-sound-enabled');
  _soundEnabled = checkbox.checked;
  localStorage.setItem('aic_sound_enabled', _soundEnabled ? '1' : '0');
  console.log('🔊 音效已' + (_soundEnabled ? '开启' : '关闭'));
}

// 加载音效开关设置
function loadSoundEnabled() {
  const saved = localStorage.getItem('aic_sound_enabled');
  if (saved !== null) {
    _soundEnabled = saved === '1';
  }
  const checkbox = document.getElementById('cfg-sound-enabled');
  if (checkbox) {
    checkbox.checked = _soundEnabled;
  }
}

// 监听用户首次交互
document.addEventListener('click', function () {
  if (!_userInteracted) {
    _userInteracted = true;
    console.log('🔊 用户首次交互，播放延迟音效队列');
    while (_pendingSounds.length > 0) {
      const s = _pendingSounds.shift();
      _doPlaySound(s.name, s.volume);
    }
  }
}, { once: true });

// 实际播放音效
function _doPlaySound(name, volume) {
  const url = _soundUrls[name];
  if (!url) {
    console.warn('❌ 未知音效:', name);
    return;
  }
  try {
    const audio = new Audio(url);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.play().then(function () {
      console.log('✅ 音效播放成功:', name);
    }).catch(function (e) {
      console.warn('❌ 音效播放失败:', name, e.message);
    });
  } catch (e) {
    console.warn('❌ 创建音频元素失败:', name, e);
  }
}

// 播放音效（支持延迟播放，检查开关状态）
window.playSound = function (name, volume = 0.5) {
  if (!_soundEnabled) {
    console.log('🔇 音效已关闭:', name);
    return;
  }
  if (_userInteracted) {
    _doPlaySound(name, volume);
  } else {
    console.log('⏳ 音效延迟播放（等待用户交互）:', name);
    _pendingSounds.push({ name: name, volume: volume });
  }
};

window.playSimpleButton = function () { window.playSound('simple_buttons', 0.4); };
window.playNewGame = function () { window.playSound('new_game', 0.5); };
window.playSaved = function () { window.playSound('saved', 0.3); };
window.playSaveLoaded = function () { window.playSound('save_loaded', 0.4); };
window.playAdmin = function () { window.playSound('admin', 0.4); };
window.playFinance = function () { window.playSound('finance', 0.4); };
window.playHistory = function () { window.playSound('history', 0.4); };
window.playNews = function () { window.playSound('news', 0.4); };
window.playMayor = function () { window.playSound('mayor', 0.4); };
window.playInteractionNPC = function () { window.playSound('interaction_npc', 0.5); };
window.playObserverNPC = function () { window.playSound('observer_npc', 0.4); };
window.playMessageSent = function () { window.playSound('message_sent', 0.4); };
window.playReplyFinished = function () { window.playSound('reply_finished', 0.5); };

// ==================== 全局状态 ====================
let gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));

// 应用用户配置的地图网格大小
function applyMapGridSize(state) {
  var size = mapGridSize || 8;
  if (!state.city_map) state.city_map = {};
  state.city_map.grid_size = size;
  state.city_map.regions = state.city_map.regions || [];
  state.city_map.districts = state.city_map.districts || [];
  state.city_map.landmarks = state.city_map.landmarks || [];
  state.city_map.legend = state.city_map.legend || {};
}
// applyMapGridSize 延迟到 mapGridSize 声明后调用

let turnCount = 0;
let historyDecisions = [];
let chartData = { labels: ['初始'], gdp: [3.2], support: [65] };
let lastChartMonth = ''; // 上次刷新图表的游戏月份
let popGrowthHistory = []; // [{month, rate}] 人口增长率历史（近5个月）
// cityChart 在下文挂载到 window.cityChart

// ==================== 市井百态：钉选NPC ====================
let pinnedNPCs = []; // [{name, age, job, trait, background, lastUpdate, dailyLog:[{day, text}]}]
let npcLifeCandidates = []; // AI生成的候选底层NPC
let _npcLifeLastDay = ''; // 上次更新日历（每天只更新一次）
let broadcastContent = ''; // 当前广播内容
let broadcastSegments = []; // 广播段落数组
let _broadcastLastDay = ''; // 上次更新广播的时间
let isProcessing = false;
// ==================== 刷新功能快照 ====================
let refreshSnapshot = null; // { gameState, turnCount, shortLen, fullLen, histLen, chartLabelsLen, chartGdpLen, chartSupLen, lastUser, lastAssistant, decision }
let customPrompt = ''; // 玩家自定义追加提示词
// ==================== 智能模型模式 ====================
let smartMode = false;        // 智能模式开关
let smartAIEnhanced = false; // AI增强分析（本地模型）
let flashModel = 'deepseek-chat';    // Flash模型
let proModel = 'deepseek-reasoner';  // Pro模型
let complexityThreshold = 50; // 复杂度阈值（0-100）
let latestComplexity = 0;     // 最近一次复杂度分析结果
let latestCategories = [];    // 最近一次数据类别选择结果
let localModelReady = false;  // 本地模型是否就绪
// 数据类别定义：每个类别包含对应的gameState字段和触发关键词
const DATA_CATEGORIES = {
  header: { fields: ['time', 'location', 'place', 'plot', 'weather'], always: true, label: '基本信息' },
  macro: { fields: ['liquid_fx', 'debt', 'infra_health', 'gdp', 'growth_rate', 'currency_cpi', 'unemployment', 'gini', 'income_mode', 'dependency', 'security', 'political_stability', 'execution_efficiency'], label: '宏观经济', keywords: '经济 GDP 增长 财政 预算 资金 收入 支出 债务 失业 物价 通膨 货币 稳定 安全' },
  demo: { fields: ['population', 'growth_rate', 'health', 'mortality', 'education', 'ethnicity', 'religion'], label: '人口民生', keywords: '人口 市民 居民 健康 教育 民族 宗教 医疗 出生 死亡 学校 医院' },
  land: { fields: ['area', 'admin_level', 'climate', 'geography', 'power', 'water', 'heating', 'traffic', 'pollution'], label: '土地环境', keywords: '土地 能源 供水 供电 交通 污染 环境 气候 地理 面积 发电' },
  econ: { fields: ['facilities', 'exports', 'imports', 'classes'], label: '产业经济', keywords: '产业 工厂 设施 贸易 出口 进口 阶层 企业 公司 商业 港口 航运 关税' },
  fiscal: { fields: ['total_expense', 'expense_items', 'total_income', 'income_items'], label: '财政收支', keywords: '财政 税收 预算 拨款 支出 投资 补贴 贷款 收入 盈余 赤字' },
  admin: { fields: ['districts', 'departments', 'projects', 'civil_servants', 'admin_load', 'corruption'], label: '行政管理', keywords: '行政 部门 项目 公务员 腐败 区划 治理 工程 建设 效率 规划' },
  council: { fields: ['groups'], label: '议会派系', keywords: '议会 派系 政党 选举 政治 联盟 反对 支持率 席位 法案' },
  city: { fields: ['face', 'geo_text', 'election', 'housing', 'culture', 'policies'], always: true, label: '城市信息', keywords: '城市 住房 文化 政策 选举 面貌 风格 建筑 年代 氛围' },
  city_map: { fields: ['grid_size', 'regions', 'districts', 'landmarks', 'legend'], always: true, label: '城市地图', keywords: '地图 地形 区域 区划 居住区 商业区 工业区 道路 设施 地标' },
  city_map_regions: { fields: [], label: '区划增量', keywords: '区划 新建 拆除 改名 状态变更', excludeFromSend: true },
  npc: { fields: [], label: 'NPC人物', keywords: 'NPC 会见 人物 关系 部长 官员 商人 贵族 代表 议员 秘书', always: true },
  mayor: { fields: ['name', 'age', 'gender', 'faction', 'reputation', 'integrity', 'energy', 'skills', 'background', 'schedule'], label: '市长信息', always: true },
  news: { fields: [], label: '新闻', always: false, excludeFromSend: true },
  notes: { fields: [], label: '待办', always: true }
};
// ==================== 智能模型模式 - 核心函数 ====================
function toggleSmartConfig() {
  var area = document.getElementById('smart-config-area');
  var cb = document.getElementById('cfg-smart-mode');
  if (area) area.style.display = cb && cb.checked ? '' : 'none';
}
function downloadLocalModel() {
  var statusEl = document.getElementById('model-download-status');
  var btn = document.getElementById('btn-download-model');
  if (localModelReady) {
    statusEl.textContent = '✅ 本地模型已就绪（Transformers.js已加载）';
    statusEl.className = 'text-xs text-center text-green-600';
    return;
  }
  // 检测协议：file:// 下浏览器禁止所有跨域fetch，Transformers.js无法工作
  if (window.location.protocol === 'file:') {
    statusEl.innerHTML = '⚠️ <b>当前通过文件协议(file://)打开，浏览器安全策略禁止加载远程AI模型。</b><br>请用以下任一方式启动本地HTTP服务器后再试：<br>① VS Code: 安装"Live Server"扩展，右键→Open with Live Server<br>② Python: 在本目录运行 <code style="background:#eee;padding:1px 4px;border-radius:3px">python -m http.server 8080</code> 然后访问 localhost:8080<br>③ Node.js: <code style="background:#eee;padding:1px 4px;border-radius:3px">npx serve .</code>';
    statusEl.className = 'text-xs text-center text-orange-600';
    btn.disabled = false;
    btn.textContent = '📥 需HTTP服务器';
    smartAIEnhanced = false;
    document.getElementById('cfg-ai-enhanced').checked = false;
    return;
  }
  statusEl.textContent = '⏳ 正在加载Transformers.js库...';
  statusEl.className = 'text-xs text-center text-gray-600';
  btn.disabled = true;
  btn.textContent = '⏳ 加载中...';
  var script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
        import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';
        try {
          // 配置模型下载源
          env.allowLocalModels = false;
          window.classifier = await pipeline(
            'text-classification',
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            { quantized: true }
          );
          window._smartPipelineReady = true;
          document.getElementById('model-download-status').textContent = '✅ 本地模型加载完成！（基于Transformers.js + DistilBERT）';
          document.getElementById('model-download-status').className = 'text-xs text-center text-green-600';
          document.getElementById('btn-download-model').textContent = '✅ 模型已就绪';
          document.getElementById('btn-download-model').disabled = false;
          window.localModelReady = true;
        } catch(e) {
          var errMsg = e && e.message ? e.message : String(e);
          var detail = '';
          if (errMsg.indexOf('CORS') !== -1 || errMsg.indexOf('cross-origin') !== -1) {
            detail = '（CORS跨域错误：当前页面可能仍通过file://打开，或CDN不支持跨域）';
          } else if (errMsg.indexOf('Failed to fetch') !== -1 || errMsg.indexOf('net::') !== -1) {
            detail = '（网络连接失败，可能需要代理或VPN访问HuggingFace）';
          }
          document.getElementById('model-download-status').innerHTML = '❌ 模型加载失败<br><span class="text-gray-500">' + errMsg.substring(0, 100) + '</span>' + detail;
          document.getElementById('model-download-status').className = 'text-xs text-center text-red-600';
          document.getElementById('btn-download-model').disabled = false;
          document.getElementById('btn-download-model').textContent = '📥 重试下载';
          window.smartAIEnhanced = false;
          document.getElementById('cfg-ai-enhanced').checked = false;
          console.error('Transformer.js模型加载失败:', e);
        }
      `;
  script.onerror = function () {
    statusEl.textContent = '❌ Transformers.js库加载失败（CDN不可用，请检查网络连接）';
    statusEl.className = 'text-xs text-center text-orange-600';
    btn.disabled = false;
    btn.textContent = '📥 重试下载';
    smartAIEnhanced = false;
    document.getElementById('cfg-ai-enhanced').checked = false;
  };
  document.head.appendChild(script);
}
// 复杂度分析器：启发式评分 (0-100)
function analyzeComplexity(decision) {
  var score = 0;
  // 1. 输入长度 (0-30)
  var len = (decision || '').length;
  if (len > 200) score += 30;
  else if (len > 100) score += 20;
  else if (len > 50) score += 10;
  else if (len > 20) score += 5;
  // 2. 关键词覆盖类别数 (0-40)
  var catCount = 0;
  var text = (decision || '').toLowerCase();
  Object.keys(DATA_CATEGORIES).forEach(function (k) {
    var cat = DATA_CATEGORIES[k];
    if (cat.always) return;
    var kw = (cat.keywords || '').toLowerCase().split(/\s+/);
    for (var i = 0; i < kw.length; i++) {
      if (kw[i] && text.indexOf(kw[i]) !== -1) { catCount++; break; }
    }
  });
  score += Math.min(catCount * 4, 40);
  // 3. 子操作数 (0-30) - 分号、编号、换行
  var actions = (decision || '').split(/[；;]/).length;
  var numbered = ((decision || '').match(/\d+[.、)]/g) || []).length;
  var lines = (decision || '').split(/\n/).filter(function (l) { return l.trim().length > 5; }).length;
  var totalActions = Math.max(actions, numbered, lines);
  score += Math.min(totalActions * 3, 30);
  // 选择相关类别
  var cats = selectRelevantCategories(decision);
  latestComplexity = Math.min(100, Math.max(0, score));
  latestCategories = cats;
  // 更新UI
  var bar = document.getElementById('complexity-bar-fill');
  var val = document.getElementById('complexity-value');
  var sum = document.getElementById('complexity-summary');
  var label = document.getElementById('smart-analyzer-label');
  if (bar) bar.style.width = latestComplexity + '%';
  if (val) {
    val.textContent = latestComplexity;
    val.className = 'text-xs font-bold ' + (latestComplexity >= complexityThreshold ? 'text-red-600' : 'text-green-600');
  }
  if (sum) sum.textContent = latestCategories.map(function (c) { return DATA_CATEGORIES[c].label; }).join('、') || '仅基本信息';
  if (label) label.textContent = '（复杂度' + latestComplexity + '，选中' + latestCategories.length + '类）';
  logDebug('智能分析 复杂度=' + latestComplexity + '/' + complexityThreshold + ' ' + (latestComplexity < complexityThreshold ? '→Flash' : '→Pro') + ' 类别=' + latestCategories.join(','));
  return { complexity: latestComplexity, categories: latestCategories, useFlash: latestComplexity < complexityThreshold };
}
// 数据类别选择器：基于关键词匹配
function selectRelevantCategories(decision) {
  var text = (decision || '').toLowerCase();
  var selected = [];
  Object.keys(DATA_CATEGORIES).forEach(function (k) {
    if (DATA_CATEGORIES[k].always) { selected.push(k); return; }
    var kw = (DATA_CATEGORIES[k].keywords || '').toLowerCase().split(/\s+/);
    for (var i = 0; i < kw.length; i++) {
      if (kw[i] && text.indexOf(kw[i]) !== -1) { selected.push(k); return; }
    }
  });
  return selected;
}
// 选择性序列化：只构建需要的 gameState 子集
function serializePartialState(categories) {
  var partial = {};
  var headerFields = ['time', 'location', 'place', 'plot', 'weather', 'mayor_name'];
  var topLevel = ['narrative', 'turn_summary', 'next_actions', 'game_over'];
  // header 始终包含（always字段）
  if (categories.indexOf('header') !== -1) {
    partial.header = {};
    headerFields.forEach(function (f) {
      if (gameState.header && gameState.header[f] !== undefined) partial.header[f] = gameState.header[f];
    });
  }
  // 顶层字段始终包含
  topLevel.forEach(function (f) {
    if (gameState[f] !== undefined) partial[f] = JSON.parse(JSON.stringify(gameState[f]));
  });
  // 按类别选择性包含
  if (categories.indexOf('macro') !== -1) { partial.macro = {}; DATA_CATEGORIES.macro.fields.forEach(function (f) { if (gameState.macro && gameState.macro[f] !== undefined) partial.macro[f] = gameState.macro[f]; }); }
  if (categories.indexOf('demo') !== -1) { partial.demo = {}; DATA_CATEGORIES.demo.fields.forEach(function (f) { if (gameState.demo && gameState.demo[f] !== undefined) partial.demo[f] = gameState.demo[f]; }); }
  if (categories.indexOf('land') !== -1) { partial.land = {}; DATA_CATEGORIES.land.fields.forEach(function (f) { if (gameState.land && gameState.land[f] !== undefined) partial.land[f] = gameState.land[f]; }); }
  if (categories.indexOf('econ') !== -1) { partial.econ = JSON.parse(JSON.stringify(gameState.econ || {})); }
  if (categories.indexOf('fiscal') !== -1) { partial.fiscal = JSON.parse(JSON.stringify(gameState.fiscal || {})); }
  if (categories.indexOf('admin') !== -1) { partial.admin = JSON.parse(JSON.stringify(gameState.admin || {})); }
  if (categories.indexOf('council') !== -1) { partial.council = JSON.parse(JSON.stringify(gameState.council || {})); }
  if (categories.indexOf('city') !== -1) { partial.city = JSON.parse(JSON.stringify(gameState.city || {})); }
  if (categories.indexOf('npc') !== -1) { partial.npc = JSON.parse(JSON.stringify(gameState.npc || [])); }
  if (categories.indexOf('mayor') !== -1) { partial.mayor = JSON.parse(JSON.stringify(gameState.mayor || {})); }
  if (categories.indexOf('news') !== -1) { partial.news = JSON.parse(JSON.stringify(gameState.news || {})); }
  if (categories.indexOf('notes') !== -1) { partial.notes = JSON.parse(JSON.stringify(gameState.notes || [])); }
  // city_map 始终包含（always字段），但只发送摘要信息，不发送grid/cells等大体积数据
  if (categories.indexOf('city_map') !== -1) {
    var cm = gameState.city_map || {};
    partial.city_map = {
      grid_size: cm.grid_size,
      regions: cm.regions,
      landmarks: cm.landmarks,
      legend: cm.legend,
      districts: cm.districts
    };
    // 排除大体积字段
    if (partial.city_map.cells) delete partial.city_map.cells;
    if (partial.city_map.fill_areas) delete partial.city_map.fill_areas;
  }
  return partial;
}
function getExcludedCats(selected) {
  return Object.keys(DATA_CATEGORIES).filter(function (k) { return selected.indexOf(k) === -1; }).map(function (k) { return DATA_CATEGORIES[k].label; });
}
// 智能合并：AI返回的partial JSON合并到完整gameState
function mergePartialStateSmart(partial) {
  if (!partial || typeof partial !== 'object') return;
  // 基本做法：复用已有的mergeState逻辑（它已经做了逐字段合并）
  // 但这里只合并AI实际返回的字段
  mergeState(partial);
}
// ==================== State发送预处理：排除沉浸感字段 ====================
var SEND_EXCLUDE_FIELDS = ['news', 'city_map'];
function prepareStateForSend(state) {
  if (!state || typeof state !== 'object') return state;
  var c = JSON.parse(JSON.stringify(state));
  SEND_EXCLUDE_FIELDS.forEach(function (f) { delete c[f]; });
  return c;
}
function estimateTokens(text) { return Math.ceil((text || '').length / 3.5); }

// ==================== 新闻更新时间检测 ====================
// 新闻更新时间表（小时）
var NEWS_UPDATE_SCHEDULE = {
  city_official: { hour: 8, label: '市属媒体', freq: '每天8:00' },
  foreign: { hour: 12, label: '外国媒体', freq: '每天12:00' },
  social: { hours: [6, 9, 12, 15, 18, 21], label: '社会媒体', freq: '每3小时' },
  radio: { hours: [0, 6, 12, 18], label: '民间电台', freq: '每6小时' }
};
var _prevGameTimeStr = ''; // 上回合的游戏时间字符串
function parseGameTime(timeStr) {
  if (!timeStr) return null;
  var m = timeStr.match(/(\d+)年(\d+)月(\d+)日\s+(\d+):(\d+)/);
  if (!m) return null;
  return { year: +m[1], month: +m[2], day: +m[3], hour: +m[4], minute: +m[5] };
}
function checkNewsUpdates(prevTime, newTime) {
  var now = parseGameTime(newTime);
  if (!now) return { needUpdate: [], allCopy: true };
  var prev = parseGameTime(prevTime);
  var result = { needUpdate: [], keepAsIs: [] };
  // 首回合或跨天 → 全部需要更新
  if (!prev || now.day !== prev.day || now.month !== prev.month) {
    result.needUpdate = ['city_official', 'foreign', 'social', 'radio'];
    result.keepAsIs = [];
    logDebug('新闻更新检测: 跨天/首回合 → 全部4源需更新');
    return result;
  }
  // 同天内：检查每个媒体是否跨越了更新时间点
  var prevHourMin = prev.hour * 60 + prev.minute;
  var nowHourMin = now.hour * 60 + now.minute;
  function crossedUpdateHour(schedule) {
    if (schedule.hour !== undefined) {
      var uh = schedule.hour * 60;
      return prevHourMin < uh && nowHourMin >= uh;
    }
    if (schedule.hours) {
      for (var i = 0; i < schedule.hours.length; i++) {
        var uh = schedule.hours[i] * 60;
        if (prevHourMin < uh && nowHourMin >= uh) return true;
      }
    }
    return false;
  }
  Object.keys(NEWS_UPDATE_SCHEDULE).forEach(function (key) {
    if (crossedUpdateHour(NEWS_UPDATE_SCHEDULE[key])) {
      result.needUpdate.push(key);
    } else {
      result.keepAsIs.push(key);
    }
  });
  logDebug('新闻更新检测: 更新=[' + result.needUpdate.join(',') + '] 保持=[' + result.keepAsIs.join(',') + '] 时间:' + (newTime || '') + '→上一轮:' + (prevTime || '(无)'));
  return result;
}

// 检查是否跨天（用于触发日程更新）
function checkCrossDay(prevTime, newTime) {
  var now = parseGameTime(newTime);
  if (!now) return false;
  var prev = parseGameTime(prevTime);
  // 首回合或跨天
  if (!prev || now.day !== prev.day || now.month !== prev.month) {
    logInfo('检测到跨天: ' + (prevTime || '初始') + ' → ' + newTime);
    return true;
  }
  return false;
}

// 获取日程更新指令
function getScheduleUpdatePrompt(prevTime, newTime) {
  if (!checkCrossDay(prevTime, newTime)) return '';
  return '\n\n# 日程更新指令\n检测到游戏时间已进入新的一天：' + newTime + '\n**请为市长生成今日的完整日程安排（mayor.schedule）**，包含时间、地点和事件，体现市长当天的工作安排。';
}
// ==================== 完整历史存档系统 ====================
let fullHistory = []; // 完整历史：每回合的 narrative + news + decision
let maxHistoryRounds = 100; // 默认存储100轮
let mapGridSize = 8; // 默认地图网格大小（可配置4-12）
applyMapGridSize(gameState); // 在 mapGridSize 声明后应用网格大小
// ==================== 记忆系统 ====================
let shortTermMemory = []; // 短期记忆：最近5个回合总结
let longTermMemory = []; // 长期记忆：每5个短期记忆合并为一个
let lastUserMessage = null; // 前1轮完整用户消息（含完整状态JSON）
let lastAssistantMessage = null; // 前1轮完整AI响应（含完整叙事+数据）

// ==================== NPC世界书系统 ====================
// 自动从gameState.npc提取关键NPC，持久化记录以防AI多轮后遗忘
let worldBook = []; // [{name, keywords, gender, role, personality, stance, background, history:[{turn,time,expression,action,relation}], firstSeen, lastSeen, importance}]
function loadWorldBook() {
  try { worldBook = JSON.parse(localStorage.getItem('aic_worldbook') || '[]'); } catch (e) { worldBook = []; }
}
function saveWorldBook() {
  localStorage.setItem('aic_worldbook', JSON.stringify(worldBook));
}
function updateWorldBook() {
  if (!gameState.npc || !Array.isArray(gameState.npc) || !gameState.npc.length) return;
  if (!worldBook || !Array.isArray(worldBook)) worldBook = [];
  var now = gameState.header.time || '';
  gameState.npc.forEach(function (n) {
    // 查找是否已存在
    var existing = null;
    for (var i = 0; i < worldBook.length; i++) {
      if (worldBook[i] && worldBook[i].name === n.name) { existing = worldBook[i]; break; }
    }
    if (existing) {
      // 更新已有NPC
      existing.lastSeen = turnCount;
      existing.role = n.role;
      existing.stance = n.stance;
      existing.personality = n.personality;
      if (!existing.history) existing.history = [];
      if (Array.isArray(existing.history)) {
        existing.history.push({ turn: turnCount, time: now, expression: n.expression, action: n.action, relation: n.relation });
        // 只保留最近20条历史
        if (existing.history.length > 20) existing.history = existing.history.slice(-20);
        // 重要性根据出现频率和角色类型计算
        var roleWeight = ((n.role || '').indexOf('部长') >= 0 || (n.role || '').indexOf('主席') >= 0 || (n.role || '').indexOf('市长') >= 0 || (n.role || '').indexOf('总裁') >= 0 || (n.role || '').indexOf('将军') >= 0 || (n.role || '').indexOf('大使') >= 0) ? 3 : ((n.role || '').indexOf('秘书') >= 0 || (n.role || '').indexOf('顾问') >= 0 || (n.role || '').indexOf('局长') >= 0) ? 2 : 1;
        existing.importance = Math.min(10, roleWeight + Math.floor(existing.history.length / 3));
      }
    } else {
      // 新NPC
      var roleWeight2 = ((n.role || '').indexOf('部长') >= 0 || (n.role || '').indexOf('主席') >= 0 || (n.role || '').indexOf('市长') >= 0 || (n.role || '').indexOf('总裁') >= 0 || (n.role || '').indexOf('将军') >= 0 || (n.role || '').indexOf('大使') >= 0) ? 3 : ((n.role || '').indexOf('秘书') >= 0 || (n.role || '').indexOf('顾问') >= 0 || (n.role || '').indexOf('局长') >= 0) ? 2 : 1;
      worldBook.push({
        name: n.name,
        keywords: n.name, // 可后续手动扩展
        gender: n.gender,
        role: n.role,
        personality: n.personality,
        stance: n.stance,
        background: n.background,
        appearance: n.appearance,
        history: [{ turn: turnCount, time: now, expression: n.expression, action: n.action, relation: n.relation }],
        firstSeen: turnCount,
        lastSeen: turnCount,
        importance: Math.min(10, roleWeight2 + 1)
      });
    }
  });
  saveWorldBook();
}
function buildWorldBookContext() {
  if (!worldBook || !Array.isArray(worldBook) || !worldBook.length) return '';
  // 按重要性排序，取前15个重要NPC
  var sorted = worldBook.slice().sort(function (a, b) { return (b ? b.importance : 0) - (a ? a.importance : 0); });
  var important = sorted.slice(0, 15);
  var ctx = '\n## NPC世界档案（重要角色记录，供AI参考以避免遗忘）\n';
  important.forEach(function (wb) {
    if (!wb) return;
    ctx += '### ' + (wb.name || '未知') + ' [重要性:' + (wb.importance || 0) + ']\n';
    ctx += '- 身份：' + (wb.gender || '') + ' · ' + (wb.role || '') + '\n';
    ctx += '- 性格：' + (wb.personality || '') + '\n';
    ctx += '- 背景：' + (wb.background || '') + '\n';
    ctx += '- 立场：' + (wb.stance || '') + '\n';
    ctx += '- 外貌：' + (wb.appearance || '') + '\n';
    ctx += '- 首次出现：第' + (wb.firstSeen || 0) + '回合 | 最近出现：第' + (wb.lastSeen || 0) + '回合\n';
    if (wb.history && Array.isArray(wb.history) && wb.history.length > 0) {
      ctx += '- 历史动态（最近5条）：\n';
      var recent = wb.history.slice(-5);
      recent.forEach(function (h) {
        if (h) {
          ctx += '  · 回合' + (h.turn || 0) + ': ' + (h.expression || '') + ' · ' + (h.action || '') + ' | 关系:' + (h.relation || '') + '\n';
        }
      });
    }
  });
  return ctx;
}

// ==================== Token 用量显示 ====================
function displayTokenInfo(usage) {
  var el = document.getElementById('token-info');
  if (!el) return;
  if (!usage) { el.textContent = ''; return; }
  var parts = [];
  if (usage.total_tokens) parts.push('本次消耗: ' + usage.total_tokens.toLocaleString() + ' tokens');
  if (usage.prompt_tokens) parts.push('输入: ' + usage.prompt_tokens.toLocaleString());
  if (usage.completion_tokens) parts.push('输出: ' + usage.completion_tokens.toLocaleString());
  if (usage.prompt_cache_hit_tokens !== undefined && usage.prompt_cache_hit_tokens > 0) {
    parts.push('缓存命中: ' + usage.prompt_cache_hit_tokens.toLocaleString());
  }
  el.textContent = '📊 ' + parts.join(' | ');
  // 30秒后自动淡出
  setTimeout(function () { el.style.opacity = '0.3'; }, 15000);
  setTimeout(function () { el.style.opacity = '1'; el.textContent = ''; }, 18000);
}

// ==================== 系统提示词 ====================
function getConfig() {
  var model = localStorage.getItem('aic_api_model') || 'deepseek-chat';
  // 智能模式：根据复杂度自动选择flash/pro
  if (smartMode && latestComplexity > 0) {
    model = latestComplexity < complexityThreshold ? flashModel : proModel;
  }
  return {
    url: localStorage.getItem('aic_api_url') || 'https://api.deepseek.com/v1',
    key: localStorage.getItem('aic_api_key') || '',
    model: model
  };
}
function saveConfig(url, key, model) {
  localStorage.setItem('aic_api_url', url);
  localStorage.setItem('aic_api_key', key);
  localStorage.setItem('aic_api_model', model);
}
function loadSettings() {
  const c = getConfig();
  document.getElementById('cfg-url').value = c.url;
  document.getElementById('cfg-key').value = c.key;
  document.getElementById('cfg-model').value = localStorage.getItem('aic_api_model') || 'deepseek-chat';
  document.getElementById('cfg-maxhist').value = maxHistoryRounds;
  try { mapGridSize = parseInt(localStorage.getItem('aic_map_grid_size')) || 8; } catch (e) { mapGridSize = 8; }
  var gsEl = document.getElementById('cfg-map-grid-size');
  if (gsEl) { gsEl.value = mapGridSize; var l1 = document.getElementById('cfg-grid-size-label'); if (l1) l1.textContent = mapGridSize; var l2 = document.getElementById('cfg-grid-size-label2'); if (l2) l2.textContent = mapGridSize; }
  document.getElementById('cfg-custom-prompt').value = customPrompt;
  // 加载智能模式配置
  try { smartMode = localStorage.getItem('aic_smart_mode') === 'true'; } catch (e) { smartMode = false; }
  try { smartAIEnhanced = localStorage.getItem('aic_smart_ai_enhanced') === 'true'; } catch (e) { smartAIEnhanced = false; }
  try { flashModel = localStorage.getItem('aic_flash_model') || 'deepseek-chat'; } catch (e) { flashModel = 'deepseek-chat'; }
  try { proModel = localStorage.getItem('aic_pro_model') || 'deepseek-reasoner'; } catch (e) { proModel = 'deepseek-reasoner'; }
  try { complexityThreshold = parseInt(localStorage.getItem('aic_complexity_threshold')) || 50; } catch (e) { complexityThreshold = 50; }
  try { localModelReady = localStorage.getItem('aic_local_model_ready') === 'true'; } catch (e) { localModelReady = false; }
  var cb = document.getElementById('cfg-smart-mode');
  if (cb) cb.checked = smartMode;
  var flashEl = document.getElementById('cfg-flash-model');
  if (flashEl) flashEl.value = flashModel;
  var proEl = document.getElementById('cfg-pro-model');
  if (proEl) proEl.value = proModel;
  var thEl = document.getElementById('cfg-complexity-threshold');
  if (thEl) { thEl.value = complexityThreshold; var thLabel = document.getElementById('cfg-threshold-label'); if (thLabel) thLabel.textContent = complexityThreshold; }
  var aiEnh = document.getElementById('cfg-ai-enhanced');
  if (aiEnh) aiEnh.checked = smartAIEnhanced;
  toggleSmartConfig();
  loadSoundEnabled(); // 加载音效开关设置
  if (localModelReady) {
    var dlStatus = document.getElementById('model-download-status');
    if (dlStatus) { dlStatus.textContent = '✅ 本地模型已就绪'; dlStatus.className = 'text-xs text-center text-green-600'; }
    var dlBtn = document.getElementById('btn-download-model');
    if (dlBtn) { dlBtn.textContent = '✅ 模型已就绪'; dlBtn.disabled = true; }
  }
}
function toggleSettingsInternal() {
  const m = document.getElementById('settings-modal');
  m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
}
function saveSettingsInternal() {
  saveConfig(
    document.getElementById('cfg-url').value.trim(),
    document.getElementById('cfg-key').value.trim(),
    document.getElementById('cfg-model').value.trim()
  );
  const mh = parseInt(document.getElementById('cfg-maxhist').value) || 100;
  maxHistoryRounds = Math.max(10, Math.min(500, mh));
  localStorage.setItem('aic_maxhist', maxHistoryRounds);
  document.getElementById('hist-max').textContent = maxHistoryRounds;
  var gsEl = document.getElementById('cfg-map-grid-size');
  if (gsEl) { mapGridSize = parseInt(gsEl.value) || 8; localStorage.setItem('aic_map_grid_size', mapGridSize); }
  customPrompt = (document.getElementById('cfg-custom-prompt').value || '').trim();
  localStorage.setItem('aic_custom_prompt', customPrompt);
  // 保存智能模式配置
  var cbSmart = document.getElementById('cfg-smart-mode');
  smartMode = cbSmart ? cbSmart.checked : false;
  localStorage.setItem('aic_smart_mode', smartMode);
  var flashEl = document.getElementById('cfg-flash-model');
  flashModel = flashEl ? flashEl.value.trim() : 'deepseek-chat';
  localStorage.setItem('aic_flash_model', flashModel);
  var proEl = document.getElementById('cfg-pro-model');
  proModel = proEl ? proEl.value.trim() : 'deepseek-reasoner';
  localStorage.setItem('aic_pro_model', proModel);
  var thEl = document.getElementById('cfg-complexity-threshold');
  complexityThreshold = thEl ? parseInt(thEl.value) || 50 : 50;
  localStorage.setItem('aic_complexity_threshold', complexityThreshold);
  var aiEnh = document.getElementById('cfg-ai-enhanced');
  smartAIEnhanced = aiEnh ? aiEnh.checked : false;
  localStorage.setItem('aic_smart_ai_enhanced', smartAIEnhanced);
  localStorage.setItem('aic_local_model_ready', localModelReady);
  const r = document.getElementById('test-result');
  r.textContent = smartMode ? '✅ 已保存（智能模式：' + flashModel + ' / ' + proModel + '）' : '✅ 已保存';
  r.className = 'text-sm text-center text-green-600';
  setTimeout(toggleSettingsInternal, 600);
}
async function testConnectionInternal() {
  const r = document.getElementById('test-result');
  const originalText = r.textContent;
  const originalClass = r.className;
  r.textContent = '⏳ 测试中...'; r.className = 'text-sm text-center text-gray-600';

  // 先保存输入到临时变量，而不是立即调用saveSettingsInternal
  const tempUrl = document.getElementById('cfg-url').value.trim();
  const tempKey = document.getElementById('cfg-key').value.trim();
  const tempModel = document.getElementById('cfg-model').value.trim();

  try {
    const resp = await fetch(tempUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tempKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: tempModel, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 })
    });
    if (resp.ok) {
      r.textContent = '✅ 连接成功';
      r.className = 'text-sm text-center text-green-600';
      // 只有测试成功后才保存设置
      saveSettingsInternal();
    }
    else {
      const e = await resp.json().catch(() => ({}));
      r.textContent = '❌ ' + (e.error?.message || 'HTTP ' + resp.status);
      r.className = 'text-sm text-center text-red-600';
    }
  } catch (e) {
    r.textContent = '❌ ' + e.message;
    r.className = 'text-sm text-center text-red-600';
  }
}

// ==================== 记忆系统管理 ====================
function addToShortTermMemory(summary, turn, time) {
  if (!shortTermMemory) shortTermMemory = [];
  shortTermMemory.push({ turn: turn || 0, time: time || '', summary: summary || '' });
  if (shortTermMemory.length > 5) shortTermMemory.shift();
  if (shortTermMemory.length === 5) mergeToLongTermMemory();
}
function mergeToLongTermMemory() {
  if (!shortTermMemory || shortTermMemory.length < 5) return;
  const merged = shortTermMemory.map(function (item) { return item ? item.summary : ''; }).join(' | ');
  const startTurn = shortTermMemory[0] ? shortTermMemory[0].turn : 0;
  const endTurn = shortTermMemory[4] ? shortTermMemory[4].turn : 0;
  longTermMemory.push({ startTurn: startTurn, endTurn: endTurn, summary: merged });
  shortTermMemory = [];
}
function buildMemoryContext() {
  let context = '';
  if (longTermMemory && Array.isArray(longTermMemory) && longTermMemory.length > 0) {
    context += '\n【长期历史（摘要）:\n';
    longTermMemory.forEach(function (mem) { if (mem) context += '- 回合' + (mem.startTurn || 0) + '-' + (mem.endTurn || 0) + ': ' + (mem.summary || '') + '\n'; });
  }
  if (shortTermMemory && Array.isArray(shortTermMemory) && shortTermMemory.length > 0) {
    context += '\n【短期历史（最近回合）:\n';
    shortTermMemory.forEach(function (mem) { if (mem) context += '- 回合' + (mem.turn || 0) + '(' + (mem.time || '') + '): ' + (mem.summary || '') + '\n'; });
  }
  // 注入NPC世界书
  var wbCtx = buildWorldBookContext();
  if (wbCtx) context += '\n' + wbCtx;
  return context;
}

// ==================== 开局面板逻辑 ====================
var START_DATA = {
  names: ["陈致远", "艾琳娜·沃森", "亚历山大·李", "索菲亚·陈", "李俊熙", "王建国", "山本太郎", "艾哈迈德·本·萨拉丁"],
  titles: ["市长", "总督", "执行官", "城主", "首席执政官"],
  appearances: [
    "身材挺拔，常穿深色西装，戴金丝眼镜，目光锐利。",
    "总是面带微笑，喜欢穿定制的中式立领装，手腕上有一块老式怀表。",
    "短发干练，身着简洁的职业套装，行动迅速，说话直接。",
    "留着精心修剪的胡须，喜欢穿风衣，给人一种老派绅士的感觉。"
  ],
  origins: [
    "出身政治世家，从基层公务员一步步晋升上来。",
    "原为著名企业家，因经济危机被推举为市长挽救城市。",
    "退役军官，以铁腕手段整顿治安后获得民众支持。",
    "学者出身，因提出前瞻性城市规划方案而被破格任命。"
  ],
  cities: ["头道沟", "大榆树", "宛州", "沙皇格勒", "彼得罗巴甫洛夫斯克", "红星", "勐端", "瓦雪平", "唐斯特", "弗里斯堡", "涅罗波利斯", "复兴镇", "天际线市"],
  symbols: ["雄鹰展翅", "齿轮与麦穗", "灯塔", "天平", "凤凰涅槃", "盾与剑"],
  eras: ["蒸汽时代", "电气时代", "信息革命", "战后重建期", "经济腾飞期", "转型阵痛期"],
  industries: [
    "以重工业为主，拥有全国最大的钢铁厂和机械制造基地。",
    "港口贸易发达，是区域物流中心，金融服务业正在崛起。",
    "农业产业化程度高，食品加工业和农业科技是支柱。",
    "旅游资源丰富，服务业占比超过70%，但工业基础薄弱。",
    "高科技产业聚集，拥有多家跨国公司的研发中心。"
  ],
  popDetails: [
    "人口老龄化严重，年轻劳动力外流。",
    "移民人口占30%，文化多元但也存在融合问题。",
    "大学城所在地，学生人口占比高，消费力强但流动性大。",
    "产业工人为主，工会力量强大，劳资关系紧张。"
  ],
  skills: [
    "危机公关大师", "财政预算专家", "城市规划鬼才", "招商引资能手",
    "舆情控制高手", "基建推进狂人", "社会保障设计师", "环境治理先锋",
    "外交谈判专家", "科技产业推手", "文化遗产保护者", "公共交通优化师",
    "治安整顿铁腕", "医疗改革先锋", "教育公平推动者", "住房保障专家",
    "数字化转型领航员", "乡村振兴策划师", "应急管理指挥官", "社区治理创新者"
  ]
};
var startSelectedSkills = [];

function startRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function startRandInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// 获取资源基础路径（兼容 GitHub Pages 等子目录部署）
function getBasePath() {
  var origin = window.location.origin || '';
  var pathname = (window.location.pathname || '').replace(/\/[^\/]*$/, '/');
  return origin + pathname;
}
function assetPath(filename) {
  var base = getBasePath();
  var encoded = filename;
  try {
    encoded = encodeURI(filename);
  } catch (e) {
    console.warn('URL编码失败:', e);
  }
  return base + encoded;
}

var _openingDeclarationLoaded = false;
var _presetsLoaded = false;
var _presets = [];
var _selectedStartMode = null;
var _selectedPreset = null;

function loadOpeningDeclaration() {
  if (_openingDeclarationLoaded) return;
  var el = document.getElementById('opening-declaration');
  if (!el) return;
  el.innerHTML = '<div class="decl-loading">正在加载开局声明...</div>';
  var url = assetPath('开局声明.txt');
  fetch(url, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (text) {
      text = text.trim();
      if (!text) {
        el.innerHTML = '<div class="decl-text">欢迎来到 AI City Simulator —— 市长模拟器。\n\n请完成市长任命档案，开始你的执政之路。</div>';
      } else {
        el.innerHTML = '<div class="decl-text">' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
      }
      _openingDeclarationLoaded = true;
    })
    .catch(function (e) {
      console.warn('加载开局声明失败 (尝试路径: ' + url + '):', e);
      fetch('开局声明.txt', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (text) {
          text = text.trim();
          el.innerHTML = '<div class="decl-text">' + (text || '欢迎来到 AI City Simulator —— 市长模拟器。\n\n请完成市长任命档案，开始你的执政之路。') + '</div>';
        })
        .catch(function () {
          el.innerHTML = '<div class="decl-text">欢迎来到 AI City Simulator —— 市长模拟器。\n\n请完成市长任命档案，开始你的执政之路。</div>';
        });
      _openingDeclarationLoaded = true;
    });
}

function loadPresets() {
  if (_presetsLoaded) return;
  _presetsLoaded = true;
  var url = assetPath('开局.txt');
  fetch(url, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (text) {
      _presets = parsePresets(text);
      _presetsLoaded = true;
    })
    .catch(function (e) {
      console.warn('加载预设剧本失败 (尝试路径: ' + url + '):', e);
      fetch('开局.txt', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (text) { _presets = parsePresets(text); })
        .catch(function () { _presets = []; });
    });
}

function parsePresets(text) {
  var presets = [];
  var blocks = text.split(/#\s*(?:开局|start)[：:]/);
  blocks.shift();
  blocks.forEach(function (block) {
    var lines = block.split('\n');
    var titleLine = lines[0].trim();
    var titleMatch = titleLine.match(/^([^#：]+?)(?:\s*[（(].*?[）)]\s*)?[：:](.+)$/);
    var title = titleMatch ? titleMatch[1].trim() : titleLine;
    var subtitle = titleMatch ? titleMatch[2].trim() : '';
    var yearMatch = title.match(/(\d{4})/);
    var year = yearMatch ? yearMatch[1] : '';
    var displayTitle = (year ? year + '：' : '') + title + (subtitle ? '：' + subtitle : '');
    var cityBg = '';
    var cityData = '';
    var playerIdentity = '';
    var quote = '';
    var section = '';
    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (trimmed === '### 城市背景：' || trimmed === '### 城市背景' || trimmed === '## 城市背景') {
        section = 'cityBg';
      } else if (trimmed === '## 城市数据' || trimmed === '### 城市数据') {
        section = 'cityData';
      } else if (trimmed === '## 玩家身份' || trimmed === '### 玩家身份') {
        section = 'playerIdentity';
      } else if (trimmed.startsWith('- 描述：') || trimmed.startsWith('- 描述:')) {
        quote = trimmed.replace(/^[-\s]*描述[：:]\s*/, '');
      } else if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
        section = '';
      } else if (section === 'cityBg' && trimmed) {
        cityBg += (cityBg ? '\n' : '') + trimmed;
      } else if (section === 'cityData' && trimmed && !trimmed.startsWith('人口') && !trimmed.startsWith('经济') && !trimmed.startsWith('特点') && !trimmed.startsWith('GDP') && !trimmed.startsWith('####')) {
        cityData += (cityData ? '\n' : '') + trimmed;
      } else if (section === 'playerIdentity' && trimmed) {
        playerIdentity += (playerIdentity ? '\n' : '') + trimmed;
      }
    });
    if (title || cityBg || playerIdentity) {
      presets.push({
        title: displayTitle || title,
        year: year,
        cityName: title,
        cityBg: cityBg,
        cityData: cityData,
        playerIdentity: playerIdentity,
        quote: quote
      });
    }
  });
  return presets;
}

function selectStartMode(mode) {
  _selectedStartMode = mode;
  document.querySelectorAll('.start-mode-card').forEach(function (el) { el.classList.remove('selected'); });
  if (mode === 'custom') {
    document.getElementById('start-mode-custom').classList.add('selected');
    document.getElementById('start-preset-list').style.display = 'none';
    document.getElementById('start-nav').style.display = '';
    document.querySelector('.start-body').style.display = '';
    startSwitchTab('mayor');
  } else if (mode === 'preset') {
    document.getElementById('start-mode-preset').classList.add('selected');
    if (_presets.length === 0) {
      loadPresets();
      setTimeout(function () { renderPresetList(); }, 500);
    } else {
      renderPresetList();
    }
  }
}

function renderPresetList() {
  var el = document.getElementById('start-preset-list');
  if (!el) return;
  if (_presets.length === 0) {
    el.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;padding:20px">未能加载预设剧本，请确保"开局.txt"文件存在</p>';
    el.style.display = '';
    return;
  }
  var html = '';
  _presets.forEach(function (preset, idx) {
    html += '<div class="start-preset-item' + (_selectedPreset === idx ? ' selected' : '') + '" onclick="selectPreset(' + idx + ')">';
    // 修复年份重复问题：移除标题中重复的年份前缀
    var displayTitle = preset.title;
    if (preset.year) {
      var yearPrefix = preset.year + '：';
      if (displayTitle.startsWith(yearPrefix)) {
        displayTitle = displayTitle.substring(yearPrefix.length);
      }
    }
    html += '<div class="start-preset-title">' + displayTitle + '</div>';
    html += '<div class="start-preset-desc">' + (preset.cityBg.substring(0, 80) || '') + (preset.cityBg.length > 80 ? '...' : '') + '</div>';
    if (preset.quote) {
      html += '<div class="start-preset-quote">"' + preset.quote + '"</div>';
    }
    html += '</div>';
  });
  html += '<div class="start-preset-item" onclick="selectStartMode(\'custom\')" style="background:#f5f5f5;border-style:dashed;color:#888;text-align:center;display:flex;align-items:center;justify-content:center;min-height:80px"><div>没有喜欢的？<br><strong>自定义开局</strong></div></div>';
  el.innerHTML = html;
  el.style.display = '';
}

function selectPreset(idx) {
  if (idx < 0 || idx >= _presets.length) return;
  _selectedPreset = idx;
  document.querySelectorAll('.start-preset-item').forEach(function (el, i) {
    el.classList.toggle('selected', i === idx);
  });
  var preset = _presets[idx];
  // 直接启动预设开局，不填充表单
  launchPresetGame(preset);
}

// 根据游戏背景自动适配货币符号
function detectCurrencySymbol(cityBg, cityName, era) {
  var text = (cityBg || '') + ' ' + (cityName || '') + ' ' + (era || '');
  // 中世纪/古典时代 - 西方风格
  if (/中世纪|古典|古罗马|古希腊|拜占庭|中世|文艺复兴|维多利亚/.test(text)) {
    if (/亚洲|中国|中华|大唐|宋朝|明朝|清朝|东亚/.test(text)) {
      return '贯'; // 中国古代铜钱单位
    }
    if (/法国|法兰西|巴黎/.test(text)) {
      return '₣';
    }
    return '£'; // 西方案例
  }
  // 近代/现代
  if (/蒸汽|工业|战后|民国|近代|现代|当代/.test(text)) {
    if (/民国|近代中国|亚洲|东南亚|中国|中华/.test(text)) {
      return '元';
    }
    if (/英国|英联邦|维多利亚|伦敦/.test(text)) {
      return '£';
    }
    if (/美国|美元|美洲|纽约|华盛顿/.test(text)) {
      return '$';
    }
    if (/日本|日元|大和|东京|京都/.test(text)) {
      return '円';
    }
    if (/欧盟|欧元区|欧洲|法国|法兰西|德国|巴黎/.test(text)) {
      return '€';
    }
    if (/俄罗斯|莫斯科/.test(text)) {
      return '₽';
    }
    if (/印度/.test(text)) {
      return '₹';
    }
    if (/韩国|朝鲜|首尔/.test(text)) {
      return '₩';
    }
    return '¥'; // 默认为人民币
  }
  // 架空/幻想世界
  if (/架空|幻想|魔法|异世界|奇幻/.test(text)) {
    return '金'; // 奇幻世界通用金币
  }
  // 殖民地背景
  if (/殖民地|殖民/.test(text)) {
    if (/法属|法兰西/.test(text)) {
      return '₣';
    }
    if (/荷属|荷兰/.test(text)) {
      return 'ƒ';
    }
    if (/西班牙属/.test(text)) {
      return '₧';
    }
    return '£'; // 英属殖民地
  }
  // 根据城市名称做最后判断
  if (/中国|中华|北京|上海|广州|长安|洛阳|金陵|临安|汴京|成都|杭州|苏州|南京|武汉|西安|香港|澳门|台北/.test(text)) {
    if (/古代|朝|代|宋|唐|明|清|汉|元/.test(text)) {
      return '贯';
    }
    return '元';
  }
  if (/日本|东京|京都|大阪|奈良|江户/.test(text)) {
    return '円';
  }
  if (/韩国|首尔|釜山|朝鲜|平壤/.test(text)) {
    return '₩';
  }
  if (/印度|孟买|新德里/.test(text)) {
    return '₹';
  }
  if (/俄罗斯|莫斯科|圣彼得堡/.test(text)) {
    return '₽';
  }
  if (/美国|纽约|华盛顿|洛杉矶|芝加哥|波士顿|费城/.test(text)) {
    return '$';
  }
  if (/巴黎|伦敦|柏林|罗马|马德里|维也纳|阿姆斯特丹|布鲁塞尔/.test(text)) {
    if (/巴黎|法国/.test(text)) {
      return '€';
    }
    return '£';
  }
  // 真正的默认（无任何背景信息时）使用通用货币符号
  return '¤';
}

function launchPresetGame(preset) {
  // 检查API配置
  var apiUrl = localStorage.getItem('aic_api_url') || '';
  var apiKey = localStorage.getItem('aic_api_key') || '';
  if (!apiUrl || !apiKey) {
    alert('请先在设置中配置DeepSeek API。点击右上角⚙️按钮进行配置。');
    return;
  }
  // 构建预设开局的文本内容 - 修复年份重复问题，使用原始标题而不是displayTitle
  var originalTitle = preset.title;
  // 如果标题包含年份且格式是"年份：标题：副标题"，移除前面的年份
  if (preset.year) {
    var yearPrefix = preset.year + '：';
    if (originalTitle.startsWith(yearPrefix)) {
      originalTitle = originalTitle.substring(yearPrefix.length);
    }
  }
  var presetContent = '# ' + originalTitle + '\n\n';
  if (preset.cityBg) {
    presetContent += '## 城市背景\n' + preset.cityBg + '\n\n';
  }
  if (preset.cityData) {
    presetContent += '## 城市数据\n' + preset.cityData + '\n\n';
  }
  if (preset.playerIdentity) {
    presetContent += '## 玩家身份\n' + preset.playerIdentity + '\n\n';
  }
  if (preset.quote) {
    presetContent += '> ' + preset.quote + '\n';
  }
  // 自动检测货币符号
  var currencySymbol = detectCurrencySymbol(preset.cityBg, preset.cityName, '');
  var btn = document.getElementById('start-btn-launch');
  var statusEl = document.getElementById('start-launch-status');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ AI正在生成开局...'; }
  if (statusEl) statusEl.textContent = '正在调用DeepSeek API，请稍候...';
  // 先隐藏开局面板，显示加载界面
  var startPanel = document.getElementById('start-panel');
  if (startPanel) startPanel.style.display = 'none';
  var loadingModal = document.getElementById('loading-modal');
  if (loadingModal) loadingModal.classList.remove('hidden');
  // 构建消息
  var startSysContent = START_SYSTEM_PROMPT;
  var customPrompt = localStorage.getItem('aic_custom_prompt') || '';
  if (customPrompt) startSysContent += '\n\n# 玩家自定义指令\n' + customPrompt;
  var messages = [
    { role: 'system', content: startSysContent },
    { role: 'user', content: '【开局初始化请求】请根据以下预设剧本生成完整的初始城市状态JSON。\n\n⚠️ ⚠️ 【极端重要！】这是首次生成，必须返回JSON全部字段的真实、完整数据！！！\n\n✅ city_map新格式：\n- regions：仅自然地形(8种:ocean/mountain/river/lake/forest/desert/swamp/plain)带形状坐标(rect/polygon/circle/line)\n- districts：人工区划(6种:road/residential/commercial/industrial/suburb/transport)只传type+name+blocks+status，不传位置\n- landmarks：设施emoji只传{name,icon,district}（district=区划名或自然类型，市政厅district=""），不传col/row\n- legend：emoji→名称\n示例："districts":[{"type":"residential","name":"老城区","status":"治安良好","blocks":4},{"type":"commercial","name":"商圈","status":"繁荣","blocks":3},{"type":"road","blocks":3}]\n\n✅ 必须包含的字段（每个字段都必须有真实值）：\n- header/macro/demo/land/econ/fiscal/admin/council/city/npc/mayor/news/notes 所有字段都必须有内容\n\n✅ 特殊强调（最容易缺失的字段）：\n- npc：必须包含至少3-5个NPC角色，每个都要有完整的name/gender/role/expression/appearance/personality/background/stance/action/relation信息\n- news：必须包含city_official/foreign/social/radio四个部分的完整新闻内容\n- 所有数组（districts, exports, imports, facilities, classes, projects, groups, npc, policies等）必须包含合理的数据项，绝对不能是空数组！\n- 🛣️ 道路宽度约束：每条道路最多1格宽（道路不会形成面状区域）\n\n✅ 货币符号（必须严格遵守）：\n- 本局使用的货币符号为：【' + currencySymbol + '】\n- 所有涉及金额的字段（gdp/debt/liquid_fx/total_expense/total_income/cost/revenue/value等）都必须使用这个货币符号\n- 金额格式：【货币符号 + 数字 + 万/亿】（如：' + currencySymbol + '5000万 或 ' + currencySymbol + '1.2亿）\n\n✅ 格式要求：\n- 禁止省略任何字段\n- 禁止使用null或空字符串占位\n- JSON格式必须绝对正确\n- ⚠️重要：residential+commercial+industrial的blocks总和必须≥所有district blocks总和的30%\n\n预设剧本：\n' + presetContent + '\n\n请严格按照标准JSON格式输出完整数据。' }
  ];
  var proModel = localStorage.getItem('aic_pro_model');
  var apiModel = proModel || localStorage.getItem('aic_api_model') || 'deepseek-reasoner';
  // 保存开局快照，供刷新使用
  refreshSnapshot = { isOpening: true, messages: messages.map(function (m) { return { role: m.role, content: m.content }; }), apiModel: apiModel, appointmentText: presetContent };
  var fullContent = '';
  var finishReason = '';
  var decoder = new TextDecoder();

  // 双Agent：数据 + 地图
  var baseSystemMsg = messages[0];
  var dataUserMsg = '【开局初始化请求 - 城市数据部分】请根据以下市长任命档案生成完整的初始城市状态。\n\n⚠️ 只输出以下块（禁止输出city_map块！）：\nheader / narrative / macro / demo / land / econ / fiscal / admin / council / city / npc / mayor / news / notes / secretary_reminder / turn_summary / next_actions / game_over\n\n必须使用块标记协议格式输出。\n\n市长任命档案：\n' + presetContent + '\n\n严格按照块标记协议格式输出：===块名===\\n内容\\n===end===';
  var mapUserMsg = '【开局初始化请求 - 城市地图部分】请根据以下市长任命档案生成城市地图。\n\n⚠️ 只输出 city_map 块！使用简单文本格式（禁止JSON）。\n格式：MAP:GRID=34 / REGION:类型,形状,坐标 / LANDMARK:名,图标,区划 / LEGEND:名,图标 / DISTRICT:类型,名,状态,块数 / ENDMAP\n\n🧠 生成前推敲：海岸/山脉/河流分布，平原≥40%，海洋≤20%，res+com+ind≥总块30%，森林山脉不覆盖市中心。\n\n市长任命档案：\n' + presetContent + '\n\n格式：===city_map===\\n...\\n===end===';
  var dataMessages = [{ role: 'system', content: baseSystemMsg.content }, { role: 'user', content: dataUserMsg }];
  var mapMessages = [{ role: 'system', content: baseSystemMsg.content }, { role: 'user', content: mapUserMsg }];

  var dataFullContent = '', mapFullContent = '';
  var dataDone = false, mapDone = false;

  function checkBothDone() {
    if (!dataDone || !mapDone) return;
    fullContent = dataFullContent + '\n' + mapFullContent;
    finishStart();
  }

  // Agent A：数据
  fetch(apiUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: apiModel, messages: dataMessages, temperature: 0.7, max_tokens: 24576, stream: true })
  }).then(function (res) {
    if (!res.ok) throw new Error('数据Agent请求失败: ' + res.status);
    var reader = res.body.getReader();
    function pump() {
      return reader.read().then(function (result) {
        if (result.done) { dataDone = true; checkBothDone(); return; }
        var chunk = decoder.decode(result.value, { stream: true });
        var lines = chunk.split('\n');
        lines.forEach(function (line) {
          line = line.trim();
          if (!line || !line.startsWith('data:')) return;
          var payload = line.substring(5).trim();
          if (payload === '[DONE]') return;
          try { var j = JSON.parse(payload); if (j.choices && j.choices[0]) { if (j.choices[0].delta && j.choices[0].delta.content) dataFullContent += j.choices[0].delta.content; if (j.choices[0].finish_reason) finishReason = j.choices[0].finish_reason; } } catch (e) { }
        });
        return pump();
      });
    }
    return pump();
  }).catch(function (err) { console.error('数据Agent错误:', err); dataDone = true; checkBothDone(); });

  // Agent B：地图
  fetch(apiUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: apiModel, messages: mapMessages, temperature: 0.7, max_tokens: 8192, stream: true })
  }).then(function (res) {
    if (!res.ok) throw new Error('地图Agent请求失败: ' + res.status);
    var reader = res.body.getReader();
    function pump() {
      return reader.read().then(function (result) {
        if (result.done) { mapDone = true; checkBothDone(); return; }
        var chunk = decoder.decode(result.value, { stream: true });
        var lines = chunk.split('\n');
        lines.forEach(function (line) {
          line = line.trim();
          if (!line || !line.startsWith('data:')) return;
          var payload = line.substring(5).trim();
          if (payload === '[DONE]') return;
          try { var j = JSON.parse(payload); if (j.choices && j.choices[0]) { if (j.choices[0].delta && j.choices[0].delta.content) mapFullContent += j.choices[0].delta.content; if (j.choices[0].finish_reason) finishReason = j.choices[0].finish_reason; } } catch (e) { }
        });
        return pump();
      });
    }
    return pump();
  }).catch(function (err) { console.error('地图Agent错误:', err); mapDone = true; checkBothDone(); });

  function finishStart() {
    if (finishReason === 'length' && statusEl) statusEl.textContent += ' ⚠️ 响应可能被截断，正在修复...';
    if (!fullContent) throw new Error('AI返回内容为空');
    displayTokenInfo({ prompt_tokens: 0, completion_tokens: 0 });
    // 先提取city_map（可能是简单文本格式），然后从fullContent中移除
    var cityMapData = null;
    var cmMatch = /===city_map===\s*([\s\S]*?)\s*===end===/.exec(fullContent);
    if (cmMatch) {
      cityMapData = parseSimpleMapFormat(cmMatch[1].trim());
      fullContent = fullContent.replace(/===city_map===[\s\S]*?===end===/, '');
    }
    // 解析JSON - 多策略提取（含截断修复）
    var newState;
    try { newState = extractJSON(fullContent); } catch (parseErr) {
      console.warn('首次解析失败，尝试截断修复:', parseErr.message);
      try { newState = extractJSON(fullContent); } catch (e2) { throw new Error('JSON解析失败：' + e2.message); }
    }
    // 检查并补全缺失字段
    var missingFields = [];
    var requiredFields = ['header', 'macro', 'demo', 'land', 'econ', 'fiscal', 'admin', 'council', 'city', 'npc', 'news'];
    requiredFields.forEach(function (f) { if (!newState[f]) missingFields.push(f); });
    if (missingFields.length > 0 || !newState.header || !newState.macro) {
      console.warn('开局返回缺失字段:', missingFields.length ? missingFields : '(header/macro)');
      // 用DEFAULT_STATE填充缺失的顶级字段
      var defaults = JSON.parse(JSON.stringify(DEFAULT_STATE));
      requiredFields.forEach(function (f) { if (!newState[f] && defaults[f]) newState[f] = defaults[f]; });
      if (!newState.city_map) { newState.city_map = cityMapData || {}; applyMapGridSize(newState); }
      if (!newState.next_actions) newState.next_actions = [];
      if (newState.macro && !newState.macro.mayor_name && newState.mayor) newState.macro.mayor_name = newState.mayor.name;
    }
    // 深拷贝替换gameState
    gameState = JSON.parse(JSON.stringify(newState));
    _prevGameTimeStr = ''; // 新游戏：重置新闻时间追踪，首回合全部更新
    // 开局后清除数据缺失检测，避免立即触发补全
    _missingDataFields = [];
    // 重置回合计数和记忆
    turnCount = 0;
    historyDecisions = [];
    fullHistory = [];
    chartData = { labels: ['初始'], gdp: [gameState.macro.total_gdp || 3.2], support: [gameState.macro.mayor_support || 65] };
    lastChartMonth = '';
    popGrowthHistory = [];
    shortTermMemory = [];
    longTermMemory = [];
    lastUserMessage = null;
    lastAssistantMessage = null;
    // 重置NPC模块
    pinnedNPCs = [];
    broadcastSegments = [];
    _npcLifeLastDay = '';
    _broadcastLastDay = '';
    // 保存存档
    saveGame();
    // 隐藏加载界面，显示游戏界面
    if (loadingModal) loadingModal.classList.add('hidden');
    var appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'block';
    // 渲染界面
    render();
    // 检查是否需要初始化NPC生活和广播
    checkDailyUpdates();
    // 恢复按钮状态
    if (btn) { btn.disabled = false; btn.textContent = '🚀 开始游戏（AI生成开局）'; }
  }
}

function startSwitchTabInternal(tabId) {
  document.querySelectorAll('.start-tab').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.start-nav-btn').forEach(function (el) { el.classList.remove('active'); });
  var tabEl = document.getElementById('start-tab-' + tabId);
  if (tabEl) tabEl.classList.add('active');
  var navBtns = document.querySelectorAll('.start-nav-btn');
  var idx = ['mayor', 'city', 'economy', 'skills', 'final'].indexOf(tabId);
  if (idx >= 0 && navBtns[idx]) navBtns[idx].classList.add('active');
  // 自动滚动到顶部
  var body = document.querySelector('.start-body');
  if (body) body.scrollTop = 0;
}

function startSelectRadioInternal(el) {
  var group = el.parentElement;
  if (!group) return;
  group.querySelectorAll('.start-radio-opt').forEach(function (opt) { opt.classList.remove('selected'); });
  el.classList.add('selected');
  // 自定义背景显示/隐藏
  var radio = el.querySelector('input');
  if (radio && radio.name === 'start-bg') {
    var customInput = document.getElementById('start-bg-custom');
    if (customInput) customInput.style.display = radio.value === '自定义' ? 'block' : 'none';
  }
}

function startUpdatePopInternal() {
  var val = document.getElementById('start-pop-slider').value;
  var labels = ['乡镇 (<5万)', '小集镇 (5-20万)', '城市 (20-100万)', '直辖市 (100-500万)', '国际大都会 (>500万)'];
  document.getElementById('start-pop-label').textContent = labels[val - 1];
}

function startAutoMayorInternal() {
  document.getElementById('start-mayor-name').value = startRand(START_DATA.names);
  document.getElementById('start-mayor-age').value = startRandInt(35, 65);
  document.getElementById('start-mayor-gender').value = startRand(['男', '女']);
  document.getElementById('start-mayor-title').value = startRand(START_DATA.titles);
  document.getElementById('start-mayor-appearance').value = startRand(START_DATA.appearances);
  document.getElementById('start-mayor-origin').value = startRand(START_DATA.origins);
}

function startAutoCityInternal() {
  document.getElementById('start-city-name').value = startRand(START_DATA.cities);
  document.getElementById('start-city-symbol').value = startRand(START_DATA.symbols);
  document.getElementById('start-era').value = startRand(START_DATA.eras);
  document.getElementById('start-succession').value = startRand(['民选', '任命', '世袭', '临时代理']);
  // 随机选城市背景
  var bgOpts = document.querySelectorAll('#start-city-bg .start-radio-opt');
  if (bgOpts.length > 0) {
    var randomBg = bgOpts[Math.floor(Math.random() * (bgOpts.length - 1))]; // 排除"自定义"
    if (randomBg) startSelectRadioInternal(randomBg);
  }
  // 随机选地形
  var trOpts = document.querySelectorAll('#start-terrain .start-radio-opt');
  if (trOpts.length > 0) startSelectRadioInternal(trOpts[Math.floor(Math.random() * trOpts.length)]);
  // 随机选气候
  var clOpts = document.querySelectorAll('#start-climate .start-radio-opt');
  if (clOpts.length > 0) startSelectRadioInternal(clOpts[Math.floor(Math.random() * clOpts.length)]);
  // 随机选隐患
  var hzOpts = document.querySelectorAll('#start-hazard .start-radio-opt');
  if (hzOpts.length > 0) startSelectRadioInternal(hzOpts[Math.floor(Math.random() * hzOpts.length)]);
}

function startAutoEconomyInternal() {
  var financeOpts = document.querySelectorAll('#start-finance .start-radio-opt');
  if (financeOpts.length > 0) startSelectRadioInternal(financeOpts[Math.floor(Math.random() * financeOpts.length)]);
  document.getElementById('start-industry').value = startRand(START_DATA.industries);
  document.getElementById('start-pop-slider').value = startRandInt(1, 5);
  startUpdatePopInternal();
  document.getElementById('start-pop-detail').value = startRand(START_DATA.popDetails);
}

function startRollSkillsInternal() {
  var pool = START_DATA.skills.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 10);
  var container = document.getElementById('start-skill-pool');
  container.innerHTML = '';
  startSelectedSkills = [];
  var countEl = document.getElementById('start-skill-count');
  if (countEl) countEl.textContent = '（已选 0/3）';
  pool.forEach(function (skill) {
    var div = document.createElement('div');
    div.className = 'start-skill-item';
    div.innerHTML = '<span>' + skill + '</span>';
    div.onclick = function () { startToggleSkill(div, skill); };
    container.appendChild(div);
  });
}

function startToggleSkill(el, skill) {
  if (startSelectedSkills.indexOf(skill) >= 0) {
    startSelectedSkills = startSelectedSkills.filter(function (s) { return s !== skill; });
    el.classList.remove('selected');
  } else {
    if (startSelectedSkills.length >= 3) { alert('最多只能选择3个技能！'); return; }
    startSelectedSkills.push(skill);
    el.classList.add('selected');
  }
  var countEl = document.getElementById('start-skill-count');
  if (countEl) countEl.textContent = '（已选 ' + startSelectedSkills.length + '/3）';
}

function startGetRadioValue(groupId) {
  var checked = document.querySelector('#' + groupId + ' .start-radio-opt.selected input');
  return checked ? checked.value : '';
}

function startGeneratePreviewInternal() {
  // 自动填充空字段
  if (!document.getElementById('start-mayor-name').value) startAutoMayorInternal();
  if (!document.getElementById('start-city-name').value) startAutoCityInternal();
  if (!document.getElementById('start-industry').value) startAutoEconomyInternal();
  var bg = startGetRadioValue('start-city-bg');
  if (bg === '自定义') bg = document.getElementById('start-bg-custom').value || '自定义';
  var customSkill = document.getElementById('start-custom-skill').value.trim();
  var skills = startSelectedSkills.slice();
  if (customSkill) skills.unshift('★ ' + customSkill);
  if (skills.length === 0) skills.push('暂无特殊技能');
  var text = '【城市模拟器 · 市长任命档案】\n' +
    '════════════════════════════════════\n' +
    '[城市信息]\n' +
    '城市名称：' + document.getElementById('start-city-name').value + '\n' +
    '城市象征：' + document.getElementById('start-city-symbol').value + '\n' +
    '城市背景：' + bg + '\n' +
    '时代背景：' + document.getElementById('start-era').value + '\n' +
    '地形特征：' + startGetRadioValue('start-terrain') + '\n' +
    '气候类型：' + startGetRadioValue('start-climate') + '\n' +
    '自然隐患：' + startGetRadioValue('start-hazard') + '\n' +
    '[经济状况]\n' +
    '财政开局：' + startGetRadioValue('start-finance') + '\n' +
    '人口规模：' + document.getElementById('start-pop-label').textContent + '\n' +
    '产业情况：' + document.getElementById('start-industry').value + '\n' +
    '人口详情：' + document.getElementById('start-pop-detail').value + '\n' +
    '[市长档案]\n' +
    '姓    名：' + document.getElementById('start-mayor-name').value + '\n' +
    '头    衔：' + document.getElementById('start-mayor-title').value + '\n' +
    '性    别：' + document.getElementById('start-mayor-gender').value + '\n' +
    '年    龄：' + document.getElementById('start-mayor-age').value + '岁\n' +
    '继任方式：' + document.getElementById('start-succession').value + '\n' +
    '外貌特征：' + document.getElementById('start-mayor-appearance').value + '\n' +
    '出身背景：' + document.getElementById('start-mayor-origin').value + '\n' +
    '[执政技能]\n' +
    skills.map(function (s) { return '▸ ' + s; }).join('\n') + '\n' +
    '════════════════════════════════════\n' +
    '市长阁下，祝您执政顺利，城市繁荣！';
  document.getElementById('start-preview').textContent = text;
}

// 开局系统提示词
var START_SYSTEM_PROMPT = [
  '【开局生成模式】这是游戏的首次初始化，与后续回合完全不同！',
  '⚠️ 核心规则：必须返回JSON中每一个字段的完整真实数据，绝对禁止省略任何字段！这不是增量更新，是全量生成。',
  '城市模拟游戏开局。市长刚上任。根据【市长任命档案】生成完整初始城市状态JSON。',
  '财政/人口/产业等须与任命档案一致。初始助手汇报城市情况。回合≠天数。',
  '输出完整JSON（```json包裹），所有字段不可省略。每个数组至少包含1-3个合理数据项（如districts至少2个区、exports至少2种出口商品、npc至少2个重要人物）。',
  '# AI行为禁令',
  '1.禁替玩家决策。2.narrative第三人称，禁引导性语言。3.NPC反应与立场一致。4.禁暗中降低风险。5.重大负面影响须明确提及。6.禁爽文，须有代价。7.禁死局。',
  '# JSON格式',
  '{',
  '  "header":{"time":"年月日时分星期","location":"","place":"","plot":"","weather":""},',
  '  "narrative":"<p class=\'text-gray-800 leading-relaxed\'>上任首日叙事，≥1000字，小说文风</p>",',
  '  "macro":{"mayor_name":"市长姓名","liquid_fx":"£","debt":"£","infra_health":"%","gdp":"£","growth_rate":"%","currency_cpi":"","unemployment":"%","gini":"","income_mode":"£","dependency":"%","security":"","political_stability":"%","execution_efficiency":"%","mayor_support":"%"},',
  '  "demo":{"population":"","growth_rate":"","health":"","mortality":"","education":"","ethnicity":"","religion":""},',
  '  "land":{"area":"","admin_level":"","climate":"","geography":"","power":"","water":"","heating":"","traffic":"","pollution":""},',
  '  "econ":{"facilities":[{"id":"","type":"","employees":"","cost":"","status":"","revenue":""}],"exports":[{"name":"","type":"","volume":"货运量","value":"贸易额","tax":"","tag":""}],"imports":[同exports],"classes":[{"name":"","pop_pct":"","income":"","demand":"","satisfaction":"","global_rank":""}]},',
  '  "fiscal":{"total_expense":"£","expense_items":[{"name":"","type":"","amount":"£","status":""}],"total_income":"£","income_items":[{"name":"","type":"","amount":"£","status":""}]},',
  '  "admin":{"districts":[{"name":"","location":"","governance":""}],"departments":[{"name":"","function":"","head":""}],"projects":[{"name":"","stage":"","cost":"£","progress":"%"}],"civil_servants":"","admin_load":"%","corruption":"%"},',
  '  "council":{"groups":[{"name":"","type":"","support":"%","influence":"","demand":"","seats":"","risk":""}]},',
  '  "city":{"face":"","geo_text":"","election":"","housing":"","culture":"","policies":[{"name":"","stage":"","effect":"","opinion":"%","status":""}],"terrain":{"layout":"","water_direction":"","mountain_direction":"","river_direction":""}},',
  '  "city_map":"\n===city_map===\nMAP:GRID=' + (mapGridSize || 8) + '\nREGION:ocean,rect,26,0,8,' + (mapGridSize || 8) + '\nREGION:mountain,polygon,0,0,4,0,0,8\nREGION:river,line,2,0,5,6,8,10,12,16\nREGION:forest,rect,0,22,4,12\nLANDMARK:市政厅,🏛️,\nLANDMARK:港口,⚓,港口区\nLEGEND:市政厅,🏛️\nLEGEND:港口,⚓\nDISTRICT:residential,老城中心,人口密集,16\nDISTRICT:commercial,商圈,繁荣,9\nDISTRICT:road,,主干道,20\nENDMAP\n===end===",',
  '  "npc":[{"name":"","gender":"","role":"","expression":"","appearance":"","personality":"","background":"","stance":"","action":"","relation":""}],',
  '  "mayor":{"name":"","age":"","gender":"","faction":"","reputation":"","integrity":"","energy":"","skills":"","background":"","schedule":[{"time":"","location":"","event":""}]},',
  '  "news":{"city_official":{"media":"","date":"","edition":"","title":"","body":"70字"},"foreign":{"media":"","date":"","edition":"","title":"","body":"70字"},"social":{"media":"","date":"","edition":"","title":"","body":"90字","secretary_note":""},"radio":{"media":"","time":"","program_name":"","body":"150字"}},',
  '  "notes":["待办事项1","待办事项2"],"turn_summary":"80-150字开局总结","next_actions":["行动1","行动2","行动3","行动4"],"game_over":false',
  '}',
  '# 注意',
  '1.数值基于任命档案设定。2.JSON有效，双引号。3.【必须输出完整JSON，每个字段都必须有真实值，禁止省略、禁止null、禁止空字符串作为占位】4.金额含单位如"£5000万"。5.mayor_name来自任命档案。',
  '6.【极端重要】city.terrain和city_map完全由玩家在任命档案中的"地形特征"和"气候类型"决定！\n   - 玩家选择"平原"→无ocean/mountain区域，仅少量river\n   - 玩家选择"狭长海岸"→一侧有ocean rect区域\n   - 玩家选择"岛屿"→四周ocean包裹少量陆地\n   - 玩家选择"山地"→有大量mountain polygon区域\n   - 玩家选择"沿海"/"河口"→必须有ocean rect区域\n   先严格根据用户描述的地形特征决定整体布局。\n   - layout: 整体地形布局描述\n   - water_direction: 水域方向\n   - mountain_direction: 山地方向\n   - river_direction: 河流方向\n\n7.🧠 city_map地形生成思维链（先思考再填）：\n   a) 城市位于怎样的自然地理？海岸/山脉/河流如何分布？⚡若ocean+river同时存在，河流终点必须入海！\n   b) 各地形占比：平原≥40%、海洋≤20%、山地≤15%、森林≤15%、河流/道路<10%\n   c) ⚠️森林(forest)和山脉(mountain)不能放在市中心（grid中心2格半径内）\n   d) 区划blocks按grid_size²比例缩放，目标约30%城区面积：road×2~5%，res×8~15%，com×3~7%，ind×2~5%，sub×1~3%，trans×0.5~2%。34²网格≈300~370blocks。\n   e) 地标放在合理地形：🏛️市政厅在城区中央、⚓港口在水边、🏭工厂在工业区、🏠小区在居住区\n   city_map用regions列表(仅自然地形)+districts列表(人工区划)描述（默认平原）。自然(8):ocean/mountain/river/lake/forest/desert/swamp/plain。区划(6):road/residential/commercial/industrial/suburb/transport。districts只传type+name+blocks+status，不传形状。坐标0~' + (mapGridSize - 1) + '。landmarks=设施emoji含name/icon/district（district=区划名或自然类型，市政厅district=""），不传坐标。legend=emoji→名称映射。'
].join('\n');

function startLaunchGameInternal() {
  // 检查API配置
  var apiUrl = localStorage.getItem('aic_api_url') || '';
  var apiKey = localStorage.getItem('aic_api_key') || '';
  if (!apiUrl || !apiKey) {
    alert('请先在设置中配置DeepSeek API。点击右上角⚙️按钮进行配置。');
    return;
  }
  // 生成任命书
  startGeneratePreviewInternal();
  var appointmentText = document.getElementById('start-preview').textContent;
  if (!appointmentText || appointmentText.length < 50) {
    alert('请完成市长任命档案的填写。');
    startSwitchTabInternal('mayor');
    return;
  }
  // 自动检测货币符号
  var eraValue = document.getElementById('start-era').value || '';
  var cityBgValue = startGetRadioValue('start-city-bg') || '';
  if (cityBgValue === '自定义') cityBgValue = document.getElementById('start-bg-custom').value || '';
  var cityNameValue = document.getElementById('start-city-name').value || '';
  var currencySymbol = detectCurrencySymbol(cityBgValue, cityNameValue, eraValue);
  var btn = document.getElementById('start-btn-launch');
  var statusEl = document.getElementById('start-launch-status');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ AI正在生成开局...'; }
  if (statusEl) statusEl.textContent = '正在调用DeepSeek API，请稍候...';
  // 构建消息
  var startSysContent = START_SYSTEM_PROMPT;
  if (customPrompt) startSysContent += '\n\n# 玩家自定义指令\n' + customPrompt;
  var messages = [
    { role: 'system', content: startSysContent },
    { role: 'user', content: '【开局初始化请求】请根据以下市长任命档案生成完整的初始城市状态JSON。\n\n⚠️ ⚠️ 【极端重要！】这是首次生成，必须返回JSON全部字段的真实、完整数据！！！\n\n🧠 生成city.terrain和city_map前请在脑中逐项推敲：1)城市位于怎样的自然地理？海岸/山脉/河流如何分布？⚡河流必须入海！2)各地形占比：平原≥40%、海洋≤20%、山地≤15%、森林≤15% 3)⚠️强制：res+com+ind的blocks总和≥总blocks的30%！一个区块代表的现实面积大小不固定 4)市政厅和其他emoji设施合理分布，只传name/icon/district不传坐标。\n\n✅ city_map新格式：\n- regions：仅自然地形(8种:ocean/mountain/river/lake/forest/desert/swamp/plain)带形状坐标(rect/polygon/circle/line)\n- districts：人工区划(6种:road/residential/commercial/industrial/suburb/transport)只传type+name+blocks+status，不传位置\n- landmarks：设施emoji只传{name,icon,district}（district=区划名或自然类型，市政厅district=""），不传col/row\n- legend：emoji→名称\n示例："districts":[{"type":"residential","name":"老城区","status":"治安良好","blocks":4},{"type":"commercial","name":"商圈","status":"繁荣","blocks":3},{"type":"road","blocks":3}]\n\n✅ 必须包含的字段（每个字段都必须有真实值）：\n- header/macro/demo/land/econ/fiscal/admin/council/city/npc/mayor/news/notes 所有字段都必须有内容\n\n✅ 特殊强调（最容易缺失的字段）：\n- npc：必须包含至少3-5个NPC角色，每个都要有完整的name/gender/role/expression/appearance/personality/background/stance/action/relation信息\n- news：必须包含city_official/foreign/social/radio四个部分的完整新闻内容\n- 所有数组（districts, exports, imports, facilities, classes, projects, groups, npc, policies等）必须包含合理的数据项，绝对不能是空数组！\n- 🛣️ 道路宽度约束：每条道路最多1格宽（道路不会形成面状区域）\n\n✅ 货币符号（必须严格遵守）：\n- 本局使用的货币符号为：【' + currencySymbol + '】\n- 所有涉及金额的字段（gdp/debt/liquid_fx/total_expense/total_income/cost/revenue/value等）都必须使用这个货币符号\n- 金额格式：【货币符号 + 数字 + 万/亿】（如：' + currencySymbol + '5000万 或 ' + currencySymbol + '1.2亿）\n\n✅ 格式要求：\n- 禁止省略任何字段\n- 禁止使用null或空字符串占位\n- JSON格式必须绝对正确\n- ⚠️重要：residential+commercial+industrial的blocks总和必须≥所有district blocks总和的30%\n\n市长任命档案：\n' + appointmentText + '\n\n请严格按照标准JSON格式输出完整数据。' }
  ];
  var apiModel = proModel || localStorage.getItem('aic_api_model') || 'deepseek-reasoner';
  // 保存开局快照，供刷新使用
  refreshSnapshot = { isOpening: true, messages: messages.map(function (m) { return { role: m.role, content: m.content }; }), apiModel: apiModel, appointmentText: appointmentText };
  // 第一轮双Agent并行：AgentA处理非地图数据，AgentB专注生成地图
  var startNarrativeEl = document.getElementById('narrative-box');
  if (startNarrativeEl) startNarrativeEl.innerHTML = '<p class="text-gray-500">🤖 双AI并行生成中：数据Agent + 地图Agent...</p>';
  var fullContent = '';
  var finishReason = '';
  var decoder = new TextDecoder();

  // Agent A（数据）：只输出非地图块
  var baseSystemMsg = messages[0];
  var dataUserMsg = '【开局初始化请求 - 城市数据部分】请根据以下市长任命档案生成完整的初始城市状态。\n\n⚠️ 只输出以下块（禁止输出city_map块！）：\nheader / narrative / macro / demo / land / econ / fiscal / admin / council / city / npc / mayor / news / notes / secretary_reminder / turn_summary / next_actions / game_over\n\n必须使用块标记协议格式输出。\n\n市长任命档案：\n' + appointmentText + '\n\n严格按照块标记协议格式输出：===块名===\\n内容\\n===end===';
  var mapUserMsg = '【开局初始化请求 - 城市地图部分】请根据以下市长任命档案生成城市地图。\n\n⚠️ 只输出 city_map 块！使用简单文本格式（禁止JSON）。\n格式：MAP:GRID=34 / REGION:类型,形状,坐标 / LANDMARK:名,图标,区划 / LEGEND:名,图标 / DISTRICT:类型,名,状态,块数 / ENDMAP\n\n🧠 生成前推敲：海岸/山脉/河流分布，平原≥40%，海洋≤20%，res+com+ind≥总块30%，森林山脉不覆盖市中心。\n\n市长任命档案：\n' + appointmentText + '\n\n格式：===city_map===\\n...\\n===end===';
  var dataMessages = [{ role: 'system', content: baseSystemMsg.content }, { role: 'user', content: dataUserMsg }];
  var mapMessages = [{ role: 'system', content: baseSystemMsg.content }, { role: 'user', content: mapUserMsg }];

  var dataFullContent = '', mapFullContent = '';
  var dataDone = false, mapDone = false;

  function checkBothDone() {
    if (!dataDone || !mapDone) return;
    fullContent = dataFullContent + '\n' + mapFullContent;
    finishStart();
  }

  // Agent A：数据
  fetch(apiUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: apiModel, messages: dataMessages, temperature: 0.7, max_tokens: 24576, stream: true })
  }).then(function (res) {
    if (!res.ok) throw new Error('数据Agent请求失败: ' + res.status);
    var reader = res.body.getReader();
    function pump() {
      return reader.read().then(function (result) {
        if (result.done) { dataDone = true; console.warn('[DualAgent] 数据Agent完成'); checkBothDone(); return; }
        var chunk = decoder.decode(result.value, { stream: true });
        var lines = chunk.split('\n');
        lines.forEach(function (line) {
          line = line.trim();
          if (!line || !line.startsWith('data:')) return;
          var payload = line.substring(5).trim();
          if (payload === '[DONE]') return;
          try { var j = JSON.parse(payload); if (j.choices && j.choices[0]) { if (j.choices[0].delta && j.choices[0].delta.content) dataFullContent += j.choices[0].delta.content; if (j.choices[0].finish_reason) finishReason = j.choices[0].finish_reason; } } catch (e) { }
        });
        return pump();
      });
    }
    return pump();
  }).catch(function (err) { console.error('数据Agent错误:', err); dataDone = true; checkBothDone(); });

  // Agent B：地图
  fetch(apiUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: apiModel, messages: mapMessages, temperature: 0.7, max_tokens: 8192, stream: true })
  }).then(function (res) {
    if (!res.ok) throw new Error('地图Agent请求失败: ' + res.status);
    var reader = res.body.getReader();
    function pump() {
      return reader.read().then(function (result) {
        if (result.done) { mapDone = true; console.warn('[DualAgent] 地图Agent完成'); checkBothDone(); return; }
        var chunk = decoder.decode(result.value, { stream: true });
        var lines = chunk.split('\n');
        lines.forEach(function (line) {
          line = line.trim();
          if (!line || !line.startsWith('data:')) return;
          var payload = line.substring(5).trim();
          if (payload === '[DONE]') return;
          try { var j = JSON.parse(payload); if (j.choices && j.choices[0]) { if (j.choices[0].delta && j.choices[0].delta.content) mapFullContent += j.choices[0].delta.content; if (j.choices[0].finish_reason) finishReason = j.choices[0].finish_reason; } } catch (e) { }
        });
        return pump();
      });
    }
    return pump();
  }).catch(function (err) { console.error('地图Agent错误:', err); mapDone = true; checkBothDone(); });

  function finishStart() {
    if (finishReason === 'length' && statusEl) statusEl.textContent += ' ⚠️ 响应可能被截断，正在修复...';
    if (!fullContent) throw new Error('AI返回内容为空');
    displayTokenInfo({ prompt_tokens: 0, completion_tokens: 0 });
    // 先提取city_map（可能是简单文本格式），然后从fullContent中移除
    var cityMapData2 = null;
    var cmMatch2 = /===city_map===\s*([\s\S]*?)\s*===end===/.exec(fullContent);
    if (cmMatch2) {
      cityMapData2 = parseSimpleMapFormat(cmMatch2[1].trim());
      fullContent = fullContent.replace(/===city_map===[\s\S]*?===end===/, '');
    }
    // 解析JSON - 多策略提取（含截断修复）
    var newState;
    try { newState = extractJSON(fullContent); } catch (parseErr) {
      console.warn('首次解析失败，尝试截断修复:', parseErr.message);
      try { newState = extractJSON(fullContent); } catch (e2) { throw new Error('JSON解析失败：' + e2.message); }
    }
    // 检查并补全缺失字段
    var missingFields = [];
    var requiredFields = ['header', 'macro', 'demo', 'land', 'econ', 'fiscal', 'admin', 'council', 'city', 'npc', 'news'];
    requiredFields.forEach(function (f) { if (!newState[f]) missingFields.push(f); });
    if (missingFields.length > 0 || !newState.header || !newState.macro) {
      console.warn('开局返回缺失字段:', missingFields.length ? missingFields : '(header/macro)');
      // 用DEFAULT_STATE填充缺失的顶级字段
      var defaults = JSON.parse(JSON.stringify(DEFAULT_STATE));
      requiredFields.forEach(function (f) { if (!newState[f] && defaults[f]) newState[f] = defaults[f]; });
      if (!newState.city_map) { newState.city_map = cityMapData2 || {}; applyMapGridSize(newState); }
      if (!newState.next_actions) newState.next_actions = [];
      if (newState.macro && !newState.macro.mayor_name && newState.mayor) newState.macro.mayor_name = newState.mayor.name;
    }
    // 深拷贝替换gameState
    gameState = JSON.parse(JSON.stringify(newState));
    _prevGameTimeStr = ''; // 新游戏：重置新闻时间追踪，首回合全部更新
    // 开局后清除数据缺失检测，避免立即触发补全
    _missingDataFields = [];
    // 重置回合计数和记忆
    turnCount = 0;
    historyDecisions = [];
    fullHistory = [];
    chartData = { labels: ['初始'], gdp: [gameState.macro.total_gdp || 3.2], support: [gameState.macro.mayor_support || 65] };
    lastChartMonth = '';
    popGrowthHistory = [];
    shortTermMemory = [];
    longTermMemory = [];
    lastUserMessage = null;
    lastAssistantMessage = null;
    // 先更新NPC世界书（确保renderAll时面板能显示世界书数据）
    worldBook = [];
    updateWorldBook();
    // 储存回合0的完整AI响应作为lastAssistantMessage
    lastAssistantMessage = { role: 'assistant', content: fullContent };
    // 保存
    saveGame();
    renderAll();
    recordPopGrowth();
    maybeUpdateMonthlyChart();
    // 关闭开局面板
    document.getElementById('start-panel').style.display = 'none';
    // 显示成功提示
    var toast = document.getElementById('ply-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ply-toast';
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2d5016;color:white;padding:12px 24px;border-radius:8px;z-index:200;font-weight:bold;transition:opacity 0.5s';
      document.body.appendChild(toast);
    }
    toast.textContent = '✅ 城市加载完毕！欢迎上任，' + (gameState.header.mayor_name || '市长') + '阁下！';
    toast.style.opacity = '1';
    setTimeout(function () { toast.style.opacity = '0'; }, 4000);
    // 启用刷新按钮
    var refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      refreshBtn.className = refreshBtn.className + ' hover:opacity-80';
      refreshBtn.title = '重新生成开局城市状态';
    }
    var panelRefreshBtn = document.getElementById('start-btn-refresh');
    if (panelRefreshBtn) panelRefreshBtn.style.display = '';
    checkDailyUpdates();
  }
}

// ==================== 数据缺失追踪 ====================
var _missingDataFields = []; // 记录缺失的数据字段

// 检查数据是否为空（空对象、空数组、空字符串、null、undefined）
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

// 检查游戏状态数据完整性
function checkDataCompleteness() {
  var missing = [];
  var requiredFields = [
    { key: 'header', check: function (s) { return !s.header || isEmpty(s.header.time); }, label: '基本信息(header)' },
    { key: 'macro', check: function (s) { return !s.macro; }, label: '宏观经济(macro)' },
    { key: 'demo', check: function (s) { return !s.demo || isEmpty(s.demo.population); }, label: '人口民生(demo)' },
    { key: 'land', check: function (s) { return !s.land; }, label: '土地环境(land)' },
    { key: 'econ', check: function (s) { return !s.econ || isEmpty(s.econ.facilities); }, label: '产业经济(econ)' },
    { key: 'fiscal', check: function (s) { return !s.fiscal; }, label: '财政收支(fiscal)' },
    { key: 'admin', check: function (s) { return !s.admin || isEmpty(s.admin.districts); }, label: '行政管理(admin)' },
    { key: 'council', check: function (s) { return !s.council || isEmpty(s.council.groups); }, label: '议会派系(council)' },
    { key: 'city', check: function (s) { return !s.city; }, label: '城市信息(city)' },
    { key: 'npc', check: function (s) { return !s.npc || !Array.isArray(s.npc) || s.npc.length === 0; }, label: 'NPC人物(npc)' },
    { key: 'mayor', check: function (s) { return !s.mayor || isEmpty(s.mayor.name); }, label: '市长信息(mayor)' },
    { key: 'news', check: function (s) { return !s.news; }, label: '新闻(news)' },
    { key: 'narrative', check: function (s) { return isEmpty(s.narrative); }, label: '叙事(narrative)' },
    { key: 'next_actions', check: function (s) { return !s.next_actions || !Array.isArray(s.next_actions) || s.next_actions.length === 0; }, label: '后续行动(next_actions)' }
  ];

  requiredFields.forEach(function (field) {
    if (field.check(gameState)) {
      missing.push(field.label);
    }
  });

  _missingDataFields = missing;
  return missing;
}

// 获取数据缺失提示（用于发送给AI）
function getMissingDataPrompt() {
  if (_missingDataFields.length === 0) return '';
  return '\n\n# 数据补全指令\n检测到以下数据字段缺失或不完整：[' + _missingDataFields.join('、') + ']\n**请在本次响应中完整生成这些缺失字段的数据**，确保每个字段都有合理的内容。';
}

// ==================== JSON 合并 ====================
// 财政项目增量合并：保留未失效的旧条目，更新/添加新条目
// 失效状态：已结束、已完成、失效、终止、取消、撤销
var FISCAL_INVALID_STATUS = ['已结束', '已完成', '失效', '终止', '取消', '撤销', 'expired', 'completed', 'cancelled', 'terminated'];
function isFiscalItemInvalid(item) {
  if (!item || !item.status) return false;
  var st = (item.status || '').toLowerCase();
  for (var i = 0; i < FISCAL_INVALID_STATUS.length; i++) {
    if (st.indexOf(FISCAL_INVALID_STATUS[i].toLowerCase()) !== -1) return true;
  }
  return false;
}
function mergeFiscalItems(oldItems, newItems) {
  if (!Array.isArray(newItems)) return oldItems || [];
  if (!Array.isArray(oldItems)) return newItems;
  // 结果数组：先保留未失效的旧条目
  var result = [];
  var oldMap = {}; // name -> item 映射
  for (var i = 0; i < oldItems.length; i++) {
    var oldItem = oldItems[i];
    if (!oldItem) continue;
    var name = oldItem.name || '';
    if (name) oldMap[name] = oldItem;
    // 保留未失效的旧条目
    if (!isFiscalItemInvalid(oldItem)) {
      result.push(oldItem);
    }
  }
  // 处理新条目：更新同名条目或添加新条目
  for (var j = 0; j < newItems.length; j++) {
    var newItem = newItems[j];
    if (!newItem) continue;
    var newName = newItem.name || '';
    if (!newName) continue;
    // 检查是否已存在同名条目
    var existingIdx = -1;
    for (var k = 0; k < result.length; k++) {
      if (result[k] && result[k].name === newName) {
        existingIdx = k;
        break;
      }
    }
    if (existingIdx >= 0) {
      // 更新同名条目（替换旧数据）
      result[existingIdx] = newItem;
    } else {
      // 添加新条目（如果未失效）
      if (!isFiscalItemInvalid(newItem)) {
        result.push(newItem);
      }
    }
  }
  return result;
}

// NPC增量合并：保留旧NPC，更新同名NPC，添加新NPC
function mergeNPCs(oldNPCs, newNPCs) {
  if (!Array.isArray(newNPCs)) return oldNPCs || [];
  if (!Array.isArray(oldNPCs)) return newNPCs;
  var result = [];
  var oldMap = {};
  // 先保留所有旧NPC
  for (var i = 0; i < oldNPCs.length; i++) {
    var oldN = oldNPCs[i];
    if (!oldN || !oldN.name) continue;
    oldMap[oldN.name] = oldN;
    result.push(oldN);
  }
  // 处理新NPC：更新同名或添加新NPC
  for (var j = 0; j < newNPCs.length; j++) {
    var newN = newNPCs[j];
    if (!newN || !newN.name) continue;
    var existingIdx = -1;
    for (var k = 0; k < result.length; k++) {
      if (result[k] && result[k].name === newN.name) {
        existingIdx = k;
        break;
      }
    }
    if (existingIdx >= 0) {
      // 更新同名NPC（合并新旧属性，新属性优先）
      result[existingIdx] = Object.assign({}, result[existingIdx], newN);
    } else {
      // 添加新NPC
      result.push(newN);
    }
  }
  return result;
}

// 通用数组增量合并函数：按name字段匹配，更新同名项，添加新项，保留旧项
function mergeArrayByName(oldItems, newItems, options) {
  if (!Array.isArray(newItems)) return oldItems || [];
  if (!Array.isArray(oldItems)) return newItems;
  options = options || {};
  var nameField = options.nameField || 'name';
  var result = [];
  var oldMap = {};
  // 先保留所有旧项
  for (var i = 0; i < oldItems.length; i++) {
    var oldItem = oldItems[i];
    if (!oldItem) continue;
    var key = oldItem[nameField];
    if (key) oldMap[key] = oldItem;
    result.push(oldItem);
  }
  // 处理新项：更新同名或添加新项
  for (var j = 0; j < newItems.length; j++) {
    var newItem = newItems[j];
    if (!newItem) continue;
    var newKey = newItem[nameField];
    if (!newKey) continue;
    var existingIdx = -1;
    for (var k = 0; k < result.length; k++) {
      if (result[k] && result[k][nameField] === newKey) {
        existingIdx = k;
        break;
      }
    }
    if (existingIdx >= 0) {
      // 更新同名项（合并新旧属性，新属性优先）
      result[existingIdx] = Object.assign({}, result[existingIdx], newItem);
    } else {
      // 添加新项
      result.push(newItem);
    }
  }
  return result;
}

function mergeState(newData) {
  if (!newData || typeof newData !== 'object') return;

  // 深度合并 header，只合并非空属性
  if (newData.header && typeof newData.header === 'object') {
    Object.keys(newData.header).forEach(function (key) {
      if (newData.header[key] != null && !isEmpty(newData.header[key])) {
        gameState.header[key] = newData.header[key];
      }
    });
  }

  // 只有当新数据非空时才替换
  if (newData.narrative && !isEmpty(newData.narrative)) gameState.narrative = newData.narrative;

  // 深度合并 macro、demo、land，只合并非空属性
  if (newData.macro && typeof newData.macro === 'object') {
    Object.keys(newData.macro).forEach(function (key) {
      if (newData.macro[key] != null && !isEmpty(newData.macro[key])) {
        gameState.macro[key] = newData.macro[key];
      }
    });
  }
  if (newData.demo && typeof newData.demo === 'object') {
    Object.keys(newData.demo).forEach(function (key) {
      if (newData.demo[key] != null && !isEmpty(newData.demo[key])) {
        gameState.demo[key] = newData.demo[key];
      }
    });
  }
  if (newData.land && typeof newData.land === 'object') {
    Object.keys(newData.land).forEach(function (key) {
      if (newData.land[key] != null && !isEmpty(newData.land[key])) {
        gameState.land[key] = newData.land[key];
      }
    });
  }

  if (newData.econ && typeof newData.econ === 'object') {
    // 增量合并经济数据中的数组字段
    if (newData.econ.facilities && Array.isArray(newData.econ.facilities)) gameState.econ.facilities = mergeArrayByName(gameState.econ.facilities || [], newData.econ.facilities);
    if (newData.econ.exports && Array.isArray(newData.econ.exports)) gameState.econ.exports = mergeArrayByName(gameState.econ.exports || [], newData.econ.exports);
    if (newData.econ.imports && Array.isArray(newData.econ.imports)) gameState.econ.imports = mergeArrayByName(gameState.econ.imports || [], newData.econ.imports);
    if (newData.econ.classes && Array.isArray(newData.econ.classes)) gameState.econ.classes = mergeArrayByName(gameState.econ.classes || [], newData.econ.classes);
  }

  if (newData.fiscal && typeof newData.fiscal === 'object') {
    if (newData.fiscal.total_expense != null && !isEmpty(newData.fiscal.total_expense)) gameState.fiscal.total_expense = newData.fiscal.total_expense;
    if (newData.fiscal.total_income != null && !isEmpty(newData.fiscal.total_income)) gameState.fiscal.total_income = newData.fiscal.total_income;
    // 增量更新：合并新旧条目，保留未失效的旧条目
    if (newData.fiscal.expense_items && Array.isArray(newData.fiscal.expense_items)) {
      gameState.fiscal.expense_items = mergeFiscalItems(gameState.fiscal.expense_items || [], newData.fiscal.expense_items);
    }
    if (newData.fiscal.income_items && Array.isArray(newData.fiscal.income_items)) {
      gameState.fiscal.income_items = mergeFiscalItems(gameState.fiscal.income_items || [], newData.fiscal.income_items);
    }
  }

  if (newData.admin && typeof newData.admin === 'object') {
    // 增量合并行政管理数据中的数组字段
    if (newData.admin.districts && Array.isArray(newData.admin.districts)) gameState.admin.districts = mergeArrayByName(gameState.admin.districts || [], newData.admin.districts);
    if (newData.admin.departments && Array.isArray(newData.admin.departments)) gameState.admin.departments = mergeArrayByName(gameState.admin.departments || [], newData.admin.departments);
    if (newData.admin.projects && Array.isArray(newData.admin.projects)) gameState.admin.projects = mergeArrayByName(gameState.admin.projects || [], newData.admin.projects);
    if (newData.admin.civil_servants != null && !isEmpty(newData.admin.civil_servants)) gameState.admin.civil_servants = newData.admin.civil_servants;
    if (newData.admin.admin_load != null && !isEmpty(newData.admin.admin_load)) gameState.admin.admin_load = newData.admin.admin_load;
    if (newData.admin.corruption != null && !isEmpty(newData.admin.corruption)) gameState.admin.corruption = newData.admin.corruption;
  }

  if (newData.council && typeof newData.council === 'object') {
    // 增量合并议会派系数据
    if (newData.council.groups && Array.isArray(newData.council.groups)) {
      gameState.council.groups = mergeArrayByName(gameState.council.groups || [], newData.council.groups);
    }
  }

  if (newData.city && typeof newData.city === 'object') {
    if (newData.city.face && !isEmpty(newData.city.face)) gameState.city.face = newData.city.face;
    if (newData.city.geo_text && !isEmpty(newData.city.geo_text)) gameState.city.geo_text = newData.city.geo_text;
    if (newData.city.election && !isEmpty(newData.city.election)) gameState.city.election = newData.city.election;
    if (newData.city.housing && !isEmpty(newData.city.housing)) gameState.city.housing = newData.city.housing;
    if (newData.city.culture && !isEmpty(newData.city.culture)) gameState.city.culture = newData.city.culture;
    if (newData.city.policies && Array.isArray(newData.city.policies) && newData.city.policies.length > 0) gameState.city.policies = newData.city.policies;
  }

  if (newData.city_map && !isEmpty(newData.city_map)) mergeCityMap(newData.city_map);
  if (newData.city_map_new_regions && Array.isArray(newData.city_map_new_regions) && newData.city_map_new_regions.length > 0) applyNewRegions(newData.city_map_new_regions);
  if (newData.city_map_remove_regions && Array.isArray(newData.city_map_remove_regions) && newData.city_map_remove_regions.length > 0) removeRegions(newData.city_map_remove_regions);
  if (newData.city_map_new_landmarks && Array.isArray(newData.city_map_new_landmarks) && newData.city_map_new_landmarks.length > 0) applyNewLandmarks(newData.city_map_new_landmarks);
  if (newData.city_map_new_legend && typeof newData.city_map_new_legend === 'object') mergeMapLegend(newData.city_map_new_legend);
  if (newData.city_map_new_districts && Array.isArray(newData.city_map_new_districts) && newData.city_map_new_districts.length > 0) applyNewDistricts(newData.city_map_new_districts);
  if (newData.city_map_remove_districts && Array.isArray(newData.city_map_remove_districts) && newData.city_map_remove_districts.length > 0) removeDistricts(newData.city_map_remove_districts);

  // NPC增量合并：保留旧NPC，更新同名NPC，添加新NPC
  if (newData.npc && Array.isArray(newData.npc)) {
    gameState.npc = mergeNPCs(gameState.npc || [], newData.npc);
  }
  // 合并新闻数据，保留未更新的新闻
  if (newData.news && typeof newData.news === 'object') {
    Object.keys(newData.news).forEach(function (key) {
      if (newData.news[key] && !isEmpty(newData.news[key])) {
        gameState.news[key] = newData.news[key];
      }
    });
  }
  if (newData.notes && !isEmpty(newData.notes)) gameState.notes = newData.notes;

  if (newData.turn_summary && !isEmpty(newData.turn_summary)) gameState.turn_summary = newData.turn_summary;
  if (newData.next_actions && Array.isArray(newData.next_actions) && newData.next_actions.length > 0) gameState.next_actions = newData.next_actions;
  if (typeof newData.game_over === 'boolean') gameState.game_over = newData.game_over;

  // 检查合并后的数据完整性
  var missing = checkDataCompleteness();
  if (missing.length > 0) {
    logWarn('数据合并后检测到缺失字段: ' + missing.join(', '));
  }
}

// ==================== AI 调用 ====================
async function callAI(decision) {
  // 智能模式：分析复杂度，选择模型，按需发送数据
  var analysis = null;
  var partialState = null;
  var selectedModel = null;
  var isPartialMode = false;
  if (smartMode) {
    analysis = analyzeComplexity(decision);
    selectedModel = analysis.useFlash ? flashModel : proModel;
    // 只要选中类别少于总非always类别数，就启用partial模式
    var totalCats = Object.keys(DATA_CATEGORIES).length;
    var alwaysCats = Object.keys(DATA_CATEGORIES).filter(function (k) { return DATA_CATEGORIES[k].always; });
    var selectedCats = analysis.categories;
    var excludedCount = totalCats - selectedCats.length;
    // 排除≥1个非always类别就启用partial（更激进）
    if (excludedCount >= 1) {
      partialState = serializePartialState(selectedCats);
      isPartialMode = true;
      logDebug('Partial模式 启用: 选中' + selectedCats.length + '/' + totalCats + '类 排除' + excludedCount + '类 [' + getExcludedCats(selectedCats).join(',') + ']');
    } else {
      logDebug('Partial模式 未启用: 全部' + totalCats + '类均命中');
    }
  }
  const c = getConfig();
  if (!c.key) { toggleSettings(); throw new Error('请先配置API Key'); }
  // 构建要发送的state（partial或full），排除沉浸感字段
  var rawState = partialState || gameState;
  var sendState = prepareStateForSend(rawState);
  var stateJson = JSON.stringify(sendState, null, 2);
  var rawJsonLen = JSON.stringify(rawState).length;
  // 关键：保存上一回合的时间，把两个时间都传递给AI，让AI自己判断
  var prevTimeForAI = _prevGameTimeStr;
  var currentTimeForAI = gameState.header.time || '';
  var newsInstruction = '\n\n# 新闻更新指令\n上一回合游戏时间：' + (prevTimeForAI || '无') + '\n当前游戏时间：' + (currentTimeForAI || '未知') + '\n\n请对比这两个时间，判断哪些媒体需要更新内容：\n1. city_official（市属媒体）：每天8:00更新\n2. foreign（外国媒体）：每天12:00更新\n3. social（社会媒体）：每天6:00、9:00、12:00、15:00、18:00、21:00更新\n4. radio（民间电台）：每天0:00、6:00、12:00、18:00更新\n\n如果从上一回合时间到当前时间跨越了某个媒体的更新时间点，你必须为该媒体生成全新内容；如果未跨越，你必须完全保留该媒体上一回合的内容（标题、正文、secretary_note全部原样不变）。';
  logInfo('新闻指令: 让AI自己对比时间 ' + prevTimeForAI + ' → ' + currentTimeForAI);
  var memoryContext = buildMemoryContext();
  var mapContext = buildMapContext();
  var mapUpdateInst = buildMapUpdateInstruction();
  let sysContent = SYSTEM_PROMPT + (memoryContext ? '\n\n' + memoryContext : '') + newsInstruction + mapContext + mapUpdateInst;
  if (isPartialMode) {
    sysContent += '\n\n# 增量更新模式\n当前仅发送了玩家决策相关的数据类别（news/radio等沉浸感字段已排除，不发送上一轮值）。请返回JSON时：\n1. 只返回你收到的数据类别中**实际发生变化**的字段\n2. 未变化的字段无需返回\n3. narrative、news、next_actions、turn_summary、secretary_reminder 必须返回新值（news虽未发送旧值，但你需根据游戏时间判断是否更新）\n4. next_actions必须每回合重新生成4个新推荐\n5. 不要返回完整gameState，只返回变化部分';
  } else {
    sysContent += '\n\n# 增量更新建议\n为节省token，你只需返回实际发生变化的字段。未变化的数据无需重复返回。narrative/news/next_actions/turn_summary必须返回新值（news字段未发送旧值，请根据游戏时间自行判断更新）。';
  }
  if (customPrompt) sysContent += '\n\n# 玩家自定义指令\n' + customPrompt;

  // 添加日程更新指令（跨天更新）
  var schedulePrompt = getScheduleUpdatePrompt(prevTimeForAI, currentTimeForAI);
  if (schedulePrompt) {
    sysContent += schedulePrompt;
    logInfo('跨天检测：需要更新日程安排');
  }

  // 检查数据缺失并添加补全指令
  var missingPrompt = getMissingDataPrompt();
  if (missingPrompt) {
    sysContent += missingPrompt;
    // 如果有数据缺失，强制关闭partial模式，要求AI完整生成
    isPartialMode = false;
    logInfo('检测到数据缺失，强制完整模式');
  }

  let messages = [
    { role: 'system', content: sysContent }
  ];
  // 前2轮完整对话记忆（完整状态JSON + 完整AI响应）
  if (lastUserMessage && lastAssistantMessage) {
    messages.push(lastUserMessage);
    messages.push(lastAssistantMessage);
  }
  var mapEmptyNotice = buildMapEmptyNotice();
  var userPrompt;
  if (isPartialMode) {
    userPrompt = '【局部城市状态JSON】\n' + stateJson + '\n\n【市长决策】\n' + decision + '\n\n仅返回收到数据类别的字段更新。' + mapEmptyNotice;
  } else {
    userPrompt = '【城市状态JSON】\n' + stateJson + '\n\n【市长决策】\n' + decision + '\n\n' + (missingPrompt ? '请完整生成所有缺失字段的数据。' : '仅输出变化字段，未变化省略。') + mapEmptyNotice;
  }
  messages.push({ role: 'user', content: userPrompt });
  var modelToUse = selectedModel || c.model;
  // Token明细日志
  var sysTokens = estimateTokens(sysContent);
  var stateTokens = estimateTokens(stateJson);
  var memTokens = estimateTokens(memoryContext);
  var histTokens = 0;
  if (lastUserMessage) histTokens += estimateTokens(lastUserMessage.content || '');
  if (lastAssistantMessage) histTokens += estimateTokens(lastAssistantMessage.content || '');
  logAI('Token明细: system=' + sysTokens + ' state=' + stateTokens + '(排除news,原始' + rawJsonLen + '字符) memory=' + memTokens + ' history=' + histTokens
    + ' 总输入≈' + (sysTokens + stateTokens + memTokens + histTokens)
    + ' | 模型=' + modelToUse
    + (smartMode ? ' 智能=' + (isPartialMode ? 'PARTIAL(' + analysis.categories.length + '类)' : 'FULL') : ''));
  var resp = await fetch(c.url + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelToUse, messages, temperature: 0.8, max_tokens: 24576, stream: true })
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    var errMsg = e.error?.message || 'API请求失败: HTTP ' + resp.status;
    logError('API错误 HTTP' + resp.status + ' ' + errMsg);
    throw new Error(errMsg);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let streamUsage = null;
  // 流式正文提取状态机
  var _streamState = 0; // 0=等待narrative键, 1=在值内累积, 2=narrative已结束
  var _streamBuf = '';   // 当前累积的narrative文本
  var _streamEsc = false; // 是否在上一个转义符后
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            // 逐字符状态机：从流中实时提取narrative文本
            for (var ci = 0; ci < content.length; ci++) {
              var ch = content.charAt(ci);
              if (_streamState === 0) {
                // 检测 "narrative":
                if (_streamBuf.length > 9 && _streamBuf.slice(-10) === 'narrative') {
                  _streamBuf = '';
                }
                if (ch === '"') {
                  if (_streamBuf.slice(-10) === 'narrative' || fullContent.match(/"narrative"\s*:\s*"$/)) {
                    _streamState = 1;
                    _streamBuf = '';
                    continue;
                  }
                }
              }
              if (_streamState === 1) {
                if (_streamEsc) { _streamBuf += ch; _streamEsc = false; continue; }
                if (ch === '\\') { _streamEsc = true; continue; }
                if (ch === '"') { _streamState = 2; continue; }
                _streamBuf += ch;
              }
            }
            // 实时渲染已提取的narrative（每50ms最多更新一次，避免DOM频繁操作）
            if (_streamState >= 1 && _streamBuf.length > 0) {
              renderStreamNarrative(_streamBuf);
            }
            updateStatus(fullContent);
          }
          if (json.usage) streamUsage = json.usage;
        } catch (e) { }
      }
    }
  }
  // 显示token用量 + 智能模式信息
  var tokenMsg = '';
  if (smartMode && selectedModel) {
    tokenMsg = ' [' + (analysis.useFlash ? '⚡Flash:' : '🔮Pro:') + selectedModel + ' | 复杂度:' + latestComplexity + ']';
    logAI('模型路由: ' + (analysis.useFlash ? 'Flash(' + flashModel + ')' : 'Pro(' + proModel + ')') + ' 复杂度=' + latestComplexity + ' 类别=' + latestCategories.join(','));
  }
  logAI('响应完成 ' + fullContent.length + '字符(' + estimateTokens(fullContent) + 'tok)' + (streamUsage ? ' API=' + streamUsage.total_tokens + 'tokens' : ''));
  displayTokenInfo(streamUsage);
  var tokenEl = document.getElementById('token-info');
  if (tokenEl && tokenMsg) tokenEl.textContent = (tokenEl.textContent || '') + tokenMsg;
  const result = extractJSON(fullContent);
  // 前2轮对话记忆
  lastUserMessage = { role: 'user', content: userPrompt };
  lastAssistantMessage = { role: 'assistant', content: fullContent };
  return result;
}
// 流式正文渲染（节流50ms，避免DOM频繁操作）
var _streamRenderTimer = null;
var _lastStreamText = '';
function renderStreamNarrative(text) {
  if (text === _lastStreamText) return;
  _lastStreamText = text;
  if (_streamRenderTimer) return;
  _streamRenderTimer = setTimeout(function () {
    _streamRenderTimer = null;
    var el = document.getElementById('narrative-box');
    if (!el) return;
    // 处理转义：\\n → 换行，\\" → "，\\t → tab等
    var html = _lastStreamText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\\n/g, '<br>').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/\\"/g, '"');
    el.innerHTML = '<span class="text-gray-800">' + html + '</span><span class="inline-block w-0.5 h-4 bg-amber-600 animate-pulse ml-0.5"></span>';
    // 自动滚动到底部
    var scrollEl = document.getElementById('narrative-scroll');
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }, 50);
}
function updateStatus(content) {
  const el = document.getElementById('ai-status-text');
  if (!el) return;
  if (content.includes('"macro"')) el.textContent = '正在更新宏观经济数据...';
  else if (content.includes('"narrative"')) el.textContent = '正在生成叙事报告...';
  else el.textContent = 'AI 正在推演城市发展...';
}

// ==================== 决策提交 ====================
async function submitDecisionInternal(decisionText) {
  if (isProcessing) return;
  const rawInput = document.getElementById('decision-input').value;
  const input = decisionText || rawInput.trim();
  if (!input) { alert('请输入决策内容'); return; }
  // 保存原始输入内容，JSON解析失败时恢复
  const savedInput = rawInput;
  isProcessing = true;
  const btn = document.getElementById('btn-submit');
  btn.disabled = true; btn.textContent = '⏳ 处理中...';
  // 禁用刷新按钮
  var refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.className = refreshBtn.className.replace('hover:opacity-80', ''); refreshBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
  document.getElementById('ai-status').classList.remove('hidden');
  document.getElementById('narrative-box').innerHTML = '<p class="text-gray-500 typing-cursor">AI 正在模拟城市演变...</p>';
  if (!decisionText) document.getElementById('decision-input').value = '';
  // 保存快照，供刷新使用
  var oldTime = gameState.header.time || ''; // 保存调用AI之前的时间
  refreshSnapshot = {
    gameState: JSON.parse(JSON.stringify(gameState)),
    turnCount: turnCount,
    shortLen: shortTermMemory.length,
    fullLen: fullHistory.length,
    histLen: historyDecisions.length,
    chartLabelsLen: chartData.labels.length,
    chartGdpLen: chartData.gdp.length,
    chartSupLen: chartData.support.length,
    lastUser: lastUserMessage ? JSON.parse(JSON.stringify(lastUserMessage)) : null,
    lastAssistant: lastAssistantMessage ? JSON.parse(JSON.stringify(lastAssistantMessage)) : null,
    decision: input,
    prevTime: _prevGameTimeStr // 保存新闻时间追踪，刷新时回滚
  };
  try {
    const result = await callAI(input);
    mergeState(result);
    _prevGameTimeStr = oldTime; // 关键：回合结束后，才保存旧时间用于下一轮对比
    var na = result.next_actions;
    logInfo('回合' + (turnCount + 1) + '处理完成 next_actions=' + (na ? na.length + '条[' + (na[0] || '').substring(0, 25) + '...]' : '未返回') + ' 决策=' + input.substring(0, 40));
    turnCount++;
    if (result.turn_summary) {
      addToShortTermMemory(result.turn_summary, turnCount, gameState.header.time);
    }
    historyDecisions.unshift({ turn: turnCount, decision: input.substring(0, 80), time: gameState.header.time });
    if (historyDecisions.length > 50) historyDecisions.pop();
    // 存入完整历史
    fullHistory.push({
      turn: turnCount,
      time: gameState.header.time,
      decision: input,
      narrative: gameState.narrative,
      news: JSON.parse(JSON.stringify(gameState.news))
    });
    checkHistoryLimit();
    recordPopGrowth();
    // 更新NPC世界书（必须在renderAll之前，确保面板显示世界书数据）
    updateWorldBook();
    saveGame();
    renderAll();
    maybeUpdateMonthlyChart();
    document.getElementById('ai-status').classList.add('hidden');
    // 启用刷新按钮
    var refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      if (refreshBtn.className.indexOf('hover:opacity-80') === -1) refreshBtn.className = refreshBtn.className + ' hover:opacity-80';
    }
    if (gameState.game_over) {
      logWarn('游戏结束触发！');
      document.getElementById('narrative-box').innerHTML += '<div class="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg text-center font-bold text-red-700">⚠️ 游戏结束！请点击"🔄 新游戏"重新开始。</div>';
    }
  } catch (e) {
    logError('回合处理失败: ' + e.message);
    document.getElementById('narrative-box').innerHTML = '<p class="text-red-600">错误: ' + e.message + '</p><p class="text-gray-600 mt-2 text-sm">请检查API设置或网络连接后重试</p>';
    document.getElementById('ai-status-text').textContent = '❌ ' + e.message;
    // 恢复玩家输入内容
    if (savedInput !== undefined) document.getElementById('decision-input').value = savedInput;
  } finally {
    isProcessing = false;
    btn.disabled = false; btn.textContent = '⏭️ 结束回合';
    checkDailyUpdates();
  }
}
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showToast('已复制到剪贴板');
    }).catch(function () { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('已复制到剪贴板'); } catch (e) { /* ignore */ }
  document.body.removeChild(ta);
}
// ==================== 运行日志系统 ====================
var _logs = [];
var _logFilter = 'all';
var MAX_LOGS = 500;
function getTimeStr() {
  var d = new Date();
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + (d.getMilliseconds() + '00').substring(0, 3);
}
function log(level, message) {
  var entry = { time: getTimeStr(), level: level, message: message };
  _logs.push(entry);
  if (_logs.length > MAX_LOGS) _logs.shift();
  renderLogPanel();
}
var _logRenderTimer = null;
function renderLogPanel() {
  if (_logRenderTimer) return;
  _logRenderTimer = setTimeout(function () {
    _logRenderTimer = null;
    var panel = document.getElementById('log-panel');
    if (!panel || panel.style.display === 'none') return;
    var container = document.getElementById('log-content');
    if (!container) return;
    var filtered = _logFilter === 'all' ? _logs : _logs.filter(function (l) { return l.level === _logFilter; });
    var levelColors = { info: '#6a9955', warn: '#ce9178', error: '#f44747', debug: '#569cd6', ai: '#c586c0' };
    var levelIcons = { info: 'ℹ', warn: '⚠', error: '❌', debug: '🔍', ai: '🤖' };
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var l = filtered[i];
      html += '<div style="line-height:1.5"><span style="color:#888">' + l.time + '</span> <span style="color:' + (levelColors[l.level] || '#888') + '">' + (levelIcons[l.level] || '') + ' ' + l.message + '</span></div>';
    }
    container.innerHTML = html || '<div style="color:#666">暂无日志</div>';
    container.scrollTop = container.scrollHeight;
    var countEl = document.getElementById('log-count');
    if (countEl) countEl.textContent = '(' + _logs.length + '条)';
  }, 100);
}
function toggleLogPanel() {
  var panel = document.getElementById('log-panel');
  if (!panel) return;
  var isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    document.getElementById('btn-toggle-log').style.bottom = '224px';
    renderLogPanel();
  } else {
    document.getElementById('btn-toggle-log').style.bottom = '24px';
  }
}
function applyLogFilter() {
  var sel = document.getElementById('log-level-filter');
  _logFilter = sel ? sel.value : 'all';
  renderLogPanel();
}
function clearLogs() {
  _logs = [];
  renderLogPanel();
}
function copyLogs() {
  var filtered = _logFilter === 'all' ? _logs : _logs.filter(function (l) { return l.level === _logFilter; });
  var text = filtered.map(function (l) { return '[' + l.time + '] ' + l.message; }).join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast('日志已复制到剪贴板'); }).catch(function () { });
  }
}
// 便捷方法
function logInfo(msg) { log('info', msg); }
function logWarn(msg) { log('warn', msg); }
function logError(msg) { log('error', msg); }
function logDebug(msg) { log('debug', msg); }
function logAI(msg) { log('ai', msg); }
function showToast(msg) {
  var el = document.getElementById('toast-msg');
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateY(0)';
  setTimeout(function () {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
  }, 1500);
}
window.copyToClipboard = copyToClipboard;
function renderNextActions() {
  var el = document.getElementById('next-actions');
  if (!el) return;
  var actions = gameState.next_actions;
  if (!actions || !actions.length || typeof actions.forEach !== 'function') { el.innerHTML = ''; return; }
  var colors = ['border-l-amber-600', 'border-l-emerald-600', 'border-l-blue-600', 'border-l-purple-600'];
  var bgColors = ['bg-amber-50', 'bg-emerald-50', 'bg-blue-50', 'bg-purple-50'];
  var html = '<div class="text-xs text-gray-500 mb-1">💡 点击选项自动填入决策框（可编辑后提交）</div>';
  actions.forEach(function (a, i) {
    var safe = a.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    html += '<div class="flex items-center gap-1 ' + bgColors[i % 4] + ' hover:brightness-95 border-l-4 ' + colors[i % 4] + ' rounded-r-lg p-2 transition-colors cursor-pointer group" onclick="chooseNextAction(\'' + safe + '\')">';
    html += '<span class="flex-1 text-sm text-gray-700">' + (i + 1) + '. ' + a + '</span>';
    html += '<button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#8b5a2b] transition-opacity shrink-0" title="复制到剪贴板" onclick="event.stopPropagation();copyToClipboard(\'' + safe + '\')"><i class="fa fa-copy"></i></button>';
    html += '</div>';
  });
  el.innerHTML = html;
}
function refreshTurn() {
  if (isProcessing) return;
  var s = refreshSnapshot;
  if (!s) {
    if (!gameState || !gameState.header || gameState.header.time === '等待生成...' || turnCount < 1) {
      if (!confirm('当前没有可刷新的回合数据。是否重新开始新游戏？')) return;
      resetGameInternal(false);
      return;
    }
    var lastDecision = historyDecisions.length > 0 ? historyDecisions[0].decision : '';
    if (!lastDecision) { alert('找不到上回合决策记录，无法刷新。'); return; }
    s = {
      isOpening: false,
      gameState: JSON.parse(JSON.stringify(gameState)),
      turnCount: turnCount,
      shortLen: shortTermMemory.length,
      fullLen: fullHistory.length,
      histLen: historyDecisions.length,
      chartLabelsLen: chartData.labels.length,
      chartGdpLen: chartData.gdp.length,
      chartSupLen: chartData.support.length,
      lastUser: lastUserMessage ? JSON.parse(JSON.stringify(lastUserMessage)) : null,
      lastAssistant: lastAssistantMessage ? JSON.parse(JSON.stringify(lastAssistantMessage)) : null,
      decision: lastDecision,
      prevTime: _prevGameTimeStr || ''
    };
  }
  if (s.isOpening) {
    if (!confirm('确定要重新生成开局城市状态吗？当前所有数据将被覆盖。')) return;
    refreshOpeningStart(s);
    return;
  }
  if (!confirm('确定要刷新本轮结果吗？将删除当前回合的所有数据，使用相同决策重新生成。')) return;

  // 保存当前内容，以便出错时恢复
  var narrativeBox = document.getElementById('narrative-box');
  var originalContent = narrativeBox ? narrativeBox.innerHTML : '';

  refreshSnapshot = s;
  gameState = JSON.parse(JSON.stringify(s.gameState));
  turnCount = s.turnCount;
  lastUserMessage = s.lastUser ? JSON.parse(JSON.stringify(s.lastUser)) : null;
  lastAssistantMessage = s.lastAssistant ? JSON.parse(JSON.stringify(s.lastAssistant)) : null;
  _prevGameTimeStr = s.prevTime || '';
  shortTermMemory = shortTermMemory.slice(0, s.shortLen);
  fullHistory = fullHistory.slice(0, s.fullLen);
  historyDecisions = historyDecisions.slice(0, s.histLen);
  chartData.labels = chartData.labels.slice(0, s.chartLabelsLen);
  chartData.gdp = chartData.gdp.slice(0, s.chartGdpLen);
  chartData.support = chartData.support.slice(0, s.chartSupLen);
  renderAll();
  logInfo('刷新本轮 回合=' + s.turnCount + ' 决策=' + s.decision.substring(0, 40));

  // 我们需要包装submitDecisionInternal，确保出错时恢复
  submitDecisionInternalWithRestore(s.decision, originalContent);
}

// 包装函数，在刷新时出错可以恢复内容
async function submitDecisionInternalWithRestore(decisionText, originalContent) {
  try {
    await submitDecisionInternal(decisionText);
  } catch (e) {
    // 如果出错，尝试恢复原有内容
    var narrativeBox = document.getElementById('narrative-box');
    if (narrativeBox && originalContent) {
      narrativeBox.innerHTML = originalContent;
    }
    throw e;
  }
}
function refreshOpeningFromPanel() {
  if (isProcessing) return;
  if (refreshSnapshot && refreshSnapshot.isOpening) {
    if (!confirm('确定要重新生成开局城市状态吗？当前所有数据将被覆盖。')) return;
    refreshOpeningStart(refreshSnapshot);
  } else {
    startLaunchGame();
  }
}
async function refreshOpeningStart(snapshot) {
  isProcessing = true;
  var refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.classList.add('opacity-50', 'cursor-not-allowed'); refreshBtn.className = refreshBtn.className.replace('hover:opacity-80', ''); }
  var btn = document.getElementById('btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ 重新生成开局...'; }
  document.getElementById('ai-status').classList.remove('hidden');
  document.getElementById('ai-status-text').textContent = '正在重新生成开局...';

  // 保存当前narrative-box的内容，以便失败时可以恢复
  var narrativeBox = document.getElementById('narrative-box');
  var originalContent = narrativeBox ? narrativeBox.innerHTML : '';
  narrativeBox.innerHTML = '<p class="text-gray-500 typing-cursor">AI 正在重新生成开局城市状态...</p>';

  try {
    // 使用最新的API配置，而不是依赖snapshot
    var c = getConfig();
    var apiUrl = c.url;
    var apiKey = c.key;
    var modelToUse = c.model;

    var resp = await fetch(apiUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model: modelToUse, messages: snapshot.messages, stream: true, temperature: 0.7, max_tokens: 32768 })
    });
    if (!resp.ok) throw new Error('API请求失败: ' + resp.status);
    var decoder2 = new TextDecoder();
    var reader2 = resp.body.getReader();
    var refContent = '';
    var refFinish = '';
    await (async function pumpRef() {
      while (true) {
        var r = await reader2.read();
        if (r.done) break;
        var chunk = decoder2.decode(r.value, { stream: true });
        chunk.split('\n').forEach(function (line) {
          line = line.trim(); if (!line || !line.startsWith('data:')) return;
          var p = line.substring(5).trim(); if (p === '[DONE]') return;
          try { var j = JSON.parse(p); if (j.choices && j.choices[0]) { if (j.choices[0].delta && j.choices[0].delta.content) refContent += j.choices[0].delta.content; if (j.choices[0].finish_reason) refFinish = j.choices[0].finish_reason; } } catch (e) { }
        });
      }
    })();
    if (!refContent) throw new Error('AI返回内容为空');
    displayTokenInfo({ prompt_tokens: 0, completion_tokens: 0 });
    var newState;
    try { newState = extractJSON(refContent); } catch (pe) { try { newState = extractJSON(refContent); } catch (e2) { throw new Error('JSON解析失败：' + e2.message); } }
    // 补全缺失字段
    var reqF = ['header', 'macro', 'demo', 'land', 'econ', 'fiscal', 'admin', 'council', 'city', 'npc', 'news'];
    var missing = []; reqF.forEach(function (f) { if (!newState[f]) missing.push(f); });
    if (missing.length > 0 || !newState.header || !newState.macro) {
      var dflt = JSON.parse(JSON.stringify(DEFAULT_STATE));
      reqF.forEach(function (f) { if (!newState[f] && dflt[f]) newState[f] = dflt[f]; });
      if (!newState.city_map) { newState.city_map = {}; applyMapGridSize(newState); }
      if (!newState.next_actions) newState.next_actions = [];
      if (newState.macro && !newState.macro.mayor_name && newState.mayor) newState.macro.mayor_name = newState.mayor.name;
    }
    gameState = JSON.parse(JSON.stringify(newState));
    turnCount = 0;
    historyDecisions = [];
    fullHistory = [];
    chartData = { labels: ['初始'], gdp: [gameState.macro.total_gdp || 3.2], support: [gameState.macro.mayor_support || 65] };
    lastChartMonth = '';
    popGrowthHistory = [];
    shortTermMemory = [];
    longTermMemory = [];
    lastUserMessage = null;
    lastAssistantMessage = { role: 'assistant', content: refContent };
    worldBook = [];
    updateWorldBook();
    saveGame();
    renderAll();
    recordPopGrowth();
    maybeUpdateMonthlyChart();
    // 延迟一帧确保DOM布局完成后重新初始化地图
    setTimeout(function () {
      console.warn('[地图] 重新生成开局 - 开始地图初始化...');
      // 调整Canvas尺寸
      if (typeof resizeCanvas === 'function') {
        try {
          resizeCanvas();
        } catch (e) { console.error('[地图] resizeCanvas失败:', e); }
      }
      // 从AI返回的terrain数据生成地图
      if (typeof loadTerrainFromAI === 'function') {
        var terrainData = null;
        if (gameState.city && gameState.city.terrain) {
          terrainData = gameState.city.terrain;
          console.warn('[地图] 从city.terrain加载布局数据');
        }
        if (!terrainData && gameState.city && gameState.city.geo_text && gameState.city.geo_text !== '等待生成...') {
          terrainData = { fallback: true, geoText: gameState.city.geo_text };
          console.warn('[地图] 无terrain数据，使用geo_text回退');
        }
        if (terrainData) {
          try {
            loadTerrainFromAI(terrainData);
          } catch (e) { console.error('[地图] 地形加载异常:', e); }
        } else {
          console.warn('[地图] 无地形数据，使用默认地形');
          try {
            if (typeof generateDefaultTerrain === 'function') generateDefaultTerrain();
          } catch (e) { console.error('[地图] 默认地形生成异常:', e); }
        }
      }
      // 最终重绘
      if (typeof redrawAll === 'function') {
        try {
          redrawAll();
          console.warn('[地图] 重新生成开局 - redrawAll完成');
        } catch (e) { console.error('[地图] redrawAll失败:', e); }
      }
    }, 50);
    document.getElementById('ai-status').classList.add('hidden');
    // 重新启用刷新按钮
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      refreshBtn.className = refreshBtn.className + ' hover:opacity-80';
      refreshBtn.title = '重新生成开局城市状态';
    }
    var panelRefreshBtn = document.getElementById('start-btn-refresh');
    if (panelRefreshBtn) panelRefreshBtn.style.display = '';
    // Toast通知
    var toast = document.getElementById('ply-toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'ply-toast'; toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2d5016;color:white;padding:12px 24px;border-radius:8px;z-index:200;font-weight:bold;transition:opacity 0.5s'; document.body.appendChild(toast); }
    toast.textContent = '✅ 开局城市状态已重新生成！';
    toast.style.opacity = '1';
    setTimeout(function () { toast.style.opacity = '0'; }, 4000);
  } catch (e) {
    // 失败时恢复原始内容
    if (narrativeBox && originalContent) {
      narrativeBox.innerHTML = originalContent;
    } else {
      narrativeBox.innerHTML = '<p class="text-red-600">开局刷新失败: ' + e.message + '</p><p class="text-gray-600 mt-2 text-sm">请检查API设置或网络连接后重试</p>';
    }
    document.getElementById('ai-status-text').textContent = '❌ ' + e.message;
    // 恢复刷新按钮
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      refreshBtn.className = refreshBtn.className + ' hover:opacity-80';
    }
  } finally {
    isProcessing = false;
    if (btn) { btn.disabled = false; btn.textContent = '⏭️ 结束回合'; }
  }
}

// ==================== 存档 ====================
function saveGame() {
  localStorage.setItem('aic_gamestate', JSON.stringify(gameState));
  localStorage.setItem('aic_turn', turnCount);
  localStorage.setItem('aic_history', JSON.stringify(historyDecisions));
  localStorage.setItem('aic_chart', JSON.stringify(chartData));
  localStorage.setItem('aic_fullhistory', JSON.stringify(fullHistory));
  localStorage.setItem('aic_maxhist', maxHistoryRounds);
  localStorage.setItem('aic_shortmem', JSON.stringify(shortTermMemory));
  localStorage.setItem('aic_longmem', JSON.stringify(longTermMemory));
  localStorage.setItem('aic_lastuser', JSON.stringify(lastUserMessage));
  localStorage.setItem('aic_lastassist', JSON.stringify(lastAssistantMessage));
  localStorage.setItem('aic_popgrowth', JSON.stringify(popGrowthHistory));
  localStorage.setItem('aic_lastchartmonth', lastChartMonth);
  localStorage.setItem('aic_citymap', JSON.stringify(gameState.city_map));
  localStorage.setItem('aic_pinnednpcs', JSON.stringify(pinnedNPCs));
  localStorage.setItem('aic_broadcast', JSON.stringify(broadcastSegments));
  localStorage.setItem('aic_npclastday', _npcLifeLastDay);
  localStorage.setItem('aic_broadcastlastday', _broadcastLastDay);
  if (refreshSnapshot) {
    var snap = { isOpening: !!refreshSnapshot.isOpening, messages: refreshSnapshot.messages || null, apiModel: refreshSnapshot.apiModel || '', appointmentText: refreshSnapshot.appointmentText || '' };
    if (!snap.isOpening) {
      snap.decision = refreshSnapshot.decision || '';
      snap.turnCount = refreshSnapshot.turnCount || 0;
      snap.shortLen = refreshSnapshot.shortLen || 0;
      snap.fullLen = refreshSnapshot.fullLen || 0;
      snap.histLen = refreshSnapshot.histLen || 0;
      snap.chartLabelsLen = refreshSnapshot.chartLabelsLen || 0;
      snap.chartGdpLen = refreshSnapshot.chartGdpLen || 0;
      snap.chartSupLen = refreshSnapshot.chartSupLen || 0;
      snap.prevTime = refreshSnapshot.prevTime || '';
    }
    localStorage.setItem('aic_refresh_snap', JSON.stringify(snap));
  }
  logDebug('存档已保存 回合=' + turnCount);
}
function loadGame() {
  const gs = localStorage.getItem('aic_gamestate');
  if (!gs) return { ok: false, error: 'no_save' };
  try {
    var parsed = JSON.parse(gs);
    if (!parsed.header || !parsed.macro || !parsed.demo || !parsed.land ||
      !parsed.econ || !parsed.fiscal || !parsed.admin || !parsed.council ||
      !parsed.city || !parsed.npc || !parsed.news || !parsed.notes) {
      return { ok: false, error: '存档数据结构不完整（缺少必要字段）' };
    }
    gameState = parsed;
    if (!gameState.next_actions) gameState.next_actions = [];
    if (!gameState.city_map) { gameState.city_map = {}; applyMapGridSize(gameState); }
  } catch (e) {
    console.error('解析游戏状态失败:', e);
    return { ok: false, error: '存档解析失败：' + e.message };
  }
  try {
    turnCount = parseInt(localStorage.getItem('aic_turn') || '0');
  } catch (e) { turnCount = 0; }
  try {
    historyDecisions = JSON.parse(localStorage.getItem('aic_history') || '[]');
  } catch (e) { historyDecisions = []; }
  try {
    chartData = JSON.parse(localStorage.getItem('aic_chart') || '{"labels":["初始"],"gdp":[3.2],"support":[65]}');
  } catch (e) { chartData = { labels: ['初始'], gdp: [3.2], support: [65] }; }
  try {
    shortTermMemory = JSON.parse(localStorage.getItem('aic_shortmem') || '[]');
  } catch (e) { shortTermMemory = []; }
  try {
    longTermMemory = JSON.parse(localStorage.getItem('aic_longmem') || '[]');
  } catch (e) { longTermMemory = []; }
  try {
    fullHistory = JSON.parse(localStorage.getItem('aic_fullhistory') || '[]');
  } catch (e) { fullHistory = []; }
  try {
    maxHistoryRounds = parseInt(localStorage.getItem('aic_maxhist')) || 100;
    if (maxHistoryRounds < 10) maxHistoryRounds = 10;
    if (maxHistoryRounds > 500) maxHistoryRounds = 500;
  } catch (e) { maxHistoryRounds = 100; }
  try {
    lastUserMessage = JSON.parse(localStorage.getItem('aic_lastuser'));
  } catch (e) { lastUserMessage = null; }
  try {
    lastAssistantMessage = JSON.parse(localStorage.getItem('aic_lastassist'));
  } catch (e) { lastAssistantMessage = null; }
  try {
    popGrowthHistory = JSON.parse(localStorage.getItem('aic_popgrowth') || '[]');
  } catch (e) { popGrowthHistory = []; }
  lastChartMonth = localStorage.getItem('aic_lastchartmonth') || '';
  try {
    pinnedNPCs = JSON.parse(localStorage.getItem('aic_pinnednpcs') || '[]');
  } catch (e) { pinnedNPCs = []; }
  try {
    broadcastSegments = JSON.parse(localStorage.getItem('aic_broadcast') || '[]');
  } catch (e) { broadcastSegments = []; }
  _npcLifeLastDay = localStorage.getItem('aic_npclastday') || '';
  _broadcastLastDay = localStorage.getItem('aic_broadcastlastday') || '';
  try {
    var snapStr = localStorage.getItem('aic_refresh_snap');
    if (snapStr) {
      var snap = JSON.parse(snapStr);
      if (snap.isOpening) {
        refreshSnapshot = { isOpening: true, messages: snap.messages, apiModel: snap.apiModel || '', appointmentText: snap.appointmentText || '' };
      } else {
        refreshSnapshot = {
          isOpening: false,
          gameState: gameState,
          turnCount: snap.turnCount || 0,
          shortLen: snap.shortLen || 0,
          fullLen: snap.fullLen || 0,
          histLen: snap.histLen || 0,
          chartLabelsLen: snap.chartLabelsLen || 0,
          chartGdpLen: snap.chartGdpLen || 0,
          chartSupLen: snap.chartSupLen || 0,
          lastUser: lastUserMessage ? JSON.parse(JSON.stringify(lastUserMessage)) : null,
          lastAssistant: lastAssistantMessage ? JSON.parse(JSON.stringify(lastAssistantMessage)) : null,
          decision: snap.decision || '',
          prevTime: snap.prevTime || ''
        };
        _prevGameTimeStr = snap.prevTime || '';
      }
    }
  } catch (e) { refreshSnapshot = null; }
  loadWorldBook();
  logInfo('存档加载成功 回合=' + turnCount + ' 历史=' + fullHistory.length + '轮');
  return { ok: true };
}

function resetGameInternal(showConfirm) {
  if (showConfirm === undefined) showConfirm = true;
  if (showConfirm && !confirm('确定要重新开始吗？当前进度将丢失。')) return;
  refreshSnapshot = null;
  localStorage.removeItem('aic_refresh_snap');
  pinnedNPCs = [];
  broadcastSegments = [];
  _npcLifeLastDay = '';
  _broadcastLastDay = '';
  resetStartPanel();
  document.getElementById('start-panel').style.display = 'flex';
  loadOpeningDeclaration();
  loadPresets();
}

function resetStartPanel() {
  _selectedStartMode = null;
  _selectedPreset = null;
  var nav = document.getElementById('start-nav');
  if (nav) nav.style.display = 'none';
  var body = document.querySelector('.start-body');
  if (body) body.style.display = 'none';
  var presetList = document.getElementById('start-preset-list');
  if (presetList) presetList.style.display = 'none';
  document.querySelectorAll('.start-mode-card').forEach(function (el) { el.classList.remove('selected'); });
  startSwitchTab('mayor');
}

function showDisclaimer() {
  var modal = document.getElementById('disclaimer-modal');
  var content = document.getElementById('disclaimer-content');
  if (!modal || !content) return;
  content.innerHTML = '<div class="text-center text-gray-500 py-4">正在加载...</div>';
  modal.classList.remove('hidden');
  var checkbox = document.getElementById('disclaimer-dont-show');
  if (checkbox) checkbox.checked = false;
  var url = assetPath('使用说明与免责声明.txt');
  fetch(url, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (text) {
      text = text.trim();
      content.innerHTML = text ?
        '<div class="space-y-2">' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</div>' :
        '<p class="text-center text-gray-500">未找到使用说明文本。</p>';
    })
    .catch(function (e) {
      console.warn('加载免责声明失败 (尝试路径: ' + url + '):', e);
      fetch('使用说明与免责声明.txt', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (text) {
          text = text.trim();
          content.innerHTML = text ?
            '<div class="space-y-2">' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</div>' :
            '<p class="text-center text-gray-500">未找到使用说明文本。</p>';
        })
        .catch(function () {
          content.innerHTML = '<p class="text-center text-gray-500">未找到使用说明文本（"使用说明与免责声明.txt"文件不存在）。</p>';
        });
    });
}

function closeDisclaimer() {
  var modal = document.getElementById('disclaimer-modal');
  if (modal) modal.classList.add('hidden');
}

function acceptDisclaimer() {
  var checkbox = document.getElementById('disclaimer-dont-show');
  if (checkbox && checkbox.checked) {
    localStorage.setItem('disclaimer_accepted', '1');
  }
  closeDisclaimer();
}

function clearAllData() {
  var msg = '⚠️ 此操作将永久清除以下所有本地数据：\n\n' +
    '• 游戏进度（回合数据、城市状态）\n' +
    '• API配置（地址、Key、模型）\n' +
    '• 自定义提示词\n' +
    '• 历史记录、记忆、世界书\n' +
    '• 图表数据、刷新快照\n' +
    '• 市井百态钉选NPC、广播内容\n\n' +
    '清除后页面将刷新，您可以：\n' +
    '1. 重新配置API → 开始新游戏\n' +
    '2. 导入之前导出的JSON存档文件\n\n' +
    '确定要继续吗？';
  if (!confirm(msg)) return;
  try {
    _prevGameTimeStr = '';
    // 清除所有 aic_ 前缀的 localStorage 键
    var removed = 0;
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('aic_') === 0) keysToRemove.push(k);
    }
    keysToRemove.forEach(function (k) { localStorage.removeItem(k); removed++; });
    console.log('clearAllData: 已清除 ' + removed + ' 个localStorage键');
    // 刷新页面回到初始状态
    location.reload();
  } catch (e) {
    alert('清除数据时出错: ' + e.message);
  }
}
window.clearAllData = clearAllData;

// ==================== 完整历史存档管理 ====================
function checkHistoryLimit() {
  if (fullHistory.length >= maxHistoryRounds) {
    const exceeded = fullHistory.length > maxHistoryRounds;
    const msg = exceeded
      ? '⚠️ 历史记录已达 ' + fullHistory.length + ' 轮，超过上限 ' + maxHistoryRounds + ' 轮！\n\n建议立即导出备份，然后清空历史记录以释放存储空间。\n\n点击「确定」导出备份，然后询问是否清空。'
      : '⚠️ 历史记录已达上限 ' + maxHistoryRounds + ' 轮！\n\n建议导出备份存档，然后可选择清空历史记录以释放空间。\n\n点击「确定」导出备份，然后询问是否清空。';
    if (confirm(msg)) {
      exportHistoryInternal();
      if (confirm('备份已导出。是否清空当前历史记录？\n（清空后游戏仍可继续，后续回合将继续存入）')) {
        fullHistory = [];
        saveGame();
        alert('历史记录已清空。');
      }
    }
  }
}

function openHistoryModalInternal() {
  var modal = document.getElementById('history-modal');
  if (!modal) return;
  renderHistoryContent();
  modal.style.display = 'flex';
}

function closeHistoryModalInternal() {
  var modal = document.getElementById('history-modal');
  if (modal) modal.style.display = 'none';
}

function renderHistoryContent() {
  var container = document.getElementById('history-content');
  var countEl = document.getElementById('hist-count');
  var maxEl = document.getElementById('hist-max');
  if (!container) return;
  if (countEl) countEl.textContent = fullHistory.length;
  if (maxEl) maxEl.textContent = maxHistoryRounds;
  if (fullHistory.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">暂无历史记录，开始游戏后每回合将自动存档。</p>';
    return;
  }
  // 倒序显示，最新在前
  var html = '';
  var reversed = fullHistory.slice().reverse();
  reversed.forEach(function (h) {
    html += '<div class="bg-amber-100/80 rounded-lg p-4 border border-[#8b5a2b]/30 animate-fade">';
    html += '<div class="flex justify-between items-center mb-2">';
    html += '<span class="font-bold text-[#8b5a2b] text-lg">回合 ' + h.turn + '</span>';
    html += '<span class="text-gray-600 text-sm">' + (h.time || '') + '</span>';
    html += '</div>';
    html += '<div class="mb-2"><span class="font-semibold text-gray-700 text-sm">📝 市长决策：</span>';
    html += '<p class="text-gray-800 text-sm mt-1 bg-amber-50 p-2 rounded">' + escapeHtml(h.decision || '') + '</p></div>';
    html += '<div class="mb-2"><span class="font-semibold text-gray-700 text-sm">📰 新闻与时间线：</span>';
    if (h.news && typeof h.news === 'object') {
      html += '<div class="space-y-1 mt-1">';
      var hn = h.news;
      if (hn.city_official && hn.city_official.title) { html += '<div class="bg-blue-50 p-2 rounded text-xs"><strong>' + escapeHtml(hn.city_official.title) + '</strong> <span class="text-gray-500">(' + escapeHtml(hn.city_official.media) + ')</span></div>'; }
      if (hn.foreign && hn.foreign.title) { html += '<div class="bg-purple-50 p-2 rounded text-xs"><strong>' + escapeHtml(hn.foreign.title) + '</strong> <span class="text-gray-500">(' + escapeHtml(hn.foreign.media) + ')</span></div>'; }
      if (hn.social && hn.social.title) { html += '<div class="bg-orange-50 p-2 rounded text-xs"><strong>' + escapeHtml(hn.social.title) + '</strong> <span class="text-gray-500">(' + escapeHtml(hn.social.media) + ')</span></div>'; }
      if (hn.radio && hn.radio.program_name) { html += '<div class="bg-green-50 p-2 rounded text-xs"><strong>' + escapeHtml(hn.radio.program_name) + '</strong> <span class="text-gray-500">(' + escapeHtml(hn.radio.media) + ')</span></div>'; }
      html += '</div>';
    } else {
      html += '<p class="text-gray-500 text-xs">无新闻</p>';
    }
    html += '</div>';
    html += '<details class="mt-2"><summary class="text-sm text-[#8b5a2b] cursor-pointer font-semibold">📖 展开叙事全文</summary>';
    html += '<div class="mt-2 text-sm text-gray-800 leading-relaxed">' + (h.narrative || '<p class="text-gray-500">无叙事</p>') + '</div></details>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function exportHistoryInternal() {
  if (fullHistory.length === 0) {
    alert('暂无历史记录可导出。');
    return;
  }
  var exportData = {
    exportTime: new Date().toISOString(),
    cityName: (gameState.header.location || '').split(' - ').pop() || '新罗马',
    maxHistoryRounds: maxHistoryRounds,
    totalRounds: fullHistory.length,
    records: fullHistory
  };
  var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'AI城市_' + exportData.cityName + '_历史存档_' + exportData.totalRounds + '轮.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearFullHistoryInternal() {
  if (fullHistory.length === 0) {
    alert('历史记录已为空。');
    return;
  }
  if (!confirm('确定要清空全部 ' + fullHistory.length + ' 轮历史记录吗？\n\n建议先导出备份。此操作不可恢复！')) return;
  fullHistory = [];
  saveGame();
  renderHistoryContent();
  alert('历史记录已清空。');
}

var SAVE_VERSION = 2;
function compressContext() {
  if (isProcessing) { alert('正在处理中，请稍后再试。'); return; }
  if (fullHistory.length === 0 && longTermMemory.length === 0) { alert('没有可压缩的历史记录。'); return; }
  var compressBtn = document.getElementById('btn-compress');
  if (compressBtn) { compressBtn.disabled = true; compressBtn.classList.add('opacity-50'); }
  isProcessing = true;
  var c = getConfig();
  if (!c.key) { toggleSettings(); isProcessing = false; if (compressBtn) { compressBtn.disabled = false; compressBtn.classList.remove('opacity-50'); } throw new Error('请先配置API Key'); }
  var historyText = '';
  if (fullHistory.length > 0) {
    historyText += '# 完整历史（每轮一条，共' + fullHistory.length + '轮）:\n';
    fullHistory.forEach(function (h, i) { historyText += '[' + i + '] 回合' + h.turn + '(' + h.time + '): 决策=' + (h.decision || '') + '\n叙事摘要(≤200字): ' + (h.narrative || '') + '\n'; });
  }
  if (longTermMemory.length > 0) {
    historyText += '\n# 长期记忆（已有摘要）:\n';
    longTermMemory.forEach(function (m, i) { historyText += '[' + i + '] 回合' + m.startTurn + '-' + m.endTurn + ': ' + m.summary + '\n'; });
  }
  if (shortTermMemory.length > 0) {
    historyText += '\n# 短期记忆（最近回合）:\n';
    shortTermMemory.forEach(function (m, i) { historyText += '[' + i + '] 回合' + m.turn + '(' + m.time + '): ' + m.summary + '\n'; });
  }
  var prompt = '你是城市模拟游戏的历史记录压缩器。以下是需要压缩的游戏历史记录。\n\n要求：\n1. 将每条完整历史记录压缩为≤200字的中文摘要，保留：关键决策、重要事件、数值变化趋势、NPC关系变化、派系动态。删除冗余描写和细节。\n2. 将长期记忆合并重写为更精炼的版本。\n3. 输出严格JSON格式：{"compressed_history":[{"turn":数字,"time":"时间","decision":"决策摘要","narrative":"200字内叙事摘要"}],"compressed_longterm":[{"startTurn":数字,"endTurn":数字,"summary":"精炼摘要"}],"compressed_shortterm":[{"turn":数字,"time":"时间","summary":"摘要"}]}\n4. compressed_history条数必须与原始fullHistory一一对应，不能遗漏或合并任何一轮。\n5. 只输出JSON，不要其他文字。\n\n待压缩数据：\n' + historyText;
  logInfo('开始上下文压缩 历史轮数=' + fullHistory.length);
  fetch(c.url + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: c.model || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 4096, stream: false })
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    var text = data.choices[0].message.content;
    var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI返回未找到JSON');
    var result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    if (result.compressed_history && result.compressed_history.length === fullHistory.length) {
      fullHistory = result.compressed_history.map(function (ch, i) { return { turn: ch.turn || fullHistory[i].turn, time: ch.time || fullHistory[i].time, decision: ch.decision || fullHistory[i].decision, narrative: ch.narrative || '' }; });
      logInfo('fullHistory 已压缩: ' + fullHistory.length + '轮');
    }
    if (result.compressed_longterm && result.compressed_longterm.length > 0) {
      longTermMemory = result.compressed_longterm.map(function (cl) { return { startTurn: cl.startTurn, endTurn: cl.endTurn, summary: cl.summary }; });
      logInfo('longTermMemory 已压缩: ' + longTermMemory.length + '条');
    }
    if (result.compressed_shortterm && result.compressed_shortterm.length === shortTermMemory.length) {
      shortTermMemory = result.compressed_shortterm.map(function (cs) { return { turn: cs.turn, time: cs.time, summary: cs.summary }; });
      logInfo('shortTermMemory 已压缩: ' + shortTermMemory.length + '条');
    }
    saveGame();
    renderHistoryContent();
    var origTokens = estimateTokens(historyText);
    var newTokens = estimateTokens(JSON.stringify(fullHistory) + JSON.stringify(longTermMemory) + JSON.stringify(shortTermMemory));
    alert('✅ 上下文压缩完成！\n\n完整历史: ' + fullHistory.length + '轮\n长期记忆: ' + longTermMemory.length + '条\n短期记忆: ' + shortTermMemory.length + '条\n\n预估token节省: ≈' + Math.round((origTokens - newTokens) / origTokens * 100) + '%');
  }).catch(function (err) {
    console.error('压缩失败:', err);
    alert('❌ 压缩失败：' + err.message + '\n\n可能是API错误或返回格式不正确。');
  }).finally(function () {
    isProcessing = false;
    if (compressBtn) { compressBtn.disabled = false; compressBtn.classList.remove('opacity-50'); }
  });
}

// ==================== 文件存档（磁盘文件） ====================
function exportSaveFileInternal() {
  var saveData = {
    version: SAVE_VERSION,
    exportTime: new Date().toISOString(),
    cityName: (gameState.header.location || '').split(' - ').pop() || '新罗马',
    gameState: gameState,
    turnCount: turnCount,
    historyDecisions: historyDecisions,
    fullHistory: fullHistory,
    chartData: chartData,
    shortTermMemory: shortTermMemory,
    longTermMemory: longTermMemory,
    maxHistoryRounds: maxHistoryRounds,
    lastUserMessage: lastUserMessage,
    lastAssistantMessage: lastAssistantMessage,
    pinnedNPCs: pinnedNPCs,
    broadcastSegments: broadcastSegments,
    npcLifeLastDay: _npcLifeLastDay,
    broadcastLastDay: _broadcastLastDay
  };
  var blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  var cityName = saveData.cityName;
  var dateStr = new Date().toISOString().slice(0, 10);
  a.download = 'AI城市_' + cityName + '_存档_回合' + turnCount + '_' + dateStr + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  var resultEl = document.getElementById('file-result');
  if (resultEl) {
    resultEl.textContent = '✅ 存档已导出（回合' + turnCount + '）';
    resultEl.className = 'text-sm text-center text-green-600 mt-1';
    setTimeout(function () { resultEl.textContent = ''; }, 3000);
  }
}

function importSaveFileInternal(input) {
  var file = input.files[0];
  if (!file) return;
  var resultEl = document.getElementById('file-result');
  if (!resultEl) resultEl = document.getElementById('standalone-file-result');
  if (resultEl) {
    resultEl.textContent = '⏳ 正在读取存档...';
    resultEl.className = 'text-sm text-center text-gray-600 mt-1';
  }
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var saveData = JSON.parse(e.target.result);
      // 验证数据结构
      if (!saveData.gameState || !saveData.gameState.header || !saveData.gameState.macro) {
        throw new Error('存档文件格式不正确');
      }
      var fileVersion = saveData.version || 1;
      var versionLabel = fileVersion >= SAVE_VERSION ? '兼容' : ('旧版 v' + fileVersion + '，将自动迁移到当前版本');
      // 提示用户确认
      var cityName = (saveData.gameState.header.location || '').split(' - ').pop() || '未知城市';
      if (!confirm('确定要加载存档吗？\n\n城市：' + cityName + '\n回合数：' + (saveData.turnCount || '?') + '\n导出时间：' + (saveData.exportTime || '未知') + '\n存档版本：v' + fileVersion + '（' + versionLabel + '）\n\n⚠️ 当前未保存的进度将丢失！')) return;
      // 版本迁移
      if (fileVersion < 2 && saveData.gameState.macro) {
        if (!saveData.gameState.city_map) {
          saveData.gameState.city_map = {}; applyMapGridSize(saveData.gameState);
        }
      }
      // 恢复存档
      gameState = saveData.gameState;
      turnCount = saveData.turnCount || 0;
      historyDecisions = saveData.historyDecisions || [];
      fullHistory = saveData.fullHistory || [];
      chartData = saveData.chartData || { labels: ['初始'], gdp: [3.2], support: [65] };
      shortTermMemory = saveData.shortTermMemory || [];
      longTermMemory = saveData.longTermMemory || [];
      maxHistoryRounds = saveData.maxHistoryRounds || 100;
      lastUserMessage = saveData.lastUserMessage || null;
      lastAssistantMessage = saveData.lastAssistantMessage || null;
      pinnedNPCs = saveData.pinnedNPCs || [];
      broadcastSegments = saveData.broadcastSegments || [];
      _npcLifeLastDay = saveData.npcLifeLastDay || '';
      _broadcastLastDay = saveData.broadcastLastDay || '';
      if (!gameState.city_map) { gameState.city_map = {}; applyMapGridSize(gameState); }
      // 保存到 localStorage
      saveGame();
      // 重新渲染
      renderAll();
      updateChart();
      renderNPCLifeList();
      updateBroadcast();
      loadSettings();
      if (resultEl) {
        resultEl.textContent = '✅ 存档已加载！' + cityName + ' 回合' + turnCount + (fileVersion < SAVE_VERSION ? ' (已迁移)' : '');
        resultEl.className = 'text-sm text-center text-green-600 mt-1';
        setTimeout(function () { resultEl.textContent = ''; }, 5000);
      }
      toggleSettingsInternal();
    } catch (err) {
      if (resultEl) {
        resultEl.textContent = '❌ 存档读取失败：' + err.message;
        resultEl.className = 'text-sm text-center text-red-600 mt-1';
      }
    }
  };
  reader.onerror = function () {
    if (resultEl) {
      resultEl.textContent = '❌ 文件读取失败';
      resultEl.className = 'text-sm text-center text-red-600 mt-1';
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function importSaveFromStandalone(input) {
  importSaveFileInternal(input);
}

function importSaveFromStart(input) {
  var file = input.files[0];
  if (!file) return;
  var resultEl = document.getElementById('start-import-result');
  if (resultEl) {
    resultEl.textContent = '⏳ 正在读取存档...';
    resultEl.style.color = '#666';
  }
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var saveData = JSON.parse(e.target.result);
      if (!saveData.gameState || !saveData.gameState.header || !saveData.gameState.macro) {
        throw new Error('存档文件格式不正确');
      }
      var cityName = (saveData.gameState.header.location || '').split(',').pop().trim() || '未知城市';
      if (!confirm('确定要加载存档吗？\n\n城市：' + cityName + '\n回合数：' + (saveData.turnCount || '?') + '\n导出时间：' + (saveData.exportTime || '未知'))) return;
      gameState = saveData.gameState;
      turnCount = saveData.turnCount || 0;
      historyDecisions = saveData.historyDecisions || [];
      fullHistory = saveData.fullHistory || [];
      chartData = saveData.chartData || { labels: ['初始'], gdp: [3.2], support: [65] };
      shortTermMemory = saveData.shortTermMemory || [];
      longTermMemory = saveData.longTermMemory || [];
      maxHistoryRounds = saveData.maxHistoryRounds || 100;
      lastUserMessage = saveData.lastUserMessage || null;
      lastAssistantMessage = saveData.lastAssistantMessage || null;
      popGrowthHistory = saveData.popGrowthHistory || [];
      lastChartMonth = saveData.lastChartMonth || '';
      if (!gameState.city_map) { gameState.city_map = {}; applyMapGridSize(gameState); }
      refreshSnapshot = null;
      localStorage.removeItem('aic_refresh_snap');
      saveGame();
      // 隐藏开局面板，显示主界面
      document.getElementById('start-panel').style.display = 'none';
      isProcessing = false;
      setUIState('playing');
      renderAll();
      updateChart();
      loadSettings();
      if (resultEl) {
        resultEl.textContent = '✅ 存档已加载！' + cityName + ' · 第' + turnCount + '回合';
        resultEl.style.color = '#16a34a';
        setTimeout(function () { resultEl.textContent = ''; }, 5000);
      }
    } catch (err) {
      if (resultEl) {
        resultEl.textContent = '❌ 导入失败：' + err.message;
        resultEl.style.color = '#dc2626';
      }
    }
  };
  reader.onerror = function () {
    if (resultEl) {
      resultEl.textContent = '❌ 文件读取失败';
      resultEl.style.color = '#dc2626';
    }
  };
  reader.readAsText(file);
  input.value = '';
}
window.importSaveFromStart = importSaveFromStart;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== 工具函数 ====================
function avgSupport() {
  const g = gameState.council && gameState.council.groups;
  if (!g || !g.length) return 65;
  let t = 0;
  g.forEach(x => { const m = String(x.support).match(/(\d+)/); if (m) t += parseInt(m[1]); });
  return Math.round(t / g.length);
}
function calcBalance() {
  const pa = s => { s = String(s).replace(/[£$¥€₽₹₩₣ƒ₧金元円贯¤,]/g, ''); if (s.includes('亿')) return parseFloat(s) * 1e8; if (s.includes('万')) return parseFloat(s) * 1e4; return parseFloat(s) || 0; };
  const d = pa(gameState.fiscal.total_income) - pa(gameState.fiscal.total_expense);
  const sym = getCurrencySymbol();
  if (Math.abs(d) >= 1e8) return sym + (d / 1e8).toFixed(2) + '亿';
  if (Math.abs(d) >= 1e4) return sym + (d / 1e4).toFixed(0) + '万';
  return sym + d.toFixed(0);
}

// ==================== 正文区自适应高度 ====================
function fitNarrativeHeight() {
  var scrollEl = document.getElementById('narrative-scroll');
  var newsEl = document.getElementById('news-timeline-panel');
  if (!scrollEl) return;
  var vh = window.innerHeight;
  if (!newsEl || newsEl.offsetParent === null) {
    scrollEl.style.height = '';
    scrollEl.style.maxHeight = '';
    return;
  }
  var scrollTop = scrollEl.getBoundingClientRect().top;
  var newsTop = newsEl.getBoundingClientRect().top;
  var gap = 16;
  var available = newsTop - scrollTop - gap;
  if (available > 200) {
    scrollEl.style.height = available + 'px';
    scrollEl.style.maxHeight = available + 'px';
  } else {
    scrollEl.style.height = '';
    scrollEl.style.maxHeight = '';
  }
}

// ==================== 渲染函数 ====================
function renderAll() {
  renderHeader();
  renderMacroCard();
  renderDemoCard();
  renderLandCard();
  renderMayor();
  renderEconIndustry();
  renderEconFiscal();
  renderEconClasses();
  renderAdmin();
  renderSideIndicators();
  renderNarrative();
  renderNPC();
  renderNotes();
  renderNews();
  renderCityFace();
  renderCityMap();
  renderNextActions();
  renderHistorySidebar();
  renderNPCLifeList();
  renderBroadcastBar();
  renderEthnicityPieChart();
  renderReligionPieChart();
  recordPopGrowth();
  renderPopGrowthChart();
  fitNarrativeHeight();
}

function renderHeader() {
  const h = gameState.header;
  document.getElementById('hdr-city').textContent = (h.location || '').split(' - ').pop() || '新罗马';
  document.getElementById('hdr-time').textContent = '📅 ' + (h.time || '');
  document.getElementById('hdr-weather').textContent = h.weather || '';
  document.getElementById('hdr-plot').textContent = h.plot || '城市动态';
  document.getElementById('hdr-loc').textContent = h.location || '';
  document.getElementById('hdr-place').textContent = h.place || '';
  const sup = avgSupport();
  document.getElementById('hdr-support-bar').style.width = sup + '%';
  document.getElementById('hdr-support').textContent = sup + '%';
  document.getElementById('hdr-stability').textContent = '⚖️ ' + (gameState.macro.political_stability || '78%');
  document.getElementById('hdr-corruption').textContent = '🦠 ' + (gameState.admin.corruption || '18%');
}

// ==================== 下拉面板切换 ====================
function toggleDropdown(panel) {
  var el = document.getElementById('dropdown-' + panel);
  var btn = document.querySelector('.dropdown-btn[data-panel="' + panel + '"]');
  if (!el || !btn) return;
  var isOpen = el.style.display === 'block';
  var colors = { macro: '#8b5a2b', demo: '#4a3c31', land: '#a83232' };
  if (isOpen) {
    // 关闭面板
    el.style.display = 'none';
    btn.style.background = '#f5f0eb';
    btn.style.color = '#6b7280';
    btn.style.borderBottomColor = 'transparent';
    btn.textContent = btn.textContent.replace('▾', '▸');
  } else {
    // 打开面板
    el.style.display = 'block';
    btn.style.background = '#fff';
    btn.style.color = colors[panel] || '#8b5a2b';
    btn.style.borderBottomColor = colors[panel] || '#8b5a2b';
    btn.textContent = btn.textContent.replace('▸', '▾');
    // 触发图表渲染
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
      if (panel === 'macro' && typeof updateChart === 'function') updateChart();
      else if (panel === 'demo' && typeof renderPopGrowthChart === 'function') renderPopGrowthChart();
    }, 150);
  }
}
function toggleChart(btn) {
  var containerId = btn.getAttribute('data-chart');
  var container = document.getElementById(containerId);
  if (!container) return;
  var isHidden = container.style.display === 'none';
  container.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? '📊 收起图表 ▾' : '📊 展开图表 ▸';
  if (isHidden) {
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
      // 找到所属的下拉面板
      var dropdown = container.closest('.dropdown-panel');
      if (dropdown) {
        var panelId = dropdown.id;
        if (panelId === 'dropdown-macro' && typeof updateChart === 'function') updateChart();
        else if (panelId === 'dropdown-demo' && typeof renderPopGrowthChart === 'function') renderPopGrowthChart();
      }
    }, 150);
  }
}

// ==================== 进度条辅助 ====================
function getProgressBar(value, opts) {
  // opts: {reversed, goodColor, midColor, badColor} 
  // reversed=true表示值越大越坏（如污染、基尼系数）
  var num = parseFloat(value);
  if (isNaN(num)) return '';
  var pct;
  // 对于包含%号的字符串，直接取数字
  if (typeof value === 'string' && value.indexOf('%') !== -1) { pct = num; }
  // 0-1区间映射到0-100（如基尼系数）
  else if (num < 1 && value > 0) { pct = num * 100; }
  // 已知-10~+10范围（增长率）映射到0-100
  else if (num >= -20 && num <= 20) { pct = ((num + 20) / 40) * 100; }
  // 默认直接使用
  else { pct = Math.min(100, Math.max(0, num)); }
  pct = Math.min(100, Math.max(0, pct));
  var reversed = opts && opts.reversed;
  var goodColor = (opts && opts.goodColor) || '#10b981';
  var midColor = (opts && opts.midColor) || '#f59e0b';
  var badColor = (opts && opts.badColor) || '#ef4444';
  var barColor;
  if (reversed) {
    barColor = pct > 70 ? badColor : pct > 40 ? midColor : goodColor;
  } else {
    barColor = pct >= 70 ? goodColor : pct >= 40 ? midColor : badColor;
  }
  return '<div class="w-full h-1.5 bg-gray-200 rounded-full mt-0.5 overflow-hidden" style="background:#e5e7eb"><div class="h-full rounded-full transition-all" style="width:' + pct + '%;background:' + barColor + '"></div></div>';
}

function renderMacroCard() {
  const m = gameState.macro;
  const gr = parseFloat(m.growth_rate) || 0;
  const items = [
    ['📊 GDP', m.gdp, 'font-bold text-[#8b5a2b]', null],
    ['📈 增长', m.growth_rate, gr >= 0 ? 'text-emerald-600' : 'text-red-600', { reversed: gr < 0 }],
    ['💼 失业', m.unemployment, (parseFloat(m.unemployment) || 0) > 5 ? 'text-red-600' : 'text-emerald-600', { reversed: true }],
    ['💰 货币/通胀', m.currency_cpi, '', null],
    ['🏦 外债', m.debt, '', null],
    ['💧 流动/外汇', m.liquid_fx, '', null],
    ['⚖️ 基尼系数', m.gini, (parseFloat(m.gini) || 0) > 0.45 ? 'text-red-600' : '', { reversed: true }],
    ['👶 抚养比', m.dependency, '', null],
    ['🏗️ 基建健康', m.infra_health, '', {}],
    ['⚔️ 治安', m.security, '', null],
    ['🏛️ 政治稳定', m.political_stability, '', {}],
    ['⚡ 行政效率', m.execution_efficiency, '', null],
    ['💸 收入模式', m.income_mode, '', null]
  ];
  var hasCharts = (document.getElementById('gdpChart') && typeof Chart !== 'undefined');
  document.getElementById('card-macro').innerHTML = items.map(function (x) {
    var bar = x[3] !== null ? getProgressBar(x[1], x[3]) : '';
    return '<div class="py-0.5"><div class="flex justify-between"><span class="text-gray-600">' + x[0] + '</span><span class="' + (x[2] || '') + '">' + x[1] + '</span></div>' + bar + '</div>';
  }).join('');
  var chartToggle = document.querySelector('#dropdown-macro .chart-toggle');
  if (chartToggle) chartToggle.style.display = hasCharts ? 'inline-block' : 'none';
}

function renderDemoCard() {
  const d = gameState.demo;
  const items = [
    ['👥 总人口', d.population, 'font-bold text-[#4a3c31]', null],
    ['🌱 增长率', d.growth_rate, '', {}],
    ['🏥 健康指数', d.health, '', {}],
    ['⚰️ 死亡率', d.mortality, '', { reversed: true }],
    ['📚 教育', d.education, '', {}],
    ['🌍 种族', d.ethnicity, '', null],
    ['⛪ 宗教', d.religion, '', null],
    ['❤️ 忠诚度', d.loyalty || '—', '', {}]
  ];
  var hasCharts = (document.getElementById('popGrowthChart') && typeof Chart !== 'undefined');
  document.getElementById('card-demo').innerHTML = items.map(function (x) {
    var bar = x[3] !== null ? getProgressBar(x[1], x[3]) : '';
    return '<div class="py-0.5"><div class="flex justify-between"><span class="text-gray-600">' + x[0] + '</span><span class="' + (x[2] || '') + '">' + x[1] + '</span></div>' + bar + '</div>';
  }).join('');
  var chartToggle = document.querySelector('#dropdown-demo .chart-toggle');
  if (chartToggle) chartToggle.style.display = hasCharts ? 'inline-block' : 'none';
}

function renderLandCard() {
  const l = gameState.land;
  const items = [
    ['🗺️ 面积/级别', l.area + ' | ' + l.admin_level, 'font-bold text-[#a83232]', null],
    ['🌡️ 气候', l.climate, '', null],
    ['⛰️ 地形', l.geography, '', null],
    ['⚡ 电力', l.power, '', {}],
    ['💧 供水', l.water, '', {}],
    ['🔥 供热', l.heating, '', {}],
    ['🚦 交通', l.traffic, '', {}],
    ['🫁 污染', l.pollution, '', { reversed: true }]
  ];
  document.getElementById('card-land').innerHTML = items.map(function (x) {
    var bar = x[3] !== null ? getProgressBar(x[1], x[3]) : '';
    return '<div class="py-0.5"><div class="flex justify-between"><span class="text-gray-600">' + x[0] + '</span><span class="' + (x[2] || '') + '">' + x[1] + '</span></div>' + bar + '</div>';
  }).join('');
}

function renderMayor() {
  var m = gameState.mayor || {};
  var panel = document.getElementById('mayor-panel');
  if (!panel) return;
  var rep = parseInt(m.reputation) || 0;
  var integ = parseInt(m.integrity) || 0;
  var ener = parseInt(m.energy) || 0;
  var html = '';
  // 基本信息
  html += '<div class="bg-amber-50/80 rounded-lg p-2 border border-[#2d5016]/20">';
  html += '<div class="font-bold text-[#2d5016] text-sm mb-1">' + (m.name || '市长') + '</div>';
  html += '<div class="text-gray-500">' + (m.age || '?') + '岁 · ' + (m.gender || '?') + '</div>';
  html += '<div class="text-[#8b5a2b] font-bold mt-1">' + (m.faction || '无派别') + '</div>';
  html += '</div>';
  // 属性条
  html += '<div class="space-y-1">';
  html += '<div class="flex justify-between"><span class="text-gray-600">声望</span><span>' + (m.reputation || '0') + '</span></div>';
  html += '<div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div class="h-full bg-amber-600 rounded-full" style="width:' + Math.min(100, rep) + '%"></div></div>';
  html += '<div class="flex justify-between"><span class="text-gray-600">诚信</span><span>' + (m.integrity || '0') + '</span></div>';
  html += '<div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div class="h-full bg-emerald-600 rounded-full" style="width:' + Math.min(100, integ) + '%"></div></div>';
  html += '<div class="flex justify-between"><span class="text-gray-600">精力</span><span>' + (m.energy || '0') + '</span></div>';
  html += '<div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div class="h-full bg-blue-600 rounded-full" style="width:' + Math.min(100, ener) + '%"></div></div>';
  html += '</div>';
  // 特殊技能
  html += '<div class="bg-amber-50/80 rounded-lg p-2 border border-[#8b5a2b]/20">';
  html += '<div class="font-bold text-[#8b5a2b] mb-1">特殊技能</div>';
  html += '<div class="text-gray-700">' + (m.skills || '暂无') + '</div>';
  html += '</div>';
  // 身份背景
  html += '<div class="bg-amber-50/80 rounded-lg p-2 border border-[#8b5a2b]/20">';
  html += '<div class="font-bold text-[#8b5a2b] mb-1">身份背景</div>';
  html += '<div class="text-gray-700">' + (m.background || '暂无') + '</div>';
  html += '</div>';
  // 日程安排
  var schedule = m.schedule || [];
  if (schedule.length > 0) {
    html += '<div class="bg-amber-50/80 rounded-lg p-2 border border-[#2d5016]/20">';
    html += '<div class="font-bold text-[#2d5016] mb-1">日程安排</div>';
    html += '<div class="space-y-1">';
    schedule.forEach(function (s, i) {
      html += '<div class="flex items-start text-gray-700"><span class="text-[#8b5a2b] font-bold mr-1">' + (i + 1) + '.</span><span>【' + (s.time || '') + ' · ' + (s.location || '') + ' · ' + (s.event || '') + '】</span></div>';
    });
    html += '</div></div>';
  }
  panel.innerHTML = html;
}

function renderEconIndustry() {
  const e = gameState.econ || {};
  let html = '<h4 class="font-bold text-[#8b5a2b] mb-1 text-sm">城市设施</h4>';
  html += '<div class="overflow-x-auto scrollbar-thin mb-3"><table class="w-full text-xs"><thead><tr class="border-b border-[#8b5a2b]/30"><th class="text-left py-1 px-2 text-[#8b5a2b]">ID</th><th class="text-left py-1 px-2 text-[#8b5a2b]">类型</th><th class="text-left py-1 px-2 text-[#8b5a2b]">雇员</th><th class="text-left py-1 px-2 text-[#8b5a2b]">成本</th><th class="text-left py-1 px-2 text-[#8b5a2b]">状态</th><th class="text-left py-1 px-2 text-[#8b5a2b]">收益</th></tr></thead><tbody>';
  (e.facilities || []).forEach(f => { html += '<tr class="border-b border-[#8b5a2b]/10 hover:bg-amber-100"><td class="py-1 px-2">' + f.id + '</td><td class="py-1 px-2">' + f.type + '</td><td class="py-1 px-2">' + f.employees + '</td><td class="py-1 px-2">' + f.cost + '</td><td class="py-1 px-2">' + f.status + '</td><td class="py-1 px-2">' + f.revenue + '</td></tr>'; });
  html += '</tbody></table></div>';
  html += '<div class="grid grid-cols-2 gap-3"><div class="overflow-y-auto scrollbar-thin" style="max-height:160px"><h5 class="font-semibold text-[#8b5a2b] mb-1 text-xs">出口</h5>';
  (e.exports || []).forEach(x => { html += '<div class="flex justify-between text-xs"><span>' + x.name + '</span><span class="text-[#2d5016]">' + (x.value || x.volume || '?') + '</span></div>'; });
  html += '</div><div class="overflow-y-auto scrollbar-thin" style="max-height:160px"><h5 class="font-semibold text-[#8b5a2b] mb-1 text-xs">进口</h5>';
  (e.imports || []).forEach(x => { html += '<div class="flex justify-between text-xs"><span>' + x.name + '</span><span class="text-[#a83232]">' + (x.value || x.volume || '?') + '</span></div>'; });
  html += '</div></div>';
  document.getElementById('industry-main').innerHTML = html;
  renderTradePieChart();
}

function parseTradeValueToNumber(str) {
  if (typeof str !== 'string') return parseFloat(str) || 0;
  // 移除所有货币符号和中文字符
  var v = str.replace(/[$£€¥₹₩₽₣ƒ₧金元円贯¤]/g, '').replace(/[^\d.，,]/g, '').trim();
  // 处理中文逗号
  v = v.replace(/，/g, '.');
  // 处理亿/万单位
  if (v.indexOf('亿') !== -1) return (parseFloat(v) || 0) * 10000;
  if (v.indexOf('千万') !== -1) return (parseFloat(v) || 0) * 1000;
  if (v.indexOf('百万') !== -1) return (parseFloat(v) || 0) * 100;
  if (v.indexOf('万') !== -1) return parseFloat(v) || 0;
  if (v.indexOf('千') !== -1) return (parseFloat(v) || 0) * 0.1;
  return parseFloat(v) || 0;
}

function renderTradePieChart() {
  var canvas = document.getElementById('tradePieChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._tradeChart && typeof window._tradeChart.destroy === 'function') window._tradeChart.destroy();
  var labels = [];
  var data = [];
  var totalExport = 0, totalImport = 0;
  (gameState.econ.exports || []).forEach(function (x) {
    labels.push('📤 ' + x.name);
    var val = parseTradeValueToNumber(x.value) || parseTradeValueToNumber(x.volume) || 0;
    data.push(val);
    totalExport += val;
  });
  (gameState.econ.imports || []).forEach(function (x) {
    labels.push('📥 ' + x.name);
    var val = parseTradeValueToNumber(x.value) || parseTradeValueToNumber(x.volume) || 0;
    data.push(val);
    totalImport += val;
  });
  if (!data.length || data.every(function (v) { return v === 0; })) {
    var balanceElEmpty = document.getElementById('trade-balance-box');
    if (balanceElEmpty) balanceElEmpty.innerHTML = '';
    return;
  }
  var exportCount = gameState.econ.exports.length;
  var colors = [];
  var exportColors = ['rgba(45,80,22,0.85)', 'rgba(65,120,32,0.75)', 'rgba(35,60,18,0.8)', 'rgba(85,140,42,0.7)', 'rgba(55,100,28,0.78)'];
  var importColors = ['rgba(168,50,50,0.85)', 'rgba(188,70,70,0.75)', 'rgba(138,30,30,0.8)', 'rgba(200,90,90,0.7)', 'rgba(158,40,40,0.78)'];
  for (var i = 0; i < data.length; i++) {
    if (i < exportCount) colors.push(exportColors[i % exportColors.length]);
    else colors.push(importColors[(i - exportCount) % importColors.length]);
  }
  window._tradeChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderColor: '#f5f5dc', borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 }, padding: 3 } } } }
  });
  var balance = totalExport - totalImport;
  var currency = getCurrencySymbol();
  var balanceEl = document.getElementById('trade-balance-box');
  if (balanceEl) {
    var sign = balance >= 0 ? '+' : '';
    var cls = balance >= 0 ? 'text-emerald-600' : 'text-red-600';
    balanceEl.innerHTML = '<div class="text-center"><div class="text-xs text-gray-500">贸易差额</div><div class="text-xl font-bold ' + cls + '">' + sign + currency + formatTradeValue(balance) + '</div><div class="text-xs ' + cls + '">' + (balance >= 0 ? '顺差' : '逆差') + '</div></div>';
  }
}

function renderEconFiscal() {
  const f = gameState.fiscal || {};
  let html = '<div class="mb-3 text-sm"><div class="flex justify-between mb-1"><span>上月总支出:</span><strong class="text-[#8b0000]">' + (f.total_expense || '-') + '</strong></div>';
  html += '<div class="flex justify-between mb-1"><span>上月总收入:</span><strong class="text-[#2d5016]">' + (f.total_income || '-') + '</strong></div>';
  html += '<div class="flex justify-between"><span>余额:</span><strong class="text-[#8b5a2b]">' + calcBalance() + '</strong></div></div>';
  html += '<div class="overflow-y-auto scrollbar-thin" style="max-height:160px"><h5 class="font-semibold text-[#8b5a2b] mb-1 text-xs">收入项目</h5>';
  (f.income_items || []).forEach(x => { html += '<div class="flex justify-between text-xs"><span>' + x.name + '</span><span class="text-[#2d5016]">' + x.amount + '(' + x.status + ')</span></div>'; });
  html += '</div>';
  html += '<div class="overflow-y-auto scrollbar-thin mt-2" style="max-height:160px"><h5 class="font-semibold text-[#8b5a2b] mb-1 text-xs">支出项目</h5>';
  (f.expense_items || []).forEach(x => { html += '<div class="flex justify-between text-xs"><span>' + x.name + '</span><span class="text-[#8b0000]">' + x.amount + '(' + x.status + ')</span></div>'; });
  html += '</div>';
  document.getElementById('fiscal-table').innerHTML = html;
  // 财政饼状图
  renderFiscalPieChart();
}

function renderFiscalPieChart() {
  var canvas = document.getElementById('fiscalPieChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._fiscalChart) window._fiscalChart.destroy();
  var labels = [];
  var data = [];
  var colors = [];
  gameState.fiscal.income_items.forEach(function (x) {
    labels.push(x.name);
    var val = parseFloat(x.amount) || 0;
    if (isNaN(val)) val = 0;
    data.push(val);
    colors.push('rgba(45,80,22,0.7)');
  });
  gameState.fiscal.expense_items.forEach(function (x) {
    labels.push(x.name);
    var val = parseFloat(x.amount) || 0;
    if (isNaN(val)) val = 0;
    data.push(val < 0 ? -val : val);
    colors.push('rgba(139,0,0,0.7)');
  });
  if (!data.length) return;
  window._fiscalChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderColor: '#f5f5dc', borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
  });
}

function renderEconClasses() {
  const cls = gameState.econ.classes;
  let html = '<h4 class="font-bold text-[#8b5a2b] mb-2 text-sm">社会阶层结构</h4>';
  html += '<div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="border-b border-[#8b5a2b]/30"><th class="text-left py-1 px-2">阶层</th><th class="text-left py-1 px-2">人口占比</th><th class="text-left py-1 px-2">收入水平</th><th class="text-left py-1 px-2">消费需求</th><th class="text-left py-1 px-2">满意度</th><th class="text-left py-1 px-2">全球对比</th></tr></thead><tbody>';
  cls.forEach(c => { html += '<tr class="border-b border-[#8b5a2b]/10"><td class="py-1 px-2 font-bold">' + c.name + '</td><td class="py-1 px-2">' + c.pop_pct + '</td><td class="py-1 px-2">' + c.income + '</td><td class="py-1 px-2">' + c.demand + '</td><td class="py-1 px-2">' + c.satisfaction + '</td><td class="py-1 px-2">' + c.global_rank + '</td></tr>'; });
  html += '</tbody></table></div>';
  document.getElementById('classes-table').innerHTML = html;
  // 阶层饼状图
  renderClassesPieChart();
}

function renderClassesPieChart() {
  var canvas = document.getElementById('classesPieChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._classesChart) window._classesChart.destroy();
  var labels = [];
  var data = [];
  var bgColors = ['rgba(139,90,43,0.8)', 'rgba(74,60,49,0.8)', 'rgba(168,50,50,0.8)', 'rgba(45,80,22,0.8)', 'rgba(106,13,173,0.8)', 'rgba(30,64,175,0.8)', 'rgba(180,83,9,0.8)', 'rgba(75,85,99,0.8)'];
  (gameState.econ.classes || []).forEach(function (c, i) {
    labels.push(c.name);
    var val = parseFloat(c.pop_pct) || 0;
    data.push(val);
  });
  if (!data.length) return;
  window._classesChart = new Chart(ctx, {
    type: 'pie',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: bgColors.slice(0, data.length), borderColor: '#f5f5dc', borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
    }
  });
}

function renderAdmin() {
  const a = gameState.admin || {};
  const c = gameState.council;
  const ci = gameState.city;
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">';
  html += '<div class="overflow-y-auto scrollbar-thin" style="max-height:140px"><h4 class="font-bold text-[#4a3c31] mb-1">行政区</h4>';
  (a.districts || []).forEach(d => { html += '<div class="flex justify-between"><span>' + d.name + '</span><span>' + d.governance + '</span></div>'; });
  html += '</div><div class="overflow-y-auto scrollbar-thin" style="max-height:140px"><h4 class="font-bold text-[#4a3c31] mb-1">政府部门</h4>';
  (a.departments || []).forEach(d => { html += '<div class="flex justify-between"><span>' + d.name + '</span><span>' + d.head + '</span></div>'; });
  html += '</div><div class="overflow-y-auto scrollbar-thin" style="max-height:140px"><h4 class="font-bold text-[#4a3c31] mb-1">当前项目</h4>';
  (a.projects || []).forEach(p => { html += '<div><div class="mb-1"><span>' + p.name + '|' + p.stage + '|' + p.cost + '</span></div><div class="w-full h-2 bg-amber-100 rounded-full overflow-hidden border border-amber-200"><div class="h-full bg-[#4a3c31]" style="width:' + (parseInt(p.progress) || 0) + '%"></div></div></div>'; });
  html += '</div></div>';
  document.getElementById('admin-content').innerHTML = html;
  // 议会饼状图
  renderCouncilPieChart();
  renderCouncilBars();
}

function renderCouncilPieChart() {
  var canvas = document.getElementById('councilPieChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._councilChart) window._councilChart.destroy();
  var labels = [];
  var data = [];
  var bgColors = ['rgba(139,90,43,0.8)', 'rgba(74,60,49,0.8)', 'rgba(168,50,50,0.8)', 'rgba(45,80,22,0.8)', 'rgba(106,13,173,0.8)', 'rgba(30,64,175,0.8)', 'rgba(180,83,9,0.8)', 'rgba(75,85,99,0.8)'];
  if (gameState.council && gameState.council.groups) {
    gameState.council.groups.forEach(function (g, i) {
      labels.push(g.name);
      var val = parseInt(g.seats) || 0;
      data.push(val);
    });
    if (!data.length) return;
    window._councilChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: data, backgroundColor: bgColors.slice(0, data.length), borderColor: '#f5f5dc', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 }, padding: 8 } } }
      }
    });
  }
}

function renderCouncilBars() {
  var el = document.getElementById('council-bars');
  if (!el) return;
  var html = '';
  var barColors = ['bg-amber-600', 'bg-emerald-600', 'bg-red-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-teal-600', 'bg-gray-600'];
  if (gameState.council && gameState.council.groups) {
    gameState.council.groups.forEach(function (g, i) {
      var sup = parseInt(g.support) || 0;
      var riskColor = (g.risk === '低' || g.risk === 'low') ? 'text-green-600' : (g.risk === '中' || g.risk === 'medium') ? 'text-yellow-600' : 'text-red-600';
      html += '<div><div class="flex justify-between mb-0.5"><span class="font-bold">' + g.name + '</span><span class="text-gray-600">' + g.support + '</span></div>';
      html += '<div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div class="h-full ' + (barColors[i % barColors.length]) + ' rounded-full" style="width:' + Math.min(100, sup) + '%"></div></div>';
      html += '<div class="flex justify-between mt-0.5"><span class="' + riskColor + '">风险:' + g.risk + '</span><span class="text-gray-500">' + g.seats + '</span></div></div>';
    });
    el.innerHTML = html;
  }
}

// ==================== 可展开图表渲染 ====================

function parsePieData(rawStr) {
  // 解析类似 "汉族85%,回族8%,满族5%,蒙古族2%" 的字符串
  if (!rawStr) return [];
  var parts = rawStr.split(/[,，]/);
  var result = [];
  parts.forEach(function (p) {
    var match = p.match(/(.+?)(\d+\.?\d*)%/);
    if (match) result.push({ name: match[1].trim(), value: parseFloat(match[2]) });
    else { var m2 = p.match(/(.+?)(\d+\.?\d*)/); if (m2) result.push({ name: m2[1].trim(), value: parseFloat(m2[2]) }); }
  });
  return result;
}

function renderEthnicityPieChart() {
  var canvas = document.getElementById('ethnicityPieChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._ethnicityChart) window._ethnicityChart.destroy();
  var items = parsePieData(gameState.demo.ethnicity);
  if (!items.length) return;
  var colors = ['rgba(139,90,43,0.8)', 'rgba(74,60,49,0.8)', 'rgba(168,50,50,0.8)', 'rgba(45,80,22,0.8)', 'rgba(106,13,173,0.8)', 'rgba(30,64,175,0.8)', 'rgba(180,83,9,0.8)', 'rgba(75,85,99,0.8)', 'rgba(15,118,110,0.8)', 'rgba(219,39,119,0.8)'];
  window._ethnicityChart = new Chart(ctx, {
    type: 'pie',
    data: { labels: items.map(function (x) { return x.name; }), datasets: [{ data: items.map(function (x) { return x.value; }), backgroundColor: colors.slice(0, items.length), borderColor: '#f5f5dc', borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 }, padding: 6 } } } }
  });
}

function renderReligionPieChart() {
  var canvas = document.getElementById('religionPieChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._religionChart) window._religionChart.destroy();
  var items = parsePieData(gameState.demo.religion);
  if (!items.length) return;
  var colors = ['rgba(106,13,173,0.8)', 'rgba(30,64,175,0.8)', 'rgba(180,83,9,0.8)', 'rgba(45,80,22,0.8)', 'rgba(168,50,50,0.8)', 'rgba(139,90,43,0.8)', 'rgba(74,60,49,0.8)', 'rgba(15,118,110,0.8)'];
  window._religionChart = new Chart(ctx, {
    type: 'pie',
    data: { labels: items.map(function (x) { return x.name; }), datasets: [{ data: items.map(function (x) { return x.value; }), backgroundColor: colors.slice(0, items.length), borderColor: '#f5f5dc', borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 }, padding: 6 } } } }
  });
}

function recordPopGrowth() {
  var rate = parseFloat(gameState.demo.growth_rate) || 0;
  var month = extractGameMonth();
  if (!month) month = 'T' + turnCount;
  // 避免同一月重复记录
  if (popGrowthHistory.length > 0 && popGrowthHistory[popGrowthHistory.length - 1].month === month) return;
  popGrowthHistory.push({ month: month, rate: rate });
  if (popGrowthHistory.length > 5) popGrowthHistory = popGrowthHistory.slice(-5);
}

function renderPopGrowthChart() {
  var canvas = document.getElementById('popGrowthChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window._popGrowthChart) window._popGrowthChart.destroy();
  if (popGrowthHistory.length < 1) return;
  window._popGrowthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: popGrowthHistory.map(function (x) { return x.month; }),
      datasets: [{
        label: '人口增长率',
        data: popGrowthHistory.map(function (x) { return x.rate; }),
        borderColor: 'rgba(74,60,49,1)',
        backgroundColor: 'rgba(74,60,49,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(74,60,49,1)'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: { y: { beginAtZero: false, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderSideIndicators() {
  const m = gameState.macro;
  const gr = parseFloat(m.growth_rate) || 0;
  const unemp = parseFloat(m.unemployment) || 0;
  const gini = parseFloat(m.gini) || 0;
  const corr = parseFloat(gameState.admin.corruption) || 0;
  document.getElementById('side-econ').innerHTML =
    buildProgressBar('GDP增长', m.growth_rate, gr >= 0 ? 'bg-emerald-600' : 'bg-red-600') +
    buildProgressBar('失业率', m.unemployment, unemp > 6 ? 'bg-red-600' : unemp > 3 ? 'bg-amber-600' : 'bg-emerald-600') +
    '<div class="flex justify-between text-xs"><span>产业多样性</span><span>' + (gameState.econ.facilities.length >= 4 ? '高' : '中等') + '</span></div>';
  document.getElementById('side-social').innerHTML =
    buildProgressBar('腐败率', gameState.admin.corruption, corr > 40 ? 'bg-red-600' : corr > 15 ? 'bg-amber-600' : 'bg-emerald-600') +
    buildProgressBar('基尼系数', m.gini, gini > 0.5 ? 'bg-red-600' : gini > 0.35 ? 'bg-amber-600' : 'bg-emerald-600', 100) +
    buildProgressBar('行政负荷', gameState.admin.admin_load, 'bg-gray-600');
  const pol = gameState.land.pollution.split('/');
  document.getElementById('side-env').innerHTML =
    buildProgressBar('交通指数', gameState.land.traffic, 'bg-teal-600') +
    '<div class="flex justify-between text-xs"><span>空气污染</span><span class="text-[#b85c38]">⚠️ ' + (pol[0] || '') + '</span></div>' +
    '<div class="flex justify-between text-xs"><span>文化繁荣</span><span>' + (gameState.city.culture.split('|')[0] || '') + '</span></div>';
}

function buildProgressBar(label, value, color, scale) {
  var v = parseFloat(value) || 0;
  var displayVal = value;
  var pct = scale ? v * scale : (v > 1 && v <= 100 ? v : v * 100);
  // 对于0~1比例值，用scale=100来正确映射
  return '<div class="mb-1.5"><div class="flex justify-between text-xs mb-0.5"><span>' + label + '</span><span class="font-bold">' + displayVal + '</span></div><div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div class="h-full ' + color + ' rounded-full transition-all duration-500" style="width:' + Math.min(100, Math.max(0, pct)) + '%"></div></div></div>';
}

function renderNarrative() {
  document.getElementById('narrative-box').innerHTML = gameState.narrative || '<p class="text-gray-500">等待城市发展...</p>';
}

function renderNPC() {
  var el = document.getElementById('npc-sidebar');
  loadWorldBook();
  if (!worldBook || !worldBook.length) { el.innerHTML = '<p class="text-gray-500 text-xs text-center">暂无NPC</p>'; return; }
  // 按重要性排序
  var sorted = worldBook.slice().sort(function (a, b) { return (b.importance || 0) - (a.importance || 0); });
  var html = '<div class="space-y-1">';
  sorted.forEach(function (wb, idx) {
    if (!wb || !wb.name) return;
    var detailId = 'npc-detail-' + idx;
    var importanceLabel = '★' + (wb.importance || 0);
    var importanceColor = (wb.importance || 0) >= 8 ? 'text-red-500' : (wb.importance || 0) >= 5 ? 'text-amber-500' : 'text-gray-400';
    html += '<div class="bg-amber-50/80 rounded border border-[#6a0dad]/20 text-xs overflow-hidden">';
    // 可点击的摘要栏
    html += '<div class="flex justify-between items-center p-2 cursor-pointer hover:bg-amber-100/60 transition-colors npc-summary" onclick="toggleNPCDetail(\'' + detailId + '\')">';
    html += '<div class="flex items-center gap-2 min-w-0">';
    html += '<span class="text-xs ' + importanceColor + ' font-mono shrink-0">' + importanceLabel + '</span>';
    html += '<span class="font-bold text-[#6a0dad] truncate">' + escHtml(wb.name) + '</span>';
    html += '<span class="text-gray-500 truncate shrink-0">' + escHtml(wb.gender || '') + ' · ' + escHtml(wb.role || '') + '</span>';
    html += '</div>';
    html += '<span class="text-gray-400 text-xs shrink-0 ml-1 npc-toggle-icon">▶</span>';
    html += '</div>';
    // 详细内容（默认隐藏）
    html += '<div id="' + detailId + '" class="npc-detail-content hidden px-2 pb-2 border-t border-[#6a0dad]/10 pt-1">';
    html += '<div class="text-gray-600 mb-1"><span class="text-gray-500">性格：</span>' + escHtml(wb.personality || '—') + '</div>';
    html += '<div class="text-gray-600 mb-1"><span class="text-gray-500">立场：</span>' + escHtml(wb.stance || '—') + '</div>';
    html += '<div class="text-gray-600 mb-1"><span class="text-gray-500">外貌：</span>' + escHtml(wb.appearance || '—') + '</div>';
    html += '<div class="text-gray-500 text-xs mb-1 italic">' + escHtml(wb.background || '') + '</div>';
    html += '<div class="text-gray-400 text-xs mb-1">';
    html += '首次出现：第' + (wb.firstSeen || 0) + '回合 | 最近出现：第' + (wb.lastSeen || 0) + '回合';
    html += '</div>';
    // 历史动态
    if (wb.history && Array.isArray(wb.history) && wb.history.length > 0) {
      html += '<div class="mt-1 pt-1 border-t border-[#6a0dad]/5">';
      html += '<div class="text-gray-500 text-xs font-semibold mb-1">📋 历史动态</div>';
      var recent = wb.history.slice(-10);
      recent.forEach(function (h) {
        if (!h) return;
        html += '<div class="flex gap-1 text-xs text-gray-600 leading-relaxed">';
        html += '<span class="text-gray-400 shrink-0">[回合' + (h.turn || 0) + ']</span>';
        html += '<span>' + escHtml(h.expression || '') + ' · ' + escHtml(h.action || '');
        if (h.relation) html += ' | 关系：' + escHtml(h.relation);
        html += '</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>'; // detail-content
    html += '</div>'; // card
  });
  html += '</div>';
  el.innerHTML = html;
}

// 展开/折叠NPC详情
window.toggleNPCDetail = function (id) {
  var el = document.getElementById(id);
  if (!el) return;
  var isHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden');
  // 旋转箭头图标
  var summary = el.previousElementSibling;
  if (summary) {
    var icon = summary.querySelector('.npc-toggle-icon');
    if (icon) icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  }
};

function renderNotes() {
  if (!gameState.notes || !gameState.notes.length) { document.getElementById('notes-box').innerHTML = ''; return; }
  let html = '<details open class="bg-amber-50/90 rounded-lg border border-[#4a3c31]/20 mb-2"><summary class="p-2 cursor-pointer text-[#4a3c31] font-bold text-sm list-none">📜 市政官手记</summary><div class="px-2 pb-2">';
  gameState.notes.forEach((n, i) => { html += '<div class="text-xs text-gray-700 mb-1">' + (i + 1) + '. ' + n + '</div>'; });
  html += '</div></details>';
  document.getElementById('notes-box').innerHTML = html;
}

function renderNews() {
  var container = document.getElementById('news-content');
  if (!container) return;
  if (!gameState.news || typeof gameState.news !== 'object') { container.innerHTML = '<p class="text-gray-500 text-xs text-center col-span-2">暂无新闻</p>'; return; }
  var n = gameState.news;
  var html = '';
  // 市属媒体
  if (n.city_official && n.city_official.media) {
    html += '<div class="bg-blue-50/80 rounded-lg border border-blue-300/40 p-3"><div class="text-xs text-gray-400 mb-1">—— ' + escHtml(n.city_official.media) + ' ' + escHtml(n.city_official.date || '') + ' 第' + escHtml(n.city_official.edition || '') + ' ——</div><div class="text-sm font-bold text-blue-800 mb-1">' + escHtml(n.city_official.title || '') + '</div><div class="text-xs text-gray-700 leading-relaxed">' + escHtml(n.city_official.body || '') + '</div></div>';
  }
  // 外国媒体
  if (n.foreign && n.foreign.media) {
    html += '<div class="bg-purple-50/80 rounded-lg border border-purple-300/40 p-3"><div class="text-xs text-gray-400 mb-1">—— ' + escHtml(n.foreign.media) + ' ' + escHtml(n.foreign.date || '') + ' 第' + escHtml(n.foreign.edition || '') + ' ——</div><div class="text-sm font-bold text-purple-800 mb-1">' + escHtml(n.foreign.title || '') + '</div><div class="text-xs text-gray-700 leading-relaxed">' + escHtml(n.foreign.body || '') + '</div></div>';
  }
  // 社会媒体
  if (n.social && n.social.media) {
    html += '<div class="bg-orange-50/80 rounded-lg border border-orange-300/40 p-3"><div class="text-xs text-gray-400 mb-1">—— ' + escHtml(n.social.media) + ' ' + escHtml(n.social.date || '') + ' 第' + escHtml(n.social.edition || '') + ' ——</div><div class="text-sm font-bold text-orange-800 mb-1">' + escHtml(n.social.title || '') + '</div><div class="text-xs text-gray-700 leading-relaxed mb-1">' + escHtml(n.social.body || '') + '</div>';
    if (n.social.secretary_note) { html += '<div class="mt-1 pt-1 border-t border-orange-200/60 italic text-xs text-orange-600">💬 秘书提醒：' + escHtml(n.social.secretary_note) + '</div>'; }
    html += '</div>';
  }
  // 民间电台
  if (n.radio && n.radio.media) {
    html += '<div class="bg-green-50/80 rounded-lg border border-green-300/40 p-3"><div class="text-xs text-gray-400 mb-1">—— ' + escHtml(n.radio.media) + ' ' + escHtml(n.radio.time || '') + ' ——</div><div class="text-sm font-bold text-green-800 mb-1">' + escHtml(n.radio.program_name || '') + '</div><div class="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">' + escHtml(n.radio.body || '') + '</div></div>';
  }
  if (!html) { container.innerHTML = '<p class="text-gray-500 text-xs text-center col-span-2">暂无新闻</p>'; return; }
  container.innerHTML = html;
}
function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function renderCityFace() {
  var el = document.getElementById('cityface-box');
  if (!el) return;
  var face = gameState.city.face || '';
  var style = gameState.city.geo_text || '';
  var combined = face || style;
  if (face && style && face !== style) {
    combined = face + ' · ' + style;
  }
  var html = '<div class="flex flex-wrap gap-x-6 gap-y-1">';
  html += '<span><span class="text-gray-500">🏙️ 城市面貌：</span><span class="font-bold text-[#8b5a2b]">' + (combined || '—') + '</span></span>';
  html += '</div>';
  el.innerHTML = html;
}

// ==================== 广播字幕 ====================
function updateBroadcast() {
  var el = document.getElementById('broadcast-text');
  if (!el) return;
  if (broadcastSegments.length === 0) {
    el.textContent = '📢 欢迎收听城市之声...';
    return;
  }
  var combined = broadcastSegments.join('　◆　');
  if (combined !== el.textContent) {
    el.textContent = combined;
    var track = document.getElementById('broadcast-track');
    if (track) {
      track.style.animation = 'none';
      track.offsetHeight;
      track.style.animation = '';
    }
  }
}

function renderBroadcastBar() {
  var bar = document.getElementById('broadcast-bar');
  if (bar) bar.style.display = 'block';
  updateBroadcast();
}

function generateBroadcastContent() {
  var c = getConfig();
  if (!c.key) return;
  var cityInfo = '城市：' + (gameState.header.location || '') + '，时间：' + (gameState.header.time || '');
  var city = gameState.city || {};
  var macro = gameState.macro || {};
  var econ = gameState.econ || {};
  var eraHint = city.face || city.geo_text || '';
  var prompt = '你是城市电台的主持人，根据城市时代背景生成社会广播内容。\n\n要求：\n1. **推断城市所处时代**：根据城市信息判断（如：古典城邦/中世纪/近现代/架空世界观），内容风格须贴合该时代\n2. **内容类型**（选3-5项）：\n   - 时代流行风尚（古典乐/爵士乐/摇滚乐/街头潮流视时代而定）\n   - 社会热点（集市公告/新政传闻/舆论热议/社交话题）\n   - 时尚文化（衣着/饮食/娱乐/休闲方式）\n   - 天气预报与生活贴士（结合时代背景，如马车路况/交通实况）\n   - 名人动态（歌者/文人/贵族/球星/意见领袖视时代而定）\n   - 趣闻逸事\n3. 语气贴合时代（如：古典风格端庄典雅/近现代轻松活泼/架空世界奇幻有趣）\n4. **绝对不要**提及任何具体政策、改革、财政、税收、建设项目等\n5. 可以隐晦反映城市氛围（如"近日坊间议论纷纷"而非"因为XX政策"）\n6. 150字以内，分段用|分隔，中文输出\n\n格式：段落1|段落2|段落3\n\n背景信息：' + cityInfo + '\n城市特色：' + eraHint + '\n经济状态（仅供氛围参考）：' + (macro.growth_rate || '平稳') + '，' + (macro.unemployment || '');
  fetch(c.url + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: c.model || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 600, stream: false })
  }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var text = (data.choices[0].message.content || '').trim();
      var segments = text.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
      if (segments.length > 0) {
        broadcastSegments = segments;
        updateBroadcast();
        saveGame();
      }
    }).catch(function (err) { console.warn('广播生成失败:', err); });
}

// ==================== 市井百态：NPC生活观察（浮动面板模式） ====================
function openNPClifeModal() {
  var modal = document.getElementById('npc-life-modal');
  if (!modal) return;
  renderNPCLifeList();
  modal.classList.remove('hidden');
}

function closeNPClifeModal() {
  var modal = document.getElementById('npc-life-modal');
  if (modal) modal.classList.add('hidden');
}

function renderNPCLifeList() {
  var el = document.getElementById('npc-life-content');
  var actions = document.getElementById('npc-life-modal-actions');
  if (!el) return;
  if (pinnedNPCs.length === 0) {
    el.innerHTML = '<p class="text-sm text-gray-500 text-center py-6">暂无钉选的观察对象。<br>点击下方按钮添加第一个观察对象。</p>';
    if (actions) actions.innerHTML = '<button onclick="addNewNPCCard()" class="bg-[#d35400] hover:opacity-80 text-white py-2 px-4 rounded-lg font-bold text-sm">➕ 添加观察对象</button>';
    return;
  }
  var html = '';
  pinnedNPCs.forEach(function (npc, idx) {
    var latest = npc.dailyLog && npc.dailyLog.length > 0 ? npc.dailyLog[npc.dailyLog.length - 1] : null;
    var lastDay = latest ? latest.day : '尚未更新';
    var lastText = latest ? latest.text : '等待首日记录...';
    html += '<div class="bg-white rounded-lg p-3 border border-[#d35400]/20 shadow-sm">';
    html += '<div class="flex justify-between items-start mb-2">';
    html += '<div><p class="font-bold text-[#d35400]">' + npc.name + '</p><p class="text-xs text-gray-500">' + npc.job + ' · ' + npc.age + '岁 · ' + (npc.trait || '') + '</p></div>';
    html += '<div class="flex items-center gap-2">';
    html += '<label class="flex items-center text-xs text-blue-600 cursor-pointer"><input type="checkbox" class="npc-refresh-cb mr-1" value="' + idx + '"' + (npc.pendingRefresh ? ' checked' : '') + '>下回合换人</label>';
    html += '<button onclick="removePinnedNPC(' + idx + ')" class="text-gray-400 hover:text-red-500 text-xs px-1">✕</button>';
    html += '</div></div>';
    html += '<p class="text-[10px] text-gray-400 mb-1">📅 ' + lastDay + '</p>';
    html += '<p class="text-sm text-gray-700 leading-relaxed">' + lastText + '</p>';
    if (npc.dailyLog && npc.dailyLog.length > 3) {
      html += '<details class="mt-2"><summary class="text-xs text-gray-400 cursor-pointer">查看历史(' + (npc.dailyLog.length - 1) + '条)</summary>';
      npc.dailyLog.slice(0, -1).reverse().forEach(function (log) {
        html += '<p class="text-xs text-gray-400 mt-1"><span class="font-semibold">' + log.day + ':</span> ' + log.text + '</p>';
      });
      html += '</details>';
    }
    html += '</div>';
  });
  el.innerHTML = html;
  document.querySelectorAll('.npc-refresh-cb').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var idx = parseInt(this.value);
      pinnedNPCs[idx].pendingRefresh = this.checked;
      saveGame();
    });
  });
  if (actions) {
    actions.innerHTML = '<button onclick="addNewNPCCard()" class="bg-[#d35400] hover:opacity-80 text-white py-2 px-4 rounded-lg font-bold text-sm">➕ 添加观察对象</button>';
  }
}

function removePinnedNPC(idx) {
  if (!confirm('确定取消观察 ' + pinnedNPCs[idx].name + ' 吗？')) return;
  pinnedNPCs.splice(idx, 1);
  saveGame();
  renderNPCLifeList();
}

function addNewNPCCard() {
  var idx = pinnedNPCs.length;
  pinnedNPCs.push({ name: '待定市民' + (idx + 1), age: 0, job: '待定', trait: '', background: '', dailyLog: [], lastUpdate: '', pendingRefresh: true });
  saveGame();
  renderNPCLifeList();
  setTimeout(function () {
    var inputs = document.querySelectorAll('.npc-name-input');
    if (inputs[idx]) { inputs[idx].focus(); inputs[idx].select(); }
  }, 50);
}

function updatePinnedNPCDaily() {
  if (pinnedNPCs.length === 0) return;
  var c = getConfig();
  if (!c.key) return;
  var gameTime = gameState.header.time || '';
  var dayMatch = gameTime.match(/(\d+)年(\d+)月(\d+)日/);
  if (!dayMatch) return;
  var today = dayMatch[1] + '年' + dayMatch[2] + '月' + dayMatch[3] + '日';
  if (_npcLifeLastDay === today) return;
  _npcLifeLastDay = today;
  var needsRefresh = pinnedNPCs.filter(function (n) { return n.pendingRefresh; });
  var needsDailyUpdate = pinnedNPCs.filter(function (n) { return !n.pendingRefresh; });
  var macro = gameState.macro || {};
  var city = gameState.city || {};
  if (needsDailyUpdate.length > 0) {
    var npcNames = needsDailyUpdate.map(function (n) { return n.name + '(' + n.job + ')'; }).join('、');
    var prompt = '你是底层市民生活的观察者，描述以下普通市民今天的日常生活片段。\n\n要求：\n1. 为每个人物生成100字以内的生活片段，描写他们今天的普通生活\n2. **只描写普通市民的日常生活**：早餐、上班路上的见闻、工作内容、下班后的活动等\n3. **可以隐晦地**反映玩家决策带来的影响（如"今天物价涨了，买菜多花了不少钱"而非"因为税收政策..."），但比例控制在10%以内\n4. 每个片段用|分隔，顺序对应人物列表\n5. 语言朴实自然，像真实的人物日记\n6. **绝对不要**写成官员、商人或名人的视角\n\n人物：' + npcNames + '\n城市：' + (gameState.header.location || '') + '\n时间：' + gameTime + '\n当前城市状态（仅供隐晦参考）：' + '\n经济：' + (macro.growth_rate || '正常') + '，' + (macro.unemployment || '') + '\n社会：' + (city.housing || '稳定');
    fetch(c.url + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: c.model || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 1500, stream: false })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var text = (data.choices[0].message.content || '').trim();
        var segments = text.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
        if (segments.length > 0) {
          needsDailyUpdate.forEach(function (npc, idx) {
            if (segments[idx]) {
              npc.dailyLog.push({ day: today, text: segments[idx] });
              if (npc.dailyLog.length > 30) npc.dailyLog.shift();
            }
          });
          saveGame();
          renderNPCLifeList();
        }
      }).catch(function (err) { console.warn('NPC每日更新失败:', err); });
  }
  if (needsRefresh.length > 0) {
    var cityName = gameState.header.location || '这座城市';
    var pop = (gameState.demo || {}).population || '数万';
    var econ = gameState.econ || {};
    var jobs = [];
    if (econ.facilities) econ.facilities.forEach(function (f) { if (f.type) jobs.push(f.type); });
    if (jobs.length === 0) jobs = ['工厂工人', '小商贩', '服务员', '清洁工', '出租车司机', '快递员', '摊贩', '保安'];
    var existingNames = pinnedNPCs.map(function (n) { return n.name; }).join('、');
    var prompt = '你是城市社会学研究者，为以下观察槽位生成' + needsRefresh.length + '个新的底层市民档案。\n\n要求：\n1. **必须是底层普通市民**：工人、小贩、服务员、摊贩、保安、清洁工等，**绝对不能是官员、商人、贵族、名人**\n2. 每个人物：name(姓名)、age(年龄20-60)、job(职业)、trait(性格特征)、background(一句话背景)\n3. **姓名必须与以下已有市民不同**：' + existingNames + '\n4. JSON数组：[{name,age,job,trait,background}]\n5. 只输出JSON\n\n职业池：' + jobs.join('、') + '\n城市：' + cityName + '，人口：' + pop;
    fetch(c.url + '/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: c.model || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 1200, stream: false })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var text = (data.choices[0].message.content || '').trim();
        var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\[[\s\S]*\])/);
        if (!jsonMatch) throw new Error('未找到JSON');
        var newNPCs = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        if (!Array.isArray(newNPCs) || newNPCs.length === 0) throw new Error('解析失败');
        needsRefresh.forEach(function (npc, idx) {
          if (newNPCs[idx]) {
            npc.name = newNPCs[idx].name;
            npc.age = newNPCs[idx].age;
            npc.job = newNPCs[idx].job;
            npc.trait = newNPCs[idx].trait || '';
            npc.background = newNPCs[idx].background || '';
            npc.pendingRefresh = false;
            npc.dailyLog = [];
          }
        });
        saveGame();
        renderNPCLifeList();
      }).catch(function (err) { console.warn('NPC刷新生成失败:', err); });
  }
}

function checkDailyUpdates() {
  var gameTime = gameState.header.time || '';
  var dayMatch = gameTime.match(/(\d+)年(\d+)月(\d+)日/);
  if (!dayMatch) return;
  var today = dayMatch[1] + '年' + dayMatch[2] + '月' + dayMatch[3] + '日';
  if (_broadcastLastDay !== today || broadcastSegments.length === 0) {
    _broadcastLastDay = today;
    generateBroadcastContent();
  }
  if (_npcLifeLastDay !== today || pinnedNPCs.length === 0) {
    if (pinnedNPCs.length === 0) {
      _npcLifeLastDay = today;
      autoInitNPCCandidates();
    } else {
      _npcLifeLastDay = today;
      updatePinnedNPCDaily();
    }
  }
}

function autoInitNPCCandidates() {
  var c = getConfig();
  if (!c.key) return;
  var cityName = gameState.header.location || '这座城市';
  var pop = (gameState.demo || {}).population || '数万';
  var econ = gameState.econ || {};
  var jobs = [];
  if (econ.facilities) econ.facilities.forEach(function (f) { if (f.type) jobs.push(f.type); });
  if (jobs.length === 0) jobs = ['工厂工人', '小商贩', '服务员', '清洁工', '出租车司机', '快递员', '摊贩', '保安'];
  var prompt = '你是城市社会学研究者，为旧存档迁移生成3个底层市民档案。\n\n要求：\n1. **必须是底层普通市民**，绝对不能是官员、商人、贵族、名人\n2. 每个人物：name(姓名)、age(年龄20-60)、job(职业)、trait(性格特征)、background(一句话背景)\n3. JSON数组格式：[{name,age,job,trait,background}]\n4. 只输出JSON，不要其他文字\n\n职业池：' + jobs.join('、') + '\n城市：' + cityName + '，人口：' + pop;
  fetch(c.url + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: c.model || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 800, stream: false })
  }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var text = (data.choices[0].message.content || '').trim();
      var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\[[\s\S]*\])/);
      if (!jsonMatch) throw new Error('未找到JSON');
      var candidates = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (!Array.isArray(candidates) || candidates.length === 0) throw new Error('解析失败');
      candidates.forEach(function (npc) {
        var exists = pinnedNPCs.some(function (p) { return p.name === npc.name; });
        if (!exists) {
          pinnedNPCs.push({ name: npc.name, age: npc.age, job: npc.job, trait: npc.trait || '', background: npc.background || '', dailyLog: [], lastUpdate: '' });
        }
      });
      saveGame();
      renderNPCLifeList();
    }).catch(function (err) { console.warn('旧存档NPC初始化失败:', err); });
}

function autoInitBroadcast() {
  var c = getConfig();
  if (!c.key) return;
  var cityInfo = '城市：' + (gameState.header.location || '') + '，时间：' + (gameState.header.time || '');
  var city = gameState.city || {};
  var macro = gameState.macro || {};
  var eraHint = city.face || city.geo_text || '';
  var prompt = '你是城市电台主持人，为旧存档迁移生成一段社会广播内容。\n\n要求：\n1. 根据城市信息推断时代背景（古典/中世纪/近现代/架空），内容贴合时代\n2. 内容：时代流行风尚、社会热点、时尚文化、天气预报与生活贴士、名人动态、趣闻逸事等\n3. 语气贴合时代，150字以内，分3段用|分隔\n4. 绝对不要提及任何具体政策、改革、财政等\n5. 格式：段落1|段落2|段落3\n\n背景：' + cityInfo + '\n城市特色：' + eraHint + '\n氛围：' + (macro.political_stability || '稳定');
  fetch(c.url + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: c.model || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 400, stream: false })
  }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var text = (data.choices[0].message.content || '').trim();
      var segments = text.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
      if (segments.length > 0) {
        broadcastSegments = segments;
        updateBroadcast();
        saveGame();
      }
    }).catch(function (err) { console.warn('旧存档广播初始化失败:', err); });
}

// ==================== 城市情报地图 ====================
// 地形类型→颜色映射（rgb值用于canvas绘制）
var MAP_REGION_COLORS = {
  // 自然地形
  ocean: { hex: '#1a5276', rgb: [26, 82, 118] },
  mountain: { hex: '#6c7a89', rgb: [108, 122, 137] },
  river: { hex: '#2471a3', rgb: [36, 113, 163] },
  lake: { hex: '#2e86c1', rgb: [46, 134, 193] },
  forest: { hex: '#1e8449', rgb: [30, 132, 73] },
  desert: { hex: '#e8c35c', rgb: [232, 195, 92] },
  swamp: { hex: '#7d6608', rgb: [125, 102, 8] },
  plain: { hex: '#c5dca0', rgb: [197, 220, 160] },
  // 人工区划
  road: { hex: '#839192', rgb: [131, 145, 146] },
  residential: { hex: '#f5b041', rgb: [245, 176, 65] },
  commercial: { hex: '#e74c3c', rgb: [231, 76, 60] },
  industrial: { hex: '#7f8c8d', rgb: [127, 140, 141] },
  suburb: { hex: '#a8d5a2', rgb: [168, 213, 162] },
  transport: { hex: '#5d6d7e', rgb: [93, 109, 126] }
};

// ==================== 形状栅格化引擎 ====================
// 形状扰动：给AI返回的规整形状添加小幅度随机不规则
var _shapeSeed = 0;
function _perturbShape(region) {
  var key = JSON.stringify(region);
  var hash = 0;
  for (var i = 0; i < key.length; i++) { hash = ((hash << 5) - hash) + key.charCodeAt(i); hash |= 0; }
  _shapeSeed = Math.abs(hash) || 1;
  function prng() { _shapeSeed = (_shapeSeed * 1103515245 + 12345) & 0x7fffffff; return (_shapeSeed / 0x7fffffff) * 2 - 1; }
  var p = JSON.parse(JSON.stringify(region.params || {}));
  var s = region.shape;
  // 标准化字段名：兼容 AI 可能使用的别名
  if (!p.verts && p.vertices) p.verts = p.vertices;
  if (!p.verts && p.points) p.verts = p.points;
  if (!p.start && p.from) p.start = p.from;
  if (!p.end && p.to) p.end = p.to;
  if (!p.width && p.w) p.width = p.w;
  if (!p.xs && p.xCoords) { p.xs = p.xCoords; p.ys = p.yCoords || []; }
  // 兼容 AI 可能使用的 path 格式（点坐标数组）
  if (!p.xs && Array.isArray(p.path) && p.path.length > 0 && typeof p.path[0] === 'object') {
    p.xs = []; p.ys = [];
    for (var pi = 0; pi < p.path.length; pi++) { p.xs.push(p.path[pi][0]); p.ys.push(p.path[pi][1]); }
  }
  // 兼容 AI 可能使用的 points 格式（用于河流等多段线）
  if (!p.xs && Array.isArray(p.points) && p.points.length > 0 && typeof p.points[0] === 'object') {
    p.xs = []; p.ys = [];
    for (var pi = 0; pi < p.points.length; pi++) { p.xs.push(p.points[pi][0]); p.ys.push(p.points[pi][1]); }
  }
  // 兼容 AI 可能使用的 x1/y1/x2/y2 线段格式
  if (!p.start && p.x1 !== undefined) { p.start = [Number(p.x1), Number(p.y1)]; p.end = [Number(p.x2), Number(p.y2)]; }
  if (s === 'rect' && p.w > 1 && p.h > 1) {
    p.x += prng() * 0.2; p.y += prng() * 0.2;
    p.w += prng() * 0.15; p.h += prng() * 0.15;
  } else if (s === 'circle' && p.r > 1) {
    p.cx += prng() * 0.3; p.cy += prng() * 0.3;
    p.r += prng() * 0.2;
  } else if (s === 'polygon' && p.verts) {
    for (var j = 0; j < p.verts.length; j++) {
      p.verts[j][0] = Number(p.verts[j][0]) + prng() * 0.25;
      p.verts[j][1] = Number(p.verts[j][1]) + prng() * 0.25;
    }
  } else if (s === 'line') {
    // 单段线: start/end 点
    if (p.start && p.end) {
      p.start[0] = Number(p.start[0]) + prng() * 0.2; p.start[1] = Number(p.start[1]) + prng() * 0.2;
      p.end[0] = Number(p.end[0]) + prng() * 0.2; p.end[1] = Number(p.end[1]) + prng() * 0.2;
    }
    // 多段线: xs/ys 数组
    if (p.xs && p.ys) {
      for (var k = 0; k < p.xs.length && k < p.ys.length; k++) {
        p.xs[k] = Number(p.xs[k]) + prng() * 0.2;
        p.ys[k] = Number(p.ys[k]) + prng() * 0.2;
      }
    }
  }
  return p;
}
// 将region列表渲染到内部像素缓冲区，返回二维布尔数组（哪些格子被该region占据）
function rasterizeRegion(region, gridSize) {
  var buf = [];
  for (var y = 0; y < gridSize; y++) { buf[y] = (new Array(gridSize)).fill(false); }
  var shape = region.shape;
  var p = _perturbShape(region);

  if (shape === 'rect') {
    var rx = Math.max(0, Math.round(p.x || 0));
    var ry = Math.max(0, Math.round(p.y || 0));
    var rw = Math.max(1, Math.round(p.w || 1));
    var rh = Math.max(1, Math.round(p.h || 1));
    for (var y = ry; y < Math.min(gridSize, ry + rh); y++) {
      for (var x = rx; x < Math.min(gridSize, rx + rw); x++) {
        buf[y][x] = true;
      }
    }
  } else if (shape === 'circle') {
    var cx = Number(p.cx), cy = Number(p.cy), r = Number(p.r);
    if (isNaN(cx) || isNaN(cy) || isNaN(r) || r <= 0) return buf;
    for (var y = 0; y < gridSize; y++) {
      for (var x = 0; x < gridSize; x++) {
        var dx2 = x - cx, dy2 = y - cy;
        if (dx2 * dx2 + dy2 * dy2 <= r * r) buf[y][x] = true;
      }
    }
  } else if (shape === 'polygon') {
    var verts = p.verts;
    if (!verts || verts.length < 3) return buf;
    // 钳制顶点到网格边界：AI 可能生成远超 grid_size 的坐标
    for (var vi = 0; vi < verts.length; vi++) {
      verts[vi][0] = Math.max(0, Math.min(gridSize - 1, Math.round(Number(verts[vi][0]))));
      verts[vi][1] = Math.max(0, Math.min(gridSize - 1, Math.round(Number(verts[vi][1]))));
      if (isNaN(verts[vi][0]) || isNaN(verts[vi][1])) return buf;
    }
    for (var y = 0; y < gridSize; y++) {
      for (var x = 0; x < gridSize; x++) {
        var inside = false;
        for (var i = 0, j = verts.length - 1; i < verts.length; j = i++) {
          var xi = verts[i][0], yi = verts[i][1];
          var xj = verts[j][0], yj = verts[j][1];
          if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
          }
        }
        if (inside) buf[y][x] = true;
      }
    }
  } else if (shape === 'line') {
    var lw = Math.max(0, Math.floor((p.width || p.w || 1) - 1));
    // 多段线: xs/ys 数组（河流等曲线）
    if (p.xs && p.ys && p.xs.length > 1) {
      for (var seg = 0; seg < p.xs.length - 1; seg++) {
        var sx = Math.round(Number(p.xs[seg])), sy = Math.round(Number(p.ys[seg]));
        var ex = Math.round(Number(p.xs[seg + 1])), ey = Math.round(Number(p.ys[seg + 1]));
        if (isNaN(sx) || isNaN(sy) || isNaN(ex) || isNaN(ey)) continue;
        sx = Math.max(0, Math.min(gridSize - 1, sx));
        sy = Math.max(0, Math.min(gridSize - 1, sy));
        ex = Math.max(0, Math.min(gridSize - 1, ex));
        ey = Math.max(0, Math.min(gridSize - 1, ey));
        var dx = Math.abs(ex - sx), dy = Math.abs(ey - sy);
        var sxSign = sx < ex ? 1 : -1, sySign = sy < ey ? 1 : -1;
        var err = dx - dy;
        var cx = sx, cy = sy;
        while (true) {
          for (var ow = -lw; ow <= lw; ow++) {
            var px, py;
            if (dx > dy) { px = cx; py = cy + ow; }
            else { px = cx + ow; py = cy; }
            if (py >= 0 && py < gridSize && px >= 0 && px < gridSize) buf[py][px] = true;
          }
          if (cx === ex && cy === ey) break;
          var e2 = 2 * err;
          if (e2 > -dy) { err -= dy; cx += sxSign; }
          if (e2 < dx) { err += dx; cy += sySign; }
        }
      }
    } else {
      // 单段线: start/end 点
      var sx = Math.round(Number(p.start ? p.start[0] : 0)), sy = Math.round(Number(p.start ? p.start[1] : 0));
      var ex = Math.round(Number(p.end ? p.end[0] : 0)), ey = Math.round(Number(p.end ? p.end[1] : 0));
      if (isNaN(sx) || isNaN(sy) || isNaN(ex) || isNaN(ey)) { /* skip */ }
      else {
        sx = Math.max(0, Math.min(gridSize - 1, sx));
        sy = Math.max(0, Math.min(gridSize - 1, sy));
        ex = Math.max(0, Math.min(gridSize - 1, ex));
        ey = Math.max(0, Math.min(gridSize - 1, ey));
        var dx = Math.abs(ex - sx), dy = Math.abs(ey - sy);
        var sxSign = sx < ex ? 1 : -1, sySign = sy < ey ? 1 : -1;
        var err = dx - dy;
        var cx = sx, cy = sy;
        while (true) {
          for (var ow = -lw; ow <= lw; ow++) {
            var px, py;
            if (dx > dy) { px = cx; py = cy + ow; }
            else { px = cx + ow; py = cy; }
            if (py >= 0 && py < gridSize && px >= 0 && px < gridSize) buf[py][px] = true;
          }
          if (cx === ex && cy === ey) break;
          var e2 = 2 * err;
          if (e2 > -dy) { err -= dy; cx += sxSign; }
          if (e2 < dx) { err += dx; cy += sySign; }
        }
      }
    }
  }
  return buf;
}

// ==================== 区划权重生成系统 ====================
// 硬约束：不可建造地形 = ocean, mountain, river, lake（swamp 可建但有惩罚）
var _UNBUILDABLE = { ocean: true, mountain: true, river: true, lake: true };
function _isBuildable(cellType) { return !_UNBUILDABLE[cellType]; }
function _cellKey(x, y) { return x * 100 + y; }
function _isWaterType(t) { return t === 'ocean' || t === 'river' || t === 'lake'; }
// ============ 确定性伪随机数生成器（种子存 localStorage，刷新后地图一致）============
function _hashSeed(str) { var h = 0; for (var i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; } return h; }
function _makePrng(seed) {
  var s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 权重计算：以市政厅为中心快速衰减 + 邻近同类型极强加成 + 孤立区划严重惩罚
function _calcDistrictWeight(x, y, dType, dName, dGrid, size, chX, chY, waterEdge, waterCells, oceanCells) {
  var w = 0.00001; // 极微基础权重，孤立格子几乎不可能被选中
  var dist = Math.sqrt((x - chX) * (x - chX) + (y - chY) * (y - chY));
  var maxDist = Math.sqrt(size * size + size * size);
  // 距离从中心极速衰减（σ²缩小到0.04，离市中心越远权重断崖式下跌）
  var distFactor = Math.exp(-dist * dist / (maxDist * maxDist * 0.04));
  // 统计相邻格子类型
  var sameAdj = 0, anyAdj = 0, roadAdj = 0, resAdj = 0, comAdj = 0, indAdj = 0, transAdj = 0, waterAdj = 0, oceanAdj = 0;
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      var nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      if (waterCells[_cellKey(nx, ny)]) { waterAdj++; if (oceanCells[_cellKey(nx, ny)]) oceanAdj++; }
      if (dGrid[ny][nx]) {
        anyAdj++;
        var adjType = dGrid[ny][nx].type;
        if (adjType === dType) sameAdj++;
        if (adjType === 'road') roadAdj++;
        if (adjType === 'residential') resAdj++;
        if (adjType === 'commercial') comAdj++;
        if (adjType === 'industrial') indAdj++;
        if (adjType === 'transport') transAdj++;
      }
    }
  }
  // 孤立惩罚：无任何相邻格子时权重极低（只有非常靠近中心才略有希望）
  if (anyAdj === 0) {
    // 例外：沿海区划第一块必须在海边，不能被孤立惩罚带走
    if (dName && (dName.indexOf('海') >= 0 || dName.indexOf('港') >= 0 || dName.indexOf('湾') >= 0 || dName.indexOf('滨') >= 0)) {
      var isWater = waterEdge.hasOwnProperty(_cellKey(x, y));
      if (dName.indexOf('港') >= 0) {
        // "港"=港口：海>河湖，邻海时权重碾压一切，邻河湖次之
        var hasOcean = oceanAdj > 0;
        return hasOcean ? 5.0 : (isWater ? 0.5 : 0.00000001);
      }
      // "海""滨""湾"：任意水边均可
      return isWater ? 1.0 : 0.00000001;
    }
    return dist < size * 0.15 ? distFactor * 0.00001 : 0.0000001;
  }
  // 强化聚类奖励（指数放大，确保同类型连片）
  var clusterBonus = sameAdj === 0 ? 1 : Math.pow(7, sameAdj);
  var isWaterEdge = waterEdge.hasOwnProperty(_cellKey(x, y));
  var waterBonus = isWaterEdge ? (1 + waterAdj * 0.5) : 1;
  // 名称含"海""港""湾""滨"：强制拉到水边，距离衰减无法压制
  var nameWaterBonus = 1;
  if (dName && (dName.indexOf('海') >= 0 || dName.indexOf('港') >= 0 || dName.indexOf('湾') >= 0 || dName.indexOf('滨') >= 0)) {
    if (dName.indexOf('港') >= 0) {
      // "港"=港口：海边>>河边>>无水(极罚)
      var hasOcean = oceanAdj > 0;
      nameWaterBonus = hasOcean ? Math.pow(30, 1 + oceanAdj) : (isWaterEdge ? Math.pow(8, 1 + waterAdj) : 0.00001);
    } else {
      // "海""滨""湾"：任意水边强力加成
      nameWaterBonus = isWaterEdge ? Math.pow(20, 1 + waterAdj) : 0.0001;
    }
  }
  // 类型特定因子
  switch (dType) {
    case 'road':
      w = 0.05 + (anyAdj > 0 ? Math.pow(3.5, anyAdj) : 0.0005);
      if (isWaterEdge && waterAdj >= 2) w *= 1.8;
      w *= nameWaterBonus;
      break;
    case 'residential':
      w = distFactor * clusterBonus;
      if (roadAdj > 0) w *= Math.pow(2.5, roadAdj);
      if (resAdj > 0) w *= Math.pow(3.0, resAdj); // 极度偏好成片居住
      if (comAdj > 0) w *= Math.pow(1.5, comAdj);
      var nearInd = false;
      for (var dy2 = -2; dy2 <= 2; dy2++) {
        for (var dx2 = -2; dx2 <= 2; dx2++) {
          var nx2 = x + dx2, ny2 = y + dy2;
          if (nx2 >= 0 && nx2 < size && ny2 >= 0 && ny2 < size && dGrid[ny2][nx2] && dGrid[ny2][nx2].type === 'industrial') nearInd = true;
        }
      }
      if (nearInd) w *= 0.04;
      if (isWaterEdge) w *= 2.5 * (1 + waterAdj * 0.4);
      w *= nameWaterBonus;
      break;
    case 'commercial':
      w = distFactor * clusterBonus;
      if (dist < size * 0.25) w *= 5.0; // 中心圈内极强偏好
      else if (dist < size * 0.45) w *= 2.0;
      if (roadAdj > 0) w *= Math.pow(2.0, roadAdj);
      if (resAdj > 0) w *= Math.pow(2.5, resAdj);
      if (comAdj > 0) w *= Math.pow(2.5, comAdj); // 商业集聚
      if (isWaterEdge) w *= 1.8 * (1 + waterAdj * 0.3);
      w *= nameWaterBonus;
      break;
    case 'industrial':
      w = (1 - distFactor) * clusterBonus;
      if (isWaterEdge) w *= 3.5;
      if (dist < size * 0.25) w *= 0.04; // 严格禁入中心圈
      if (sameAdj > 0) w *= Math.pow(3.0, sameAdj); // 工业成片集聚
      if (roadAdj > 0) w *= Math.pow(1.8, roadAdj);
      if (resAdj > 0) w *= 0.1; // 远离居住
      w *= nameWaterBonus;
      break;
    case 'suburb':
      w = (1 - distFactor * 0.25) * clusterBonus;
      if (sameAdj > 0) w *= Math.pow(3.0, sameAdj);
      if (roadAdj > 0) w *= Math.pow(2.0, roadAdj);
      if (isWaterEdge) w *= 1.6;
      w *= nameWaterBonus;
      break;
    case 'transport':
      if (isWaterEdge) w = 8.0 * clusterBonus;
      else if (roadAdj > 0) w = 3.0 * clusterBonus * Math.pow(2.0, roadAdj);
      else if (anyAdj > 0) w = 0.6 * clusterBonus;
      else w = 0.001;
      w *= nameWaterBonus;
      break;
    default:
      w = distFactor * clusterBonus;
  }
  return Math.max(0.00002, w);
}
// 道路锚点策略生成函数：先选择不超过3个靠近城区的锚点，再用线条连接到最近道路/边界
function generateRoadWithAnchorStrategy(dist, dGrid, size, buildableSet, waterCells, districtCells, placedCells) {
  var target = dist.blocks || 0;
  var key = 'road|' + (dist.name || '');
  var _rand2 = _makePrng(_hashSeed('road_' + key + '_' + size));
  var placedCount = 0;

  // 步骤1：找到所有城区附近的可建造格子作为锚点候选
  var anchorCandidates = [];
  var distKeys = Object.keys(districtCells);
  for (var i = 0; i < distKeys.length; i++) {
    var ck = distKeys[i];
    var col = Math.floor(parseInt(ck, 10) / 100);
    var row = parseInt(ck, 10) % 100;
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        var nc = col + dc, nr = row + dr;
        if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
        var nk = _cellKey(nc, nr);
        if (!buildableSet[nk]) continue;
        if (dGrid[nr][nc] !== null) continue;
        if (waterCells[nk]) continue;
        var distToDistrict = Math.abs(dc) + Math.abs(dr);
        var weight = Math.pow(10, 3 - distToDistrict) * (0.9 + _rand2() * 0.1);
        anchorCandidates.push({ col: nc, row: nr, w: weight });
      }
    }
  }

  // 步骤2：选择不超过3个锚点
  anchorCandidates.sort(function (a, b) { return b.w - a.w; });
  var anchors = [];
  var anchorSet = {};
  var maxAnchors = Math.min(3, anchorCandidates.length);
  for (var i = 0; i < maxAnchors && anchors.length < 3; i++) {
    var cand = anchorCandidates[i];
    var ck = _cellKey(cand.col, cand.row);
    if (!anchorSet[ck]) { anchors.push(cand); anchorSet[ck] = true; }
  }

  if (anchors.length === 0) {
    for (var r = 0; r < size && placedCount < target; r++) {
      for (var c = 0; c < size && placedCount < target; c++) {
        if (buildableSet[_cellKey(c, r)] && dGrid[r][c] === null && !waterCells[_cellKey(c, r)]) {
          placeRoadCell(c, r);
        }
      }
    }
    return;
  }

  // 步骤3：为每个锚点连接到最近的边界
  for (var ai = 0; ai < anchors.length; ai++) {
    var anchor = anchors[ai];
    if (placedCount < target && buildableSet[_cellKey(anchor.col, anchor.row)] && dGrid[anchor.row][anchor.col] === null) {
      placeRoadCell(anchor.col, anchor.row);
    }
    var nearest = findNearestBoundary(anchor.col, anchor.row, size);
    if (nearest) {
      var path = linePath(anchor.col, anchor.row, nearest.col, nearest.row);
      for (var pi = 0; pi < path.length && placedCount < target; pi++) {
        var p = path[pi];
        if (buildableSet[_cellKey(p.x, p.y)] && dGrid[p.y][p.x] === null && !waterCells[_cellKey(p.x, p.y)]) {
          placeRoadCell(p.x, p.y);
        }
      }
    }
  }

  // 步骤4：填充剩余道路块
  if (placedCount < target) {
    var roadFrontier = {};
    for (var i = 0; i < placedCells.length; i++) {
      var pc = placedCells[i];
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          var nc = pc.col + dc, nr = pc.row + dr;
          if (nc >= 0 && nc < size && nr >= 0 && nr < size) {
            var nk = _cellKey(nc, nr);
            if (buildableSet[nk] && dGrid[nr][nc] === null && !waterCells[nk]) {
              roadFrontier[nk] = true;
            }
          }
        }
      }
    }
    var frontierList = Object.keys(roadFrontier);
    frontierList.sort(function () { return _rand2() > 0.5 ? 1 : -1; });
    for (var fi = 0; fi < frontierList.length && placedCount < target; fi++) {
      var fk = frontierList[fi];
      var fc = Math.floor(parseInt(fk, 10) / 100);
      var fr = parseInt(fk, 10) % 100;
      if (buildableSet[fk] && dGrid[fr][fc] === null && !waterCells[fk]) {
        placeRoadCell(fc, fr);
      }
    }
  }

  function placeRoadCell(col, row) {
    dGrid[row][col] = { type: 'road', name: dist.name || '', status: dist.status || '', key: key };
    placedCells.push({ col: col, row: row });
    delete buildableSet[_cellKey(col, row)];
    placedCount++;
  }

  function findNearestBoundary(startCol, startRow, size) {
    var minDist = Infinity;
    var nearest = null;
    for (var c = 0; c < size; c++) {
      var distTop = Math.abs(c - startCol) + Math.abs(0 - startRow);
      if (distTop < minDist) { minDist = distTop; nearest = { col: c, row: 0 }; }
      var distBottom = Math.abs(c - startCol) + Math.abs(size - 1 - startRow);
      if (distBottom < minDist) { minDist = distBottom; nearest = { col: c, row: size - 1 }; }
    }
    for (var r = 0; r < size; r++) {
      var distLeft = Math.abs(0 - startCol) + Math.abs(r - startRow);
      if (distLeft < minDist) { minDist = distLeft; nearest = { col: 0, row: r }; }
      var distRight = Math.abs(size - 1 - startCol) + Math.abs(r - startRow);
      if (distRight < minDist) { minDist = distRight; nearest = { col: size - 1, row: r }; }
    }
    return nearest;
  }

  function linePath(x1, y1, x2, y2) {
    var path = [];
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var sx = x1 < x2 ? 1 : -1;
    var sy = y1 < y2 ? 1 : -1;
    var err = dx - dy;
    var x = x1, y = y1;
    while (x !== x2 || y !== y2) {
      path.push({ x: x, y: y });
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    path.push({ x: x2, y: y2 });
    return path;
  }
}
// 基于权重系统在本地生成人工区划位置（使用确定性种子）
function generateDistricts(baseGrid, size, districts, landmarks) {
  // 第一步：选择市政厅位置（优先生成在海边/河边）
  var chX = Math.floor(size / 2), chY = Math.floor(size / 2);

  // 构建水域边缘标记（用于市政厅位置选择）
  var waterEdgeCells = {};
  var waterCells = {};
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var nt = baseGrid[y][x].type;
      if (_isWaterType(nt)) {
        waterCells[_cellKey(x, y)] = true;
      }
    }
  }
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      if (!_isBuildable(baseGrid[y][x].type)) continue;
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          var nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && waterCells[_cellKey(nx, ny)]) {
            waterEdgeCells[_cellKey(x, y)] = true;
            break;
          }
        }
      }
    }
  }

  // 从水域边缘选择市政厅位置（加权随机）
  var candidates = [];
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      if (!_isBuildable(baseGrid[y][x].type)) continue;
      var weight = 1;
      var distToCenter = Math.abs(x - size / 2) + Math.abs(y - size / 2);
      weight *= Math.pow(0.95, distToCenter);
      if (waterEdgeCells[_cellKey(x, y)]) {
        weight *= 10;
      }
      candidates.push({ x: x, y: y, w: weight });
    }
  }

  if (candidates.length > 0) {
    candidates.sort(function (a, b) { return b.w - a.w; });
    var topN = Math.min(5, candidates.length);
    var totalW = 0;
    for (var i = 0; i < topN; i++) totalW += candidates[i].w;
    var rand = _hashSeed(JSON.stringify(districts) + '_ch') % totalW;
    var cum = 0;
    for (var i = 0; i < topN; i++) {
      cum += candidates[i].w;
      if (rand < cum) {
        chX = candidates[i].x;
        chY = candidates[i].y;
        break;
      }
    }
  }

  // 生成确定性种子：基于区划配置 + 网格大小 + 市政厅位置
  var seedKey = JSON.stringify({ d: districts, s: size, chX: chX, chY: chY });
  var seedHash = _hashSeed(seedKey).toString();
  // 检查 localStorage 是否已有此配置的种子
  var storedRaw = localStorage.getItem('aic_district_seed');
  var storedHash = localStorage.getItem('aic_district_hash');
  var prngSeed;
  if (storedRaw && storedHash === seedHash) {
    prngSeed = parseInt(storedRaw, 10);
  } else {
    prngSeed = _hashSeed(seedKey + Date.now().toString() + Math.random().toString());
    localStorage.setItem('aic_district_seed', prngSeed.toString());
    localStorage.setItem('aic_district_hash', seedHash);
  }
  var _rand = _makePrng(prngSeed);
  var buildableSet = {};
  var waterEdge = {};
  var waterCells = {};
  var oceanCells = {};
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var nt = baseGrid[y][x].type;
      if (_isWaterType(nt)) { waterCells[_cellKey(x, y)] = true; if (nt === 'ocean') oceanCells[_cellKey(x, y)] = true; }
      if (_isBuildable(nt)) buildableSet[_cellKey(x, y)] = true;
    }
  }
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      if (!buildableSet[_cellKey(x, y)]) continue;
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          var nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && waterCells[_cellKey(nx, ny)]) {
            waterEdge[_cellKey(x, y)] = true;
          }
        }
      }
    }
  }
  var dGrid = [];
  for (var row = 0; row < size; row++) { dGrid[row] = []; for (var col = 0; col < size; col++) dGrid[row][col] = null; }

  var order = ['residential', 'commercial', 'industrial', 'suburb', 'transport', 'road'];
  var districtCells = {};

  for (var oi = 0; oi < order.length; oi++) {
    var dType = order[oi];
    var typeDistricts = districts.filter(function (d) { return d.type === dType; });

    for (var di = 0; di < typeDistricts.length; di++) {
      var dist = typeDistricts[di];
      var target = dist.blocks || 0;
      var key = dType + '|' + (dist.name || '');
      var frontierSet = {};
      var placedCells = [];

      if (dType === 'road' && target > 0) {
        generateRoadWithAnchorStrategy(dist, dGrid, size, buildableSet, waterCells, districtCells, placedCells);
        continue;
      }

      for (var b = 0; b < target; b++) {
        var candidates = [];
        if (b === 0) {
          for (var row = 0; row < size; row++) {
            for (var col = 0; col < size; col++) {
              if (!buildableSet[_cellKey(col, row)]) continue;
              if (dGrid[row][col] !== null) continue;
              if (dType !== 'transport' && waterCells[_cellKey(col, row)]) continue;

              var weight = _calcDistrictWeight(col, row, dType, dist.name || '', dGrid, size, chX, chY, waterEdge, waterCells, oceanCells);
              if (dType === 'road' && (col === 0 || col === size - 1 || row === 0 || row === size - 1)) {
                weight *= 5;
              }
              candidates.push({ col: col, row: row, w: weight });
            }
          }
        } else {
          var fkeys = Object.keys(frontierSet);
          for (var fi = 0; fi < fkeys.length; fi++) {
            var col = Math.floor(parseInt(fkeys[fi], 10) / 100);
            var row = parseInt(fkeys[fi], 10) % 100;
            if (!buildableSet[_cellKey(col, row)]) continue;
            if (dGrid[row][col] !== null) continue;
            if (dType !== 'transport' && waterCells[_cellKey(col, row)]) continue;

            // 道路宽度约束：每个道路格最多与2条其他道路边相接（保证线状，不形成宽面）
            if (dType === 'road') {
              var roadNbrs = 0;
              if (row > 0 && dGrid[row - 1][col] && dGrid[row - 1][col].type === 'road') roadNbrs++;
              if (row < size - 1 && dGrid[row + 1][col] && dGrid[row + 1][col].type === 'road') roadNbrs++;
              if (col > 0 && dGrid[row][col - 1] && dGrid[row][col - 1].type === 'road') roadNbrs++;
              if (col < size - 1 && dGrid[row][col + 1] && dGrid[row][col + 1].type === 'road') roadNbrs++;
              if (roadNbrs >= 2) continue;
            }

            var sameAdjCount = 0;
            for (var p = 0; p < placedCells.length; p++) {
              var pc = placedCells[p].col, pr = placedCells[p].row;
              if (Math.abs(col - pc) <= 1 && Math.abs(row - pr) <= 1) sameAdjCount++;
            }
            var weight = Math.pow(50, sameAdjCount) * (0.9 + _rand() * 0.1);
            candidates.push({ col: col, row: row, w: weight });
          }
        }

        if (candidates.length === 0) break;

        candidates.sort(function (a, b) { return b.w - a.w; });

        var topCandidates = candidates.slice(0, Math.min(3, candidates.length));
        var totalW = 0;
        for (var ci = 0; ci < topCandidates.length; ci++) totalW += topCandidates[ci].w;
        var rand = _rand() * totalW;
        var cum = 0, chosen = topCandidates[0];
        for (var ci = 0; ci < topCandidates.length; ci++) { cum += topCandidates[ci].w; if (rand <= cum) { chosen = topCandidates[ci]; break; } }

        dGrid[chosen.row][chosen.col] = { type: dType, name: dist.name || '', status: dist.status || '', key: key };
        placedCells.push({ col: chosen.col, row: chosen.row });
        delete buildableSet[_cellKey(chosen.col, chosen.row)];
        if (dType !== 'road') {
          districtCells[_cellKey(chosen.col, chosen.row)] = { type: dType, name: dist.name || '' };
        }

        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dc === 0 && dr === 0) continue;
            var nr = chosen.row + dr, nc = chosen.col + dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            var fk = _cellKey(nc, nr);
            if (buildableSet[fk] && dGrid[nr][nc] === null) {
              if (dType !== 'transport' || !waterCells[fk]) {
                frontierSet[fk] = true;
              }
            }
          }
        }

        delete frontierSet[_cellKey(chosen.col, chosen.row)];
      }
    }
  }
  return dGrid;
}

// 构建最终的像素网格并渲染为HTML表格
function buildPixelGrid(cm) {
  var size = cm.grid_size || 8;
  var regions = cm.regions || [];
  var districts = cm.districts || [];
  // 初始化：默认全为平原
  var grid = [];
  for (var y = 0; y < size; y++) {
    grid[y] = [];
    for (var x = 0; x < size; x++) {
      grid[y][x] = { type: 'plain', color: MAP_REGION_COLORS.plain.hex };
    }
  }
  // 两遍渲染：先渲染面状区域（rect/circle/polygon），再渲染线状区域（line），确保河流/道路显示在最上层
  // plain 始终最先渲染作为底色，其他地形覆盖其上
  var sortedRegions = regions.slice().sort(function (a, b) {
    if (a.type === 'plain' && b.type !== 'plain') return -1;
    if (b.type === 'plain' && a.type !== 'plain') return 1;
    return 0;
  });
  var passOrder = [function (r) { return r.shape !== 'line'; }, function (r) { return r.shape === 'line'; }];
  for (var pi = 0; pi < passOrder.length; pi++) {
    for (var i = 0; i < sortedRegions.length; i++) {
      var r = sortedRegions[i];
      if (!passOrder[pi](r)) continue;
      var mask = rasterizeRegion(r, size);
      var rColor = MAP_REGION_COLORS[r.type] || MAP_REGION_COLORS.plain;
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (mask[y][x]) {
            grid[y][x] = { type: r.type, color: rColor.hex };
          }
        }
      }
    }
  }
  // 生成人工区划并叠加到网格
  if (districts.length > 0) {
    var dGrid = generateDistricts(grid, size, districts, cm.landmarks || []);
    // 第一遍：渲染非道路区划
    for (var dy = 0; dy < size; dy++) {
      for (var dx = 0; dx < size; dx++) {
        if (dGrid[dy][dx] && dGrid[dy][dx].type !== 'road') {
          var dInfo = dGrid[dy][dx];
          var dColor = MAP_REGION_COLORS[dInfo.type] || MAP_REGION_COLORS.plain;
          grid[dy][dx] = { type: dInfo.type, color: dColor.hex, name: dInfo.name, status: dInfo.status };
        }
      }
    }
    // 第二遍：渲染道路（最后渲染，覆盖山脉和河流）
    for (var dy = 0; dy < size; dy++) {
      for (var dx = 0; dx < size; dx++) {
        if (dGrid[dy][dx] && dGrid[dy][dx].type === 'road') {
          var dInfo = dGrid[dy][dx];
          var dColor = MAP_REGION_COLORS[dInfo.type] || MAP_REGION_COLORS.plain;
          grid[dy][dx] = { type: dInfo.type, color: dColor.hex, name: dInfo.name, status: dInfo.status };
        }
      }
    }
    _mapCache.districtGrid = dGrid;
  }
  // 垂直翻转：AI 坐标 y=0 在底部（数学坐标系），但渲染 y=0 在顶部（屏幕坐标系）
  for (var fy = 0; fy < Math.floor(size / 2); fy++) {
    var oy2 = size - 1 - fy;
    var t = grid[fy]; grid[fy] = grid[oy2]; grid[oy2] = t;
  }
  if (_mapCache.districtGrid) {
    var dg = _mapCache.districtGrid;
    for (var fy = 0; fy < Math.floor(size / 2); fy++) {
      var oy2 = size - 1 - fy;
      var td = dg[fy]; dg[fy] = dg[oy2]; dg[oy2] = td;
    }
  }
  return grid;
}

function destroyTerrainColor(type) {
  return (MAP_REGION_COLORS[type] || MAP_REGION_COLORS.plain).hex;
}

function initCityMapData() {
  if (!gameState.city_map) {
    gameState.city_map = {}; applyMapGridSize(gameState);
  }
  var cm = gameState.city_map;
  if (!cm.regions) cm.regions = [];
  if (!cm.landmarks) cm.landmarks = [];
  if (!cm.legend) cm.legend = {};
  if (!cm.districts) cm.districts = [];
}

function mergeCityMap(newMap) {
  if (!newMap || typeof newMap !== 'object') return;
  initCityMapData();
  var cm = gameState.city_map;
  if (newMap.grid_size) cm.grid_size = newMap.grid_size;
  if (newMap.regions && Array.isArray(newMap.regions)) cm.regions = newMap.regions.slice();
  if (newMap.landmarks && Array.isArray(newMap.landmarks)) cm.landmarks = newMap.landmarks.slice();
  if (newMap.legend && typeof newMap.legend === 'object') {
    Object.keys(newMap.legend).forEach(function (k) { cm.legend[k] = newMap.legend[k]; });
  }
  if (newMap.districts && Array.isArray(newMap.districts)) {
    cm.districts = newMap.districts.slice();
    console.warn('[mergeCityMap] 合并districts:', cm.districts.length, '个区划');
  }
}

function applyNewRegions(newRegions) {
  if (!newRegions || !Array.isArray(newRegions)) return;
  initCityMapData();
  var cm = gameState.city_map;
  // 按type替换：删除同type旧区域，加入新区域
  newRegions.forEach(function (nr) {
    cm.regions = cm.regions.filter(function (r) { return r.type !== nr.type; });
    cm.regions.push({ type: nr.type, shape: nr.shape, params: nr.params || {} });
  });
}

function removeRegions(types) {
  if (!types || !Array.isArray(types)) return;
  initCityMapData();
  var cm = gameState.city_map;
  cm.regions = cm.regions.filter(function (r) { return types.indexOf(r.type) === -1; });
}

function applyNewDistricts(newDistricts) {
  if (!newDistricts || !Array.isArray(newDistricts)) return;
  initCityMapData();
  var cm = gameState.city_map;
  newDistricts.forEach(function (nd) {
    var found = false;
    for (var i = 0; i < cm.districts.length; i++) {
      if (cm.districts[i].type === nd.type && cm.districts[i].name === nd.name) {
        cm.districts[i].blocks = nd.blocks;
        if (nd.status !== undefined) cm.districts[i].status = nd.status;
        found = true; break;
      }
    }
    if (!found) cm.districts.push({ type: nd.type, name: nd.name || '', status: nd.status || '', blocks: nd.blocks || 0 });
  });
}
function removeDistricts(removals) {
  if (!removals || !Array.isArray(removals)) return;
  initCityMapData();
  var cm = gameState.city_map;
  cm.districts = cm.districts.filter(function (d) {
    for (var i = 0; i < removals.length; i++) {
      if (d.type === removals[i].type && d.name === removals[i].name) return false;
    }
    return true;
  });
}

function applyNewLandmarks(newLandmarks) {
  if (!newLandmarks || !Array.isArray(newLandmarks)) return;
  initCityMapData();
  var cm = gameState.city_map;
  newLandmarks.forEach(function (nl) {
    if (!nl.name) return;
    var existing = false;
    for (var i = 0; i < cm.landmarks.length; i++) {
      if (cm.landmarks[i].name === nl.name) {
        cm.landmarks[i] = { name: nl.name, icon: nl.icon || '', district: nl.district || '' };
        existing = true; break;
      }
    }
    if (!existing) cm.landmarks.push({ name: nl.name, icon: nl.icon || '', district: nl.district || '' });
  });
}

function mergeMapLegend(newLegend) {
  var cm = gameState.city_map;
  if (!cm) return;
  if (!cm.legend) cm.legend = {};
  Object.keys(newLegend).forEach(function (k) { cm.legend[k] = newLegend[k]; });
}

// ==================== Canvas 地图（缩放+拖动+Hover） ====================
var _mapView = { scale: 1, offsetX: 0, offsetY: 0, dragging: false, dragStartX: 0, dragStartY: 0, dragStartOX: 0, dragStartOY: 0 };
var _mapCache = { size: 8, ox: 0, oy: 0, cellSize: 0, grid: null, iconMap: null, landmarks: null, regions: null, regionIndex: null };
function _clampMapOffset() {
  var canvas = document.getElementById('city-canvas');
  if (!canvas) return;
  var container = canvas.parentElement;
  if (!container) return;
  var w = container.clientWidth, h = container.clientHeight;
  var cm = gameState.city_map;
  if (!cm) return;
  var size = cm.grid_size || 8;
  var fitScale = Math.min(w / size, h / size);
  var cellSize = fitScale * _mapView.scale;
  var halfWorldWidth = size * cellSize / 2;
  var halfWorldHeight = size * cellSize / 2;
  var minX = halfWorldWidth - w / 2;
  var maxX = w / 2 - halfWorldWidth;
  var minY = halfWorldHeight - h / 2;
  var maxY = h / 2 - halfWorldHeight;
  _mapView.offsetX = Math.max(minX, Math.min(maxX, _mapView.offsetX));
  _mapView.offsetY = Math.max(minY, Math.min(maxY, _mapView.offsetY));
}
var _mapRegionNames = { ocean: '🌊海洋', mountain: '⛰️山脉', river: '🏞️河流', lake: '🌊湖泊', forest: '🌲森林', desert: '🏜️沙漠', swamp: '🪵沼泽', plain: '🌿平原', road: '🛣️道路', residential: '🏠居住区', commercial: '🏬商业区', industrial: '🏭工业区', suburb: '🌳郊外', transport: '🚉轨道与交通' };
// 在本地将 landmark emoji 放置到对应区划/地形的随机格子上
function _placeLandmarksLocally(baseGrid, districtGrid, landmarks, size) {
  var iconMap = {};
  if (!landmarks || !landmarks.length) return iconMap;
  var lmSeed = _hashSeed(JSON.stringify(landmarks) + '|' + size);
  var _rl = _makePrng(lmSeed);
  for (var li = 0; li < landmarks.length; li++) {
    var lm = landmarks[li];
    if (!lm.name || !lm.icon) continue;
    var district = lm.district || '';
    var candidates = [];
    if (district === '') {
      // 市政厅无district：放网格中心
      var cx = Math.floor(size / 2), cy = Math.floor(size / 2);
      candidates.push({ x: cx, y: cy });
    } else {
      // 1) 精确匹配人工区划名称
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (districtGrid && districtGrid[y] && districtGrid[y][x] && districtGrid[y][x].name === district) {
            candidates.push({ x: x, y: y });
          }
        }
      }
      // 2) 模糊匹配：含有关键字的人工区划
      if (candidates.length === 0 && districtGrid) {
        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) {
            if (districtGrid[y] && districtGrid[y][x]) {
              var dn = districtGrid[y][x].name || '';
              var dt = districtGrid[y][x].type || '';
              // district名称是区划名的子串（或反之）
              if (dn && district && (dn.indexOf(district) >= 0 || district.indexOf(dn) >= 0)) {
                candidates.push({ x: x, y: y });
              }
            }
          }
        }
      }
      // 3) 按设施名称推断区划类型（港口→transport，工厂→industrial 等）
      if (candidates.length === 0 && districtGrid) {
        var hintType = '';
        if (lm.name.indexOf('港') >= 0 || lm.name.indexOf('码头') >= 0 || lm.name.indexOf('船') >= 0 || lm.name.indexOf('站') >= 0) hintType = 'transport';
        else if (lm.name.indexOf('厂') >= 0 || lm.name.indexOf('工') >= 0) hintType = 'industrial';
        else if (lm.name.indexOf('商') >= 0 || lm.name.indexOf('店') >= 0 || lm.name.indexOf('市') >= 0) hintType = 'commercial';
        else if (lm.name.indexOf('宅') >= 0 || lm.name.indexOf('社区') >= 0 || lm.name.indexOf('区') >= 0) hintType = 'residential';
        if (hintType) {
          for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
              if (districtGrid[y] && districtGrid[y][x] && districtGrid[y][x].type === hintType) {
                candidates.push({ x: x, y: y });
              }
            }
          }
        }
      }
      // 4) 在自然地形中找同 type 的格子（e.g. district="ocean"）
      if (candidates.length === 0) {
        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) {
            if (baseGrid[y] && baseGrid[y][x] && baseGrid[y][x].type === district) {
              candidates.push({ x: x, y: y });
            }
          }
        }
      }
      // 5) 最终保底：放市中心附近的可建格子
      if (candidates.length === 0) {
        var ccx = Math.floor(size / 2), ccy = Math.floor(size / 2);
        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) {
            if (baseGrid[y] && baseGrid[y][x] && !_isWaterType(baseGrid[y][x].type)) {
              candidates.push({ x: x, y: y });
            }
          }
        }
        // 按距离中心排序，优先近的
        candidates.sort(function (a, b) {
          return (Math.abs(a.x - ccx) + Math.abs(a.y - ccy)) - (Math.abs(b.x - ccx) + Math.abs(b.y - ccy));
        });
        candidates = candidates.slice(0, Math.max(5, Math.floor(candidates.length / 3)));
      }
    }
    if (candidates.length > 0) {
      var idx = Math.floor(_rl() * candidates.length);
      if (idx >= candidates.length) idx = candidates.length - 1;
      var chosen = candidates[idx];
      var key = chosen.y + ',' + chosen.x;
      if (!iconMap[key]) iconMap[key] = lm.icon;
    }
  }
  return iconMap;
}
function _initMapCanvas() {
  var canvas = document.getElementById('city-canvas');
  if (!canvas || canvas._mapInited) return;
  canvas._mapInited = true;
  var tooltip = document.getElementById('map-tooltip');
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var ds = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    var newScale = Math.max(0.3, Math.min(8, _mapView.scale * ds));
    _mapView.offsetX = mx - (mx - _mapView.offsetX) * (newScale / _mapView.scale);
    _mapView.offsetY = my - (my - _mapView.offsetY) * (newScale / _mapView.scale);
    _mapView.scale = newScale;
    _clampMapOffset();
    _drawMapCanvas();
    return false;
  }, { passive: false });
  canvas.addEventListener('mousedown', function (e) {
    if (e.button !== 2) return;
    e.preventDefault();
    _mapView.dragging = true;
    _mapView.dragStartX = e.pageX;
    _mapView.dragStartY = e.pageY;
    _mapView.dragStartOX = _mapView.offsetX;
    _mapView.dragStartOY = _mapView.offsetY;
    canvas.style.cursor = 'grabbing';
    if (tooltip) tooltip.style.display = 'none';
  });
  canvas.addEventListener('mousemove', function (e) {
    if (_mapView.dragging) {
      _mapView.offsetX = _mapView.dragStartOX + (e.pageX - _mapView.dragStartX);
      _mapView.offsetY = _mapView.dragStartOY + (e.pageY - _mapView.dragStartY);
      _clampMapOffset();
      _drawMapCanvas();
      if (tooltip) tooltip.style.display = 'none';
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var c = _mapCache;
    if (!c.grid) { if (tooltip) tooltip.style.display = 'none'; return; }
    var gx = Math.floor((mx - c.ox) / c.cellSize);
    var gy = Math.floor((my - c.oy) / c.cellSize);
    if (gx < 0 || gy < 0 || gx >= c.size || gy >= c.size) { if (tooltip) tooltip.style.display = 'none'; return; }
    var cell = (c.grid[gy] && c.grid[gy][gx]) ? c.grid[gy][gx] : { type: 'plain' };
    var icon = c.iconMap[gy + ',' + gx] || '';
    var typeName = _mapRegionNames[cell.type] || cell.type;
    // 找此格上的地标：通过iconMap反查landmark名
    var landmarkName = '';
    if (icon && c.landmarks) {
      for (var lmi = 0; lmi < c.landmarks.length; lmi++) {
        if (c.landmarks[lmi].icon === icon) { landmarkName = c.landmarks[lmi].name; break; }
      }
    }
    // 查找此格的区划信息(name/status)：优先从districtGrid读取，回退到regionIndex
    var districtExtra = '';
    var districtGrid = c.districtGrid;
    if (districtGrid && districtGrid[gy] && districtGrid[gy][gx]) {
      var dInfo = districtGrid[gy][gx];
      districtExtra = '【' + (dInfo.name || dInfo.type) + '】';
      if (dInfo.status) districtExtra += ' ' + dInfo.status;
      districtExtra += ' ';
    } else {
      var ri = (c.regionIndex && c.regionIndex[gy]) ? c.regionIndex[gy][gx] : -1;
      var region = (ri >= 0 && c.regions && c.regions[ri]) ? c.regions[ri] : null;
      if (region && region.name) {
        districtExtra = '【' + region.name + '】';
        if (region.status) districtExtra += ' ' + region.status;
        districtExtra += ' ';
      }
    }
    var text = (landmarkName ? landmarkName + ' (' + icon + ') ' : '') + districtExtra + typeName + ' [' + (gx + 1) + '列,' + (gy + 1) + '行]';
    if (tooltip) {
      tooltip.style.display = '';
      tooltip.style.left = mx + 'px';
      tooltip.style.top = my + 'px';
      tooltip.textContent = text;
    }
  });
  canvas.addEventListener('mouseup', function (e) {
    if (!_mapView.dragging) return;
    _mapView.dragging = false;
    canvas.style.cursor = '';
  });
  canvas.addEventListener('mouseleave', function () {
    if (_mapView.dragging) { _mapView.dragging = false; canvas.style.cursor = ''; }
    if (tooltip) tooltip.style.display = 'none';
  });
}
function _drawMapCanvas() {
  var canvas = document.getElementById('city-canvas');
  if (!canvas) return;
  var container = canvas.parentElement;
  if (!container) return;
  var w = container.clientWidth, h = container.clientHeight;
  if (w < 10 || h < 10) return;
  var dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  var ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  initCityMapData();
  var cm = gameState.city_map;
  if (!cm.regions || cm.regions.length === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🗺️ 等待首轮推演生成…', w / 2, h / 2);
    return;
  }
  var size = cm.grid_size || 8;
  var grid = buildPixelGrid(cm);
  var districtGrid = _mapCache.districtGrid || null;
  var iconMap = _placeLandmarksLocally(grid, districtGrid, cm.landmarks || [], size);
  var fitScale = Math.min(w / size, h / size);
  var cellSize = fitScale * _mapView.scale;
  var ox = (w - size * cellSize) / 2 + _mapView.offsetX;
  var oy = (h - size * cellSize) / 2 + _mapView.offsetY;
  _mapCache.size = size;
  _mapCache.ox = ox;
  _mapCache.oy = oy;
  _mapCache.cellSize = cellSize;
  _mapCache.grid = grid;
  _mapCache.iconMap = iconMap;
  _mapCache.landmarks = cm.landmarks || [];
  _mapCache.regions = cm.regions || [];
  // 构建regionIndex网格以便hover查询区划名/状态
  var regionIndex = [];
  for (var riy = 0; riy < size; riy++) { regionIndex[riy] = (new Array(size)).fill(-1); }
  (cm.regions || []).forEach(function (reg, idx) {
    var mask = rasterizeRegion(reg, size);
    for (var riy = 0; riy < size; riy++) {
      for (var rix = 0; rix < size; rix++) {
        if (mask[riy][rix]) regionIndex[riy][rix] = idx;
      }
    }
  });
  _mapCache.regionIndex = regionIndex;
  // 翻转 regionIndex 的 Y 轴，与 grid 翻转保持一致（regionIndex 是用 rasterizeRegion 单独构建的，未跟着 grid 翻转）
  for (var fy = 0; fy < Math.floor(size / 2); fy++) {
    var oy2 = size - 1 - fy;
    var tr = regionIndex[fy]; regionIndex[fy] = regionIndex[oy2]; regionIndex[oy2] = tr;
  }
  // iconMap 由 _placeLandmarksLocally 基于翻转后的 grid/districtGrid 生成，无需再翻转
  _mapCache.iconMap = iconMap;
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var cell = grid[y] ? grid[y][x] : { type: 'plain', color: MAP_REGION_COLORS.plain.hex };
      var cx = ox + x * cellSize, cy = oy + y * cellSize;
      if (cx + cellSize < 0 || cx > w || cy + cellSize < 0 || cy > h) continue;
      // 山脉/森林/海洋色块添加确定性随机扰动，模拟自然纹理
      var perturbTypes = { mountain: true, forest: true, ocean: true };
      var useColor = cell.color;
      var drawShape = 'rect'; // rect | eroded
      var topIn = 0, rightIn = 0, bottomIn = 0, leftIn = 0;
      if (perturbTypes[cell.type]) {
        var pSeed = (x * 31 + y * 17 + (cell.type === 'ocean' ? 7 : cell.type === 'mountain' ? 13 : 23)) % 101;
        var pR = (pSeed % 19) - 9;
        var pG = ((pSeed * 3) % 19) - 9;
        var pB = ((pSeed * 7) % 13) - 6;
        var r = parseInt(cell.color.slice(1, 3), 16);
        var g = parseInt(cell.color.slice(3, 5), 16);
        var b = parseInt(cell.color.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, r + pR));
        g = Math.max(0, Math.min(255, g + pG));
        b = Math.max(0, Math.min(255, b + pB));
        useColor = '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2);
        // 不规则边缘：检查四方向邻居，若类型不同则侵蚀该侧
        var nbrUp = (y > 0 && grid[y - 1][x]) ? grid[y - 1][x].type : cell.type;
        var nbrDn = (y < size - 1 && grid[y + 1][x]) ? grid[y + 1][x].type : cell.type;
        var nbrLf = (x > 0 && grid[y][x - 1]) ? grid[y][x - 1].type : cell.type;
        var nbrRt = (x < size - 1 && grid[y][x + 1]) ? grid[y][x + 1].type : cell.type;
        if (nbrUp !== cell.type) topIn = cellSize * (0.05 + 0.25 * (((x * 13 + y * 7 + pSeed * 3) % 100) / 100));
        if (nbrDn !== cell.type) bottomIn = cellSize * (0.05 + 0.25 * (((x * 19 + y * 11 + pSeed * 5) % 100) / 100));
        if (nbrLf !== cell.type) leftIn = cellSize * (0.05 + 0.25 * (((x * 23 + y * 13 + pSeed * 7) % 100) / 100));
        if (nbrRt !== cell.type) rightIn = cellSize * (0.05 + 0.25 * (((x * 29 + y * 17 + pSeed * 11) % 100) / 100));
        if (topIn > 0 || rightIn > 0 || bottomIn > 0 || leftIn > 0) drawShape = 'eroded';
      }
      ctx.fillStyle = useColor;
      if (drawShape === 'eroded') {
        // 绘制不规则四边形
        ctx.beginPath();
        ctx.moveTo(cx + leftIn, cy + topIn);
        ctx.lineTo(cx + cellSize - rightIn, cy + topIn);
        ctx.lineTo(cx + cellSize - rightIn, cy + cellSize - bottomIn);
        ctx.lineTo(cx + leftIn, cy + cellSize - bottomIn);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(cx, cy, cellSize, cellSize);
      }
      ctx.strokeRect(cx, cy, cellSize, cellSize);
      var icon = iconMap[y + ',' + x];
      if (icon && cellSize >= 6) {
        var fs = cellSize * 0.8;
        if (fs < 8) fs = 8;
        ctx.font = fs + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, cx + cellSize / 2, cy + cellSize / 2);
      }
    }
  }
  ctx.strokeStyle = '#4a3c31';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, size * cellSize, size * cellSize);
  // 更新图例：自动收集地图上的区域类型，显示颜色色块
  var legendEl = document.getElementById('map-legend-bar');
  if (legendEl) {
    // 收集所有实际出现的区域类型
    var seenTypes = {};
    for (var ly = 0; ly < size; ly++) {
      for (var lx = 0; lx < size; lx++) {
        var cell = grid[ly] ? grid[ly][lx] : null;
        if (cell && cell.type && cell.type !== 'plain') seenTypes[cell.type] = true;
      }
    }
    var typeOrder = ['ocean', 'mountain', 'river', 'lake', 'forest', 'desert', 'swamp', 'road', 'residential', 'commercial', 'industrial', 'suburb', 'transport'];
    var legendHtml = '';
    for (var ti = 0; ti < typeOrder.length; ti++) {
      var t = typeOrder[ti];
      if (!seenTypes[t]) continue;
      var color = (MAP_REGION_COLORS[t] || MAP_REGION_COLORS.plain).hex;
      var labelMap = { ocean: '海洋', mountain: '山地', river: '河流', lake: '湖泊', forest: '森林', desert: '沙漠', swamp: '沼泽', road: '道路', residential: '居住区', commercial: '商业区', industrial: '工业区', suburb: '郊外', transport: '轨道与交通', plain: '平原' };
      legendHtml += '<div class="legend-item"><span class="legend-swatch" style="background:' + color + '"></span><span class="legend-name">' + (labelMap[t] || t) + '</span></div>';
    }
    // 追加地标图例
    if (cm.legend && Object.keys(cm.legend).length > 0) {
      Object.keys(cm.legend).forEach(function (k) {
        legendHtml += '<div class="legend-item"><span class="legend-emoji">' + cm.legend[k] + '</span><span class="legend-name">' + k + '</span></div>';
      });
    }
    if (legendHtml) {
      legendEl.innerHTML = legendHtml;
      legendEl.style.display = '';
    } else {
      legendEl.style.display = 'none';
    }
  }
}
function renderCityMap() {
  _initMapCanvas();
  var canvas = document.getElementById('city-canvas');
  if (canvas) {
    var container = canvas.parentElement;
    if (container) {
      var w = container.clientWidth, h = container.clientHeight;
      initCityMapData();
      var cm = gameState.city_map;
      if (cm.regions && cm.regions.length > 0) {
        var size = cm.grid_size || 8;
        _mapView.scale = 0.85;
        _mapView.offsetX = 0;
        _mapView.offsetY = 0;
      }
    }
  }
  _drawMapCanvas();
}
window.addEventListener('resize', function () { if (gameState && gameState.city_map && gameState.city_map.regions && gameState.city_map.regions.length > 0) _drawMapCanvas(); });

function serializeMapForAI() {
  initCityMapData();
  var cm = gameState.city_map;
  if (!cm.regions || cm.regions.length === 0) return null;
  // 发送regions简要描述给AI
  var regionList = cm.regions.map(function (r) {
    var paramStr = JSON.stringify(r.params);
    var extra = '';
    if (r.name) { extra += ' name:"' + r.name + '"'; }
    if (r.status) { extra += ' status:"' + r.status + '"'; }
    return r.type + '(' + r.shape + ':' + paramStr + extra + ')';
  }).join('，');
  var landmarkStr = (cm.landmarks || []).map(function (l) {
    return l.name + '(' + (l.district || '市中心') + ')';
  }).join('，');
  var districtStr = (cm.districts || []).map(function (d) {
    return d.type + ':"' + (d.name || '') + '" blocks:' + d.blocks + (d.status ? ' status:"' + d.status + '"' : '');
  }).join('，');
  return {
    regions_text: regionList || '(无区域)',
    landmarks_text: landmarkStr || '(无设施)',
    legend: cm.legend || {},
    grid_size: cm.grid_size,
    districts_text: districtStr || '(无区划)'
  };
}

function buildMapContext() {
  var info = serializeMapForAI();
  var isEmpty = !info || (info.regions_text === '(无区域)' && info.districts_text === '(无区划)');
  if (isEmpty) {
    initCityMapData();
    var cmForEmpty = gameState.city_map;
    return '\n\n# 城市地图\n⚠️ 无地图数据，请生成完整city_map。\n【重要】regions只包含自然地形(8种:ocean/mountain/river/lake/forest/desert/swamp/plain)，坐标0~' + (cmForEmpty.grid_size - 1) + '。平原≥40%，其他地形合理分布。\n人工区划使用districts数组（只传名称/区块数/状态），由系统本地生成位置。⚠️强制：res+com+ind的blocks总和≥总blocks的30%！一个区块代表的现实面积大小不固定。blocks按grid_size²比例：road×2~5%，res×10~18%，com×4~8%，ind×3~6%，sub×1~3%，trans×0.5~2%。\ndistricts格式：[{"type":"residential","name":"老城区","status":"治安良好","blocks":' + Math.round((cmForEmpty.grid_size || 8) * (cmForEmpty.grid_size || 8) * 0.10) + '}]\nlandmarks只传{name,icon,district}（district=区划名或自然类型），不传坐标。';
  }
  return '\n\n# 城市地图\n网格：' + info.grid_size + '×' + info.grid_size + '\n区域：' + info.regions_text + '\n区划：' + info.districts_text + '\n设施：' + info.landmarks_text + '\n图例：' + JSON.stringify(info.legend);
}

function buildMapUpdateInstruction() {
  var info = serializeMapForAI();
  var isEmpty = !info || (info.regions_text === '(无区域)' && info.districts_text === '(无区划)');
  if (isEmpty) return '';
  return '\n\n# 地图更新（增量，只传变化）\n🧠 修改地形前先思考：变化的合理性？与现有地形冲突吗？\n⚠️ 只返回发生变化的内容，不变的不传。\n新增/替换自然地形用 city_map_new_regions:[{type,shape,params,name,status}]。\n修改已有区划的名称或状态也用 city_map_new_regions，传入完整type+shape+params+新name/status即可覆盖。\n删除自然地形用 city_map_remove_regions:["type"]。\n区划变动用 city_map_new_districts:[{type,name,status,blocks}]（按type+name去重）。\n删除区划用 city_map_remove_districts:[{type:"",name:""}]。\n设施变更用 city_map_new_landmarks:[{name,icon,district}]（不传坐标）。\n新增图例用 city_map_new_legend:{"名":"emoji"}。';
}

function buildMapEmptyNotice() {
  var info = serializeMapForAI();
  var isEmpty = !info || (info.regions_text === '(无区域)' && info.districts_text === '(无区划)');
  if (!isEmpty) return '';
  initCityMapData();
  var cmForEmpty = gameState.city_map;
  return '\n\n【🗺️必做】无地图数据，须在city_map中用regions列表(自然地形)+districts列表(人工区划)生成完整' + cmForEmpty.grid_size + '×' + cmForEmpty.grid_size + '地图。默认平原。自然(8):ocean/mountain/river/lake/forest/desert/swamp/plain。区划(6):road/residential/commercial/industrial/suburb/transport（只传type+name+blocks+status，不传位置）。';
}
function renderHistorySidebar() {
  if (!historyDecisions.length) { document.getElementById('history-sidebar').innerHTML = '<p class="text-gray-500 text-xs text-center">暂无记录</p>'; return; }
  document.getElementById('history-sidebar').innerHTML = historyDecisions.slice(0, 12).map(h => '<div class="bg-amber-50/50 p-2 rounded border border-[#8b5a2b]/20"><p class="text-xs font-bold text-[#8b5a2b]">回合' + h.turn + '</p><p class="text-xs text-gray-600">' + h.decision + '</p><p class="text-xs text-gray-500">' + h.time + '</p></div>').join('');
}

function parseSimpleMapFormat(content) {
  const lines = content.trim().split('\n');
  const result = { grid_size: 34, regions: [], landmarks: [], legend: {}, districts: [] };
  let inMap = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('MAP:')) {
      inMap = true;
      const gridMatch = line.match(/GRID=(\d+)/);
      if (gridMatch) result.grid_size = parseInt(gridMatch[1], 10);
      continue;
    }

    if (line === 'ENDMAP') {
      break;
    }

    if (!inMap) continue;

    if (line.startsWith('REGION:')) {
      const parts = line.substring(7).split(',');
      if (parts.length >= 3) {
        const type = parts[0].trim().toLowerCase();
        const shape = parts[1].trim().toLowerCase();
        const params = parts.slice(2).map(p => parseFloat(p.trim()));

        const region = { type, shape, params: {} };

        if (shape === 'rect' && params.length >= 4) {
          region.params = { x: params[0], y: params[1], w: params[2], h: params[3] };
        } else if (shape === 'circle' && params.length >= 3) {
          region.params = { cx: params[0], cy: params[1], r: params[2] };
        } else if (shape === 'polygon' && params.length >= 4) {
          const verts = [];
          for (let j = 0; j < params.length - 1; j += 2) {
            verts.push([params[j], params[j + 1]]);
          }
          region.params = { verts };
        } else if (shape === 'line' && params.length >= 4) {
          const xs = [], ys = [];
          for (let j = 0; j < params.length; j += 2) {
            if (j + 1 < params.length) {
              xs.push(params[j]);
              ys.push(params[j + 1]);
            }
          }
          region.params = { xs, ys };
        }

        result.regions.push(region);
      }
    } else if (line.startsWith('LANDMARK:')) {
      const parts = line.substring(9).split(',');
      if (parts.length >= 2) {
        result.landmarks.push({
          name: parts[0].trim(),
          icon: parts[1].trim(),
          district: parts.length > 2 ? parts[2].trim() : ''
        });
      }
    } else if (line.startsWith('LEGEND:')) {
      const parts = line.substring(7).split(',');
      if (parts.length >= 2) {
        result.legend[parts[0].trim()] = parts[1].trim();
      }
    } else if (line.startsWith('DISTRICT:')) {
      const parts = line.substring(9).split(',');
      if (parts.length >= 4) {
        result.districts.push({
          type: parts[0].trim().toLowerCase(),
          name: parts[1].trim(),
          status: parts[2].trim(),
          blocks: parseInt(parts[3].trim(), 10) || 1
        });
      }
    }
  }

  return result;
}

function parseBlockProtocol(content) {
  if (!content) throw new Error('内容为空');

  const result = {};
  const blockPattern = /===(\w+)===\s*([\s\S]*?)\s*===end===/gi;
  let match;
  var foundBlocks = [];

  while ((match = blockPattern.exec(content)) !== null) {
    const blockName = match[1].toLowerCase().trim();
    const blockContent = match[2].trim();
    foundBlocks.push(blockName);

    if (blockName === 'city_map') {
      if (blockContent.startsWith('MAP:')) {
        try {
          const parsed = parseSimpleMapFormat(blockContent);
          result[blockName] = parsed;
          console.warn('[parseBlockProtocol] city_map 简单格式解析成功');
          continue;
        } catch (e) {
          console.warn('[parseBlockProtocol] city_map 简单格式解析失败:', e.message);
        }
      }
    }

    try {
      const parsed = JSON.parse(blockContent);
      result[blockName] = parsed;
    } catch (e) {
      try {
        const trimmed = blockContent.trim();
        if ((trimmed.startsWith('[') && !trimmed.endsWith(']')) ||
          (trimmed.startsWith('{') && !trimmed.endsWith('}'))) {
          let fixed = trimmed;
          if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
            fixed = trimmed + ']';
          }
          if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
            fixed = trimmed + '}';
          }
          const parsed = JSON.parse(fixed);
          result[blockName] = parsed;
        } else {
          result[blockName] = blockContent;
        }
      } catch (e2) {
        result[blockName] = blockContent;
      }
    }

  }

  if (Object.keys(result).length === 0) {
    console.warn('[parseBlockProtocol] 未找到任何块');
    return null;
  }

  console.warn('[parseBlockProtocol] 找到的块:', foundBlocks.join(', '));

  const arrayBlocks = ['npc', 'notes', 'next_actions', 'turn_summary'];
  for (const block of arrayBlocks) {
    if (result[block] && typeof result[block] === 'string') {
      const trimmed = result[block].trim();
      if (trimmed.startsWith('[')) {
        try {
          result[block] = JSON.parse(trimmed.endsWith(']') ? trimmed : trimmed + ']');
        } catch (e) { }
      }
    }
  }

  return result;
}

function extractJSON(content) {
  if (!content) throw new Error('内容为空');

  const blockResult = parseBlockProtocol(content);
  if (blockResult) {
    return blockResult;
  }

  var candidates = [];
  // 策略1：匹配 ```json ... ```
  var m1 = content.match(/```json\s*([\s\S]+?)\s*```/i);
  if (m1) candidates.push({ src: '策略1(json代码块)', raw: m1[1].trim() });
  // 策略1b：有 ```json 但没有闭合 ```
  if (!candidates.length) {
    var m1b = content.match(/```json\s*([\s\S]*)$/i);
    if (m1b) candidates.push({ src: '策略1b(无闭合)', raw: m1b[1].trim() });
  }
  // 策略2：任意代码块
  if (!candidates.length) {
    var m2 = content.match(/```\s*([\s\S]+?)\s*```/);
    if (m2) candidates.push({ src: '策略2(无标记代码块)', raw: m2[1].trim() });
  }
  // 策略2b：无闭合代码块
  if (!candidates.length) {
    var m2b = content.match(/```\s*([\s\S]*)$/);
    if (m2b) candidates.push({ src: '策略2b(无闭合标记)', raw: m2b[1].trim() });
  }
  // 策略3：花括号计数法 — 逐字符追踪，找到最外层 { ... } 的精确边界
  if (!candidates.length) {
    var startIdx = content.indexOf('{');
    if (startIdx >= 0) {
      var braceCount = 0, inStr = false, escaped = false, endIdx = -1;
      for (var i = startIdx; i < content.length; i++) {
        var ch = content.charAt(i);
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') braceCount++;
        else if (ch === '}') {
          braceCount--;
          if (braceCount === 0) { endIdx = i; break; }
        }
      }
      if (endIdx > startIdx) candidates.push({ src: '策略3(花括号计数)', raw: content.substring(startIdx, endIdx + 1) });
    }
  }
  logDebug('extractJSON 候选策略数=' + candidates.length + ' 原始长度=' + content.length + 'chars');
  if (!candidates.length) { logError('extractJSON 无可用候选策略！'); }
  // 尝试解析每个候选（先尝试原始，再尝试修复后）
  for (var c = 0; c < candidates.length; c++) {
    // 尝试原始
    try {
      var result = JSON.parse(candidates[c].raw);
      logInfo('JSON解析成功 via ' + candidates[c].src + '(原始) ' + candidates[c].raw.length + '字符');
      console.log('[extractJSON] 成功 via ' + candidates[c].src + '(原始), 长度:' + candidates[c].raw.length);
      return result;
    } catch (e) {
      console.warn('[extractJSON] ' + candidates[c].src + '(原始) 失败: ' + e.message);
    }
    // 尝试修复后
    try {
      var repaired = repairJSON(candidates[c].raw);
      result = JSON.parse(repaired);
      logWarn('JSON修复成功 via ' + candidates[c].src + ' 修复后' + repaired.length + '字符');
      console.log('[extractJSON] 成功 via ' + candidates[c].src + '(修复后)');
      return result;
    } catch (e2) {
      console.warn('[extractJSON] ' + candidates[c].src + '(修复后) 也失败: ' + e2.message);
    }
    // 逐步截断降级：从末尾逐步截短直到可解析（处理AI输出被截断的情况）
    try {
      var truncated = progressiveTruncate(candidates[c].raw);
      if (truncated) {
        console.log('[extractJSON] 成功 via ' + candidates[c].src + '(逐步截断), 最终长度:' + truncated.raw.length);
        return truncated.parsed;
      }
    } catch (e3) {
      console.warn('[extractJSON] ' + candidates[c].src + '(逐步截断) 失败: ' + e3.message);
    }
  }
  // 最终降级：清理裸文本后尝试
  try {
    var s = content.indexOf('{'), e = content.lastIndexOf('}');
    if (s >= 0 && e > s) {
      var body = content.substring(s, e + 1).replace(/^[\s\n]*[^\{]*/, '').replace(/[^\}]*[\s\n]*$/, '');
      try { return JSON.parse(body); } catch (e3) { /* ignore */ }
      try { return JSON.parse(repairJSON(body)); } catch (e4) { /* ignore */ }
      var pt = progressiveTruncate(body);
      if (pt) return pt.parsed;
    }
  } catch (ex) { /* ignore */ }
  logError('extractJSON 所有策略失败！原始内容前300字: ' + content.substring(0, 300));
  throw new Error('无法从AI响应中提取有效JSON。原始内容前300字:\n' + content.substring(0, 300));
}

function progressiveTruncate(raw) {
  // 从完整长度开始，每次截掉尾部的一部分，尝试解析
  // 步长：先大步(500)，再中步(100)，再小步(20)，最后逐字符
  var steps = [500, 200, 100, 50, 20, 10, 5, 2, 1];
  for (var si = 0; si < steps.length; si++) {
    var step = steps[si];
    var len = raw.length;
    while (len > 200) {
      len -= step;
      var truncated = raw.substring(0, len);
      // 确保以合理字符结尾
      truncated = truncated.replace(/[,\s\n\r]+$/, '');
      if (!truncated || truncated.length < 50) break;
      // 补上可能的缺失闭合
      var closed = ensureClosed(truncated);
      try {
        var parsed = JSON.parse(closed);
        console.log('[progressiveTruncate] 截断成功: 原始' + raw.length + ' → ' + closed.length + ', 步长=' + step);
        return { raw: closed, parsed: parsed };
      } catch (e) { /* 继续缩短 */ }
    }
  }
  return null;
}

function ensureClosed(s) {
  // 计算需要补多少个 } 和 ] 来闭合JSON
  var openBrace = 0, openBracket = 0, inStr = false, escaped = false;
  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') openBrace++;
    else if (ch === '}') openBrace--;
    else if (ch === '[') openBracket++;
    else if (ch === ']') openBracket--;
  }
  var suffix = '';
  // 如果在字符串内，先闭合字符串
  if (inStr) suffix += '"';
  // 闭合数组和对象（反序：先闭合内层]
  for (var b = 0; b < openBracket; b++) suffix += ']';
  for (var c = 0; c < openBrace; c++) suffix += '}';
  return s + suffix;
}

function repairJSON(str) {
  var s = str;
  // 1. 全角引号 → 半角引号（常见于中文AI输出）
  s = s.replace(/\u201C/g, '"').replace(/\u201D/g, '"');
  s = s.replace(/\u2018/g, "'").replace(/\u2019/g, "'");
  s = s.replace(/\u300C/g, '"').replace(/\u300D/g, '"');
  // 2. 移除注释（不在字符串内的 // 和 /* */）
  s = stripComments(s);
  // 3. 尾部逗号修复
  s = s.replace(/,\s*([}\]])/g, '$1');
  // 4. 字符串内未转义的换行
  s = fixUnescapedNewlines(s);
  // 5. 修复未闭合的字符串 — 只在明确检测到且不会破坏结构时执行
  s = fixUnterminatedStringsSafe(s);
  return s;
}

function fixUnterminatedStringsSafe(s) {
  var result = '';
  var inStr = false, escaped = false, strStart = -1;
  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') {
      if (!inStr) { inStr = true; strStart = i; }
      else { inStr = false; }
      result += ch; continue;
    }
    result += ch;
  }
  // 只有当剩余内容很短时才自动闭合（说明是真正的尾部截断）
  if (inStr && (s.length - strStart) > 100) {
    console.warn('[repairJSON] 检测到未闭合字符串(位置:' + strStart + ', 长度:' + (s.length - strStart) + ')，可能为尾部截断');
    result += '"';
  }
  return result;
}

function stripComments(s) {
  var result = '';
  var inStr = false, escaped = false;
  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; result += ch; continue; }
    if (inStr) { result += ch; continue; }
    if (ch === '/' && i + 1 < s.length) {
      if (s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
      if (s[i + 1] === '*') { i += 2; while (i + 1 < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i++; continue; }
    }
    result += ch;
  }
  return result;
}

function fixUnescapedNewlines(s) {
  var result = '';
  var inStr = false, escaped = false;
  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; result += ch; continue; }
    if (inStr && (ch === '\n' || ch === '\r')) {
      result += '\\n';
      if (ch === '\r' && i + 1 < s.length && s[i + 1] === '\n') i++;
      continue;
    }
    result += ch;
  }
  return result;
}

function updateChart() {
  updateGDPChart();
  updateSupportChart();
}
function updateGDPChart() {
  const ctx = document.getElementById('gdpChart')?.getContext('2d');
  if (!ctx) return;
  if (window._gdpChart && typeof window._gdpChart.destroy === 'function') window._gdpChart.destroy();
  var gdpMin = Math.min.apply(null, chartData.gdp.length ? chartData.gdp : [0]);
  var gdpMax = Math.max.apply(null, chartData.gdp.length ? chartData.gdp : [0]);
  var pad = Math.max(1, (gdpMax - gdpMin) * 0.3);
  window._gdpChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{ label: 'GDP增长率(%)', data: chartData.gdp, borderColor: '#8b5a2b', backgroundColor: 'rgba(139,90,43,0.15)', tension: 0.4, borderWidth: 2, fill: true }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: Math.round((gdpMin - pad) * 10) / 10, max: Math.round((gdpMax + pad) * 10) / 10, grid: { color: 'rgba(139,90,43,0.12)' }, ticks: { color: '#4a3c31', font: { size: 9 }, stepSize: undefined } },
        x: { grid: { color: 'rgba(139,90,43,0.12)' }, ticks: { color: '#4a3c31', font: { size: 9 }, maxRotation: 30 } }
      }
    }
  });
}
function updateSupportChart() {
  const ctx = document.getElementById('supportChart')?.getContext('2d');
  if (!ctx) return;
  if (window._supportChart && typeof window._supportChart.destroy === 'function') window._supportChart.destroy();
  window._supportChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{ label: '支持率(%)', data: chartData.support, borderColor: '#a83232', backgroundColor: 'rgba(168,50,50,0.15)', tension: 0.4, borderWidth: 2, fill: true }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, grid: { color: 'rgba(168,50,50,0.12)' }, ticks: { color: '#4a3c31', font: { size: 9 }, stepSize: 20 } },
        x: { grid: { color: 'rgba(168,50,50,0.12)' }, ticks: { color: '#4a3c31', font: { size: 9 }, maxRotation: 30 } }
      }
    }
  });
}

function getCurrencySymbol() {
  // 从 currency_cpi (如 "GBP|2.5%") 或 liquid_fx (如 "£5000万/£2000万") 提取货币符号
  var cpi = (gameState.macro.currency_cpi || '');
  var parts = cpi.split('|');
  if (parts[0] && parts[0].trim()) return parts[0].trim();
  var fx = (gameState.macro.liquid_fx || '');
  var m = fx.match(/^[^\d\s]+/);
  if (m) return m[0];
  return '';
}

function formatTradeValue(val, options) {
  // 解析带单位的数值：支持"5000万"、"1.2亿"等格式
  options = options || {};
  var sym = options.symbol || getCurrencySymbol() || '¥';
  var str = String(val || '0');
  var multiplier = 1;
  if (/亿/.test(str)) {
    multiplier = 10000;
    str = str.replace(/亿/g, '');
  } else if (/万/.test(str)) {
    multiplier = 1;
    str = str.replace(/万/g, '');
  }
  var v = Math.abs(parseFloat(str)) * multiplier || 0;
  if (v >= 10000) return sym + (v / 10000).toFixed(1) + '亿';
  if (v >= 1) return sym + v.toFixed(0) + '万';
  return sym + v.toFixed(2);
}

function extractGameMonth() {
  // 从 gameState.header.time 提取月份: "1847年7月15日" → "1847-07"
  var time = gameState.header.time || '';
  var m = time.match(/(\d{4})年(\d{1,2})月/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2);
  return '';
}

function maybeUpdateMonthlyChart() {
  // 只有游戏月份变化时才添加新数据点
  var month = extractGameMonth();
  if (!month || month === lastChartMonth) { updateChart(); return; }
  lastChartMonth = month;
  var gr = parseFloat(gameState.macro.growth_rate) || 0;
  var sup = parseInt(gameState.macro.mayor_support) || 0;
  chartData.labels.push(month);
  chartData.gdp.push(gr);
  chartData.support.push(sup);
  // 保持最多24个数据点
  if (chartData.labels.length > 24) {
    chartData.labels = chartData.labels.slice(-24);
    chartData.gdp = chartData.gdp.slice(-24);
    chartData.support = chartData.support.slice(-24);
  }
  updateChart();
}

// ==================== Tab切换 ====================
function switchTabInternal(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('bg-amber-200', 'text-[#8b5a2b]'); b.classList.add('bg-amber-100', 'text-gray-600'); });
  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.remove('hidden');
  const btn = document.querySelector('.tab-btn');
  if (btn) {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach((b, i) => {
      if (i === 0 && name === 'industry') {
        b.classList.add('bg-amber-200', 'text-[#8b5a2b]'); b.classList.remove('bg-amber-100', 'text-gray-600');
      } else if (i === 1 && name === 'fiscal') {
        b.classList.add('bg-amber-200', 'text-[#8b5a2b]'); b.classList.remove('bg-amber-100', 'text-gray-600');
      } else if (i === 2 && name === 'classes') {
        b.classList.add('bg-amber-200', 'text-[#8b5a2b]'); b.classList.remove('bg-amber-100', 'text-gray-600');
      } else {
        b.classList.remove('bg-amber-200', 'text-[#8b5a2b]'); b.classList.add('bg-amber-100', 'text-gray-600');
      }
    });
  }
}

// ==================== 暴露全局函数 ====================
console.log('开始加载页面...');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成！');

  try {
    // 先确保能找到基本元素
    var hdrCity = document.getElementById('hdr-city');
    if (hdrCity) {
      console.log('找到标题元素');
    } else {
      console.error('找不到标题元素！');
    }

    // 先尝试直接设置一些基本显示，确保页面能看到东西
    if (hdrCity) hdrCity.textContent = '新罗马';

    // 尝试加载游戏
    let loaded = false;
    try {
      loaded = loadGame();
      console.log('加载存档结果:', loaded);
    } catch (e) {
      console.error('加载存档失败:', e);
      loaded = { ok: false, error: e.message };
    }

    if (!loaded || !loaded.ok) {
      if (loaded && loaded.error && loaded.error !== 'no_save') {
        console.warn('存档损坏:', loaded.error);
        showToast('❌ 存档数据损坏：' + loaded.error);
        document.getElementById('narrative-box').innerHTML = '<p class="text-red-600 text-center py-8">⚠️ 存档文件已损坏或格式不兼容<br><span class="text-sm text-gray-500">' + loaded.error + '</span><br><br><span class="text-sm">请通过"设置→导入存档"恢复有效存档，或点击"新游戏"重新开始</span></p>';
      }
      console.log((loaded && loaded.error !== 'no_save') ? '存档损坏，显示提示' : '无存档，显示开局面板');
      gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      applyMapGridSize(gameState);
      turnCount = 0;
      historyDecisions = [];
      fullHistory = [];
      chartData = { labels: ['初始'], gdp: [3.2], support: [65] };
      lastChartMonth = '';
      popGrowthHistory = [];
      shortTermMemory = [];
      longTermMemory = [];
      lastUserMessage = null;
      lastAssistantMessage = null;
      worldBook = [];
    }

    try { customPrompt = localStorage.getItem('aic_custom_prompt') || ''; } catch (e) { customPrompt = ''; }
    loadSettings();
    document.getElementById('hist-max').textContent = maxHistoryRounds;
    // 规范化为数组，防止非数组导致 forEach 崩溃
    if (!Array.isArray(gameState.next_actions)) gameState.next_actions = [];
    console.log('开始渲染...');
    renderAll();
    console.log('渲染完成');
    var rb = document.getElementById('btn-refresh');
    if (rb) { rb.disabled = false; rb.classList.remove('opacity-50', 'cursor-not-allowed'); }
    document.addEventListener('click', function (e) {
      var dd = document.getElementById('save-dropdown');
      if (dd && dd.style.display === 'block' && !dd.contains(e.target) && !e.target.closest('[onclick*="save-dropdown"]')) {
        dd.style.display = 'none';
      }
    });
    // 隐藏测试横幅 - JS初始化成功
    var tb = document.getElementById('test-visible');
    if (tb) tb.style.display = 'none';

    try {
      updateChart();
    } catch (e) {
      console.error('图表初始化失败:', e);
    }

    // 无存档时显示开局面板
    if (!loaded) {
      resetStartPanel();
      document.getElementById('start-panel').style.display = 'flex';
      loadOpeningDeclaration();
      loadPresets();
    }

    if (!getConfig().key) setTimeout(toggleSettings, 500);

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        submitDecision();
      }
    });

    var settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
      settingsModal.addEventListener('click', function (e) {
        if (e.target === this) toggleSettings();
      });
    }

    var historyModal = document.getElementById('history-modal');
    if (historyModal) {
      historyModal.addEventListener('click', function (e) {
        if (e.target === this) closeHistoryModal();
      });
    }

    document.querySelectorAll('details').forEach(d => {
      d.addEventListener('toggle', () => {
        const icon = d.querySelector('i.fa-chevron-down');
        if (icon) icon.style.transform = d.open ? 'rotate(180deg)' : 'rotate(0)';
        // 折叠面板展开时重绘内部图表（canvas在隐藏父元素中尺寸为0）
        if (d.open) {
          if (d.querySelector('#popGrowthChart')) { setTimeout(renderPopGrowthChart, 50); }
          if (d.querySelector('#ethnicityPieChart')) { setTimeout(renderEthnicityPieChart, 50); }
          if (d.querySelector('#religionPieChart')) { setTimeout(renderReligionPieChart, 50); }
        }
      });
    });

    if (settingsModal) settingsModal.style.display = 'none';

    // 窗口大小变化时重绘所有图表
    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        var charts = [
          window._fiscalChart, window._classesChart, window._councilChart,
          window._tradeChart, window._ethnicityChart, window._religionChart,
          window._popGrowthChart, window._gdpChart, window._supportChart
        ];
        charts.forEach(function (c) { if (c && c.resize) { try { c.resize(); } catch (e) { } } });
        fitNarrativeHeight();
      }, 150);
    });

    console.log('页面初始化完成！');
    logInfo('页面初始化完成 ' + (loaded ? '从存档加载' : '新游戏') + ' 回合=' + turnCount);

    // 首次打开时显示使用说明与免责声明
    if (!localStorage.getItem('disclaimer_accepted')) {
      showDisclaimer();
    }
  } catch (e) {
    logError('初始化失败: ' + e.message);
    console.error('初始化失败:', e);
    try {
      gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      applyMapGridSize(gameState);
      renderAll();
    } catch (err) {
      console.error('渲染默认状态也失败:', err);
    }
  }
});