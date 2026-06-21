
// ===== 主应用逻辑 =====

let canvas, ctx, canvasOverlay, ctxOverlay;
let mapContainer;

let strokes = [];

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

function initDOMElements() {
    const debugEl = document.getElementById('map-debug-js');
    if (debugEl) debugEl.innerHTML = 'DOM elements loading...';

    mapContainer = document.getElementById('map-container');
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas not found');
        if (debugEl) debugEl.innerHTML = 'Canvas not found';
        return false;
    }

    if (debugEl) debugEl.innerHTML = 'Canvas found';

    ctx = canvas.getContext('2d');
    canvasOverlay = document.getElementById('canvasOverlay');
    ctxOverlay = canvasOverlay.getContext('2d');

    return true;
}

function resizeCanvas() {
    const container = document.querySelector('#map-container .map-canvas-wrap') || document.getElementById('map-container');
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvasOverlay.width = width;
    canvasOverlay.height = height;
    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
    viewOffsetX = canvas.width / 2;
    viewOffsetY = canvas.height / 2;
    updatePixelsPerMeter(canvas.width);
    updateLineWidth();
    ctxOverlay.strokeStyle = '#000000';
    ctxOverlay.lineWidth = calculateTotalWidth(currentLanePreset);
    ctxOverlay.lineCap = 'round';
    ctxOverlay.lineJoin = 'round';
    fitToBounds();
    redrawAll();
}

