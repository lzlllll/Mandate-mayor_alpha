// ===== 工具函数 =====

// 距离计算
function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// 点是否在线段上（带容差）
function pointOnSegment(p, a, b, tolerance = 1) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-6) return distance(p, a) < tolerance;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * dx, y: a.y + t * dy };
    return distance(p, proj) < tolerance;
}

// 点是否在多边形内或边界上（更稳健，对边界附近点有效）
// tolerance: 允许点距离多边形边界最多多少米仍视为在内部
function isPointInsideOrOnPolygon(point, polygon, tolerance = 1.5) {
    if (!polygon || polygon.length < 3) return false;
    // 1) 若点距离任何一条边小于 tolerance 视为"在边界上"
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (pointOnSegment(point, polygon[i], polygon[j], tolerance)) return true;
    }
    // 2) 否则用严格射线法判断是否在内部
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// 点是否在多边形内（经典射线法，保留以兼容旧代码）
function isPointInPolygon(point, polygon, threshold = 0) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi + threshold)) {
            inside = !inside;
        }
    }
    return inside;
}

// 线段与多边形相交检测
function linePolygonIntersection(p1, p2, polygon) {
    const intersections = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % n];
        const intersect = lineIntersection(p1, p2, a, b);
        if (intersect) {
            intersections.push(intersect);
        }
    }
    return intersections;
}

// 两线段相交检测
function lineIntersection(p1, p2, p3, p4) {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denom) < 0.0001) return null;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            x: p1.x + ua * (p2.x - p1.x),
            y: p1.y + ua * (p2.y - p1.y)
        };
    }
    return null;
}

// 点到线段的最近点
function projectPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = dx * dx + dy * dy;
    if (len < 0.0001) return { x: x1, y: y1 };

    let t = ((px - x1) * dx + (py - y1) * dy) / len;
    t = Math.max(0, Math.min(1, t));

    return {
        x: x1 + t * dx,
        y: y1 + t * dy
    };
}

// 计算多边形面积
function polygonArea(poly) {
    let area = 0;
    const n = poly.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += poly[i].x * poly[j].y;
        area -= poly[j].x * poly[i].y;
    }
    return Math.abs(area) / 2;
}

