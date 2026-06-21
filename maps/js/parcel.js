// ===== 规划区系统 =====

let planningParcels = [];
let parcelIdCounter = 1;

// 市政设施类型：可在"市政预留"规划区的信息面板中选择
const CIVIC_FACILITY_TYPES = [
    { key: 'none', name: '未指定', icon: '🏢' },
    { key: 'school', name: '学校', icon: '🏫' },
    { key: 'hospital', name: '医院', icon: '🏥' },
    { key: 'busdepot', name: '公交车库', icon: '🚌' },
    { key: 'firestation', name: '消防站', icon: '🚒' },
    { key: 'policestation', name: '警察局', icon: '🚓' },
    { key: 'library', name: '图书馆', icon: '📚' },
    { key: 'government', name: '政府机关', icon: '🏛️' },
    { key: 'postoffice', name: '邮局', icon: '📮' },
    { key: 'park', name: '公园', icon: '🌳' },
    { key: 'stadium', name: '体育场馆', icon: '🏟️' },
    { key: 'cemetery', name: '墓园', icon: '⚰️' },
    { key: 'powerplant', name: '电厂', icon: '⚡' },
    { key: 'watertower', name: '水塔', icon: '💧' },
    { key: 'substation', name: '变电站', icon: '🔌' },
    { key: 'warehouse', name: '仓库', icon: '📦' }
];

function getCivicFacility(key) {
    return CIVIC_FACILITY_TYPES.find(f => f.key === key) || CIVIC_FACILITY_TYPES[0];
}

// 规划区类型预设
const defaultParcelTypePresets = {
    residential: { name: '住宅', generator: 'table', size: [64, 32], tag: ['residential', 'housing', 'low-rise'], design: { independence: 3, quality: 3, density: 3, enclosure: 2 } },
    commercial: { name: '商业', generator: 'table', size: [80, 40], tag: ['commercial', 'retail', 'office'], design: { localization: 3, scale: 3, convenience: 3 } },
    industrial: { name: '工业', generator: 'large-table', size: [112, 56], tag: ['industrial', 'factory', 'warehouse'], design: { environmental: 3, automation: 3, output: 3 } },
    courtyard: { name: '临街住宅', generator: 'perimeter', size: [48, 40], tag: ['residential', 'courtyard'], design: { independence: 5, quality: 4, density: 2, enclosure: 5 } },
    highstreet: { name: '主干道商业街', generator: 'spine', size: [80, 40], tag: ['commercial', 'highstreet'] },
    office: { name: '办公区', generator: 'large-table', size: [96, 48], tag: ['office', 'commercial', 'hq'] },
    civic: { name: '市政预留', generator: 'ungrowable', size: [80, 80], tag: ['civic', 'municipal', 'reserved'] },
    slum: { name: '贫民窟', generator: 'ungrowable', size: [64, 64], tag: ['slum'], placeable: false, style: { fill: 'diagonal-hatch', baseColor: '#3a3a3a', strokeColor: '#1a1a1a', alpha: 0.45 } },
    agricultural: { name: '农业区', generator: 'ungrowable', size: [80, 80], tag: ['agricultural', 'farm'], style: { fill: 'grid-pattern', baseColor: '#7cb342', gridColor: '#aed581', strokeColor: '#558b2f', alpha: 0.55, gridSize: 16 }, design: { sustainability: 3, economicBenefit: 3, collectivism: 3 } }
};