function redrawAll() {
    // 检查canvas和ctx是否已初始化
    if (!ctx || !canvas) {
        console.warn('[redrawAll] Canvas或Context未初始化');
        return;
    }

    resetCanvasTransform(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyCanvasTransform(ctx);

    // 先绘制地形
    drawTerrain(ctx);
    drawNaturalResources(ctx);

    // 在地形之上绘制边界遮罩 - 覆盖地图边界外的区域
    ctx.fillStyle = 'rgba(20, 25, 45, 0.55)';
    ctx.beginPath();
    ctx.rect(-1000000, -1000000, 2000000, 2000000);
    ctx.rect(-BOUNDARY_HALF, -BOUNDARY_HALF, BOUNDARY_HALF * 2, BOUNDARY_HALF * 2);
    ctx.fill('evenodd');

    strokes.forEach(stroke => {
        ctx.save();
        let strokeWidth = 1;
        if (Array.isArray(stroke.modules) && stroke.modules.length > 0) {
            strokeWidth = stroke.modules.reduce((sum, m) => sum + (m && typeof m.width === 'number' ? m.width : 0), 0) || 1;
        } else {
            strokeWidth = calculateTotalWidth(currentLanePreset);
        }
        const status = (typeof stroke.status === 'string' && stroke.status) ? stroke.status : '开放';
        const height = (typeof stroke.height === 'number') ? stroke.height : 0;
        ctx.lineWidth = strokeWidth;

        const roadPts = roadToPolyline(stroke);

        if (status === '建造中' && roadPts.length >= 2) {
            const totalLen = polylineLength(roadPts);
            const builtPerEnd = getRoadBuiltLengthPerEnd(stroke, gameSecondsFromStart);
            const effectiveBuilt = Math.min(builtPerEnd, totalLen / 2);

            if (height === -1) {
                ctx.save();
                ctx.translate(3, 3);
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.lineWidth = strokeWidth;
                ctx.globalAlpha = 0.6;
                ctx.setLineDash([10, 8]);
                drawPolyline(ctx, roadPts);
                ctx.restore();
            }

            ctx.lineWidth = strokeWidth;
            if (height === -1) {
                ctx.strokeStyle = '#78909c';
                ctx.globalAlpha = 0.55;
                ctx.setLineDash([10, 8]);
            } else if (height === 1) {
                ctx.strokeStyle = '#ba68c8';
                ctx.globalAlpha = 0.4;
                ctx.setLineDash([6, 5]);
            } else {
                ctx.strokeStyle = '#888888';
                ctx.globalAlpha = 0.45;
                ctx.setLineDash([10, 8]);
            }
            drawPolyline(ctx, roadPts);

            if (effectiveBuilt > 0) {
                const startBuilt = subPathFromStart(roadPts, effectiveBuilt);
                const endBuilt = subPathFromEnd(roadPts, effectiveBuilt);
                const buildAlpha = buildingBlinkOn ? 1.0 : 0.35;

                if (startBuilt.length >= 2) {
                    if (height === -1) {
                        ctx.save();
                        ctx.translate(3, 3);
                        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                        ctx.lineWidth = strokeWidth;
                        ctx.globalAlpha = buildAlpha * 0.7;
                        ctx.setLineDash([]);
                        drawPolyline(ctx, startBuilt);
                        ctx.restore();
                    }
                    ctx.lineWidth = strokeWidth;
                    ctx.setLineDash([]);
                    if (height === -1) {
                        ctx.strokeStyle = '#546e7a';
                        ctx.globalAlpha = buildAlpha * 0.85;
                    } else if (height === 1) {
                        ctx.strokeStyle = '#9c27b0';
                        ctx.globalAlpha = buildAlpha * 0.65;
                    } else {
                        ctx.strokeStyle = '#000000';
                        ctx.globalAlpha = buildAlpha;
                    }
                    const gradLen = Math.min(200, polylineLength(startBuilt) * 0.5);
                    if (gradLen > 0 && polylineLength(startBuilt) > gradLen) {
                        const mainLen = polylineLength(startBuilt) - gradLen;
                        const mainPart = subPathFromStart(startBuilt, mainLen);
                        drawPolyline(ctx, mainPart);
                        const gradPart = subPathFromEnd(startBuilt, gradLen);
                        const gradSteps = 6;
                        const prevAlpha = ctx.globalAlpha;
                        for (let s = 0; s < gradSteps; s++) {
                            const t1 = s / gradSteps;
                            const t2 = (s + 1) / gradSteps;
                            const segStart = subPathFromStart(gradPart, t1 * gradLen);
                            const segEnd = subPathFromStart(gradPart, t2 * gradLen);
                            const sp = segStart[segStart.length - 1];
                            const ep = segEnd[segEnd.length - 1];
                            const segAlpha = prevAlpha * (1 - t1);
                            if (segAlpha <= 0.02) continue;
                            ctx.globalAlpha = segAlpha;
                            ctx.beginPath();
                            ctx.moveTo(sp.x, sp.y);
                            ctx.lineTo(ep.x, ep.y);
                            ctx.stroke();
                        }
                        ctx.globalAlpha = prevAlpha;
                    } else {
                        drawPolyline(ctx, startBuilt);
                    }
                }

                if (endBuilt.length >= 2) {
                    if (height === -1) {
                        ctx.save();
                        ctx.translate(3, 3);
                        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                        ctx.lineWidth = strokeWidth;
                        ctx.globalAlpha = buildAlpha * 0.7;
                        ctx.setLineDash([]);
                        drawPolyline(ctx, endBuilt);
                        ctx.restore();
                    }
                    ctx.lineWidth = strokeWidth;
                    ctx.setLineDash([]);
                    if (height === -1) {
                        ctx.strokeStyle = '#546e7a';
                        ctx.globalAlpha = buildAlpha * 0.85;
                    } else if (height === 1) {
                        ctx.strokeStyle = '#9c27b0';
                        ctx.globalAlpha = buildAlpha * 0.65;
                    } else {
                        ctx.strokeStyle = '#000000';
                        ctx.globalAlpha = buildAlpha;
                    }
                    const gradLen2 = Math.min(200, polylineLength(endBuilt) * 0.5);
                    if (gradLen2 > 0 && polylineLength(endBuilt) > gradLen2) {
                        const mainLen2 = polylineLength(endBuilt) - gradLen2;
                        const mainPart2 = subPathFromEnd(endBuilt, mainLen2);
                        drawPolyline(ctx, mainPart2);
                        const gradPart2 = subPathFromStart(endBuilt, gradLen2);
                        const gradSteps2 = 6;
                        const prevAlpha2 = ctx.globalAlpha;
                        for (let s = 0; s < gradSteps2; s++) {
                            const t1 = s / gradSteps2;
                            const t2 = (s + 1) / gradSteps2;
                            const segStart = subPathFromStart(gradPart2, t1 * gradLen2);
                            const segEnd = subPathFromStart(gradPart2, t2 * gradLen2);
                            const sp = segStart[segStart.length - 1];
                            const ep = segEnd[segEnd.length - 1];
                            const segAlpha = prevAlpha2 * (t1 + (1 / gradSteps2) * 0.5);
                            if (segAlpha <= 0.02) continue;
                            ctx.globalAlpha = segAlpha;
                            ctx.beginPath();
                            ctx.moveTo(sp.x, sp.y);
                            ctx.lineTo(ep.x, ep.y);
                            ctx.stroke();
                        }
                        ctx.globalAlpha = prevAlpha2;
                    } else {
                        drawPolyline(ctx, endBuilt);
                    }
                }
            }
        } else {
            if (height === -1) {
                ctx.save();
                ctx.translate(3, 3);
                ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                ctx.lineWidth = strokeWidth;
                ctx.globalAlpha = ctx.globalAlpha || 1;
                if (status === '规划中') ctx.setLineDash([10, 8]);
                if (stroke.type === 'line') {
                    ctx.beginPath(); ctx.moveTo(stroke.points[0].x, stroke.points[0].y); ctx.lineTo(stroke.points[1].x, stroke.points[1].y); ctx.stroke();
                } else if (stroke.type === 'free') {
                    ctx.beginPath(); if (stroke.points.length > 0) { ctx.moveTo(stroke.points[0].x, stroke.points[0].y); for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y); } ctx.stroke();
                } else if (stroke.type === 'curve') {
                    if (stroke.points.length >= 3) drawArc(ctx, stroke.points[0], stroke.points[1], stroke.points[2]);
                }
                ctx.restore();
                ctx.strokeStyle = '#546e7a';
                ctx.globalAlpha = status === '规划中' ? 0.45 : 0.85;
                if (status === '规划中') ctx.setLineDash([10, 8]);
                else ctx.setLineDash([]);
            } else if (height === 1) {
                ctx.strokeStyle = '#9c27b0';
                ctx.globalAlpha = status === '规划中' ? 0.45 * 0.65 : 0.65;
                ctx.setLineDash([6, 5]);
            } else {
                ctx.strokeStyle = '#000000';
                ctx.globalAlpha = status === '规划中' ? 0.45 : 1.0;
                if (status === '规划中') ctx.setLineDash([10, 8]);
                else ctx.setLineDash([]);
            }

            if (stroke.type === 'line') {
                ctx.beginPath();
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
                ctx.stroke();
            } else if (stroke.type === 'curve') {
                if (stroke.points.length >= 3) {
                    drawArc(ctx, stroke.points[0], stroke.points[1], stroke.points[2]);
                } else if (stroke.points.length === 2) {
                    ctx.beginPath();
                    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                    ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
                    ctx.stroke();
                }
            } else if (stroke.type === 'free') {
                ctx.beginPath();
                if (stroke.points.length > 0) {
                    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                    for (let i = 1; i < stroke.points.length; i++) {
                        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                    }
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    });

    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);
    ctx.lineWidth = 1;

    planningParcels.forEach(parcel => {
        const poly = parcel.getPolygon ? parcel.getPolygon() : parcel.points || [];
        if (poly.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();

        const color = getParcelColor(parcel.type || 'residential');
        const preset = parcelTypePresets[parcel.type] || {};

        if (preset.style && preset.style.fill === 'diagonal-hatch') {
            ctx.fillStyle = preset.style.baseColor || '#3a3a3a';
            ctx.globalAlpha = (preset.style.alpha != null ? preset.style.alpha : 0.35);
            ctx.fill();
            const size = 16;
            const off = document.createElement('canvas');
            off.width = size;
            off.height = size;
            const octx = off.getContext('2d');
            octx.strokeStyle = preset.style.strokeColor || '#1a1a1a';
            octx.lineWidth = 1.5;
            octx.beginPath();
            octx.moveTo(0, size);
            octx.lineTo(size, 0);
            octx.moveTo(-size / 2, size / 2);
            octx.lineTo(size / 2, -size / 2);
            octx.moveTo(size / 2, size + size / 2);
            octx.lineTo(size + size / 2, size / 2);
            octx.stroke();
            const pattern = ctx.createPattern(off, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.globalAlpha = 1.0;
                ctx.fill();
            }
            ctx.strokeStyle = preset.style.strokeColor || color.stroke;
        } else if (preset.style && preset.style.fill === 'grid-pattern') {
            ctx.fillStyle = preset.style.baseColor || '#7cb342';
            ctx.globalAlpha = (preset.style.alpha != null ? preset.style.alpha : 0.45);
            ctx.fill();
            const gsize = preset.style.gridSize || 18;
            const off2 = document.createElement('canvas');
            off2.width = gsize * 2;
            off2.height = gsize * 2;
            const octx2 = off2.getContext('2d');
            octx2.fillStyle = preset.style.baseColor || '#7cb342';
            octx2.fillRect(0, 0, gsize * 2, gsize * 2);
            octx2.fillStyle = preset.style.gridColor || '#aed581';
            octx2.fillRect(0, 0, gsize, gsize);
            octx2.fillRect(gsize, gsize, gsize, gsize);
            if (preset.style.gridLine !== false) {
                octx2.strokeStyle = preset.style.strokeColor || '#558b2f';
                octx2.lineWidth = 1;
                octx2.strokeRect(0, 0, gsize, gsize);
                octx2.strokeRect(gsize, gsize, gsize, gsize);
            }
            const pattern2 = ctx.createPattern(off2, 'repeat');
            if (pattern2) {
                ctx.fillStyle = pattern2;
                ctx.globalAlpha = 1.0;
                ctx.fill();
            }
            ctx.strokeStyle = preset.style.strokeColor || color.stroke;
        } else {
            if (parcel.type === 'civic' && parcel.facility && parcel.facility !== 'none') {
                ctx.fillStyle = '#4a4a4a';
                ctx.globalAlpha = 1.0;
                ctx.fill();
                ctx.strokeStyle = '#2a2a2a';
            } else {
                ctx.fillStyle = color.fill;
                ctx.globalAlpha = 1.0;
                ctx.fill();
                ctx.strokeStyle = color.stroke;
            }
        }
        ctx.lineWidth = Math.max(1.5, 3 / viewScale);
        ctx.stroke();

        let cx = 0, cy = 0;
        for (let i = 0; i < poly.length; i++) {
            cx += poly[i].x;
            cy += poly[i].y;
        }
        cx /= poly.length;
        cy /= poly.length;

        const presetName = (parcelTypePresets && parcelTypePresets[parcel.type]?.name) || parcel.type || '';
        let labelText = presetName + ' ' + parcel.name;
        let subLabel = null;
        if (parcel.type === 'civic' && parcel.facility && parcel.facility !== 'none') {
            const fac = (typeof CIVIC_FACILITY_TYPES !== 'undefined')
                ? CIVIC_FACILITY_TYPES.find(f => f.key === parcel.facility)
                : null;
            if (fac) labelText = fac.icon + ' ' + fac.name;
            const fMeta = (typeof CIVIC_FACILITY_DESIGNS !== 'undefined')
                ? CIVIC_FACILITY_DESIGNS[parcel.facility] : null;
            if (fMeta && parcel.facilityDesign) {
                const parts = [];
                ['design1', 'design2', 'design3'].forEach(dk => {
                    const dim = fMeta[dk];
                    if (!dim || !dim.gears) return;
                    const v = Math.max(1, Math.min(5, parseInt(parcel.facilityDesign[dk], 10) || 3));
                    parts.push(dim.gears[v - 1]);
                });
                if (parts.length > 0) subLabel = '[' + parts.join('·') + ']';
            }
        }

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.max(11, 14 / viewScale) + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.lineWidth = Math.max(2, 4 / viewScale);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeText(labelText, cx, cy);
        const textColor = color.stroke || '#333';
        ctx.fillStyle = textColor;
        ctx.fillText(labelText, cx, cy);

        if (subLabel) {
            const subY = cy + Math.max(14, 20 / viewScale);
            ctx.font = Math.max(9, 11 / viewScale) + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.lineWidth = Math.max(1.5, 3 / viewScale);
            ctx.strokeText(subLabel, cx, subY);
            ctx.fillStyle = (parcel.type === 'civic') ? '#6a7c7d' : '#555';
            ctx.fillText(subLabel, cx, subY);
        }
        ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    function flatToPoints(flat) {
        const pts = [];
        for (let i = 0; i < flat.length; i += 2) {
            pts.push({ x: flat[i], y: flat[i + 1] });
        }
        return pts;
    }

    ctx.lineWidth = m(2);
    ctx.strokeStyle = '#666666';
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.7;
    strokes.forEach(stroke => {
        if (!stroke || stroke.type !== 'internal') return;
        if (!stroke.points || stroke.points.length < 2) return;

        const roadPts = stroke.points;
        const segments = [];
        let currentSegment = [roadPts[0]];

        for (let i = 1; i < roadPts.length; i++) {
            const p1 = roadPts[i - 1];
            const p2 = roadPts[i];

            let intersectsLot = false;
            for (const plot of internalPlots) {
                if (!plot || !plot.polygon) continue;
                const poly = typeof plot.polygon[0] === 'number'
                    ? flatToPoints(plot.polygon)
                    : plot.polygon;
                if (poly.length < 3) continue;

                const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                if (isPointInsideOrOnPolygon(mid, poly, 2)) {
                    intersectsLot = true;
                    break;
                }
            }

            if (intersectsLot) {
                if (currentSegment.length > 1) {
                    segments.push(currentSegment);
                }
                currentSegment = [];
            } else {
                currentSegment.push(p2);
            }
        }

        if (currentSegment.length > 1) {
            segments.push(currentSegment);
        }

        for (const seg of segments) {
            if (seg.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(seg[0].x, seg[0].y);
            for (let i = 1; i < seg.length; i++) {
                ctx.lineTo(seg[i].x, seg[i].y);
            }
            ctx.stroke();
        }
    });
    ctx.globalAlpha = 1.0;

    if (internalPlots && internalPlots.length > 0) {
        for (const plot of internalPlots) {
            if (!plot) continue;
            const poly = plot.polygon;
            if (!poly || poly.length < 3) continue;

            ctx.beginPath();
            if (typeof poly[0] === 'number') {
                ctx.moveTo(poly[0], poly[1]);
                for (let i = 2; i < poly.length; i += 2) {
                    ctx.lineTo(poly[i], poly[i + 1]);
                }
            } else {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) {
                    ctx.lineTo(poly[i].x, poly[i].y);
                }
            }
            ctx.closePath();

            const color = getPlotSolidColor(plot.parcelType || 'residential');

            if (plot.status === '建造中') {
                ctx.setLineDash([]);
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                ctx.globalAlpha = buildingBlinkOn ? 0.85 : 0.25;
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (plot.status === '开放') {
                let densityAlpha = 0.5;
                if (plot.parcelName) {
                    const parcel = planningParcels.find(p => p.name === plot.parcelName);
                    if (parcel) {
                        const densityValue = parcel.design?.density || 3;
                        const idx = Math.max(0, Math.min(4, (parseInt(densityValue, 10) || 3) - 1));
                        const densityAlphas = [0.3, 0.45, 0.6, 0.75, 0.9];
                        densityAlpha = densityAlphas[idx];
                    }
                }
                ctx.setLineDash([]);
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                ctx.globalAlpha = densityAlpha;
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
    }

    ctx.strokeStyle = '#000000';
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
    updateLineWidth();
}

function handleMouseDown(e) {
    if (e.button === 2) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        mapContainer.classList.add('canvas-dragging');
    }
}

function handleMouseMove(e) {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        viewOffsetX += dx;
        viewOffsetY += dy;
        clampViewOffset();
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        redrawAll();
    }
}

function handleMouseUp(e) {
    if (e.button === 2) {
        isDragging = false;
        mapContainer.classList.remove('canvas-dragging');
    }
}

function handleContextMenu(e) {
    e.preventDefault();
}

function handleWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(getMinScale(canvas.width, canvas.height), Math.min(getMaxScale(), viewScale * delta));

    const worldX = (mouseX - viewOffsetX) / viewScale;
    const worldY = (mouseY - viewOffsetY) / viewScale;

    viewScale = newScale;
    viewOffsetX = mouseX - worldX * viewScale;
    viewOffsetY = mouseY - worldY * viewScale;

    clampViewOffset();
    updateLineWidth();
    redrawAll();
}

function handleKeyDown(e) {
    if (e.key === 'w' || e.key === 'W') {
        viewOffsetY += 50;
        clampViewOffset();
        redrawAll();
    }
    if (e.key === 's' || e.key === 'S') {
        viewOffsetY -= 50;
        clampViewOffset();
        redrawAll();
    }
    if (e.key === 'a' || e.key === 'A') {
        viewOffsetX += 50;
        clampViewOffset();
        redrawAll();
    }
    if (e.key === 'd' || e.key === 'D') {
        viewOffsetX -= 50;
        clampViewOffset();
        redrawAll();
    }
}

function drawNaturalResources(ctx) {
    if (!naturalResources || !naturalResources.regions) return;

    naturalResources.regions.forEach(region => {
        const color = NATURAL_RESOURCE_COLORS[region.type];
        ctx.fillStyle = color + '60';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        drawPolygon(ctx, region.polygon);
    });
}

function cloneDesign(design) {
    if (!design) return null;
    const copy = {};
    for (const k in design) copy[k] = design[k] | 0;
    return copy;
}

async function saveToStorage() {
    try {
        const data = {
            version: APP_VERSION,
            strokes: strokes.map(s => ({
                name: s.name,
                type: s.type,
                points: s.points,
                modules: s.modules,
                status: s.status,
                buildStartGameSec: s.buildStartGameSec,
                height: s.height
            })),
            persistentAnchors: persistentAnchors.map(a => ({ id: a.id, x: a.x, y: a.y, roadName: a.roadName })),
            planningParcels: planningParcels.map(p => ({
                name: p.name,
                anchorIds: p.anchorIds,
                points: p.points,
                type: p.type,
                status: p.status,
                buildStartGameSec: p.buildStartGameSec,
                prosperity: p.prosperity,
                seed: p.seed,
                buildProgress: p.buildProgress,
                startedLotCount: p.startedLotCount,
                builtUpMarked: p.builtUpMarked,
                design: p.design,
                facility: p.facility,
                facilityDesign: p.facilityDesign
            })),
            internalPlots: internalPlots.map(p => ({
                id: p.id,
                polygon: p.polygon,
                parcelType: p.parcelType,
                parcelName: p.parcelName,
                status: p.status,
                buildStartGameSec: p.buildStartGameSec,
                area: p.area
            })),
            terrain: terrain,
            gameSecondsFromStart: gameSecondsFromStart
        };
        localStorage.setItem('maps_autosave', JSON.stringify(data));
    } catch (err) {
        console.error('保存失败:', err);
    }
}

async function loadFromStorage() {
    try {
        const raw = localStorage.getItem('maps_autosave');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data) return;

        if (data.version && data.version !== APP_VERSION) {
            showWarning('版本不匹配！当前版本: ' + APP_VERSION + '，数据版本: ' + data.version);
            return;
        }

        if (Array.isArray(data.strokes)) {
            strokes = data.strokes.map(s => {
                const road = new Road(s.type, s.points, s.modules, s.status, s.buildStartGameSec, s.height);
                road.name = s.name;
                return road;
            });
        }

        clearAllAnchors();
        if (Array.isArray(data.persistentAnchors)) {
            persistentAnchors = data.persistentAnchors.map(a => ({
                id: a.id,
                x: a.x,
                y: a.y,
                roadName: a.roadName
            }));
        } else if (Array.isArray(data.frontageAnchors)) {
            persistentAnchors = data.frontageAnchors.map(a => ({
                id: a.id,
                x: a.point ? a.point.x : 0,
                y: a.point ? a.point.y : 0,
                roadName: a.point ? a.point.roadName : ''
            }));
        }

        if (Array.isArray(data.planningParcels)) {
            planningParcels = data.planningParcels.map(p => {
                let storedPoints = p.points || null;
                if (!storedPoints && p.anchorIds && p.anchorIds.length >= 3) {
                    const anchors = p.anchorIds.map(id => getAnchorById(id)).filter(Boolean);
                    if (anchors.length >= 3) {
                        storedPoints = anchors.map(a => ({ x: a.x, y: a.y }));
                    }
                }
                const parcel = new PlanningParcel(p.anchorIds, p.type, storedPoints,
                    cloneDesign(p.design) || getDefaultDesignForType(p.type), p.facility,
                    cloneDesign(p.facilityDesign) || null);
                parcel.name = p.name;
                parcel.status = p.status;
                parcel.buildStartGameSec = p.buildStartGameSec;
                parcel.prosperity = p.prosperity !== undefined ? p.prosperity : 0.5;
                if (typeof p.seed === 'number') parcel.seed = p.seed;
                if (typeof p.buildProgress === 'number') parcel.buildProgress = p.buildProgress;
                if (typeof p.startedLotCount === 'number') parcel.startedLotCount = p.startedLotCount;
                if (typeof p.builtUpMarked === 'boolean') parcel.builtUpMarked = p.builtUpMarked;
                return parcel;
            });
        }

        if (Array.isArray(data.internalPlots)) {
            internalPlots = data.internalPlots.map(p => ({
                id: p.id,
                polygon: p.polygon,
                parcelType: p.parcelType,
                parcelName: p.parcelName,
                status: p.status,
                buildStartGameSec: p.buildStartGameSec
            }));
        }

        if (data.terrain) {
            loadTerrain(data.terrain);
        }

        if (data.naturalResources) {
            loadNaturalResources(data.naturalResources);
        }

        if (data.gameSecondsFromStart !== undefined) {
            gameSecondsFromStart = data.gameSecondsFromStart;
        }
    } catch (err) {
        console.error('加载失败:', err);
    }
}

// ===== 劳动群众建设意愿 =====
let residentialWill = 50;
let commercialWill = 50;
let industrialWill = 50;
let officeWill = 50;

function updateClassWillingness() {
    const population = calculateTotalPopulation();

    let commercialLotCount = 0;
    let industrialLotCount = 0;
    let officeLotCount = 0;

    if (internalPlots && internalPlots.length > 0) {
        for (const plot of internalPlots) {
            if (!plot) continue;
            if (plot.status !== '开放' && plot.status !== '建造中') continue;
            const type = plot.parcelType || 'residential';
            if (type === 'commercial') commercialLotCount++;
            if (type === 'industrial') industrialLotCount++;
            if (type === 'office') officeLotCount++;
        }
    }

    const totalLotCount = internalPlots ? internalPlots.filter(p => p && (p.status === '开放' || p.status === '建造中')).length : 0;
    if (totalLotCount === 0) {
        residentialWill = 50;
        commercialWill = 50;
        industrialWill = 50;
    } else {
        if (commercialLotCount === 0) {
            commercialWill = 50;
        } else {
            commercialWill = Math.max(0, Math.min(100, Math.round((population / 100) - commercialLotCount)));
        }

        if (industrialLotCount === 0) {
            industrialWill = 50;
        } else {
            industrialWill = Math.max(0, Math.min(100, Math.round(commercialLotCount + (population / 100) - industrialLotCount)));
        }

        const neededCommercial = Math.max(1, Math.round(population / 100));
        const commercialSatisfaction = Math.min(100, Math.round((commercialLotCount / neededCommercial) * 100));

        const neededIndustrial = Math.max(1, commercialLotCount + Math.round(population / 100));
        const industrialSatisfaction = Math.min(100, Math.round((industrialLotCount / neededIndustrial) * 100));

        const industrySatisfaction = (commercialSatisfaction + industrialSatisfaction) / 2;

        const daySec = INTERNAL_PLOT_BUILD_SEC;
        const daysPassed = Math.floor(gameSecondsFromStart / daySec);
        const protectionDays = 5;
        const transitionDays = 15;
        let timeFactor = 0;

        if (daysPassed >= protectionDays + transitionDays) {
            timeFactor = 1;
        } else if (daysPassed >= protectionDays) {
            const transitionProgress = (daysPassed - protectionDays) / transitionDays;
            timeFactor = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
        }

        residentialWill = Math.max(0, Math.min(100, Math.round(industrySatisfaction * timeFactor * 1.2)));
    }

    officeWill = 50;

    const willingnessData = [
        { id: 'workingResidential', value: residentialWill },
        { id: 'workingCommercial', value: commercialWill },
        { id: 'workingIndustrial', value: industrialWill },
        { id: 'workingOffice', value: officeWill }
    ];

    willingnessData.forEach(item => {
        const bar = document.getElementById(item.id);
        const value = document.getElementById(item.id + 'Value');
        if (bar && value) {
            bar.style.width = item.value + '%';
            value.textContent = item.value + '%';
        }
    });
}

function initClassWillingness() {
    updateClassWillingness();
}

function initEventListeners() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', handleKeyDown);
}

function tick() {
    const now = Date.now();
    const deltaRealSec = (now - lastTickRealMs) / 1000;
    lastTickRealMs = now;

    if (!gamePaused && currentTimeSpeed > 0) {
        gameSecondsFromStart += deltaRealSec * GAME_SECONDS_PER_REAL_SECOND_AT_1X * currentTimeSpeed;
    }

    let anyCompleted = false;
    strokes.forEach(road => {
        if (road.status === '建造中' && typeof road.buildStartGameSec === 'number') {
            const totalLen = polylineLength(roadToPolyline(road));
            const builtPerEnd = getRoadBuiltLengthPerEnd(road, gameSecondsFromStart);
            if (totalLen > 0 && builtPerEnd * 2 >= totalLen) {
                road.status = '开放';
                anyCompleted = true;
            }
        }
    });

    let buildingInProgress = false;
    strokes.forEach(road => {
        if (road.status === '建造中') buildingInProgress = true;
    });

    if (buildingInProgress) {
        redrawAll();
    }

    if (anyCompleted) {
        saveToStorage();
        redrawAll();
    }

    const deltaGameSec = (!gamePaused && currentTimeSpeed > 0)
        ? deltaRealSec * GAME_SECONDS_PER_REAL_SECOND_AT_1X * currentTimeSpeed
        : 0;
    let parcelProgressChanged = false;
    let parcelJustCompleted = false;

    const getDemandForParcel = (parcel) => {
        const type = parcel.parcelType || 'residential';
        switch (type) {
            case 'residential': return Math.max(0, residentialWill);
            case 'commercial': return Math.max(0, commercialWill);
            case 'industrial': return Math.max(0, industrialWill);
            case 'office': return Math.max(0, officeWill);
            default: return 50;
        }
    };

    const typeCount = {};
    for (const p of planningParcels) {
        const type = p.parcelType || p.type || 'residential';
        if (!typeCount[type]) typeCount[type] = 0;
        typeCount[type]++;
    }

    const BASE_AREA = 64 * 32;
    const BASE_TIME_SECONDS = 3 * 7 * 24 * 60 * 60;
    const TIME_PER_AREA = BASE_TIME_SECONDS / BASE_AREA;

    for (const parcel of planningParcels) {
        const n = getParcelPlotCount(parcel.name);
        if (n === 0) continue;
        if (typeof parcel.seed !== 'number') parcel.seed = Math.floor(Math.random() * 0xffffffff);
        if (typeof parcel.startedLotCount !== 'number') parcel.startedLotCount = 0;

        if (parcel.startedLotCount > 0 && !parcel.builtUpMarked) {
            const completedCount = internalPlots.filter(p =>
                p.parcelName === parcel.name && p.status === '开放'
            ).length;
            if (completedCount >= n) {
                const poly = (parcel.points && parcel.points.length >= 3)
                    ? parcel.points
                    : parcel.anchorIds.map(id => getAnchorById(id)).filter(Boolean);
                if (poly.length >= 3) {
                    markAsBuiltUp(poly);
                    parcel.builtUpMarked = true;
                    parcelJustCompleted = true;
                }
            }
        }

        const type = parcel.parcelType || parcel.type || 'residential';
        let demand = getDemandForParcel(parcel);

        let isFirstOfType = false;
        const sameTypeParcels = planningParcels.filter(p => (p.parcelType || p.type) === type);
        if (sameTypeParcels.length > 0) {
            const typeIndex = sameTypeParcels.indexOf(parcel);
            isFirstOfType = typeIndex === 0;
        }

        if (isFirstOfType && type === 'residential') {
            if (parcel.startedLotCount < n) {
                parcel.startedLotCount = n;
                parcelProgressChanged = true;
            }
            continue;
        }

        if (parcel.startedLotCount >= n) continue;

        let buildProbability = isFirstOfType ? 1 : (0.2 * (demand / 100));
        buildProbability = Math.max(0, Math.min(1, buildProbability));

        const randomValue = pseudoRandom(parcel.seed + parcel.startedLotCount + Math.floor(gameSecondsFromStart / 10));
        if (randomValue < buildProbability) {
            parcel.startedLotCount++;
            parcelProgressChanged = true;
        }
    }

    let plotStateChanged = parcelProgressChanged;

    const parcelToPlots = new Map();
    for (const plot of internalPlots) {
        if (!plot.parcelName) continue;
        if (!parcelToPlots.has(plot.parcelName)) parcelToPlots.set(plot.parcelName, []);
        parcelToPlots.get(plot.parcelName).push(plot);
    }

    const getAvgLotBuildTime = (parcelName) => {
        const plots = internalPlots.filter(p => p.parcelName === parcelName && p.area);
        if (plots.length === 0) return BASE_TIME_SECONDS;
        const totalArea = plots.reduce((sum, p) => sum + p.area, 0);
        return (totalArea / plots.length) * TIME_PER_AREA;
    };

    for (const [parcelName, list] of parcelToPlots) {
        const parcel = planningParcels.find(p => p.name === parcelName);
        if (!parcel) continue;
        const n = list.length;
        if (n === 0) continue;
        if (typeof parcel.seed !== 'number') parcel.seed = Math.floor(Math.random() * 0xffffffff);
        if (typeof parcel.startedLotCount !== 'number') parcel.startedLotCount = 0;

        const perm = seededPermutation(parcel.seed, n);
        const startedCount = Math.min(n, Math.max(0, parcel.startedLotCount));
        const avgLotBuildTime = getAvgLotBuildTime(parcelName);

        for (let i = 0; i < n; i++) {
            const plot = list[i];
            let buildOrder = -1;
            for (let k = 0; k < n; k++) {
                if (perm[k] === i) { buildOrder = k; break; }
            }

            let newStatus = plot.status;
            if (buildOrder < startedCount) {
                if (plot.status === 'idle') {
                    newStatus = '建造中';
                } else if (plot.status === '建造中' && plot.buildStartGameSec) {
                    if (gameSecondsFromStart - plot.buildStartGameSec >= avgLotBuildTime) {
                        newStatus = '开放';
                    }
                }
            } else {
                newStatus = 'idle';
            }

            if (plot.status !== newStatus) {
                plot.status = newStatus;
                if (newStatus === '建造中') {
                    plot.buildStartGameSec = gameSecondsFromStart;
                } else if (newStatus === '开放') {
                    plot.buildStartGameSec = gameSecondsFromStart - avgLotBuildTime;
                } else {
                    plot.buildStartGameSec = null;
                }
                plotStateChanged = true;
            }
        }
    }

    if (plotStateChanged || parcelJustCompleted) {
        saveToStorage();
        redrawAll();
    }

    updateBuildingBlink({
        points: [],
        currentX: 0,
        currentY: 0,
        drawMode: 'none',
        drawPreview: function () { },
        redrawAll: redrawAll
    });

    updateClassWillingness();

    requestAnimationFrame(tick);
}

function pseudoRandom(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    return ((a * seed + c) % m) / m;
}

function init() {
    const debugEl = document.getElementById('map-debug-js');
    if (debugEl) debugEl.innerHTML = 'Initializing...';

    if (!initDOMElements()) {
        console.error('Failed to initialize DOM elements');
        if (debugEl) debugEl.innerHTML = 'DOM init failed';
        return;
    }

    if (debugEl) debugEl.innerHTML = 'DOM init succeeded';

    resizeCanvas();
    initEventListeners();
    initClassWillingness();

    // 优先从localStorage加载道路模板
    try {
        const storedPresets = localStorage.getItem('maps_road_presets');
        if (storedPresets) {
            const parsed = JSON.parse(storedPresets);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                lanePresets = { ...parsed };
                if (!lanePresets[currentLanePreset]) currentLanePreset = Object.keys(lanePresets)[0];
            }
        }
    } catch (e) { console.warn('读取本地道路模板失败:', e); }

    Promise.all([
        fetch('./template/road.json', { cache: 'no-cache' }).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch('./template/Planningarea.json', { cache: 'no-cache' }).then(res => res.ok ? res.json() : null).catch(() => null)
    ]).then(async ([roadPresets, parcelPresets]) => {
        // 如果localStorage已有模板，优先使用；否则使用静态文件
        if ((!lanePresets || Object.keys(lanePresets).length === 0) &&
            roadPresets && typeof roadPresets === 'object' && Object.keys(roadPresets).length > 0) {
            lanePresets = { ...roadPresets };
            if (!lanePresets[currentLanePreset]) currentLanePreset = Object.keys(lanePresets)[0];
        }
        if (parcelPresets && typeof parcelPresets === 'object' && Object.keys(parcelPresets).length > 0) {
            parcelTypePresets = { ...parcelPresets };
            if (!parcelTypePresets[currentParcelType]) currentParcelType = Object.keys(parcelTypePresets)[0];
        }
        await loadFromStorage();
        redrawAll();
    }).catch(async () => {
        await loadFromStorage();
        redrawAll();
    });

    requestAnimationFrame(tick);
}

window.addEventListener('load', init);
