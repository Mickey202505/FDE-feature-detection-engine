"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const smoothPolygon_1 = require("../../src/application/geometry/smoothPolygon");
function makeCircle(cx, cy, r, count) {
    const pts = [];
    for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
}
(0, vitest_1.describe)("smoothPolygon", () => {
    (0, vitest_1.it)("returns the input unchanged when disabled", () => {
        const pts = makeCircle(100, 100, 50, 64);
        const out = (0, smoothPolygon_1.smoothPolygon)(pts, { ...smoothPolygon_1.DEFAULT_SMOOTH_OPTIONS, enabled: false });
        (0, vitest_1.expect)(out).toEqual(pts);
    });
    (0, vitest_1.it)("returns the input unchanged for 3 or fewer points", () => {
        const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }];
        const out = (0, smoothPolygon_1.smoothPolygon)(pts);
        (0, vitest_1.expect)(out).toEqual(pts);
    });
    (0, vitest_1.it)("produces a closed-ish polygon with no NaN", () => {
        const pts = makeCircle(100, 100, 50, 32);
        const out = (0, smoothPolygon_1.smoothPolygon)(pts);
        (0, vitest_1.expect)(out.length).toBeGreaterThan(0);
        for (const p of out) {
            (0, vitest_1.expect)(Number.isFinite(p.x)).toBe(true);
            (0, vitest_1.expect)(Number.isFinite(p.y)).toBe(true);
        }
    });
    (0, vitest_1.it)("keeps the smoothed polygon roughly inside the same bounds", () => {
        const pts = makeCircle(100, 100, 50, 32);
        const out = (0, smoothPolygon_1.smoothPolygon)(pts);
        for (const p of out) {
            (0, vitest_1.expect)(p.x).toBeGreaterThan(40);
            (0, vitest_1.expect)(p.x).toBeLessThan(160);
            (0, vitest_1.expect)(p.y).toBeGreaterThan(40);
            (0, vitest_1.expect)(p.y).toBeLessThan(160);
        }
    });
});
//# sourceMappingURL=SmoothPolygon.test.js.map