// PlanningParcel 类
class PlanningParcel {
    // 参数：anchorIds 或 points 数组。传入 points 时锚点ID可选。
    constructor(anchorIds, type = 'residential', points = null, design = null, facility = null, facilityDesign = null) {
        this.name = generateParcelName();
        this.anchorIds = anchorIds;
        // 直接存储顶点坐标，不依赖动态锚点ID，保证缩放/存档后形状稳定
        this.points = points || [];
        this.type = type;
        this.status = 'idle'; // idle | 建造中 | 开放
        this.buildStartGameSec = null;
        this.prosperity = 0.5; // 繁荣度 0~1，影响建筑透明度
        // seed 用于确定性推导每个 lot 的建造顺序
        this.seed = Math.floor(Math.random() * 0xffffffff);
        // buildProgress 记录当前建造进度 0~1
        // 配合 seed 使用，存档载入后所有 lot 状态可被完全还原
        this.buildProgress = 0;
        // 是否已标记为建成区地形（避免在 tick 中重复添加）
        this.builtUpMarked = false;
        // 设计理念：由玩家在滑条面板中设置，每个住宅规划区独立一份
        // 格式：{ independence: n, quality: n, density: n, enclosure: n }
        this.design = design || getDefaultDesignForType(type);
        // 市政设施：仅对 civic 类型有意义，用于选择学校/医院/公交车库等
        this.facility = facility || (type === 'civic' ? 'none' : null);
        // 市政设施设计理念（仅 civic 有设施时使用）：3 个维度
        this.facilityDesign = facilityDesign || null;
    }

    // 获取规划区顶点坐标（优先用 points，否则从锚点动态解析）
    getPolygon() {
        if (this.points && this.points.length >= 3) {
            return this.points.map(p => ({ x: p.x, y: p.y }));
        }
        // 兼容：从 anchorIds 解析（旧存档或旧创建逻辑）
        const poly = [];
        for (const id of this.anchorIds) {
            const a = getAnchorById(id);
            if (a) poly.push({ x: a.x, y: a.y });
        }
        return poly;
    }
}

// 生成规划区名称
function generateParcelName() {
    const name = String(parcelIdCounter).padStart(3, '0');
    parcelIdCounter++;
    return name;
}

// 获取规划区颜色
function getParcelColor(type) {
    const colors = {
        residential: { fill: 'rgba(74, 144, 217, 0.10)', stroke: '#2c6fb8' },
        commercial: { fill: 'rgba(243, 156, 18, 0.10)', stroke: '#c8850a' },
        industrial: { fill: 'rgba(155, 89, 182, 0.10)', stroke: '#7b3fa3' },
        courtyard: { fill: 'rgba(39, 174, 96, 0.10)', stroke: '#1e8449' },
        highstreet: { fill: 'rgba(230, 126, 34, 0.10)', stroke: '#b96416' },
        office: { fill: 'rgba(52, 152, 219, 0.10)', stroke: '#1f6fb8' },
        civic: { fill: 'rgba(149, 165, 166, 0.10)', stroke: '#6a7c7d' },
        slum: { fill: 'rgba(58, 58, 58, 0.35)', stroke: '#1a1a1a' },
        agricultural: { fill: 'rgba(124, 179, 66, 0.35)', stroke: '#558b2f' }
    };
    return colors[type] || colors.residential;
}

// 获取地块颜色
function getPlotSolidColor(type) {
    const colors = {
        residential: '#4a90d9',
        commercial: '#f39c12',
        industrial: '#9b59b6',
        courtyard: '#27ae60',
        highstreet: '#e67e22',
        office: '#3498db',
        civic: '#95a5a6',
        slum: '#3a3a3a',
        agricultural: '#7cb342'
    };
    return colors[type] || colors.residential;
}

// 内部地块管理
let internalPlotIdCounter = 1;
let internalPlots = [];

// 注册内部地块
function registerCell(polygon, parcelType, parcelName) {
    const id = internalPlotIdCounter++;
    const flat = [];
    for (const p of polygon) { flat.push(p.x, p.y); }

    // 计算多边形面积（使用Shoelace公式）
    const area = calculatePolygonArea(flat);

    internalPlots.push({
        id,
        polygon: flat,
        parcelType: parcelType || 'residential',
        parcelName: parcelName,
        status: 'idle',
        buildStartGameSec: null,
        area: area
    });
}

// 计算多边形面积（Shoelace公式）
function calculatePolygonArea(flat) {
    if (!flat || flat.length < 6) return 1;
    let area = 0;
    const n = flat.length / 2;
    for (let i = 0; i < n; i++) {
        const x1 = flat[i * 2];
        const y1 = flat[i * 2 + 1];
        const x2 = flat[(i + 1) % n * 2];
        const y2 = flat[(i + 1) % n * 2 + 1];
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area / 2);
}

