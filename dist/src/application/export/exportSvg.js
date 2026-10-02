"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTITY_TRANSFORM = void 0;
exports.exportSvg = exportSvg;
exports.IDENTITY_TRANSFORM = {
    toWorld: (p) => ({ x: p.x, y: p.y }),
};
function exportSvg(options) {
    const { points, metadata, transform = exports.IDENTITY_TRANSFORM, padding = 2, strokeWidth = 0.25, } = options;
    if (points.length < 3) {
        throw new Error("At least 3 points are required to build a polygon.");
    }
    const worldPoints = points.map((p) => transform.toWorld(p));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of worldPoints) {
        if (p.x < minX)
            minX = p.x;
        if (p.x > maxX)
            maxX = p.x;
        if (p.y < minY)
            minY = p.y;
        if (p.y > maxY)
            maxY = p.y;
    }
    const vbX = minX - padding;
    const vbY = minY - padding;
    const vbW = maxX - minX + padding * 2;
    const vbH = maxY - minY + padding * 2;
    const pointsAttr = worldPoints
        .map((p) => `${r(p.x)},${r(p.y)}`)
        .join(" ");
    const esc = (s) => s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${r(vbX)} ${r(vbY)} ${r(vbW)} ${r(vbH)}"
     data-course="${esc(metadata.courseName)}"
     data-hole="${metadata.holeNumber}"
     data-feature-type="${metadata.featureType}"
     data-feature-number="${metadata.featureNumber}"
     data-coordinate-space="world">
  <polygon points="${pointsAttr}"
           fill="none"
           stroke="black"
           stroke-width="${r(strokeWidth)}"
           stroke-linejoin="round" />
</svg>
`;
}
function r(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=exportSvg.js.map