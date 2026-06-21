// ===== 地形系统（矢量多边形，基于区块的平滑生成）=====

const TERRAIN = { WATER: 0, LAND: 1, HILL: 2, BUILTUP: 3, RIVER: 4, INDUSTRIAL: 5, ROAD: 6 };
const TERRAIN_COLORS = {
    0: '#3e6bb8',   // 水域（蓝色）
    1: '#6fb054',   // 陆地/绿地（绿色）
    2: '#a0784a',   // 山地（棕色）
    3: '#c9b08a',   // 建成区/城区（米色）
    4: '#5dade2',   // 河流/水系（亮蓝）
    5: '#8e44ad',   // 工业区（紫色）
    6: '#505050'    // 道路/基础设施（深灰）
};

// 自然资源类型
const NATURAL_RESOURCE = { OIL: 0, MINERAL: 1, FERTILE: 2, FOREST: 3 };
const NATURAL_RESOURCE_COLORS = {
    0: '#1a1a1a',   // 石油 - 黑色
    1: '#8b4513',   // 矿产 - 棕色
    2: '#8b8b00',   // 肥沃土地 - 暗黄色
    3: '#228b22'    // 森林 - 深绿色
};
const NATURAL_RESOURCE_NAMES = {
    0: '石油',
    1: '矿产',
    2: '肥沃土地',
    3: '森林'
};

// 50km × 50km 边界：1 米 = WORLD_PIXELS_PER_METER 世界像素
const WORLD_PIXELS_PER_METER = 2;
const BOUNDARY_HALF_METERS = 25000;
const BOUNDARY_HALF = BOUNDARY_HALF_METERS * WORLD_PIXELS_PER_METER;
const WORLD_SIZE = BOUNDARY_HALF * 2;  // 100000 world-pixels

// 全局地形数据
let terrain = null;

// 全局自然资源数据
let naturalResources = null;

// 获取邻居格子（全局函数）
function getNeighbors(grid, r, c) {
    return [
        { r: r - 1, c: c },
        { r: r + 1, c: c },
        { r: r, c: c - 1 },
        { r: r, c: c + 1 },
        { r: r - 1, c: c - 1 },
        { r: r - 1, c: c + 1 },
        { r: r + 1, c: c - 1 },
        { r: r + 1, c: c + 1 }
    ];
}

// 将点限制在边界内
function clampToBoundary(p) {
    return {
        x: Math.max(-BOUNDARY_HALF, Math.min(BOUNDARY_HALF, p.x)),
        y: Math.max(-BOUNDARY_HALF, Math.min(BOUNDARY_HALF, p.y))
    };
}

// 将多边形所有点限制在边界内
function clampPolygon(poly) {
    if (!Array.isArray(poly)) return poly;
    return poly.map(clampToBoundary);
}

// 获取最小缩放（能看到整张地图）
function getMinScale(canvasWidth, canvasHeight) {
    return Math.max(0.001, Math.min(canvasWidth, canvasHeight) / WORLD_SIZE);
}

// 获取最大缩放
function getMaxScale() {
    return 20;
}

// 检查点是否在水域上
function isPointOnWater(pt) {
    if (!terrain || !terrain.regions || terrain.regions.length === 0) {
        return true; // 默认全是水域
    }
    for (const region of terrain.regions) {
        if (region.type === TERRAIN.LAND || region.type === TERRAIN.HILL) {
            if (isPointInPolygon(pt, region.polygon)) {
                return false;
            }
        }
    }
    return true;
}

// 检查点是否在山地（HILL）上
function isPointOnHill(pt) {
    if (!terrain || !terrain.regions || terrain.regions.length === 0) {
        return false;
    }
    for (const region of terrain.regions) {
        if (region.type === TERRAIN.HILL) {
            if (isPointInPolygon(pt, region.polygon)) {
                return true;
            }
        }
    }
    return false;
}

// 检查规划区是否在水域上
function isParcelOnWater(parcelPts) {
    if (!terrain || !terrain.regions || terrain.regions.length === 0) {
        return true;
    }

    // 检查所有顶点
    for (const pt of parcelPts) {
        if (isPointOnWater(pt)) return true;
    }

    // 检查中心点
    const center = polygonCenter(parcelPts);
    if (isPointOnWater(center)) return true;

    // 检查边的中点
    for (let i = 0; i < parcelPts.length; i++) {
        const p1 = parcelPts[i];
        const p2 = parcelPts[(i + 1) % parcelPts.length];
        const mid = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
        if (isPointOnWater(mid)) return true;
    }

    return false;
}

// 检查道路是否穿过水域或山地（仅地面道路需要检查）
function isRoadCrossingWater(road) {
    if (!road || !road.points || road.points.length < 2) return false;
    if (road.height !== 0) return false; // 高架或隧道可以穿过

    const pts = road.points;
    const sampleInterval = 10; // 每10米采样一次

    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const len = distance(p1, p2);
        const steps = Math.max(1, Math.floor(len / sampleInterval));

        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const pt = {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            };
            if (isPointOnWater(pt) || isPointOnHill(pt)) {
                return true;
            }
        }
    }

    return false;
}

// 绘制地形（支持emoji标记）
function drawTerrain(ctx) {
    if (!terrain || !terrain.rawBlocks) {
        ctx.fillStyle = TERRAIN_COLORS[TERRAIN.WATER];
        ctx.fillRect(-BOUNDARY_HALF, -BOUNDARY_HALF, WORLD_SIZE, WORLD_SIZE);
        return;
    }

    const GRID = BLOCK_GRID;
    const BS = BLOCK_SIZE;

    // 先绘制水域背景
    const expandMargin = BLOCK_SIZE * 2;
    ctx.fillStyle = TERRAIN_COLORS[TERRAIN.WATER];
    ctx.fillRect(-BOUNDARY_HALF - expandMargin, -BOUNDARY_HALF - expandMargin,
        WORLD_SIZE + expandMargin * 2, WORLD_SIZE + expandMargin * 2);

    // 按地形类型分层绘制：从底层到顶层
    const layerOrder = [TERRAIN.LAND, TERRAIN.RIVER, TERRAIN.HILL, TERRAIN.BUILTUP, TERRAIN.INDUSTRIAL, TERRAIN.ROAD];
    const layerColors = {};
    for (const t of Object.values(TERRAIN)) {
        layerColors[t] = TERRAIN_COLORS[t] || TERRAIN_COLORS[TERRAIN.LAND];
    }

    for (const layerType of layerOrder) {
        ctx.fillStyle = layerColors[layerType];
        ctx.beginPath();

        for (let r = 0; r < GRID; r++) {
            for (let c = 0; c < GRID; c++) {
                if (terrain.rawBlocks[r][c] !== layerType) continue;

                const x0 = -BOUNDARY_HALF + c * BS;
                const y0 = BOUNDARY_HALF - r * BS;

                ctx.rect(x0, y0 - BS, BS, BS);
            }
        }

        ctx.fill();
    }

    // 绘制emoji标记（包含单点和簇群）
    if (terrain.markers && terrain.markers.length > 0) {
        renderEmojiMarkers(ctx, GRID, BS);
    }

    // 绘制网格线
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = BS * 0.01;
    ctx.beginPath();
    for (let r = 0; r <= GRID; r++) {
        const y = BOUNDARY_HALF - r * BS;
        ctx.moveTo(-BOUNDARY_HALF, y);
        ctx.lineTo(BOUNDARY_HALF, y);
    }
    for (let c = 0; c <= GRID; c++) {
        const x = -BOUNDARY_HALF + c * BS;
        ctx.moveTo(x, -BOUNDARY_HALF);
        ctx.lineTo(x, BOUNDARY_HALF);
    }
    ctx.stroke();

    // 绘制图例到HTML栏
    if (terrain.legend && terrain.legend.length > 0) {
        renderMapLegend(terrain.legend);
    } else {
        var bar = document.getElementById('map-legend-bar');
        if (bar) bar.style.display = 'none';
    }
}

// ===== 渲染emoji标记（修复翻转+支持簇群） =====
function renderEmojiMarkers(ctx, GRID, BS) {
    // 保存上下文，取消Y翻转以正确渲染文字
    ctx.save();
    ctx.scale(1, -1);

    for (const marker of terrain.markers) {
        // 簇群模式：shape + 区域参数 + emoji
        if (marker.shape && marker.emoji) {
            renderEmojiCluster(ctx, marker, GRID, BS);
            continue;
        }
        // 单点模式
        if (marker.row !== undefined && marker.col !== undefined && marker.emoji) {
            const cx = -BOUNDARY_HALF + marker.col * BS + BS / 2;
            const cy = BOUNDARY_HALF - marker.row * BS - BS / 2;
            // Y翻转后的坐标
            const fontSize = (marker.size || BS * 0.8);
            ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(marker.emoji, cx, -cy);
        }
    }

    ctx.restore();
}

// ===== 渲染emoji簇群 =====
function renderEmojiCluster(ctx, marker, GRID, BS) {
    const shape = marker.shape || 'rect';
    const emoji = marker.emoji;
    const fontSize = (marker.size || BS * 0.7);
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (shape === 'rect') {
        const rs = Math.max(0, marker.rowStart || 0);
        const re = Math.min(GRID - 1, marker.rowEnd || GRID - 1);
        const cs = Math.max(0, marker.colStart || 0);
        const ce = Math.min(GRID - 1, marker.colEnd || GRID - 1);
        const step = Math.max(1, Math.round(1 / (marker.density || 0.4)));
        for (let r = rs; r <= re; r += step) {
            for (let c = cs; c <= ce; c += step) {
                const cx = -BOUNDARY_HALF + c * BS + BS / 2;
                const cy = BOUNDARY_HALF - r * BS - BS / 2;
                ctx.fillText(emoji, cx, -cy);
            }
        }
    } else if (shape === 'circle') {
        const cr = marker.centerRow || GRID / 2;
        const cc = marker.centerCol || GRID / 2;
        const radius = marker.radius || 4;
        const step = Math.max(1, Math.round(1 / (marker.density || 0.35)));
        for (let r = 0; r < GRID; r += step) {
            for (let c = 0; c < GRID; c += step) {
                const dr = r - cr;
                const dc = c - cc;
                if (dr * dr + dc * dc <= radius * radius) {
                    const cx = -BOUNDARY_HALF + c * BS + BS / 2;
                    const cy = BOUNDARY_HALF - r * BS - BS / 2;
                    ctx.fillText(emoji, cx, -cy);
                }
            }
        }
    } else if (shape === 'line') {
        const rs = marker.rowStart || 0;
        const cs = marker.colStart || 0;
        const re = marker.rowEnd || rs;
        const ce = marker.colEnd || cs;
        const len = Math.max(1, Math.sqrt((re - rs) ** 2 + (ce - cs) ** 2));
        const density = marker.density || 0.6;
        const count = Math.max(1, Math.round(len * density));
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1 || 1);
            const r = Math.round(rs + (re - rs) * t);
            const c = Math.round(cs + (ce - cs) * t);
            const cx = -BOUNDARY_HALF + c * BS + BS / 2;
            const cy = BOUNDARY_HALF - r * BS - BS / 2;
            ctx.fillText(emoji, cx, -cy);
        }
    }
}