// ============================================================
// 基于 seed 的确定性 lot 建造系统
// 目标：给定 (parcel.seed, parcel.buildProgress, n)，
// 能确定性地推导出每个 lot 的状态，保证存档载入后显示一致
// ============================================================

// 32位乘法同余 PRNG（mulberry32），完全确定性
function seededRandom(seed) {
    let t = seed >>> 0;
    return function () {
        t = (t + 0x6D2B79F5) >>> 0;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

// 使用 seed 生成 0..n-1 的一个确定性排列（Fisher-Yates）
// 相同的 seed 和 n 会产生完全相同的排列
function seededPermutation(seed, n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(i);
    if (n <= 1) return arr;
    const rand = seededRandom(seed >>> 0);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

// 计算一个规划区内的 lot 总数
function getParcelPlotCount(parcelName) {
    let count = 0;
    for (const plot of internalPlots) {
        if (plot.parcelName === parcelName) count++;
    }
    return count;
}

// 容积效率对应的人口倍率
// 档位1: 低密疏朗 -> 0.3
// 档位2: 适度密度 -> 0.5
// 档位3: 均衡密度 -> 1.0
// 档位4: 紧凑密度 -> 1.8
// 档位5: 高层聚集 -> 3.0
const DENSITY_MULTIPLIERS = [0.3, 0.5, 1.0, 1.8, 3.0];

function getDensityMultiplier(densityValue) {
    const idx = Math.max(0, Math.min(4, (parseInt(densityValue, 10) || 3) - 1));
    return DENSITY_MULTIPLIERS[idx];
}

// 计算整个城市的总人口
// 规则：每个已建成（状态为"开放"）的住宅区 lot 基础人口 100 人，乘以该规划区的容积效率倍率
function calculateTotalPopulation() {
    let total = 0;
    for (const parcel of planningParcels) {
        const p = calculateParcelPopulation(parcel);
        if (p > 0) total += p;
    }
    return total;
}

// 计算单个规划区的人口数（所有类型都计算，住宅区使用容积效率倍率，其他类型每个已建成 lot 100 人）
function calculateParcelPopulation(parcel) {
    if (!parcel) return 0;
    // 只统计已建成（状态为"开放"）的 lot
    let builtLotCount = 0;
    for (const plot of internalPlots) {
        if (plot.parcelName === parcel.name && plot.status === '开放') {
            builtLotCount++;
        }
    }
    if (builtLotCount === 0) return 0;

    // 住宅区使用容积效率倍率，其他类型每个 lot 100 人
    let multiplier = 1.0;
    const isResidential = (parcel.tag && parcel.tag.includes('residential')) ||
        (parcelTypePresets[parcel.type]?.tag && parcelTypePresets[parcel.type].tag.includes('residential'));
    if (isResidential) {
        const densityValue = parcel.design?.density || 3;
        multiplier = getDensityMultiplier(densityValue);
    }
    return Math.round(100 * multiplier * builtLotCount);
}

// 依据 parcel 的 seed 和 buildProgress，得到指定 lot 的"建造序号"
// （该 lot 在整体建造顺序中的第几位被启动，0-based）
// 返回 -1 表示未安排（lot 不在该 parcel 内）
function getPlotBuildOrder(parcel, plotGlobalIdxInParcel) {
    const n = getParcelPlotCount(parcel.name);
    if (n === 0) return -1;
    if (plotGlobalIdxInParcel < 0 || plotGlobalIdxInParcel >= n) return -1;
    const perm = seededPermutation(parcel.seed, n);
    // perm[k] = i 表示第 k 个被启动的 lot 的全局 index 为 i
    // 求逆：某个原始 index i 对应的建造序号 = k where perm[k] = i
    // 为避免每次 O(n)，先构造逆映射
    if (!parcel._invPerm || parcel._invPerm._n !== n || parcel._invPerm._seed !== parcel.seed) {
        const inv = new Array(n);
        for (let k = 0; k < n; k++) inv[perm[k]] = k;
        parcel._invPerm = { _n: n, _seed: parcel.seed, inv };
    }
    return parcel._invPerm.inv[plotGlobalIdxInParcel];
}

// 给定 (parcel, lotIdx) 和当前 gameSeconds，推导该 lot 的状态
// 返回: 'idle' | 'building' | 'open'，以及（建造中的）相对阶段
function computePlotState(parcel, lotIdxInParcel, n, currentGameSec) {
    if (!parcel) return { status: 'idle' };
    if (!n) n = getParcelPlotCount(parcel.name);
    if (n === 0) return { status: 'idle' };

    // 由 seed 得到排列
    const perm = seededPermutation(parcel.seed, n);
    // 由 buildProgress 计算当前已"完整启动"的 lot 数量（0..n）
    const progress = Math.max(0, Math.min(1, parcel.buildProgress || 0));
    const totalBuildSlots = n + 1; // 使用 n+1 个阶段便于 1 个 lot 正在建
    const currentStep = progress * totalBuildSlots; // 0..totalBuildSlots
    const completedCount = Math.floor(currentStep); // 0..n

    // 第 completedCount 号（在 perm 中）即当前正在建造的 lot
    // perm[k] = lot 的原始 idx（按出现顺序）
    // 所以当前 lotIdxInParcel 的"建造序号" = k 使得 perm[k] = lotIdxInParcel
    let buildOrder = -1;
    for (let k = 0; k < n; k++) {
        if (perm[k] === lotIdxInParcel) { buildOrder = k; break; }
    }
    if (buildOrder === -1) return { status: 'idle' };

    if (buildOrder < completedCount) {
        return { status: 'open' };
    } else if (buildOrder === completedCount && completedCount < n) {
        // 当前正在建造
        const frac = currentStep - completedCount; // 0~1 内的阶段
        return { status: 'building', frac };
    } else {
        return { status: 'idle' };
    }
}

// 将给定的（真实流逝的）游戏秒数转换为 buildProgress 的增量
// 语义：每 INTERNAL_PLOT_TICK_HOURS 游戏小时推进 1/(totalSlots) 的进度
function advanceParcelBuildProgress(parcel, elapsedGameSec, totalLots,
    tickHours = INTERNAL_PLOT_TICK_HOURS,
    buildSecondsPerLot = INTERNAL_PLOT_BUILD_SEC) {
    if (!parcel || totalLots <= 0) return parcel.buildProgress || 0;
    if (elapsedGameSec <= 0) return parcel.buildProgress || 0;
    const totalSlots = totalLots + 1; // 预留 n+1 个阶段
    // 每 tickHours 小时推进 1/totalSlots
    const secondsPerTick = tickHours * 3600;
    const ticks = elapsedGameSec / secondsPerTick;
    // 为保证"建造中"的视觉效果与"1 lot/游戏日"的体验一致，
    // 这里使用按秒线性推进，速率 = 1 / (totalLots * buildSecondsPerLot)
    // 这等价于：每个 lot 的建造期为 buildSecondsPerLot 游戏秒
    const delta = elapsedGameSec / (totalLots * buildSecondsPerLot);
    parcel.buildProgress = Math.max(0, Math.min(1, (parcel.buildProgress || 0) + delta));
    return parcel.buildProgress;
}

// ============================================================
// 新型锚点系统：持久锚点 + 动态临时锚点
// ============================================================
// persistentAnchors: 仅存储被规划区使用的锚点
//   格式: { id: string, x: number, y: number, roadName: string }
//   ID 格式: "p_<roadName>_<idx>" （持久锚点）
// 临时锚点: 在进入 parcel 模式时动态生成，不保存
//   ID 格式: "t_<roadName>_<idx>"
// ============================================================

let persistentAnchors = [];    // 已被使用的持久锚点
let tempAnchors = [];          // parcel 模式下动态生成的临时锚点
let persistentAnchorCounter = 0;

// 根据 viewScale 计算锚点采样间距（单位：米）
// viewScale 越小（越缩小地图），锚点越稀疏（但有上限，避免完全消失）
function getAnchorSpacingMeters(viewScale) {
    // 目标屏幕像素间距：约 36 像素（屏幕上保持可见）
    const targetPixelSpacing = 36;
    // 基础间距：6 米（最小间距）
    const baseSpacing = 6;
    // 最大间距：200 米
    const maxSpacing = 200;
    const spacing = Math.max(baseSpacing, Math.min(maxSpacing, targetPixelSpacing / viewScale));
    return spacing;
}

// 判断道路是否在视口范围内（更宽松的检测）
function isRoadInViewport(road, viewOffsetX, viewOffsetY, viewScale, canvasWidth, canvasHeight) {
    if (!road.points || road.points.length === 0) return false;
    // 总是使用固定的 500 米扩展范围，确保放大时也能检测到通过视口的道路
    const marginWorld = 500;
    const minWorldX = (0 - viewOffsetX) / viewScale - marginWorld;
    const maxWorldX = (canvasWidth - viewOffsetX) / viewScale + marginWorld;
    const minWorldY = (0 - viewOffsetY) / viewScale - marginWorld;
    const maxWorldY = (canvasHeight - viewOffsetY) / viewScale + marginWorld;

    for (const pt of road.points) {
        if (pt.x >= minWorldX && pt.x <= maxWorldX && pt.y >= minWorldY && pt.y <= maxWorldY) {
            return true;
        }
    }
    // 对于短道路（< 200 米），只要靠近视口就算可见
    if (road.points.length >= 2) {
        const p0 = road.points[0];
        const p1 = road.points[road.points.length - 1];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 200) {
            // 检查中点是否在大范围内
            const mx = (p0.x + p1.x) / 2;
            const my = (p0.y + p1.y) / 2;
            const extendedMargin = 2000;
            if (mx >= minWorldX - extendedMargin && mx <= maxWorldX + extendedMargin &&
                my >= minWorldY - extendedMargin && my <= maxWorldY + extendedMargin) {
                return true;
            }
        }
    }
    return false;
}

// 估算二次贝塞尔曲线的近似长度
function estimateCurveLength(p0, p1, p2) {
    // 使用简单的近似：取若干采样点计算折线长度
    const samples = 20;
    let length = 0;
    let prevX = p0.x;
    let prevY = p0.y;
    for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
        const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
        length += Math.sqrt((x - prevX) * (x - prevX) + (y - prevY) * (y - prevY));
        prevX = x;
        prevY = y;
    }
    return length;
}

// 为单个道路动态生成临时锚点（考虑 LOD 和视口）
function generateTempAnchorsForRoad(road, spacing, viewportBounds) {
    const results = [];
    // 放宽状态检查：只有明确标记为"规划中"的才跳过，其他状态都生成锚点
    if (road.status === '规划中') return results;
    if (typeof road.height === 'number' && road.height === 1) return results; // 隧道不生成锚点
    if (road.type === 'internal') return results; // 内部道路不生成锚点

    // 使用道路自身的 modules 或默认预设
    const modules = Array.isArray(road.modules) && road.modules.length > 0
        ? road.modules
        : getLaneModules(currentLanePreset);
    if (!Array.isArray(modules) || modules.length === 0) return results;

    const strokeWidth = modules.reduce((sum, m) =>
        sum + (m && typeof m.width === 'number' ? m.width : 0), 0);
    const halfWidth = Math.max(strokeWidth / 2, 2);

    const tryAdd = (x, y, idx) => {
        // 视口裁剪
        if (viewportBounds &&
            (x < viewportBounds.minX || x > viewportBounds.maxX ||
                y < viewportBounds.minY || y > viewportBounds.maxY)) {
            return;
        }
        // 检查是否与持久锚点重复（避免视觉重复）
        for (const pa of persistentAnchors) {
            if (Math.abs(pa.x - x) < spacing * 0.4 && Math.abs(pa.y - y) < spacing * 0.4) {
                return; // 与持久锚点太近，跳过
            }
        }
        results.push({
            id: 't_' + road.name + '_' + idx,
            x, y,
            roadName: road.name,
            isPersistent: false
        });
    };

    let idxCounter = 0;

    if (road.type === 'line' && road.points.length >= 2) {
        const p0 = road.points[0];
        const p1 = road.points[road.points.length - 1];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 0.5) return results;

        const normalX = -dy / length;
        const normalY = dx / length;

        // 确保至少在道路两端附近各生成一个锚点
        const minAnchors = 2;
        const maxAnchors = Math.floor(length / 6); // 最小间距6米
        let numAnchors = Math.floor(length / spacing);
        numAnchors = Math.max(minAnchors, Math.min(maxAnchors, numAnchors));

        // 如果道路很短，强制在两端附近生成锚点
        if (length < spacing * 2) {
            // 在道路两端附近各生成一个锚点
            const nearEndOffset = Math.min(8, length * 0.15); // 距离端点8米或长度的15%
            const t1 = nearEndOffset / length;
            const t2 = 1 - nearEndOffset / length;
            const x1 = p0.x + dx * t1;
            const y1 = p0.y + dy * t1;
            const x2 = p0.x + dx * t2;
            const y2 = p0.y + dy * t2;
            for (let side = -1; side <= 1; side += 2) {
                tryAdd(x1 + normalX * halfWidth * side, y1 + normalY * halfWidth * side, idxCounter++);
                tryAdd(x2 + normalX * halfWidth * side, y2 + normalY * halfWidth * side, idxCounter++);
            }
        } else {
            const step = length / (numAnchors + 1);
            for (let i = 1; i <= numAnchors; i++) {
                const t = i * step / length;
                const x = p0.x + dx * t;
                const y = p0.y + dy * t;
                for (let side = -1; side <= 1; side += 2) {
                    tryAdd(x + normalX * halfWidth * side, y + normalY * halfWidth * side, idxCounter++);
                }
            }
        }
    } else if (road.type === 'curve' && road.points.length >= 3) {
        const p0 = road.points[0], p1 = road.points[1], p2 = road.points[2];
        // 根据 spacing 和曲线近似长度动态采样
        const approxLength = estimateCurveLength(p0, p1, p2);
        // 确保至少生成4个锚点，最多生成足够数量（每6米一个）
        const minSamples = 4;
        const maxSamples = Math.floor(approxLength / 6);
        const approxLen = Math.max(minSamples, Math.min(maxSamples, Math.floor(approxLength / spacing)));
        const stepT = 1 / (approxLen + 1);
        for (let i = 1; i <= approxLen; i++) {
            const t = i * stepT;
            const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
            const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
            const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
            const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 0.01) continue;
            const normalX = -dy / len;
            const normalY = dx / len;
            for (let side = -1; side <= 1; side += 2) {
                tryAdd(x + normalX * halfWidth * side, y + normalY * halfWidth * side, idxCounter++);
            }
        }
    } else if (road.type === 'free' && road.points.length >= 2) {
        // 自由绘制道路：沿折线逐段采样
        for (let seg = 0; seg < road.points.length - 1; seg++) {
            const p0 = road.points[seg];
            const p1 = road.points[seg + 1];
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 0.5) continue;

            const normalX = -dy / length;
            const normalY = dx / length;

            // 确保每个路段至少有一个锚点，最多每6米一个
            const minSegAnchors = 1;
            const maxSegAnchors = Math.floor(length / 6);
            let segAnchors = Math.floor(length / spacing);
            segAnchors = Math.max(minSegAnchors, Math.min(maxSegAnchors, segAnchors));

            // 如果路段很短，在两端附近各生成一个锚点
            if (length < spacing * 2) {
                const nearEndOffset = Math.min(8, length * 0.15);
                const t1 = nearEndOffset / length;
                const t2 = 1 - nearEndOffset / length;
                const x1 = p0.x + dx * t1;
                const y1 = p0.y + dy * t1;
                const x2 = p0.x + dx * t2;
                const y2 = p0.y + dy * t2;
                for (let side = -1; side <= 1; side += 2) {
                    tryAdd(x1 + normalX * halfWidth * side, y1 + normalY * halfWidth * side, idxCounter++);
                    tryAdd(x2 + normalX * halfWidth * side, y2 + normalY * halfWidth * side, idxCounter++);
                }
            } else {
                const step = length / (segAnchors + 1);
                for (let i = 1; i <= segAnchors; i++) {
                    const t = i * step / length;
                    const x = p0.x + dx * t;
                    const y = p0.y + dy * t;
                    for (let side = -1; side <= 1; side += 2) {
                        tryAdd(x + normalX * halfWidth * side, y + normalY * halfWidth * side, idxCounter++);
                    }
                }
            }
        }
    }

    return results;
}

