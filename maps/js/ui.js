// ===== UI交互系统 =====

const APP_VERSION = 'V2-pre-alpha0.1';
const APP_VERSION_KEY = '__app_version__';

let undoStack = [];
const MAX_UNDO = 5;
let warningTimeout = null;

let demolishMode = false;
let demolishTargets = [];

let currentLanePreset = 'default';
const defaultLanePresets = {
    default: { name: '默认', modules: [{ name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }] },
    '二车道': { name: '二车道', modules: [{ name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }] },
    '四车道': { name: '四车道', modules: [{ name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }] },
    '六车道': { name: '六车道', modules: [{ name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }, { name: 'Lane', width: 3.5 }] },
    internalRoad: { name: '内部道路', modules: [{ name: 'Lane', width: 2 }, { name: 'Lane', width: 2 }, { name: 'reservedWidth', width: 1 }] }
};
let lanePresets = { ...defaultLanePresets };

let currentParcelType = 'residential';
let parcelTypePresets = { ...defaultParcelTypePresets };

let drawMode = 'line';
let points = [];
let savedImageData = null;
let currentX = 0;
let currentY = 0;

let gamePaused = false;
let parcelModeEnabled = false;
let parcelDrawPoints = [];
let parcelEdges = [];

let resourceModeEnabled = false;
let currentHeight = 0; // -1 高架 / 0 地面 / 1 地下

function renderHeightButtons() {
    const btns = document.querySelectorAll('.height-btn');
    btns.forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.height) === currentHeight);
    });
}

function setRoadHeight(h) {
    currentHeight = Number(h);
    renderHeightButtons();
}

/**
 * 估算绘制预览中道路的长度（米）
 * - line / free：直接算折线总长度
 * - curve：把 3 个点当作二次贝塞尔曲线的 p0/p1/p2，采样后近似计算
 */
function estimatePreviewLength(pts, mode) {
    if (!pts || pts.length < 2) return 0;
    if (mode === 'curve' && pts.length >= 3) {
        const p0 = pts[0], p1 = pts[1], p2 = pts[2];
        const samples = 60;
        const sampled = [];
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
            const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
            sampled.push({ x, y });
        }
        return polylineLength(sampled);
    }
    return polylineLength(pts);
}

function formatLengthMeters(meters) {
    if (!isFinite(meters) || meters <= 0) return '0 m';
    if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
    return meters.toFixed(1) + ' m';
}

let _lengthLabelEl = null;
function updateRoadLengthLabel(pts, mode, clientX, clientY, labelText) {
    if (!_lengthLabelEl) _lengthLabelEl = document.getElementById('roadLengthLabel');
    if (!_lengthLabelEl) return;
    let text = labelText;
    if (!text) {
        const len = estimatePreviewLength(pts, mode);
        text = formatLengthMeters(len);
    }
    _lengthLabelEl.textContent = text;
    _lengthLabelEl.style.display = 'block';
    // 避免标签超出视窗右侧/底部
    const offsetX = 16;
    const offsetY = 16;
    let x = clientX + offsetX;
    let y = clientY + offsetY;
    const maxX = window.innerWidth - 160;
    const maxY = window.innerHeight - 40;
    if (x > maxX) x = clientX - 130;
    if (y > maxY) y = clientY - 40;
    _lengthLabelEl.style.left = x + 'px';
    _lengthLabelEl.style.top = y + 'px';
}

function hideRoadLengthLabel() {
    if (!_lengthLabelEl) _lengthLabelEl = document.getElementById('roadLengthLabel');
    if (!_lengthLabelEl) return;
    _lengthLabelEl.style.display = 'none';
}

function getLaneModules(preset) {
    const p = lanePresets[preset];
    if (!p) return defaultLanePresets.default.modules;
    return Array.isArray(p) ? p : (p.modules || defaultLanePresets.default.modules);
}

function calculateTotalWidth(preset) {
    const modules = getLaneModules(preset);
    if (!Array.isArray(modules)) return 1;
    return modules.reduce((sum, m) => sum + (m && typeof m.width === 'number' ? m.width : 0), 0) || 1;
}

function updateLineWidth() {
    const w = calculateTotalWidth(currentLanePreset);
    ctx.lineWidth = w;
    ctxOverlay.lineWidth = w;
}