// ===== 渲染地图图例到HTML栏 =====
function renderMapLegend(legendItems) {
    var bar = document.getElementById('map-legend-bar');
    if (!bar) return;
    bar.style.display = 'flex';
    bar.innerHTML = legendItems.map(function (item) {
        var emoji = item.emoji || '';
        var name = item.name || '';
        return '<span class="legend-item"><span class="legend-emoji">' + emoji + '</span><span class="legend-name">' + name + '</span></span>';
    }).join('');
}

// 使用简单线条绘制多边形（简化版，用于测试）
function drawSmoothPolygon(ctx, poly) {
    if (poly.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);

    // 直接用直线连接所有点
    for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x, poly[i].y);
    }

    ctx.closePath();
    ctx.fill();
}

// 加载地形数据
function loadTerrain(data) {
    if (!data || (!data.regions && !data.terrain)) {
        terrain = null;
        return;
    }

    const regions = data.regions || (data.terrain && data.terrain.regions);

    if (!regions || !Array.isArray(regions)) {
        terrain = null;
        return;
    }

    terrain = {
        regions: regions.map(r => ({
            type: r.type || TERRAIN.LAND,
            polygon: r.polygon || []
        }))
    };
}

// 将一个多边形区域标记为建成区
function markAsBuiltUp(polygonPoints) {
    if (!polygonPoints || polygonPoints.length < 3) return;
    if (!terrain) {
        terrain = { regions: [] };
    }
    terrain.regions.push({
        type: TERRAIN.BUILTUP,
        polygon: polygonPoints.map(p => ({ x: p.x, y: p.y }))
    });
}

// 清除地形
function clearTerrain() {
    terrain = null;
}

// ===== 自然资源管理 =====
function loadNaturalResources(data) {
    if (!data || !data.regions) {
        naturalResources = null;
        return;
    }

    naturalResources = {
        regions: data.regions.map(r => ({
            type: r.type !== undefined ? r.type : NATURAL_RESOURCE.FOREST,
            polygon: r.polygon || []
        }))
    };
}

function clearNaturalResources() {
    naturalResources = null;
}

function getNaturalResourcesData() {
    return naturalResources;
}

// ============================================================
// 32x32区块地形生成系统
// 将 100km x 100km 地图划分为 32x32 个区块
// AI 返回区块数据，支持emoji标记和图例
// ============================================================

const BLOCK_GRID = 32;                     // 32x32 grid
const BLOCK_SIZE = WORLD_SIZE / BLOCK_GRID;  // 20000 world-pixels = 10km

// 图例数据结构（用于显示在右侧）
let terrainLegend = [];

// ============================================================
// 预设地形模板
// ============================================================
const TERRAIN_TEMPLATES = {
    // 海湾地形：东侧沿海，中部平原，西北山地，河流从西北流向东南海湾
    bay: {
        name: '海湾城市',
        description: '东侧沿海的海湾地形，适合发展港口贸易',
        water_direction: '东侧沿海',
        mountain_direction: '西北山地',
        river_direction: '自西北向东南入海',
        generate: function () {
            const grid = [];
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    // 东侧沿海（海湾）
                    if (c >= 7 || (c === 6 && r >= 5)) {
                        grid[r][c] = 0;
                    }
                    // 西北山地（只能在陆地上）
                    else if (r <= 2 && c <= 2) {
                        grid[r][c] = 2;
                    }
                    // 其他区域为陆地（包括边界行/列，确保陆地延伸到地图外侧）
                    else {
                        grid[r][c] = 1;
                    }
                }
            }
            // 河流：从西北山地流向东南海湾
            grid[3][3] = 0;
            grid[4][4] = 0;
            grid[5][5] = 0;
            return grid;
        }
    },

    // 小岛地形：中央岛屿，四周环海
    island: {
        name: '海岛城市',
        description: '四面环海的岛屿地形，适合发展渔业和旅游业',
        water_direction: '四周环海',
        mountain_direction: '中央高地',
        river_direction: '岛内河流',
        generate: function () {
            const grid = [];
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    // 四周水域
                    if (r <= 1 || r >= 8 || c <= 1 || c >= 8) {
                        grid[r][c] = 0;
                    }
                    // 中央高地
                    else if (r >= 4 && r <= 5 && c >= 4 && c <= 5) {
                        grid[r][c] = 2;
                    }
                    // 岛屿主体
                    else {
                        grid[r][c] = 1;
                    }
                }
            }
            // 岛内河流
            grid[3][4] = 0;
            grid[4][4] = 0;
            grid[5][4] = 0;
            return grid;
        }
    },

    // 河谷地形：南北两侧山地，中间河谷平原，河流贯穿
    valley: {
        name: '河谷城市',
        description: '两山之间的河谷平原，适合农业发展',
        water_direction: '无明显水域',
        mountain_direction: '南北两侧山地',
        river_direction: '南北贯穿',
        generate: function () {
            const grid = [];
            // 初始化为陆地（包括边界，确保陆地延伸到地图外侧）
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 1;
                }
            }
            // 北部山地（只能在陆地上）
            for (let r = 0; r <= 2; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 2;
                }
            }
            // 南部山地（只能在陆地上）
            for (let r = 7; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 2;
                }
            }
            // 河流贯穿河谷
            for (let r = 2; r <= 7; r++) {
                grid[r][4] = 0;
                grid[r][5] = 0;
            }
            return grid;
        }
    },

    // 三角洲地形：南侧沿海，河流从北向南形成三角洲
    delta: {
        name: '三角洲城市',
        description: '河流入海口形成的三角洲平原',
        water_direction: '南侧沿海',
        mountain_direction: '北部高地',
        river_direction: '自北向南入海',
        generate: function () {
            const grid = [];
            // 初始化为陆地（包括边界，确保陆地延伸到地图外侧）
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 1;
                }
            }
            // 南侧沿海
            for (let r = 7; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
            // 北部高地（只能在陆地上）
            for (let r = 0; r <= 2; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1) {
                        grid[r][c] = 2;
                    }
                }
            }
            // 三角洲河流分支
            grid[3][4] = 0;
            grid[4][4] = 0;
            grid[5][3] = 0;
            grid[5][4] = 0;
            grid[5][5] = 0;
            grid[6][3] = 0;
            grid[6][4] = 0;
            grid[6][5] = 0;
            grid[6][6] = 0;
            return grid;
        }
    },

    // 平原地形：广阔平原，少量丘陵
    plain: {
        name: '平原城市',
        description: '广阔平坦的平原地形，适合大规模城市建设',
        water_direction: '西侧临湖',
        mountain_direction: '东部丘陵',
        river_direction: '东西流向',
        generate: function () {
            const grid = [];
            // 初始化为陆地（包括边界，确保陆地延伸到地图外侧）
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 1;
                }
            }
            // 西侧湖泊
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r][0] = 0;
            }
            // 东部丘陵（只能在陆地上）
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = 8; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1) {
                        grid[r][c] = 2;
                    }
                }
            }
            // 河流从东向西流入湖泊
            grid[4][1] = 0;
            grid[4][2] = 0;
            grid[4][3] = 0;
            grid[4][4] = 0;
            grid[5][1] = 0;
            grid[5][2] = 0;
            grid[5][3] = 0;
            return grid;
        }
    },

    // 半岛地形：三面环海，连接大陆
    peninsula: {
        name: '半岛城市',
        description: '三面环海的半岛地形，拥有丰富海岸线',
        water_direction: '东、南、西三面环海',
        mountain_direction: '北部山地',
        river_direction: '自北向南入海',
        generate: function () {
            const grid = [];
            // 初始化为陆地（北部边界延伸到地图外侧）
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 1;
                }
            }
            // 北部连接大陆（山地，只能在陆地上）
            for (let r = 0; r <= 1; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1) {
                        grid[r][c] = 2;
                    }
                }
            }
            // 东侧海域
            for (let r = 2; r < BLOCK_GRID; r++) {
                for (let c = 7; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
            // 西侧海域
            for (let r = 2; r < BLOCK_GRID; r++) {
                for (let c = 0; c <= 1; c++) {
                    grid[r][c] = 0;
                }
            }
            // 南侧海域
            for (let r = 8; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
            // 河流（只能在陆地上）
            const riverCols = [4];
            for (let r = 2; r <= 6; r++) {
                for (const col of riverCols) {
                    if (grid[r][col] === 1) {
                        grid[r][col] = 0;
                    }
                }
            }
            return grid;
        }
    },

    // 内陆湖地形：中央大湖，周围平原
    inland_lake: {
        name: '内陆湖城市',
        description: '围绕大型内陆湖的城市',
        water_direction: '中央湖泊',
        mountain_direction: '外围山地',
        river_direction: '河流汇入湖泊',
        generate: function () {
            const grid = [];
            // 初始化为陆地（包括边界，确保陆地延伸到地图外侧）
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 1;
                }
            }
            // 外围山地（只能在陆地上）
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if ((r <= 1 || r >= 8 || c <= 1 || c >= 8) && grid[r][c] === 1) {
                        grid[r][c] = 2;
                    }
                }
            }
            // 中央湖泊
            for (let r = 3; r <= 6; r++) {
                for (let c = 3; c <= 6; c++) {
                    grid[r][c] = 0;
                }
            }
            // 汇入河流（只能在陆地上）
            const rivers = [[2, 4], [4, 2], [6, 4], [4, 6]];
            for (const [r, c] of rivers) {
                if (grid[r][c] === 1) {
                    grid[r][c] = 0;
                }
            }
            return grid;
        }
    },

    // 山城地形：多山地地形，山间盆地
    mountain_city: {
        name: '山城',
        description: '群山环绕中的城市，拥有丰富矿产资源',
        water_direction: '山间溪流',
        mountain_direction: '四周山地',
        river_direction: '山间溪流',
        generate: function () {
            const grid = [];
            // 初始化为陆地（包括边界，确保陆地延伸到地图外侧）
            for (let r = 0; r < BLOCK_GRID; r++) {
                grid[r] = [];
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 1;
                }
            }
            // 四周山地（只能在陆地上）
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if ((r <= 2 || r >= 7 || c <= 2 || c >= 7) && grid[r][c] === 1) {
                        grid[r][c] = 2;
                    }
                }
            }
            // 山间溪流（只能在陆地上）
            const streams = [[3, 4], [4, 3], [4, 5], [5, 4]];
            for (const [r, c] of streams) {
                if (grid[r][c] === 1) {
                    grid[r][c] = 0;
                }
            }
            return grid;
        }
    }
};

