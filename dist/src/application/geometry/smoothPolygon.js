"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SMOOTH_OPTIONS = void 0;
exports.smoothPolygon = smoothPolygon;
const simplify_1 = require("./simplify");
const removeSharpCorners_1 = require("./removeSharpCorners");
const catmullRom_1 = require("./catmullRom");
exports.DEFAULT_SMOOTH_OPTIONS = {
    enabled: true,
    epsilon: 2.0,
    splineSegments: 8,
    angleFilter: true,
    minAngle: 150,
};
function smoothPolygon(rawPoly, options = exports.DEFAULT_SMOOTH_OPTIONS) {
    if (!options.enabled || rawPoly.length < 4)
        return [...rawPoly];
    let poly = (0, simplify_1.simplifyPolygon)(rawPoly, options.epsilon);
    if (options.angleFilter) {
        poly = (0, removeSharpCorners_1.removeSharpCorners)(poly, options.minAngle);
    }
    poly = (0, catmullRom_1.catmullRomToPolygon)(poly, options.splineSegments);
    poly = (0, simplify_1.simplifyPolygon)(poly, options.epsilon * 0.5);
    return poly;
}
//# sourceMappingURL=smoothPolygon.js.map