// 重新生成所有临时锚点（进入 parcel 模式或视图变化时调用）
function regenerateTempAnchors(roads, viewOffsetX, viewOffsetY, viewScale, canvasWidth, canvasHeight) {
    tempAnchors = [];
    const spacing = getAnchorSpacingMeters(viewScale);

    // 使用固定的视口扩展范围（米），确保放大时仍能检测到道路
    const marginWorld = 200;
    const viewportBounds = {
        minX: (0 - viewOffsetX) / viewScale - marginWorld,
        maxX: (canvasWidth - viewOffsetX) / viewScale + marginWorld,
        minY: (0 - viewOffsetY) / viewScale - marginWorld,
        maxY: (canvasHeight - viewOffsetY) / viewScale + marginWorld
    };

    for (const road of roads) {
        if (!road) continue;
        if (!isRoadInViewport(road, viewOffsetX, viewOffsetY, viewScale, canvasWidth, canvasHeight)) continue;
        const roadAnchors = generateTempAnchorsForRoad(road, spacing, viewportBounds);
        tempAnchors.push(...roadAnchors);
    }
}

// 清空临时锚点（离开 parcel 模式时调用）
function clearTempAnchors() {
    tempAnchors = [];
}

// 根据 ID 查找锚点（先查持久锚点，再查临时）
function getAnchorById(id) {
    if (typeof id !== 'string' && typeof id !== 'number') return null;
    const key = String(id);
    // 持久锚点
    for (const a of persistentAnchors) {
        if (a.id === key) return { id: a.id, x: a.x, y: a.y, roadName: a.roadName, isPersistent: true };
    }
    // 临时锚点
    for (const a of tempAnchors) {
        if (a.id === key) return a;
    }
    return null;
}