// 根据布局描述选择最匹配的模板（仅作为参考）
function selectTerrainTemplate(water_direction, mountain_direction, river_direction) {
    // 简单的规则匹配
    if (water_direction.includes('环海')) return 'island';
    if (water_direction.includes('东侧')) return 'bay';
    if (water_direction.includes('南侧')) return 'delta';
    if (water_direction.includes('西侧')) return 'plain';
    if (water_direction.includes('三面')) return 'peninsula';
    if (water_direction.includes('中央')) return 'inland_lake';
    if (water_direction.includes('湖')) return 'inland_lake';

    if (mountain_direction.includes('南北')) return 'valley';
    if (mountain_direction.includes('四周')) return 'mountain_city';

    if (river_direction.includes('三角洲')) return 'delta';

    // 默认返回海湾模板
    return 'bay';
}

// 根据AI返回的方向描述直接生成地形网格（带有随机性）
function generateTerrainFromDirections(water_direction, mountain_direction, river_direction) {
    const grid = [];

    // 1. 初始化全部为陆地（确保陆地延伸到地图外侧）
    for (let r = 0; r < BLOCK_GRID; r++) {
        grid[r] = [];
        for (let c = 0; c < BLOCK_GRID; c++) {
            grid[r][c] = 1; // 默认陆地
        }
    }

    // 判断是否为岛屿（岛屿模式下边界可以是水域）
    const isIslandMode = (water_direction || '').includes('环海') || (water_direction || '').includes('四面');

    // 2. 根据水域方向添加水域（带有随机变化）
    addWaterByDirection(grid, water_direction, isIslandMode);

    // 3. 根据山地方向添加山地（只能在陆地上，带有随机变化）
    addMountainsByDirection(grid, mountain_direction);

    // 4. 根据河流方向添加河流（只能在陆地上，需要连接到水域，带有随机变化）
    addRiversByDirection(grid, river_direction, water_direction);

    // 5. 确保非岛屿模式下陆地连接到边界锚点
    if (!isIslandMode) {
        ensureLandConnectedToBorderAnchors(grid);
    }

    // 6. 添加自然变化：在水域和陆地交界处添加一些随机的小变化
    addNaturalVariation(grid, water_direction, mountain_direction);

    return grid;
}

// 添加自然变化，使地形更加多样化和自然（简化版，减少随机性）
function addNaturalVariation(grid, water_direction, mountain_direction) {
    const isIslandMode = (water_direction || '').includes('环海') || (water_direction || '').includes('四面');

    // 1. 在水域边缘添加少量不规则变化（减少随机性，避免碎片化）
    for (let r = 1; r < BLOCK_GRID - 1; r++) {
        for (let c = 1; c < BLOCK_GRID - 1; c++) {
            if (grid[r][c] === 1) {
                // 检查周围是否有水域
                const neighbors = getNeighbors(grid, r, c);
                const waterCount = neighbors.filter(n => grid[n.r] && grid[n.r][n.c] === 0).length;

                // 如果在边缘，有很小概率变成水域（减少碎片化）
                if (waterCount >= 3 && Math.random() < 0.05) {
                    grid[r][c] = 0; // 变成水域
                }

                // 如果在山地边缘，有一定概率变成山地
                const mountainCount = neighbors.filter(n => grid[n.r] && grid[n.r][n.c] === 2).length;
                if (mountainCount >= 2 && grid[r][c] === 1) {
                    if (Math.random() < 0.1) {
                        grid[r][c] = 2; // 变成山地
                    }
                }
            } else if (grid[r][c] === 0) {
                // 在水域中随机添加一些小岛（低概率，避免碎片化）
                const neighbors = getNeighbors(grid, r, c);
                const landCount = neighbors.filter(n => grid[n.r] && grid[n.r][n.c] === 1).length;
                if (landCount >= 4 && Math.random() < 0.02) {
                    grid[r][c] = 1; // 变成陆地
                }
            }
        }
    }

    // 2. 添加随机的小型水域（池塘、湖泊）- 低概率
    if (!isIslandMode && Math.random() < 0.2) {
        const poolR = Math.floor(Math.random() * (BLOCK_GRID - 4)) + 2;
        const poolC = Math.floor(Math.random() * (BLOCK_GRID - 4)) + 2;
        // 确保是陆地且周围没有太多水域
        if (grid[poolR][poolC] === 1) {
            const neighbors = getNeighbors(grid, poolR, poolC);
            const waterNeighbors = neighbors.filter(n => grid[n.r] && grid[n.r][n.c] === 0).length;
            if (waterNeighbors < 2) {
                grid[poolR][poolC] = 0;
                // 随机扩展1格
                if (Math.random() < 0.3 && grid[poolR + 1] && grid[poolR + 1][poolC] === 1) {
                    grid[poolR + 1][poolC] = 0;
                }
            }
        }
    }

    // 3. 添加随机的小型山地（低概率）
    if (Math.random() < 0.3) {
        const hillR = Math.floor(Math.random() * (BLOCK_GRID - 4)) + 2;
        const hillC = Math.floor(Math.random() * (BLOCK_GRID - 4)) + 2;
        // 确保是陆地且周围没有太多山地
        const neighbors = getNeighbors(grid, hillR, hillC);
        const mountainCount = neighbors.filter(n => grid[n.r] && grid[n.r][n.c] === 2).length;
        if (grid[hillR][hillC] === 1 && mountainCount < 2) {
            grid[hillR][hillC] = 2;
        }
    }
}

// 定义8个边界锚点（全局常量）
const ANCHORS = {
    north: { r: 0, c: Math.floor(BLOCK_GRID / 2), name: '北' },
    south: { r: BLOCK_GRID - 1, c: Math.floor(BLOCK_GRID / 2), name: '南' },
    west: { r: Math.floor(BLOCK_GRID / 2), c: 0, name: '西' },
    east: { r: Math.floor(BLOCK_GRID / 2), c: BLOCK_GRID - 1, name: '东' },
    northwest: { r: 0, c: 0, name: '西北' },
    northeast: { r: 0, c: BLOCK_GRID - 1, name: '东北' },
    southwest: { r: BLOCK_GRID - 1, c: 0, name: '西南' },
    southeast: { r: BLOCK_GRID - 1, c: BLOCK_GRID - 1, name: '东南' }
};

// 获取所有锚点列表
function getAllAnchors() {
    return [
        ANCHORS.north, ANCHORS.south, ANCHORS.west, ANCHORS.east,
        ANCHORS.northwest, ANCHORS.northeast, ANCHORS.southwest, ANCHORS.southeast
    ];
}

// 获取锚点对应的方向向量
function getAnchorDirection(anchor) {
    const centerR = Math.floor(BLOCK_GRID / 2);
    const centerC = Math.floor(BLOCK_GRID / 2);
    const dr = anchor.r - centerR;
    const dc = anchor.c - centerC;
    return { r: dr, c: dc };
}

// 地形特征类型定义
const TERRAIN_FEATURE_TYPES = {
    PENINSULA: 'peninsula',      // 半岛
    BAY: 'bay',                  // 海湾
    RIVER: 'river',              // 河流
    MOUNTAIN_RANGE: 'mountain',  // 山脉
    LAKE: 'lake',                // 湖泊
    PLAIN: 'plain',              // 平原
    COASTLINE: 'coastline'       // 海岸线
};

// 保守的自然变化（避免过度混乱）
function addNaturalVariationConservative(grid) {
    // 只做少量的平滑处理，不添加过多随机变化
    // 1. 平滑水域边缘（减少锯齿）
    for (let r = 1; r < BLOCK_GRID - 1; r++) {
        for (let c = 1; c < BLOCK_GRID - 1; c++) {
            if (grid[r][c] === 0) {
                // 水域边缘稍微平滑
                const neighbors = getNeighbors(grid, r, c);
                const landCount = neighbors.filter(n => grid[n.r] && grid[n.r][n.c] === 1).length;
                // 如果周围陆地太多，可能是孤立水域，保持原样
                if (landCount >= 5) {
                    // 保持不变，避免破坏大块水域
                }
            }
        }
    }
}

