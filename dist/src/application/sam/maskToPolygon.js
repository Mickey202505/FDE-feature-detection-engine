"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskToPolygon = maskToPolygon;
function maskToPolygon(mask, threshold = 0.5) {
    const w = mask.width;
    const h = mask.height;
    const data = mask.data;
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
            const idx = (y * w + x) * 4;
            if (data[idx] > threshold * 255) {
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
        }
    }
    if (minX > maxX || minY > maxY)
        return [];
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const binary = new Uint8Array(cropW * cropH);
    for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
            const idx = (y * w + x) * 4;
            binary[(y - minY) * cropW + (x - minX)] =
                data[idx] > threshold * 255 ? 1 : 0;
        }
    }
    const contour = traceContour(binary, cropW, cropH);
    return contour.map((p) => ({ x: p.x + minX, y: p.y + minY }));
}
function traceContour(binary, w, h) {
    let startX = -1;
    let startY = -1;
    for (let y = 0; y < h && startX < 0; y += 1) {
        for (let x = 0; x < w; x += 1) {
            if (binary[y * w + x] === 1 && isEdge(binary, w, h, x, y)) {
                startX = x;
                startY = y;
                break;
            }
        }
    }
    if (startX < 0)
        return [];
    const contour = [];
    let cx = startX;
    let cy = startY;
    let dir = 0;
    const dirs = [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
    ];
    const maxIter = w * h * 4;
    let iter = 0;
    do {
        contour.push({ x: cx, y: cy });
        let found = false;
        for (let i = 0; i < 8; i += 1) {
            const nd = (dir + i) % 8;
            const [dx, dy] = dirs[nd];
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 &&
                nx < w &&
                ny >= 0 &&
                ny < h &&
                binary[ny * w + nx] === 1 &&
                isEdge(binary, w, h, nx, ny)) {
                cx = nx;
                cy = ny;
                dir = (nd + 5) % 8;
                found = true;
                break;
            }
        }
        if (!found)
            break;
        iter += 1;
    } while ((cx !== startX || cy !== startY) && iter < maxIter);
    return contour;
}
function isEdge(binary, w, h, x, y) {
    const dirs = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    ];
    for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h)
            return true;
        if (binary[ny * w + nx] === 0)
            return true;
    }
    return false;
}
//# sourceMappingURL=maskToPolygon.js.map