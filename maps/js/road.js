// ===== 道路系统 =====

// 道路状态常量
const ROAD_STATUSES = ['规划', '施工中', '开放', '维修中'];
const DEFAULT_ROAD_STATUS = '开放';

// 建造进度常量
const ROAD_BUILD_INTERVAL_HOURS = 5;      // 每5小时推进一次
const ROAD_BUILD_STEP_METERS = 500;        // 每次每端推进500米
const ROAD_BUILD_GRADIENT_METERS = 200;    // 渐变过渡区长度

// 道路颜色
function getRoadColor(status) {
    switch (status) {
        case '规划中':
            return '#888888';   // 灰色
        case '建造中':
            return '#000000';   // 黑色（闪烁效果由透明度实现）
        case '维修中':
            return '#e74c3c';   // 红色
        case '开放':
        default:
            return '#000000';   // 黑色
    }
}

// 道路是否虚线
function isRoadDashed(status) {
    return status === '规划中';
}

// 道路透明度（建造中闪烁）
let buildingBlinkOn = true;
let lastBlinkToggleMs = Date.now();

function getRoadAlpha(status) {
    switch (status) {
        case '规划中':
            return 0.45;   // 半透明
        case '建造中':
            return buildingBlinkOn ? 1.0 : 0.25;   // 闪烁
        case '维修中':
        case '开放':
        default:
            return 1.0;
    }
}

// 更新闪烁状态
// 参数: drawState - 包含绘制状态的对象 { points, currentX, currentY, drawMode, drawPreview, redrawAll }
function updateBuildingBlink(drawState) {
    const now = Date.now();
    if (now - lastBlinkToggleMs >= 500) {
        buildingBlinkOn = !buildingBlinkOn;
        lastBlinkToggleMs = now;
        // 闪烁状态变化时强制重绘，确保建造中的元素正确显示闪烁效果
        if (typeof drawState?.redrawAll === 'function') {
            drawState.redrawAll();
        }

        // 如果正在绘制道路，重新绘制预览
        if (typeof drawState?.drawPreview === 'function' &&
            typeof drawState.points !== 'undefined' && drawState.points.length > 0) {
            const { points, currentX, currentY, drawMode, drawPreview } = drawState;
            if (typeof currentX === 'number' && typeof currentY === 'number') {
                let preview;
                if (typeof drawMode === 'string') {
                    if (drawMode === 'line' && points.length === 1) {
                        preview = [points[0], { x: currentX, y: currentY }];
                        drawPreview(preview);
                    } else if (drawMode === 'curve' && points.length === 2) {
                        preview = [points[0], points[1], { x: currentX, y: currentY }];
                        drawPreview(preview);
                    } else if (drawMode === 'free' && points.length > 0) {
                        preview = [...points, { x: currentX, y: currentY }];
                        drawPreview(preview);
                    }
                }
            }
        }
    }
}

// Road 类
class Road {
    constructor(type, points, modules = null, status = '规划中', buildStartGameSec = null, height = 0) {
        this.name = generateRoadName();
        this.type = type;
        this.points = points;
        this.modules = modules || getLaneModules(currentLanePreset);
        this.status = status;
        this.buildStartGameSec = buildStartGameSec;
        this.height = height; // -1 高架 / 0 地面 / 1 地下
    }
}

// 生成道路名称
let roadIdCounter = 1;
function generateRoadName() {
    const name = String(roadIdCounter).padStart(3, '0');
    roadIdCounter++;
    return name;
}

// ===== 道路建造进度辅助函数 =====

// 将道路转换为折线点数组
function roadToPolyline(road) {
    if (!road || !road.points || road.points.length < 2) return [];
    if (road.type === 'line' && road.points.length === 2) {
        return [{ x: road.points[0].x, y: road.points[0].y }, { x: road.points[1].x, y: road.points[1].y }];
    }
    if (road.type === 'curve' && road.points.length >= 3) {
        const p0 = road.points[0], p1 = road.points[1], p2 = road.points[2];
        const pts = [];
        const samples = 60;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
            const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
            pts.push({ x, y });
        }
        return pts;
    }
    return road.points.map(p => ({ x: p.x, y: p.y }));
}

// 计算折线总长度
function polylineLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
}

// 获取道路总长度
function getRoadTotalLength(road) {
    return polylineLength(roadToPolyline(road));
}

// 从折线起点截取 dist 米的子路径
function subPathFromStart(pts, dist) {
    if (dist <= 0 || pts.length < 2) return [pts[0]];
    const result = [{ x: pts[0].x, y: pts[0].y }];
    let remaining = dist;
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        const segLen = Math.sqrt(dx * dx + dy * dy);
        if (remaining >= segLen) {
            result.push({ x: pts[i].x, y: pts[i].y });
            remaining -= segLen;
        } else {
            const ratio = remaining / segLen;
            result.push({
                x: pts[i - 1].x + dx * ratio,
                y: pts[i - 1].y + dy * ratio
            });
            return result;
        }
    }
    return result;
}

// 从折线终点截取 dist 米的子路径
function subPathFromEnd(pts, dist) {
    if (dist <= 0 || pts.length < 2) return [pts[pts.length - 1]];
    const reversed = pts.slice().reverse();
    const sub = subPathFromStart(reversed, dist);
    return sub.reverse();
}

// 根据建造开始时间计算已建造的单侧长度
function getRoadBuiltLengthPerEnd(road, currentGameSec) {
    if (road.status !== '建造中' || typeof road.buildStartGameSec !== 'number') return 0;
    const elapsedSec = currentGameSec - road.buildStartGameSec;
    if (elapsedSec <= 0) return 0;
    const HOUR_SEC = 3600;
    const steps = Math.floor(elapsedSec / (HOUR_SEC * ROAD_BUILD_INTERVAL_HOURS));
    return steps * ROAD_BUILD_STEP_METERS;
}

// 在ctx上绘制折线
function drawPolyline(ctx, pts) {
    if (!pts || pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
}

// 绘制带渐变末端的折线
function drawBuiltWithGradient(ctx, pts, gradientLen, strokeWidth, baseColor, buildAlpha) {
    if (!pts || pts.length < 2) return;
    const totalLen = polylineLength(pts);
    if (totalLen <= gradientLen) {
        drawPolyline(ctx, pts);
        return;
    }

    const mainLen = totalLen - gradientLen;
    const mainPts = subPathFromStart(pts, mainLen);
    drawPolyline(ctx, mainPts);

    const endPart = subPathFromEnd(pts, gradientLen);
    const gradSteps = 6;
    for (let s = 0; s < gradSteps; s++) {
        const segStart = (s / gradSteps) * gradientLen;
        const segEnd = ((s + 1) / gradSteps) * gradientLen;
        const segPtsStart = subPathFromStart(endPart, segStart);
        const segPtsFull = subPathFromStart(endPart, segEnd);
        const startPt = segPtsStart[segPtsStart.length - 1];
        const endPt = segPtsFull[segPtsFull.length - 1];
        const alpha = buildAlpha * (1 - s / gradSteps);
        if (alpha <= 0.02) continue;
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
        ctx.globalAlpha = prevAlpha;
    }
}