// 将临时锚点转为持久锚点（规划区被创建时调用）
// 返回持久锚点的 ID
function promoteToPersistent(anchorId) {
    const key = String(anchorId);
    // 已是持久锚点
    for (const a of persistentAnchors) {
        if (a.id === key) return a.id;
    }
    // 在临时锚点中查找
    for (const a of tempAnchors) {
        if (a.id === key) {
            persistentAnchorCounter++;
            const newId = 'p_' + a.roadName + '_' + persistentAnchorCounter;
            const persist = {
                id: newId,
                x: a.x, y: a.y,
                roadName: a.roadName
            };
            persistentAnchors.push(persist);
            return newId;
        }
    }
    // 没找到，可能是老格式数字 ID —— 尝试以坐标形式（从 parcelDrawPoints 回退）
    return null;
}

// 删除与某个道路相关的锚点
function removeAnchorsByRoadName(roadName) {
    persistentAnchors = persistentAnchors.filter(a => a.roadName !== roadName);
    tempAnchors = tempAnchors.filter(a => a.roadName !== roadName);
}

// 清空所有锚点
function clearAllAnchors() {
    persistentAnchors = [];
    tempAnchors = [];
    persistentAnchorCounter = 0;
}

// 获取所有当前可用的锚点（持久 + 临时），用于点击检测和渲染
function getAllVisibleAnchors() {
    const all = [];
    for (const a of persistentAnchors) {
        all.push({ id: a.id, x: a.x, y: a.y, roadName: a.roadName, isPersistent: true });
    }
    for (const a of tempAnchors) {
        all.push(a);
    }
    return all;
}

// 根据类型返回默认的设计理念对象。对于没有 design 的区划，返回 null。
function getDefaultDesignForType(type) {
    const preset = defaultParcelTypePresets[type];
    if (preset && preset.design) {
        const result = {};
        for (const k in preset.design) {
            result[k] = clampInt(preset.design[k], 1, 5);
        }
        return result;
    }
    return null;
}

function clampInt(v, lo, hi) {
    v = parseInt(v, 10);
    if (isNaN(v)) return lo;
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}