// 根据AI返回的地形特征生成地图
function generateTerrainFromFeatures(features) {
    if (!features || !Array.isArray(features)) {

        return generateDefaultTerrain();
    }

    // 1. 初始化全部为陆地（确保陆地延伸到地图外侧）
    const grid = [];
    for (let r = 0; r < BLOCK_GRID; r++) {
        grid[r] = [];
        for (let c = 0; c < BLOCK_GRID; c++) {
            grid[r][c] = 1; // 默认陆地
        }
    }

    // 判断是否为岛屿模式
    const hasIsland = features.some(f => f.type === 'island' || f.type === '岛屿');
    const isIslandMode = hasIsland || features.some(f => (f.params || {}).isIsland);

    // 2. 先处理半岛特征（定义整体地形格局）
    const peninsulaFeatures = features.filter(f =>
        f.type === TERRAIN_FEATURE_TYPES.PENINSULA ||
        f.type === '半岛'
    );
    for (const feature of peninsulaFeatures) {
        processPeninsulaFeature(grid, feature);
    }

    // 3. 处理海岸线/海湾特征（定义水域边界）
    const coastFeatures = features.filter(f =>
        f.type === TERRAIN_FEATURE_TYPES.BAY ||
        f.type === TERRAIN_FEATURE_TYPES.COASTLINE ||
        f.type === '海湾' || f.type === '海岸线'
    );
    for (const feature of coastFeatures) {
        processWaterFeature(grid, feature);
    }

    // 4. 处理湖泊特征（内部水域）
    const lakeFeatures = features.filter(f =>
        f.type === TERRAIN_FEATURE_TYPES.LAKE ||
        f.type === '湖泊'
    );
    for (const feature of lakeFeatures) {
        processWaterFeature(grid, feature);
    }

    // 5. 确保陆地连通性（在添加山脉和河流之前）
    if (!isIslandMode) {
        ensureLandConnectedToBorderAnchors(grid);
    }

    // 6. 处理山脉特征（只能在陆地上）
    const mountainFeatures = features.filter(f =>
        f.type === TERRAIN_FEATURE_TYPES.MOUNTAIN_RANGE ||
        f.type === '山脉' || f.type === '山地'
    );
    for (const feature of mountainFeatures) {
        processMountainFeature(grid, feature);
    }

    // 7. 处理河流特征（只能在陆地上，连接水域）
    const riverFeatures = features.filter(f =>
        f.type === TERRAIN_FEATURE_TYPES.RIVER ||
        f.type === '河流'
    );
    for (const feature of riverFeatures) {
        processRiverFeature(grid, feature);
    }

    // 8. 最后检查并修复连通性
    if (!isIslandMode) {
        ensureLandConnectedToBorderAnchors(grid);
    }

    // 9. 添加保守的自然变化（避免过度混乱）
    addNaturalVariationConservative(grid);

    return grid;
}

// 处理水域特征（海湾、湖泊）
function processWaterFeature(grid, feature) {
    const params = feature.params || {};
    const type = feature.type;

    if (type === TERRAIN_FEATURE_TYPES.BAY || type === '海湾') {
        // 海湾：从指定方向向内延伸的水域
        const direction = params.direction || params.朝向 || '东';
        const depth = params.depth || 3;

        createBay(grid, direction, depth);
    } else if (type === TERRAIN_FEATURE_TYPES.LAKE || type === '湖泊') {
        // 湖泊：内部水域
        const centerR = params.centerR !== undefined ? params.centerR : Math.floor(BLOCK_GRID / 2);
        const centerC = params.centerC !== undefined ? params.centerC : Math.floor(BLOCK_GRID / 2);
        const radius = params.radius || 2;

        createLake(grid, centerR, centerC, radius);
    } else if (type === TERRAIN_FEATURE_TYPES.COASTLINE || type === '海岸线') {
        // 海岸线：沿着边界的水域
        const directions = params.directions || [params.direction || '东'];
        const width = params.width || 2;

        createCoastline(grid, directions, width);
    }
}

// 创建海湾
function createBay(grid, direction, depth) {
    const hasEast = direction.includes('东') || direction.includes('右');
    const hasWest = direction.includes('西') || direction.includes('左');
    const hasNorth = direction.includes('北') || direction.includes('上');
    const hasSouth = direction.includes('南') || direction.includes('下');

    if (hasEast) {
        for (let r = 0; r < BLOCK_GRID; r++) {
            for (let c = BLOCK_GRID - depth; c < BLOCK_GRID; c++) {
                grid[r][c] = 0;
            }
        }
    }
    if (hasWest) {
        for (let r = 0; r < BLOCK_GRID; r++) {
            for (let c = 0; c < depth; c++) {
                grid[r][c] = 0;
            }
        }
    }
    if (hasNorth) {
        for (let r = 0; r < depth; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                grid[r][c] = 0;
            }
        }
    }
    if (hasSouth) {
        for (let r = BLOCK_GRID - depth; r < BLOCK_GRID; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                grid[r][c] = 0;
            }
        }
    }
}

// 创建湖泊
function createLake(grid, centerR, centerC, radius) {
    for (let r = centerR - radius; r <= centerR + radius; r++) {
        for (let c = centerC - radius; c <= centerC + radius; c++) {
            if (r >= 0 && r < BLOCK_GRID && c >= 0 && c < BLOCK_GRID) {
                const dist = Math.abs(r - centerR) + Math.abs(c - centerC);
                if (dist <= radius + 0.5) {
                    grid[r][c] = 0;
                }
            }
        }
    }
}

// 创建海岸线
function createCoastline(grid, directions, width) {
    for (const dir of directions) {
        if (dir.includes('东')) {
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = BLOCK_GRID - width; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
        }
        if (dir.includes('西')) {
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = 0; c < width; c++) {
                    grid[r][c] = 0;
                }
            }
        }
        if (dir.includes('北')) {
            for (let r = 0; r < width; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
        }
        if (dir.includes('南')) {
            for (let r = BLOCK_GRID - width; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
        }
    }
}

// 处理山脉特征
function processMountainFeature(grid, feature) {
    const params = feature.params || {};

    // 获取山脉位置参数
    const position = params.position || params.位置 || '中央';
    const startR = params.startR !== undefined ? params.startR : null;
    const startC = params.startC !== undefined ? params.startC : null;
    const endR = params.endR !== undefined ? params.endR : null;
    const endC = params.endC !== undefined ? params.endC : null;
    const width = params.width || 2;

    if (startR !== null && startC !== null && endR !== null && endC !== null) {
        // 使用坐标范围创建山脉
        createMountainRange(grid, startR, startC, endR, endC, width);
    } else {
        // 使用方向创建山脉
        createDirectionalMountains(grid, position, width);
    }
}

// 创建山脉范围
function createMountainRange(grid, startR, startC, endR, endC, width) {
    const minR = Math.max(0, Math.min(startR, endR) - 1);
    const maxR = Math.min(BLOCK_GRID - 1, Math.max(startR, endR) + 1);
    const minC = Math.max(0, Math.min(startC, endC) - width);
    const maxC = Math.min(BLOCK_GRID - 1, Math.max(startC, endC) + width);

    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            if (grid[r][c] === 1) {
                grid[r][c] = 2;
            }
        }
    }
}

