// ===== 视图变换系统 =====

// 确保常量已定义
if (typeof WORLD_PIXELS_PER_METER === 'undefined') {
    window.WORLD_PIXELS_PER_METER = 2;
}
if (typeof BOUNDARY_HALF_METERS === 'undefined') {
    window.BOUNDARY_HALF_METERS = 25000;
}
if (typeof BOUNDARY_HALF === 'undefined') {
    window.BOUNDARY_HALF = BOUNDARY_HALF_METERS * WORLD_PIXELS_PER_METER;
}
if (typeof WORLD_SIZE === 'undefined') {
    window.WORLD_SIZE = BOUNDARY_HALF * 2;
}

const MAX_SCALE = 5.0;
const REF_SCREEN_WIDTH_M = 192;
let pixelsPerMeter = 2;

function m(meters) { return meters * pixelsPerMeter; }

let viewScale = 1.0;
let viewOffsetX = 0;
let viewOffsetY = 0;

function screenToWorld(sx, sy) {
    return { x: (sx - viewOffsetX) / viewScale, y: (sy - viewOffsetY) / viewScale };
}

function worldToScreen(wx, wy) {
    return { x: wx * viewScale + viewOffsetX, y: wy * viewScale + viewOffsetY };
}

function applyCanvasTransform(ctx) {
    // 翻转Y轴，因为Canvas的Y轴向下，而世界坐标系Y轴向上
    ctx.setTransform(viewScale, 0, 0, -viewScale, viewOffsetX, viewOffsetY);
}

function resetCanvasTransform(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function clampViewOffset() {
    const halfWorldWidth = BOUNDARY_HALF * viewScale;
    const halfWorldHeight = BOUNDARY_HALF * viewScale;

    const minX = canvas.width / 2 - halfWorldWidth;
    const maxX = canvas.width / 2 + halfWorldWidth;
    const minY = canvas.height / 2 - halfWorldHeight;
    const maxY = canvas.height / 2 + halfWorldHeight;

    viewOffsetX = Math.max(minX, Math.min(maxX, viewOffsetX));
    viewOffsetY = Math.max(minY, Math.min(maxY, viewOffsetY));
}

function fitToBounds() {
    const worldWidth = BOUNDARY_HALF * 2;
    const worldHeight = BOUNDARY_HALF * 2;

    const scaleX = canvas.width / worldWidth;
    const scaleY = canvas.height / worldHeight;
    viewScale = Math.min(scaleX, scaleY, MAX_SCALE);

    viewOffsetX = canvas.width / 2;
    viewOffsetY = canvas.height / 2;
}

function resetView() {
    viewScale = 1.0;
    viewOffsetX = canvas.width / 2;
    viewOffsetY = canvas.height / 2;
    redrawAll();
}

function updatePixelsPerMeter(canvasWidth) {
    pixelsPerMeter = canvasWidth / REF_SCREEN_WIDTH_M / MAX_SCALE;
}