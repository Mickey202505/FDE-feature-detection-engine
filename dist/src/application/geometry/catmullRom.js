"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catmullRomToPolygon = catmullRomToPolygon;
function catmullRomToPolygon(points, segments = 8) {
    if (points.length < 3)
        return [...points];
    const result = [];
    const n = points.length;
    for (let i = 0; i < n; i += 1) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];
        for (let s = 0; s <= segments; s += 1) {
            const t = s / segments;
            const t2 = t * t;
            const t3 = t2 * t;
            const x = 0.5 *
                (2 * p1.x +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
            const y = 0.5 *
                (2 * p1.y +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
            if (i === 0 && s === 0)
                continue;
            result.push({ x, y });
        }
    }
    return result;
}
//# sourceMappingURL=catmullRom.js.map