// 获取多边形中心点
function polygonCenter(poly) {
    let cx = 0, cy = 0;
    const n = poly.length;
    for (let i = 0; i < n; i++) {
        cx += poly[i].x;
        cy += poly[i].y;
    }
    return { x: cx / n, y: cy / n };
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 数组去重
function uniqueArray(arr, keyFn) {
    const seen = new Set();
    return arr.filter(item => {
        const key = keyFn ? keyFn(item) : JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// 角度转弧度
function degToRad(deg) {
    return deg * Math.PI / 180;
}

// 弧度转角度
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

// 限制值在范围内
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 线性插值
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// 防抖函数
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 节流函数
function throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 判断两条线段是否相交（不含共线完全贴合的情况）
function segmentsIntersect(a1, a2, b1, b2) {
    const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    if (Math.abs(d) < 1e-9) return false; // 平行或共线，保守处理
    const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
    const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
    return t > 0 && t < 1 && u > 0 && u < 1;
}

// 两个简单多边形是否重叠（有共享顶点/边不算重叠）
function polygonsOverlap(polyA, polyB) {
    if (!polyA || !polyB || polyA.length < 3 || polyB.length < 3) return false;
    const na = polyA.length, nb = polyB.length;
    // 1. 边交叉检测（排除公共顶点处的相接）
    for (let i = 0; i < na; i++) {
        const a1 = polyA[i], a2 = polyA[(i + 1) % na];
        for (let j = 0; j < nb; j++) {
            const b1 = polyB[j], b2 = polyB[(j + 1) % nb];
            if (segmentsIntersect(a1, a2, b1, b2)) return true;
        }
    }
    // 2. 一个多边形内部有点被完全包围（无交叉但一方包含另一方）
    //    检查每个多边形的内部采样点是否在对方多边形内
    //    使用"在每条边上稍微偏内"的采样点避免顶点重合问题
    const sampleInside = (poly) => {
        const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
        const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
        return { x: cx, y: cy };
    };
    const ca = sampleInside(polyA);
    if (isPointInPolygon(ca, polyB)) return true;
    const cb = sampleInside(polyB);
    if (isPointInPolygon(cb, polyA)) return true;
    return false;
}

// 矩形（凸四边形）是否与另一个矩形重叠（用于 lot 之间的重叠检测）
function rectPolygonsOverlap(polyA, polyB) {
    return polygonsOverlap(polyA, polyB);
}

// 检查一个新规划区是否与已有任意规划区重叠
function isParcelOverlapping(newPts, existingParcels, skipName = null) {
    for (const parcel of existingParcels) {
        if (skipName && parcel.name === skipName) continue;
        const poly = parcel.getPolygon ? parcel.getPolygon() : (parcel.points || []);
        if (polygonsOverlap(newPts, poly)) return true;
    }
    return false;
}

// 格式化数字（千分位）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================================
// 道路 / lot 相交检测
// 语义：只有地下道路（height == 1）可以与 lot 相交，其他道路必须与 lot 相互排斥
// ============================================================

// 把 flat polygon [x1,y1,x2,y2,...] 转换成 [{x,y},...]
function flatToPoints(flat) {
    const pts = [];
    for (let i = 0; i + 1 < flat.length; i += 2) {
        pts.push({ x: flat[i], y: flat[i + 1] });
    }
    return pts;
}

// 线段与多边形是否相交（包括线段穿过多边形或端点落在多边形内）
function segmentIntersectsPolygon(a, b, poly) {
    if (!poly || poly.length < 3) return false;
    // 1. 线段任意端点落在多边形内（严格"内"）
    if (isPointInPolygon(a, poly)) return true;
    if (isPointInPolygon(b, poly)) return true;
    // 2. 线段与多边形任意一条边相交（非端点处）
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        if (segmentsIntersect(a, b, p1, p2)) return true;
    }
    return false;
}

// 道路（polyline）是否与某个 lot 多边形相交
function roadCrossesPolygon(roadPoints, poly) {
    if (!roadPoints || roadPoints.length < 2 || !poly || poly.length < 3) return false;
    for (let i = 0; i < roadPoints.length - 1; i++) {
        if (segmentIntersectsPolygon(roadPoints[i], roadPoints[i + 1], poly)) return true;
    }
    return false;
}

// 检测一条道路是否穿过任何现有 lot；若道路是地下（height === 1）则直接返回 false（允许）
// 参数 lots 为 internalPlots（[{polygon: [x1,y1,...], ...}, ...]）
function isRoadCrossingLot(road, lots) {
    if (!road || !road.points || road.points.length < 2) return false;
    if (road.height === 1) return false; // 地下道路允许与 lot 相交
    if (!lots || lots.length === 0) return false;
    for (const lot of lots) {
        if (!lot || !lot.polygon) continue;
        const lotPoly = flatToPoints(lot.polygon);
        if (roadCrossesPolygon(road.points, lotPoly)) return true;
    }
    return false;
}

// 检测一个新 lot 是否与任何非地下道路相交；若存在相交则返回 true（禁止放置）
function lotIntersectsRoad(polygon, roads) {
    if (!polygon || polygon.length < 3) return false;
    if (!roads || roads.length === 0) return false;
    for (const r of roads) {
        if (!r || !r.points || r.points.length < 2) continue;
        if (r.height === 1) continue; // 地下道路不排斥 lot
        if (roadCrossesPolygon(r.points, polygon)) return true;
    }
    return false;
}

// 检测规划区是否与地面道路相交（高架和地下道路除外）
// 参数：polygon - 规划区多边形点数组，roads - 道路数组
function isParcelCrossingRoad(polygon, roads) {
    if (!polygon || polygon.length < 3) return false;
    if (!roads || roads.length === 0) return false;
    for (const road of roads) {
        if (!road || !road.points || road.points.length < 2) continue;
        if (road.type === 'internal') continue; // 内部道路不检测
        if (typeof road.height === 'number') {
            if (road.height === -1) continue; // 高架道路允许穿过
            if (road.height === 1) continue; // 地下道路允许穿过
        }
        // 地面道路与规划区相交检测
        if (roadCrossesPolygon(road.points, polygon)) {
            return true;
        }
    }
    return false;
}
