"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyPolygon = simplifyPolygon;
function simplifyPolygon(points, epsilon) {
    if (points.length < 3)
        return [...points];
    let maxDist = 0;
    let idx = 0;
    const first = points[0];
    const last = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i += 1) {
        const d = perpendicularDistance(points[i], first, last);
        if (d > maxDist) {
            maxDist = d;
            idx = i;
        }
    }
    if (maxDist > epsilon) {
        const left = simplifyPolygon(points.slice(0, idx + 1), epsilon);
        const right = simplifyPolygon(points.slice(idx), epsilon);
        return left.slice(0, -1).concat(right);
    }
    return [first, last];
}
function perpendicularDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) {
        const ex = p.x - a.x;
        const ey = p.y - a.y;
        return Math.sqrt(ex * ex + ey * ey);
    }
    return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}
//# sourceMappingURL=simplify.js.map