"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const exportSvg_1 = require("../../src/application/export/exportSvg");
const SQUARE = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
];
(0, vitest_1.describe)("exportSvg", () => {
    (0, vitest_1.it)("throws when fewer than 3 points", () => {
        (0, vitest_1.expect)(() => (0, exportSvg_1.exportSvg)({
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            metadata: {
                courseName: "Test",
                holeNumber: 1,
                featureType: "green",
                featureNumber: 1,
            },
        })).toThrow();
    });
    (0, vitest_1.it)("includes required data attributes", () => {
        const svg = (0, exportSvg_1.exportSvg)({
            points: SQUARE,
            metadata: {
                courseName: "St Andrews",
                holeNumber: 7,
                featureType: "bunker",
                featureNumber: 2,
            },
        });
        (0, vitest_1.expect)(svg).toContain('data-course="St Andrews"');
        (0, vitest_1.expect)(svg).toContain('data-hole="7"');
        (0, vitest_1.expect)(svg).toContain('data-feature-type="bunker"');
        (0, vitest_1.expect)(svg).toContain('data-feature-number="2"');
        (0, vitest_1.expect)(svg).toContain('data-coordinate-space="world"');
    });
    (0, vitest_1.it)("emits a polygon with 4 points for a square", () => {
        const svg = (0, exportSvg_1.exportSvg)({
            points: SQUARE,
            metadata: {
                courseName: "Test",
                holeNumber: 1,
                featureType: "green",
                featureNumber: 1,
            },
        });
        const match = svg.match(/<polygon points="([^"]+)"/);
        (0, vitest_1.expect)(match).not.toBeNull();
        const coords = match[1].split(" ");
        (0, vitest_1.expect)(coords.length).toBe(4);
    });
    (0, vitest_1.it)("uses the identity transform by default", () => {
        const svg = (0, exportSvg_1.exportSvg)({
            points: SQUARE,
            metadata: {
                courseName: "Test",
                holeNumber: 1,
                featureType: "green",
                featureNumber: 1,
            },
        });
        // First point should be "0,0" under identity
        (0, vitest_1.expect)(svg).toContain("0,0");
    });
    (0, vitest_1.it)("applies a custom transform", () => {
        const svg = (0, exportSvg_1.exportSvg)({
            points: SQUARE,
            metadata: {
                courseName: "Test",
                holeNumber: 1,
                featureType: "green",
                featureNumber: 1,
            },
            transform: {
                toWorld: (p) => ({ x: p.x * 2, y: p.y * 2 }),
            },
        });
        // First point should now be "0,0" still, but second should be "200,0"
        (0, vitest_1.expect)(svg).toContain("200,0");
    });
    (0, vitest_1.it)("escapes XML-special characters in course name", () => {
        const svg = (0, exportSvg_1.exportSvg)({
            points: SQUARE,
            metadata: {
                courseName: 'Links "at" <Sunset>',
                holeNumber: 1,
                featureType: "green",
                featureNumber: 1,
            },
        });
        (0, vitest_1.expect)(svg).toContain("&quot;");
        (0, vitest_1.expect)(svg).toContain("&lt;Sunset&gt;");
        (0, vitest_1.expect)(svg).not.toContain('"at"');
    });
});
//# sourceMappingURL=ExportSvg.test.js.map