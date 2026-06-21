const fs = require('fs');

// 边界：BOUNDARY_HALF = 25000 m × 2 = 50000 world pixels
// 即 BOUNDARY_HALF = 50000 world-pixels
const HALF = 50000;

const regions = [];

// A. 陆地：大椭圆岛（用多边形模拟）
function makeEllipse(cx, cy, rx, ry, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    return pts;
}

regions.push({ type: 1, polygon: makeEllipse(-10000, -5000, 35000, 25000, 48) });

// B. 山岗：岛西北角的山区
regions.push({
    type: 2,
    polygon: [
        { x: -35000, y: -25000 }, { x: -20000, y: -28000 }, { x: -8000, y: -22000 },
        { x: -15000, y: -12000 }, { x: -30000, y: -12000 }, { x: -38000, y: -18000 }
    ]
});

// C. 第二个小岛（东侧）
regions.push({ type: 1, polygon: makeEllipse(28000, 15000, 15000, 12000, 32) });

// D. 小岛上的山岗
regions.push({
    type: 2,
    polygon: [
        { x: 25000, y: 10000 }, { x: 32000, y: 8000 }, { x: 37000, y: 15000 }, { x: 30000, y: 22000 }, { x: 24000, y: 18000 }
    ]
});

// E. 主岛中的内陆湖（水域）
regions.push({
    type: 0,
    polygon: makeEllipse(-5000, 5000, 8000, 6000, 24)
});

// F. 南方半岛（陆地）
regions.push({
    type: 1,
    polygon: [
        { x: -15000, y: 20000 }, { x: 5000, y: 18000 }, { x: 15000, y: 30000 },
        { x: 5000, y: 38000 }, { x: -10000, y: 35000 }, { x: -20000, y: 28000 }
    ]
});

const data = {
    type: 'terrain-map',
    version: 'V2-pre-alpha0.1',
    regions: regions
};

fs.writeFileSync('e:/mandate_mayor/sample-terrain.json', JSON.stringify(data, null, 2));
const parsed = JSON.parse(fs.readFileSync('e:/mandate_mayor/sample-terrain.json', 'utf8'));
const valid = parsed.regions.filter(r => r && Array.isArray(r.polygon) && r.polygon.length >= 3);
console.log('OK: regions written =', regions.length, 'valid parsed =', valid.length);
