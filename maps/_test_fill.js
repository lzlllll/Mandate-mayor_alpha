const tilePx = 16;
const cols = 20, rows = 20;
function make() {
    const a = [];
    for (let y = 0; y < rows; y++) {
        const r = [];
        for (let x = 0; x < cols; x++) r.push(0);
        a.push(r);
    }
    return a;
}
let tiles = make();

function fillPolygon(points, value) {
    if (points.length < 3) return 0;
    const poly = points.slice();
    if (poly.length > 1 && poly[0].x === poly[poly.length - 1].x && poly[0].y === poly[poly.length - 1].y) poly.pop();
    if (poly.length < 3) return 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of poly) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    const startCol = Math.max(0, Math.floor(minX / tilePx));
    const endCol = Math.min(cols - 1, Math.floor((maxX - 1e-6) / tilePx));
    const startRow = Math.max(0, Math.floor(minY / tilePx));
    const endRow = Math.min(rows - 1, Math.floor((maxY - 1e-6) / tilePx));
    const n = poly.length;
    let changed = 0;

    for (let row = startRow; row <= endRow; row++) {
        const yLine = (row + 0.5) * tilePx;
        const xHits = [];
        for (let i = 0; i < n; i++) {
            const a = poly[i], b = poly[(i + 1) % n];
            if ((a.y <= yLine && b.y > yLine) || (a.y > yLine && b.y <= yLine)) {
                const t = (yLine - a.y) / (b.y - a.y);
                xHits.push(a.x + t * (b.x - a.x));
            }
        }
        xHits.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xHits.length; i += 2) {
            const x0 = xHits[i], x1 = xHits[i + 1];
            const firstCol = Math.max(startCol, Math.ceil(x0 / tilePx - 0.5 - 1e-9));
            const lastCol = Math.min(endCol, Math.floor(x1 / tilePx - 0.5 + 1e-9));
            for (let col = firstCol; col <= lastCol; col++) {
                if (tiles[row][col] !== value) { tiles[row][col] = value; changed++; }
            }
        }
    }
    return changed;
}

// Test 1: axis-aligned square from (4*16,4*16) to (14*16,14*16)
// Row 4: yLine = 4.5*16 = 72. Square edges y=64 (top) and y=224 (bottom). y=72 is between them
// For row 4, edges crossing: left edge x=64, right edge x=224.
// firstCol: col >= 64/16 - 0.5 = 3.5, col >= ceil(3.5 - eps) = 4. OK.
// lastCol: col <= 224/16 - 0.5 = 13.5, floor(13.5 + eps) = 13. OK.
// Same for rows 4..13. Expected = 10 rows * 10 cols = 100.
console.log('--- Test 1: 10x10 axis-aligned square (tiles 4..13) ---');
const changed = fillPolygon([
    { x: 4 * tilePx, y: 4 * tilePx },
    { x: 14 * tilePx, y: 4 * tilePx },
    { x: 14 * tilePx, y: 14 * tilePx },
    { x: 4 * tilePx, y: 14 * tilePx }
], 1);
let c = 0; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (tiles[y][x] === 1) c++;
console.log('changed=', changed, 'land=', c, 'expected=100, OK=', c === 100);

// Test 2: right triangle (0,0)-(20*16,0)-(0,20*16)
tiles = make();
console.log('\n--- Test 2: right triangle (0,0)-(320,0)-(0,320) ---');
fillPolygon([{ x: 0, y: 0 }, { x: 20 * tilePx, y: 0 }, { x: 0, y: 20 * tilePx }], 1);
let t = 0;
for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (tiles[y][x] === 1) t++;
// For row r: yLine = (r+0.5)*16. Hypotenuse x+y=320. Intersection x=320-(r+0.5)*16 = (20-r-0.5)*16.
// col center (c+0.5)*16 <= (20-r-0.5)*16  => c <= 19 - r. Tiles 0..19-r inclusive = (20-r) tiles.
// Sum from r=0..19 of (20-r) = 20+19+...+1 = 210
console.log('tri actual=', t, 'expected=210, OK=', t === 210);
for (let y = 0; y < rows; y++) {
    let l = '';
    for (let x = 0; x < cols; x++) l += tiles[y][x] === 1 ? '#' : '.';
    console.log(l);
}

// Test 3: diamond shape in center
tiles = make();
console.log('\n--- Test 3: diamond center=(10,10) radius=6*16 in world units ---');
const cx = 10 * tilePx, cy = 10 * tilePx, radius = 6 * tilePx;
fillPolygon([
    { x: cx, y: cy - radius },
    { x: cx + radius, y: cy },
    { x: cx, y: cy + radius },
    { x: cx - radius, y: cy }
], 1);
let d = 0;
for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (tiles[y][x] === 1) d++;
console.log('diamond count=', d);
for (let y = 0; y < rows; y++) {
    let l = '';
    for (let x = 0; x < cols; x++) l += tiles[y][x] === 1 ? '#' : '.';
    console.log(l);
}