// 根据方向创建山脉
function createDirectionalMountains(grid, position, width) {
    if (position.includes('西北') || position.includes('左上')) {
        for (let r = 0; r <= width + 1; r++) {
            for (let c = 0; c <= width + 1; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('东北') || position.includes('右上')) {
        for (let r = 0; r <= width + 1; r++) {
            for (let c = BLOCK_GRID - width - 2; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('西南') || position.includes('左下')) {
        for (let r = BLOCK_GRID - width - 2; r < BLOCK_GRID; r++) {
            for (let c = 0; c <= width + 1; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('东南') || position.includes('右下')) {
        for (let r = BLOCK_GRID - width - 2; r < BLOCK_GRID; r++) {
            for (let c = BLOCK_GRID - width - 2; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('中央') || position.includes('中部')) {
        const centerR = Math.floor(BLOCK_GRID / 2);
        const centerC = Math.floor(BLOCK_GRID / 2);
        for (let r = centerR - width; r <= centerR + width; r++) {
            for (let c = centerC - width; c <= centerC + width; c++) {
                if (r >= 0 && r < BLOCK_GRID && c >= 0 && c < BLOCK_GRID && grid[r][c] === 1) {
                    grid[r][c] = 2;
                }
            }
        }
    }
    if (position.includes('北') && !position.includes('西北') && !position.includes('东北')) {
        for (let r = 0; r <= width; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('南') && !position.includes('西南') && !position.includes('东南')) {
        for (let r = BLOCK_GRID - width - 1; r < BLOCK_GRID; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('东') && !position.includes('东北') && !position.includes('东南')) {
        for (let r = 0; r < BLOCK_GRID; r++) {
            for (let c = BLOCK_GRID - width - 1; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
    if (position.includes('西') && !position.includes('西北') && !position.includes('西南')) {
        for (let r = 0; r < BLOCK_GRID; r++) {
            for (let c = 0; c <= width; c++) {
                if (grid[r][c] === 1) grid[r][c] = 2;
            }
        }
    }
}

// 处理河流特征
function processRiverFeature(grid, feature) {
    const params = feature.params || {};

    // 获取河流参数
    const startAnchor = params.startAnchor || params.起点锚点 || 'north';
    const endAnchor = params.endAnchor || params.终点锚点 || 'south';
    const startR = params.startR !== undefined ? params.startR : null;
    const startC = params.startC !== undefined ? params.startC : null;
    const endR = params.endR !== undefined ? params.endR : null;
    const endC = params.endC !== undefined ? params.endC : null;

    if (startR !== null && startC !== null && endR !== null && endC !== null) {
        // 使用坐标创建河流
        createRiver(grid, startR, startC, endR, endC);
    } else {
        // 使用锚点创建河流
        createRiverFromAnchors(grid, startAnchor, endAnchor);
    }
}

// 创建河流（使用坐标）
function createRiver(grid, startR, startC, endR, endC) {
    // 确保起点和终点是陆地或水域（河流可以从湖泊开始或结束于海洋）
    if (grid[startR] && grid[startR][startC] !== undefined) {
        grid[startR][startC] = 0;
    }
    if (grid[endR] && grid[endR][endC] !== undefined) {
        grid[endR][endC] = 0;
    }

    // 使用Bresenham算法生成河流路径
    generateLinePath(startR, startC, endR, endC, (r, c) => {
        if (r >= 0 && r < BLOCK_GRID && c >= 0 && c < BLOCK_GRID) {
            if (grid[r][c] === 1) {
                grid[r][c] = 0;
            }
        }
    });
}

// 创建河流（使用锚点）
function createRiverFromAnchors(grid, startAnchor, endAnchor) {
    const start = ANCHORS[startAnchor] || ANCHORS.north;
    const end = ANCHORS[endAnchor] || ANCHORS.south;

    createRiver(grid, start.r, start.c, end.r, end.c);
}

// 处理半岛特征
function processPeninsulaFeature(grid, feature) {
    const params = feature.params || {};
    const direction = params.direction || params.朝向 || '南';

    // 半岛：三面环海，一面连接大陆
    createPeninsula(grid, direction);
}

// 创建半岛
function createPeninsula(grid, direction) {
    // 默认北部连接大陆，其他三面是水域
    const connectedSide = direction.includes('北') ? '南' :
        direction.includes('南') ? '北' :
            direction.includes('东') ? '西' : '东';

    // 确定水域方向
    const waterSides = [];
    if (connectedSide !== '北') waterSides.push('北');
    if (connectedSide !== '南') waterSides.push('南');
    if (connectedSide !== '东') waterSides.push('东');
    if (connectedSide !== '西') waterSides.push('西');

    // 添加水域
    createCoastline(grid, waterSides, 2);

    // 确保连接边是陆地（边界锚点）
    const anchors = getAllAnchors();
    for (const anchor of anchors) {
        if (anchor.name.includes(connectedSide)) {
            grid[anchor.r][anchor.c] = 1;
        }
    }
}

// 确保陆地连接到地图边界锚点（非岛屿模式）
// 要求：陆地必须从一个地图外锚点开始，结束在另一个地图外锚点
function ensureLandConnectedToBorderAnchors(grid) {
    const anchors = ANCHORS;

    // 确保8个锚点都是陆地
    for (const key of Object.keys(anchors)) {
        grid[anchors[key].r][anchors[key].c] = 1;
    }

    // 确保锚点周围的格子也是陆地，形成连接路径
    for (const key of Object.keys(anchors)) {
        const anchor = anchors[key];
        const centerR = Math.floor(BLOCK_GRID / 2);
        const centerC = Math.floor(BLOCK_GRID / 2);

        // 向中心方向延伸连接
        const dr = anchor.r < centerR ? 1 : (anchor.r > centerR ? -1 : 0);
        const dc = anchor.c < centerC ? 1 : (anchor.c > centerC ? -1 : 0);

        let r = anchor.r;
        let c = anchor.c;
        for (let i = 0; i < 3; i++) {
            if (r >= 0 && r < BLOCK_GRID && c >= 0 && c < BLOCK_GRID) {
                grid[r][c] = 1;
            }
            r += dr;
            c += dc;
        }
    }

    // 使用洪水填充确保所有锚点所在的陆地区域是连通的
    connectAllAnchors(grid);
}

// 使用洪水填充算法确保所有锚点所在的陆地区域是连通的
function connectAllAnchors(grid) {
    // 获取每个锚点所在的连通分量
    const visited = createVisitedArray();
    const components = [];

    const anchorPoints = getAllAnchors();

    for (const anchor of anchorPoints) {
        if (grid[anchor.r][anchor.c] === 1 && !visited[anchor.r][anchor.c]) {
            const component = floodFill(grid, visited, anchor.r, anchor.c);
            components.push(component);
        }
    }

    // 如果有多个连通分量，需要连接它们
    if (components.length > 1) {
        // 找到分量之间的最短路径并连接
        for (let i = 0; i < components.length - 1; i++) {
            connectComponents(grid, components[i], components[i + 1]);
        }
    }
}

// 创建访问数组
function createVisitedArray() {
    const visited = [];
    for (let r = 0; r < BLOCK_GRID; r++) {
        visited[r] = [];
        for (let c = 0; c < BLOCK_GRID; c++) {
            visited[r][c] = false;
        }
    }
    return visited;
}

// 洪水填充算法，返回连通分量中的所有点
function floodFill(grid, visited, startR, startC) {
    const component = [];
    const queue = [{ r: startR, c: startC }];

    while (queue.length > 0) {
        const { r, c } = queue.shift();

        if (r < 0 || r >= BLOCK_GRID || c < 0 || c >= BLOCK_GRID) continue;
        if (visited[r][c]) continue;
        if (grid[r][c] !== 1) continue;

        visited[r][c] = true;
        component.push({ r, c });

        queue.push({ r: r - 1, c }); // 上
        queue.push({ r: r + 1, c }); // 下
        queue.push({ r, c: c - 1 }); // 左
        queue.push({ r, c: c + 1 }); // 右
    }

    return component;
}

// 连接两个连通分量
function connectComponents(grid, component1, component2) {
    let minDist = Infinity;
    let bestPath = null;

    // 找到两个分量之间距离最近的点对
    for (const p1 of component1) {
        for (const p2 of component2) {
            const dist = Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c);
            if (dist < minDist) {
                minDist = dist;
                bestPath = { from: p1, to: p2 };
            }
        }
    }

    if (bestPath) {
        // 用直线连接两个点
        const { from, to } = bestPath;
        const rStep = from.r < to.r ? 1 : (from.r > to.r ? -1 : 0);
        const cStep = from.c < to.c ? 1 : (from.c > to.c ? -1 : 0);

        let r = from.r;
        let c = from.c;

        while (r !== to.r || c !== to.c) {
            grid[r][c] = 1;
            if (r !== to.r) r += rStep;
            if (c !== to.c) c += cStep;
        }
        grid[r][c] = 1;
    }
}

// 根据水域方向添加水域（带有随机变化）
function addWaterByDirection(grid, direction, isIslandMode = false) {
    if (!direction || direction.includes('无') || direction.includes('无明显')) {
        return; // 无水域
    }

    // 解析水域方向
    const hasEast = direction.includes('东');
    const hasWest = direction.includes('西');
    const hasNorth = direction.includes('北');
    const hasSouth = direction.includes('南');
    const hasCenter = direction.includes('中央');
    const hasLake = direction.includes('湖');
    const hasSea = direction.includes('海') || direction.includes('沿海') || direction.includes('岸');
    const isIsland = direction.includes('环海') || direction.includes('四面');
    const isPeninsula = direction.includes('三面');

    // 随机偏移量，使水域位置有变化
    const offsetRange = 2;
    const rOffset = Math.floor(Math.random() * offsetRange) - 1;
    const cOffset = Math.floor(Math.random() * offsetRange) - 1;

    if (isIsland) {
        // 岛屿：四周环海，中间陆地，带随机变化
        const margin = 1 + Math.floor(Math.random() * 2); // 1-2格
        for (let r = 0; r < BLOCK_GRID; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                if (r < margin || r >= BLOCK_GRID - margin || c < margin || c >= BLOCK_GRID - margin) {
                    grid[r][c] = 0;
                }
            }
        }
    } else if (isPeninsula) {
        // 半岛：三面环海，北部连接大陆（北部边界保持陆地）
        const waterDepth = 2 + Math.floor(Math.random() * 2); // 2-3格
        for (let r = waterDepth; r < BLOCK_GRID; r++) {
            if (hasEast) {
                for (let c = BLOCK_GRID - waterDepth; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
            if (hasWest) {
                for (let c = 0; c < waterDepth; c++) {
                    grid[r][c] = 0;
                }
            }
            if (hasSouth) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if (r >= BLOCK_GRID - waterDepth) {
                        grid[r][c] = 0;
                    }
                }
            }
        }
    } else if (hasCenter || hasLake) {
        // 中央湖泊，带随机偏移和大小变化
        const centerR = Math.floor(BLOCK_GRID / 2) + rOffset;
        const centerC = Math.floor(BLOCK_GRID / 2) + cOffset;
        const lakeSize = 1 + Math.floor(Math.random() * 2); // 1-2格
        for (let r = centerR - lakeSize; r <= centerR + lakeSize; r++) {
            for (let c = centerC - lakeSize; c <= centerC + lakeSize; c++) {
                if (r >= 0 && r < BLOCK_GRID && c >= 0 && c < BLOCK_GRID) {
                    // 湖泊形状有随机性
                    const dist = Math.abs(r - centerR) + Math.abs(c - centerC);
                    if (dist <= lakeSize * 1.5 || Math.random() < 0.7) {
                        grid[r][c] = 0;
                    }
                }
            }
        }
    } else if (hasSea) {
        // 沿海地形：在指定方向添加海域，带随机变化
        const waterDepth = 1 + Math.floor(Math.random() * 2); // 1-2格
        if (hasEast) {
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = BLOCK_GRID - waterDepth; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
        }
        if (hasWest) {
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = 0; c < waterDepth; c++) {
                    grid[r][c] = 0;
                }
            }
        }
        if (hasNorth) {
            for (let r = 0; r < waterDepth; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
        }
        if (hasSouth) {
            for (let r = BLOCK_GRID - waterDepth; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    grid[r][c] = 0;
                }
            }
        }
    }
}

// 根据山地方向添加山地（只能在陆地上，带随机变化）
function addMountainsByDirection(grid, direction) {
    if (!direction || direction.includes('无')) {
        return; // 无山地
    }

    const hasEast = direction.includes('东');
    const hasWest = direction.includes('西');
    const hasNorth = direction.includes('北');
    const hasSouth = direction.includes('南');
    const hasCenter = direction.includes('中央') || direction.includes('中部');
    const hasNW = direction.includes('西北');
    const hasNE = direction.includes('东北');
    const hasSW = direction.includes('西南');
    const hasSE = direction.includes('东南');
    const hasSurround = direction.includes('四周') || direction.includes('外围');
    const hasBoth = direction.includes('南北') || direction.includes('两侧');

    // 随机偏移量，使山地位置有变化
    const rOffset = Math.floor(Math.random() * 2) - 1;
    const cOffset = Math.floor(Math.random() * 2) - 1;

    if (hasSurround) {
        // 四周山地，带随机变化
        const margin = 2 + Math.floor(Math.random() * 2); // 2-3格
        for (let r = 0; r < BLOCK_GRID; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                if ((r <= margin || r >= BLOCK_GRID - margin - 1 || c <= margin || c >= BLOCK_GRID - margin - 1) && grid[r][c] === 1) {
                    // 添加随机性，不是所有边缘都变成山地
                    if (Math.random() < 0.7) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
    } else if (hasBoth) {
        // 南北两侧山地，带随机变化
        const margin = 2 + Math.floor(Math.random() * 2); // 2-3格
        for (let r = 0; r <= margin; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1 && Math.random() < 0.75) {
                    grid[r][c] = 2;
                }
            }
        }
        for (let r = BLOCK_GRID - margin - 1; r < BLOCK_GRID; r++) {
            for (let c = 0; c < BLOCK_GRID; c++) {
                if (grid[r][c] === 1 && Math.random() < 0.75) {
                    grid[r][c] = 2;
                }
            }
        }
    } else if (hasCenter) {
        // 中央高地，带随机偏移
        const centerR = Math.floor(BLOCK_GRID / 2) + rOffset;
        const centerC = Math.floor(BLOCK_GRID / 2) + cOffset;
        const size = 1 + Math.floor(Math.random() * 2); // 1-2格
        for (let r = centerR - size; r <= centerR + size; r++) {
            for (let c = centerC - size; c <= centerC + size; c++) {
                if (r >= 0 && r < BLOCK_GRID && c >= 0 && c < BLOCK_GRID && grid[r][c] === 1) {
                    if (Math.random() < 0.8) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
    } else {
        // 方向组合山地，带随机变化
        const margin = 2 + Math.floor(Math.random() * 2); // 2-3格

        if (hasNW) {
            for (let r = 0; r <= margin; r++) {
                for (let c = 0; c <= margin; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.75) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasNE) {
            for (let r = 0; r <= margin; r++) {
                for (let c = BLOCK_GRID - margin - 1; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.75) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasSW) {
            for (let r = BLOCK_GRID - margin - 1; r < BLOCK_GRID; r++) {
                for (let c = 0; c <= margin; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.75) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasSE) {
            for (let r = BLOCK_GRID - margin - 1; r < BLOCK_GRID; r++) {
                for (let c = BLOCK_GRID - margin - 1; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.75) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasNorth && !hasNW && !hasNE) {
            for (let r = 0; r <= margin; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.7) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasSouth && !hasSW && !hasSE) {
            for (let r = BLOCK_GRID - margin - 1; r < BLOCK_GRID; r++) {
                for (let c = 0; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.7) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasEast && !hasNE && !hasSE) {
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = BLOCK_GRID - margin - 1; c < BLOCK_GRID; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.7) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
        if (hasWest && !hasNW && !hasSW) {
            for (let r = 0; r < BLOCK_GRID; r++) {
                for (let c = 0; c <= margin; c++) {
                    if (grid[r][c] === 1 && Math.random() < 0.7) {
                        grid[r][c] = 2;
                    }
                }
            }
        }
    }
}

// 根据河流方向添加河流（必须从一个锚点流向另一个锚点）
function addRiversByDirection(grid, direction, water_direction = '') {
    if (!direction || direction.includes('无')) {
        return; // 无河流
    }

    const hasNorth = direction.includes('北');
    const hasSouth = direction.includes('南');
    const hasEast = direction.includes('东');
    const hasWest = direction.includes('西');
    const hasNW = direction.includes('西北');
    const hasSE = direction.includes('东南');
    const hasNE = direction.includes('东北');
    const hasSW = direction.includes('西南');
    const hasDelta = direction.includes('三角洲');

    // 根据河流方向确定起点和终点锚点
    let startAnchor = null;
    let endAnchor = null;

    // 确定河流起点和终点锚点
    if (hasNW && hasSE) {
        startAnchor = ANCHORS.northwest;
        endAnchor = ANCHORS.southeast;
    } else if (hasNE && hasSW) {
        startAnchor = ANCHORS.northeast;
        endAnchor = ANCHORS.southwest;
    } else if (hasNorth && hasSouth) {
        startAnchor = ANCHORS.north;
        endAnchor = ANCHORS.south;
    } else if (hasEast && hasWest) {
        startAnchor = ANCHORS.west;
        endAnchor = ANCHORS.east;
    } else if (hasNorth && hasEast) {
        startAnchor = ANCHORS.north;
        endAnchor = ANCHORS.southeast;
    } else if (hasSouth && hasWest) {
        startAnchor = ANCHORS.southeast;
        endAnchor = ANCHORS.northwest;
    } else if (hasSouth) {
        startAnchor = ANCHORS.north;
        endAnchor = ANCHORS.south;
    } else if (hasNorth) {
        startAnchor = ANCHORS.south;
        endAnchor = ANCHORS.north;
    } else if (hasEast) {
        startAnchor = ANCHORS.west;
        endAnchor = ANCHORS.east;
    } else if (hasWest) {
        startAnchor = ANCHORS.east;
        endAnchor = ANCHORS.west;
    } else if (hasDelta) {
        // 三角洲：多条河流汇入
        startAnchor = ANCHORS.north;
        endAnchor = ANCHORS.southeast;
    }

    // 如果确定了起点和终点锚点，生成连接路径
    if (startAnchor && endAnchor) {
        generateRiverPath(grid, startAnchor, endAnchor, hasDelta);
    }
}

// 生成连接两个锚点的河流路径
function generateRiverPath(grid, startAnchor, endAnchor, isDelta = false) {
    const startR = startAnchor.r;
    const startC = startAnchor.c;
    const endR = endAnchor.r;
    const endC = endAnchor.c;

    const riverCells = [];

    if (isDelta) {
        // 三角洲：多条分支汇入
        const centerR = Math.floor(BLOCK_GRID / 2);
        const centerC = Math.floor(BLOCK_GRID / 2);

        // 主河道
        generateLinePath(startR, startC, centerR, centerC, riverCells);

        // 分支河道
        const branch1Start = ANCHORS.northwest;
        const branch2Start = ANCHORS.northeast;
        generateLinePath(branch1Start.r, branch1Start.c, centerR + 1, centerC, riverCells);
        generateLinePath(branch2Start.r, branch2Start.c, centerR, centerC + 1, riverCells);

        // 汇合后流向终点
        generateLinePath(centerR, centerC, endR, endC, riverCells);
    } else {
        // 普通河流：直接连接两个锚点
        generateLinePath(startR, startC, endR, endC, riverCells);
    }

    // 将河流单元格应用到网格（只能在陆地上）
    for (const cell of riverCells) {
        if (cell.r >= 0 && cell.r < BLOCK_GRID && cell.c >= 0 && cell.c < BLOCK_GRID) {
            if (grid[cell.r][cell.c] === 1) {
                grid[cell.r][cell.c] = 0;
            }
        }
    }
}

// 使用Bresenham算法生成直线路径
function generateLinePath(startR, startC, endR, endC, result) {
    const dx = Math.abs(endC - startC);
    const dy = Math.abs(endR - startR);
    const sx = startC < endC ? 1 : -1;
    const sy = startR < endR ? 1 : -1;
    let err = dx - dy;
    let x = startC;
    let y = startR;

    while (true) {
        // 支持数组和回调函数两种方式
        if (typeof result === 'function') {
            result(y, x);
        } else if (Array.isArray(result)) {
            result.push({ r: y, c: x });
        }

        if (x === endC && y === endR) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

// 计算区块中心坐标
function getBlockCenter(row, col) {
    return {
        x: -BOUNDARY_HALF + col * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: -BOUNDARY_HALF + row * BLOCK_SIZE + BLOCK_SIZE / 2
    };
}

// 二次贝塞尔曲线插值（增加控制点）
function bezierInterpolation(points, numPoints) {
    if (points.length < 2) return points;

    // 在相邻点之间添加控制点，生成更平滑的曲线
    const enhancedPoints = addControlPoints(points);

    const result = [];
    const n = enhancedPoints.length - 1;

    // 增加插值点数量
    const interpolationPoints = numPoints * 2;

    for (let i = 0; i <= interpolationPoints; i++) {
        const t = i / interpolationPoints;
        let x = 0, y = 0;

        for (let j = 0; j <= n; j++) {
            const coeff = binomialCoefficient(n, j) * Math.pow(t, j) * Math.pow(1 - t, n - j);
            x += coeff * enhancedPoints[j].x;
            y += coeff * enhancedPoints[j].y;
        }

        result.push({ x, y });
    }

    return result;
}

// 在相邻点之间添加二次贝塞尔控制点
function addControlPoints(points) {
    if (points.length < 3) return points;

    const result = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        // 添加起点
        result.push(p0);

        // 如果不是最后一个点，计算控制点
        if (i < points.length - 2) {
            const p2 = points[i + 2];

            // 计算中点作为控制点
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;

            // 使用前一个点和后一个点的切线方向计算控制点
            const prevTangentX = (p1.x - p0.x) * 0.3;
            const prevTangentY = (p1.y - p0.y) * 0.3;
            const nextTangentX = (p2.x - p1.x) * 0.3;
            const nextTangentY = (p2.y - p1.y) * 0.3;

            // 第一个控制点：从p0向p1方向偏移
            const ctrl1X = p0.x + prevTangentX;
            const ctrl1Y = p0.y + prevTangentY;

            // 第二个控制点：从p1向p2方向偏移（反向）
            const ctrl2X = p1.x - nextTangentX;
            const ctrl2Y = p1.y - nextTangentY;

            result.push({ x: ctrl1X, y: ctrl1Y });
            result.push({ x: ctrl2X, y: ctrl2Y });
        }
    }

    // 添加最后一个点
    result.push(points[points.length - 1]);

    return result;
}

// 二项式系数
function binomialCoefficient(n, k) {
    if (k === 0 || k === n) return 1;
    if (k > n - k) k = n - k;

    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return result;
}

// 简化多边形（道格拉斯-普克算法）
function simplifyPolygon(points, tolerance) {
    if (points.length <= 2) return points;

    const stack = [[0, points.length - 1]];
    const keep = new Array(points.length).fill(false);
    keep[0] = true;
    keep[points.length - 1] = true;

    while (stack.length > 0) {
        const [start, end] = stack.pop();
        let maxDist = 0;
        let maxIndex = -1;

        for (let i = start + 1; i < end; i++) {
            const dist = pointToLineDistance(points[i], points[start], points[end]);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }

        if (maxDist > tolerance) {
            keep[maxIndex] = true;
            stack.push([start, maxIndex]);
            stack.push([maxIndex, end]);
        }
    }

    return points.filter((_, i) => keep[i]);
}

// 点到线段的距离
function pointToLineDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
    }

    const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)));
    const nearestX = lineStart.x + t * dx;
    const nearestY = lineStart.y + t * dy;

    return Math.sqrt(Math.pow(point.x - nearestX, 2) + Math.pow(point.y - nearestY, 2));
}

// 从区块数据生成平滑多边形
// 步骤：1.沿区块网格描出直线边界 → 2.扩展边缘 → 3.用曲线平滑
function blocksToSmoothPolygon(blocks, terrainType) {
    // 1. 沿区块网格描出直线边界（原始多边形）
    const rawPolygon = blocksToRawPolygon(blocks, terrainType);
    if (rawPolygon.length < 3) return [];

    // 2. 扩展边缘点到地图外
    const expanded = expandEdgePoints(rawPolygon);

    // 3. 简化：保留更多角点以维持形状，减少过度简化
    const simplified = simplifyPoints(expanded, BLOCK_SIZE * 0.25);

    // 4. 多重Catmull-Rom样条平滑，增加圆滑度
    let smoothed = catmullRomSmooth(simplified, 12);
    // 二次平滑，进一步提升顺滑程度
    smoothed = catmullRomSmooth(smoothed, 8);

    // 5. 极微量随机扰动，保持自然感但不过度
    const natural = addNaturalNoise(smoothed, BLOCK_SIZE * 0.015);

    return natural;
}

// 沿区块网格描出直线边界，返回世界坐标多边形顶点
function blocksToRawPolygon(blocks, terrainType) {
    const GRID = BLOCK_GRID;
    const BS = BLOCK_SIZE;
    const startWorldX = -BOUNDARY_HALF;

    const edges = [];

    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (blocks[r][c] !== terrainType) continue;

            // 关键修复：数组第一行(r=0)对应地图顶部(Y=BOUNDARY_HALF)
            // 数组最后一行(r=GRID-1)对应地图底部(Y=-BOUNDARY_HALF)
            const x0 = startWorldX + c * BS;
            const y0 = BOUNDARY_HALF - r * BS;

            // 上边：上方邻居不同或出界
            if (r === 0 || blocks[r - 1][c] !== terrainType) {
                edges.push({ x1: x0, y1: y0, x2: x0 + BS, y2: y0 });
            }
            // 下边
            if (r === GRID - 1 || blocks[r + 1][c] !== terrainType) {
                edges.push({ x1: x0, y1: y0 + BS, x2: x0 + BS, y2: y0 + BS });
            }
            // 左边
            if (c === 0 || blocks[r][c - 1] !== terrainType) {
                edges.push({ x1: x0, y1: y0, x2: x0, y2: y0 + BS });
            }
            // 右边
            if (c === GRID - 1 || blocks[r][c + 1] !== terrainType) {
                edges.push({ x1: x0 + BS, y1: y0, x2: x0 + BS, y2: y0 + BS });
            }
        }
    }

    if (edges.length === 0) return [];

    // 构建端点→边索引的邻接表
    const endpointMap = new Map();
    for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const k1 = `${roundTo(e.x1, 1)},${roundTo(e.y1, 1)}`;
        const k2 = `${roundTo(e.x2, 1)},${roundTo(e.y2, 1)}`;
        if (!endpointMap.has(k1)) endpointMap.set(k1, []);
        if (!endpointMap.has(k2)) endpointMap.set(k2, []);
        endpointMap.get(k1).push(i);
        endpointMap.get(k2).push(i);
    }

    // 连接线段形成多边形
    const used = new Set();
    const polygons = [];

    for (let i = 0; i < edges.length; i++) {
        if (used.has(i)) continue;

        const poly = [];
        const startEdge = edges[i];
        used.add(i);

        poly.push({ x: startEdge.x1, y: startEdge.y1 });
        poly.push({ x: startEdge.x2, y: startEdge.y2 });

        let curKey = `${roundTo(startEdge.x2, 1)},${roundTo(startEdge.y2, 1)}`;
        const startKey = `${roundTo(startEdge.x1, 1)},${roundTo(startEdge.y1, 1)}`;

        // 沿着链走直到回到起点
        while (curKey !== startKey) {
            const connected = endpointMap.get(curKey);
            if (!connected || connected.length === 0) break;

            let found = false;
            for (const ei of connected) {
                if (!used.has(ei)) {
                    const e = edges[ei];
                    used.add(ei);
                    if (`${roundTo(e.x1, 1)},${roundTo(e.y1, 1)}` === curKey) {
                        poly.push({ x: e.x2, y: e.y2 });
                        curKey = `${roundTo(e.x2, 1)},${roundTo(e.y2, 1)}`;
                    } else {
                        poly.push({ x: e.x1, y: e.y1 });
                        curKey = `${roundTo(e.x1, 1)},${roundTo(e.y1, 1)}`;
                    }
                    found = true;
                    break;
                }
            }
            if (!found) break;
        }

        if (poly.length >= 3) polygons.push(poly);
    }

    // 返回最大的多边形（主轮廓）
    polygons.sort((a, b) => b.length - a.length);
    return polygons[0] || [];
}

function roundTo(val, decimals) {
    const m = Math.pow(10, decimals);
    return Math.round(val * m) / m;
}

// 简化点集：移除距离过近的点，减少噪音
function simplifyPoints(points, minDist) {
    if (points.length < 3) return points;
    const result = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const last = result[result.length - 1];
        const dx = points[i].x - last.x;
        const dy = points[i].y - last.y;
        if (Math.sqrt(dx * dx + dy * dy) > minDist) {
            result.push(points[i]);
        }
    }
    return result;
}

// Catmull-Rom样条平滑
function catmullRomSmooth(points, numPoints) {
    if (points.length < 3) return points;

    const result = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        for (let j = 0; j < numPoints; j++) {
            const t = j / numPoints;
            const t2 = t * t;
            const t3 = t2 * t;

            const x = 0.5 * (
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3 +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + p2.x) * t +
                2 * p1.x
            );
            const y = 0.5 * (
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3 +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + p2.y) * t +
                2 * p1.y
            );
            result.push({ x, y });
        }
    }

    return result;
}

// 将边缘轮廓点向外扩展到地图边界之外
function expandEdgePoints(points) {
    const expanded = [];
    const expandAmount = BLOCK_SIZE * 0.8; // 向外扩展0.8个区块大小

    for (const p of points) {
        let newX = p.x;
        let newY = p.y;

        // 如果点接近边界，向外扩展
        if (Math.abs(p.x) > BOUNDARY_HALF - BLOCK_SIZE) {
            newX = p.x > 0 ? BOUNDARY_HALF + expandAmount : -BOUNDARY_HALF - expandAmount;
        }
        if (Math.abs(p.y) > BOUNDARY_HALF - BLOCK_SIZE) {
            newY = p.y > 0 ? BOUNDARY_HALF + expandAmount : -BOUNDARY_HALF - expandAmount;
        }

        expanded.push({ x: newX, y: newY });
    }

    return expanded;
}

// 添加自然噪声
function addNaturalNoise(points, amplitude) {
    return points.map((p, i) => {
        // 使用正弦波创建平滑的噪声
        const noiseX = Math.sin(i * 0.5) * (amplitude * 0.5) +
            Math.sin(i * 1.3) * (amplitude * 0.3) +
            Math.sin(i * 2.1) * (amplitude * 0.2);
        const noiseY = Math.cos(i * 0.7) * (amplitude * 0.5) +
            Math.cos(i * 1.5) * (amplitude * 0.3) +
            Math.cos(i * 2.3) * (amplitude * 0.2);

        return {
            x: p.x + noiseX,
            y: p.y + noiseY
        };
    });
}


// 生成河流多边形（宽曲线）
function generateRiverPolygon(startBlock, endBlock, width = BLOCK_SIZE * 0.3) {
    const start = getBlockCenter(startBlock.r, startBlock.c);
    const end = getBlockCenter(endBlock.r, endBlock.c);

    // 生成弯曲的河流路径
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    // 添加随机偏移使河流弯曲
    const offsetX = (Math.random() - 0.5) * BLOCK_SIZE * 0.8;
    const offsetY = (Math.random() - 0.5) * BLOCK_SIZE * 0.8;

    const controlPoint = { x: midX + offsetX, y: midY + offsetY };

    const pathPoints = bezierInterpolation([start, controlPoint, end], 30);

    // 生成河流多边形（带宽度）
    const riverPoly = [];

    for (let i = 0; i < pathPoints.length; i++) {
        const p = pathPoints[i];
        let prev = pathPoints[i - 1] || p;
        let next = pathPoints[i + 1] || p;

        // 计算垂直于路径的方向
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const perpX = -dy / len;
        const perpY = dx / len;

        riverPoly.push({
            x: p.x + perpX * width / 2,
            y: p.y + perpY * width / 2
        });
    }

    // 添加反向点形成闭合多边形
    for (let i = pathPoints.length - 1; i >= 0; i--) {
        const p = pathPoints[i];
        let prev = pathPoints[i - 1] || p;
        let next = pathPoints[i + 1] || p;

        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const perpX = -dy / len;
        const perpY = dx / len;

        riverPoly.push({
            x: p.x - perpX * width / 2,
            y: p.y - perpY * width / 2
        });
    }

    return riverPoly;
}

// 主入口：从AI返回的区块数据生成地形
// 完全根据AI返回的grid数组生成，不处理features或方向信息
function loadTerrainFromAI(terrainData) {
    const GRID = BLOCK_GRID;
    console.warn('[loadTerrainFromAI] 开始加载, 数据类型:', typeof terrainData);

    if (!terrainData) {
        console.warn('[loadTerrainFromAI] 数据为空，生成默认地形');
        return generateDefaultTerrain();
    }

    // 如果传入的是字符串，尝试JSON.parse
    if (typeof terrainData === 'string') {
        console.warn('[loadTerrainFromAI] 数据是字符串，尝试解析');
        // 先尝试解析为位图文本（纯数字+换行符）
        var bitmapGrid = parseBitmapGrid(terrainData);
        if (bitmapGrid) {
            console.warn('[loadTerrainFromAI] 位图文本解析成功, 行数:', bitmapGrid.length);
            saveTerrainBlocks(bitmapGrid, [], []);
            return true;
        }
        // 再尝试JSON.parse
        try {
            terrainData = JSON.parse(terrainData);
            console.warn('[loadTerrainFromAI] 字符串解析成功');
        } catch (e) {
            // 尝试修复
            var repaired = repairTerrainJSON(terrainData);
            if (repaired) {
                terrainData = repaired;
                console.warn('[loadTerrainFromAI] 字符串修复成功');
            } else {
                console.warn('[loadTerrainFromAI] 字符串修复失败，生成默认地形');
                return generateDefaultTerrain();
            }
        }
    }

    // 如果不是对象，回退到默认
    if (!terrainData || typeof terrainData !== 'object') {
        console.warn('[loadTerrainFromAI] 数据不是对象，生成默认地形');
        return generateDefaultTerrain();
    }

    // 优先直接获取grid
    let grid = terrainData.grid;
    console.warn('[loadTerrainFromAI] grid存在:', !!grid, '长度:', grid ? grid.length : 0);

    // 兼容旧格式：从terrain子对象获取
    if (!grid && terrainData.terrain && terrainData.terrain.grid) {
        grid = terrainData.terrain.grid;
        console.warn('[loadTerrainFromAI] 从terrain子对象获取grid');
    }

    // 如果grid是字符串（位图文本格式），解析它
    if (typeof grid === 'string') {
        console.warn('[loadTerrainFromAI] grid是字符串，尝试解析为位图文本');
        var parsedBitmap = parseBitmapGrid(grid);
        if (parsedBitmap) {
            grid = parsedBitmap;
            console.warn('[loadTerrainFromAI] grid位图文本解析成功, 行数:', grid.length);
        }
    }

    if (!grid || !Array.isArray(grid) || grid.length === 0) {
        console.warn('[loadTerrainFromAI] grid无效，生成默认地形');
        return generateDefaultTerrain();
    }

    // 将grid转换为blocks数组
    saveTerrainBlocks(grid, terrainData.markers || [], terrainData.legend || []);
}

// 解析位图文本格式（多行纯数字字符串）为二维数组
function parseBitmapGrid(text) {
    if (!text || typeof text !== 'string') return null;
    var lines = text.trim().split('\n').filter(function (l) { return l.trim().length > 0; });
    if (lines.length < 3) return null; // 至少需要3行才可能是位图
    var grid = [];
    for (var r = 0; r < lines.length; r++) {
        var line = lines[r].trim();
        var row = [];
        // 只解析数字字符，忽略空格等
        for (var c = 0; c < line.length; c++) {
            var ch = line[c];
            if (ch >= '0' && ch <= '9') {
                row.push(parseInt(ch, 10));
            }
        }
        if (row.length > 0) grid.push(row);
    }
    if (grid.length < 3) return null;
    // 验证：至少一半以上的行长度>10，才认为是有效的位图
    var longRows = 0;
    for (var i = 0; i < grid.length; i++) {
        if (grid[i].length > 10) longRows++;
    }
    if (longRows < grid.length / 2) return null;
    return grid;
}

// 将grid数组保存为terrain blocks
function saveTerrainBlocks(grid, markers, legend) {
    const GRID = BLOCK_GRID;
    const blocks = [];
    for (let r = 0; r < Math.min(grid.length, GRID); r++) {
        blocks[r] = [];
        const row = grid[r];
        for (let c = 0; c < Math.min(row ? row.length : 0, GRID); c++) {
            const val = row[c];
            if (val === 0 || val === '0') blocks[r][c] = TERRAIN.WATER;
            else if (val === 1 || val === '1') blocks[r][c] = TERRAIN.LAND;
            else if (val === 2 || val === '2') blocks[r][c] = TERRAIN.HILL;
            else if (val === 3 || val === '3') blocks[r][c] = TERRAIN.BUILTUP;
            else if (val === 4 || val === '4') blocks[r][c] = TERRAIN.RIVER;
            else if (val === 5 || val === '5') blocks[r][c] = TERRAIN.INDUSTRIAL;
            else if (val === 6 || val === '6') blocks[r][c] = TERRAIN.ROAD;
            else blocks[r][c] = TERRAIN.LAND;
        }
        // 填充剩余列
        for (let c = (row ? row.length : 0); c < GRID; c++) {
            blocks[r][c] = TERRAIN.LAND;
        }
    }
    // 填充剩余行
    for (let r = grid.length; r < GRID; r++) {
        blocks[r] = [];
        for (let c = 0; c < GRID; c++) {
            blocks[r][c] = TERRAIN.LAND;
        }
    }
    // 保存原始blocks数据供直接绘制
    terrain = {
        rawBlocks: blocks,
        markers: markers || [],
        legend: legend || []
    };
}
// 尝试修复破损的terrain JSON（处理大型grid数组常见截断等问题）
function repairTerrainJSON(raw) {
    if (!raw || typeof raw !== 'string') return null;
    // 尝试提取 grid 数组
    var gridMatch = raw.match(/"grid"\s*:\s*(\[[\s\S]*)/);
    if (!gridMatch) return null;
    try {
        // 尝试整体修复：补齐缺失的括号
        var fixed = raw.replace(/,\s*$/, ''); // 移除尾部逗号
        fixed = fixed.replace(/(["']\s*:\s*["'][^"']*)$/, '$1"'); // 修复未闭合字符串
        // 计数括号
        var openBraces = (fixed.match(/\{/g) || []).length;
        var closeBraces = (fixed.match(/\}/g) || []).length;
        var openBrackets = (fixed.match(/\[/g) || []).length;
        var closeBrackets = (fixed.match(/\]/g) || []).length;
        for (var i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
        for (var i = 0; i < openBraces - closeBraces; i++) fixed += '}';
        return JSON.parse(fixed);
    } catch (e) {
        // 最后尝试只提取grid并构建最小terrain对象
        try {
            return { grid: JSON.parse(gridMatch[1]), markers: [], legend: [] };
        } catch (e2) {
            return null;
        }
    }
}

// 生成默认地形
function generateDefaultTerrain() {
    const GRID = BLOCK_GRID;
    const blocks = [];

    // 创建多样化的默认地形
    // 布局：海岸在东侧和南侧，山地在西北和中部，河流从西北流向东南
    for (let r = 0; r < GRID; r++) {
        blocks[r] = [];
        for (let c = 0; c < GRID; c++) {
            // 东南沿海（水域）- 减少水域面积，使其更合理
            if ((c >= 4 && r >= 3) ||  // 东南角
                (c === 3 && r === 4) ||  // 底部中间
                (c === 4 && r >= 1)) {   // 最右侧一列
                blocks[r][c] = TERRAIN.WATER;
            }
            // 西北和中部山地
            else if ((r <= 1 && c <= 1) ||  // 西北山地
                (r === 1 && c === 2) || // 中北部山地
                (r === 2 && c <= 1)) {  // 中西部山地
                blocks[r][c] = TERRAIN.HILL;
            }
            // 其他区域为陆地
            else {
                blocks[r][c] = TERRAIN.LAND;
            }
        }
    }

    // 添加河流通道（从中部流向东南）
    blocks[2][2] = TERRAIN.WATER;
    blocks[3][3] = TERRAIN.WATER;

    const regions = [];

    // 保存原始blocks数据供直接绘制
    terrain = { rawBlocks: blocks };


    // 不在这里调用redrawAll，由调用者控制渲染时机
    return true;
}

// 基于geo_text的地形生成（兼容旧接口）
function generateTerrainFromGeoText(geoText) {
    if (!geoText || geoText === '等待生成...' || !geoText.trim()) {
        return false;
    }

    const GRID = BLOCK_GRID;
    const blocks = [];

    for (let r = 0; r < GRID; r++) {
        blocks[r] = [];
        for (let c = 0; c < GRID; c++) {
            blocks[r][c] = TERRAIN.LAND;
        }
    }

    // 简单的关键词分析
    if (geoText.includes('海') || geoText.includes('海岸') || geoText.includes('湾')) {
        // 沿海地形
        for (let r = 2; r < GRID; r++) {
            blocks[r][GRID - 1] = TERRAIN.WATER;
            if (r >= 3) blocks[r][GRID - 2] = TERRAIN.WATER;
        }
    }

    if (geoText.includes('山') || geoText.includes('丘陵') || geoText.includes('高原')) {
        // 山地地形
        blocks[0][0] = TERRAIN.HILL;
        blocks[0][1] = TERRAIN.HILL;
        blocks[1][0] = TERRAIN.HILL;
        if (geoText.includes('连绵')) {
            blocks[0][2] = TERRAIN.HILL;
            blocks[1][1] = TERRAIN.HILL;
        }
    }

    if (geoText.includes('河') || geoText.includes('江') || geoText.includes('溪')) {
        // 河流
        blocks[1][2] = TERRAIN.WATER;
        blocks[2][2] = TERRAIN.WATER;
        blocks[2][3] = TERRAIN.WATER;
        blocks[3][3] = TERRAIN.WATER;
    }

    if (geoText.includes('湖') || geoText.includes('湖泊')) {
        // 湖泊
        blocks[2][1] = TERRAIN.WATER;
        blocks[2][2] = TERRAIN.WATER;
        blocks[3][1] = TERRAIN.WATER;
        blocks[3][2] = TERRAIN.WATER;
    }

    const regions = [];

    const landPoly = blocksToSmoothPolygon(blocks, TERRAIN.LAND);
    if (landPoly.length >= 3) {
        regions.push({ type: TERRAIN.LAND, polygon: landPoly });
    }

    const hillPoly = blocksToSmoothPolygon(blocks, TERRAIN.HILL);
    if (hillPoly.length >= 3) {
        regions.push({ type: TERRAIN.HILL, polygon: hillPoly });
    }

    terrain = { regions: regions, rawBlocks: blocks };

    if (typeof canvas !== 'undefined' && canvas) {
        redrawAll();
    }
    return true;
}

// 导出 terrain 对象供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { terrain, drawTerrain, loadTerrainFromAI, generateTerrainFromDirections, generateDefaultTerrain };
}