function showWarning(msg) {
    if (warningTimeout) clearTimeout(warningTimeout);
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#e74c3c;color:#fff;padding:15px 30px;border-radius:8px;font-size:16px;z-index:46;box-shadow:0 4px 20px rgba(0,0,0,0.3);cursor:pointer;';
    el.textContent = msg;
    document.body.appendChild(el);

    const removeWarning = () => {
        if (el.parentNode) {
            document.body.removeChild(el);
        }
        document.removeEventListener('click', removeWarning);
        if (warningTimeout) {
            clearTimeout(warningTimeout);
        }
    };

    document.addEventListener('click', removeWarning);

    warningTimeout = setTimeout(() => {
        removeWarning();
    }, 5000);
}

function undo() {
    if (undoStack.length === 0) return;
    const last = undoStack.pop();
    if (last.type === 'add') {
        strokes.splice(last.data.index, 1);
    } else if (last.type === 'remove') {
        strokes.splice(last.data.index, 0, last.data.road);
    } else if (last.type === 'removeParcel') {
        planningParcels.splice(last.data.index, 0, last.data.parcel);
        // 恢复被删除的内部道路
        if (last.data.internalRoads && Array.isArray(last.data.internalRoads)) {
            last.data.internalRoads.forEach(road => {
                strokes.push(road);
            });
        }
        // 恢复被删除的锚点
        if (last.data.anchors && Array.isArray(last.data.anchors)) {
            last.data.anchors.forEach(anchor => {
                // 检查锚点是否已存在
                const exists = persistentAnchors.some(a => a.id === anchor.id);
                if (!exists) {
                    persistentAnchors.push(anchor);
                }
            });
        }
    } else if (last.type === 'addParcel') {
        planningParcels.splice(last.data.index, 1);
    } else if (last.type === 'clear') {
        strokes = last.data.strokes;
        planningParcels = last.data.parcels;
        internalPlots = last.data.plots;
    }
    saveToStorage();
    redrawAll();
    refreshAllRoadBuildButtons();
}

function drawArc(ctx, p0, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ctx.stroke();
}

function simplifyPoints(points, tolerance = 2) {
    if (points.length <= 2) return points;
    let simplified = [points[0]];
    let last = points[0];
    for (let i = 1; i < points.length; i++) {
        const d = distance(last, points[i]);
        if (d > tolerance) {
            simplified.push(points[i]);
            last = points[i];
        }
    }
    if (simplified.length === 1 && points.length > 1) {
        simplified.push(points[points.length - 1]);
    }
    return simplified;
}

function drawPreview(points) {
    ctx.save();

    // 先清除之前的预览：恢复保存的画布状态
    if (savedImageData) {
        ctx.putImageData(savedImageData, 0, 0);
    }

    // 预览宽度 = 车道总宽度 + 2 像素，保证预览比实际道路略粗，不会“比最终图还细”
    let previewWidth = calculateTotalWidth(currentLanePreset) + 2;
    if (previewWidth < 4) previewWidth = 4;

    if (currentHeight === -1) {
        // 高架：蓝灰色实线 + 下方轻微阴影，提示“悬浮”
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = previewWidth + 6;
        ctx.setLineDash([]);
        drawPreviewPath(points);
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = previewWidth;
        drawPreviewPath(points);
    } else if (currentHeight === 1) {
        // 地下：紫色虚线，提示“在地下”
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#6a1b9a';
        ctx.lineWidth = previewWidth + 4;
        ctx.setLineDash([14, 8]);
        drawPreviewPath(points);
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#ab47bc';
        ctx.lineWidth = previewWidth;
        ctx.setLineDash([12, 8]);
        drawPreviewPath(points);
    } else {
        // 地面：黑色实线 + 轻微白色描边，在复杂底图上更清晰
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = previewWidth + 4;
        ctx.setLineDash([]);
        drawPreviewPath(points);
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = previewWidth;
        drawPreviewPath(points);
    }
    ctx.restore();
}

function drawPreviewPath(points) {
    if (points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
    } else if (points.length >= 3) {
        drawArc(ctx, points[0], points[1], points[2]);
    } else if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }
}