import { simplifyPolygon } from "./simplify.js";
import { removeSharpCorners } from "./removeSharpCorners.js";
import { catmullRomToPolygon } from "./catmullRom.js";
export const DEFAULT_SMOOTH_OPTIONS = {
    enabled: true,
    epsilon: 2.0,
    splineSegments: 8,
    angleFilter: true,
    minAngle: 150,
};
export function smoothPolygon(rawPoly, options = DEFAULT_SMOOTH_OPTIONS) {
    if (!options.enabled || rawPoly.length < 4)
        return [...rawPoly];
    let poly = simplifyPolygon(rawPoly, options.epsilon);
    if (options.angleFilter) {
        poly = removeSharpCorners(poly, options.minAngle);
    }
    poly = catmullRomToPolygon(poly, options.splineSegments);
    poly = simplifyPolygon(poly, options.epsilon * 0.5);
    return poly;
}
//# sourceMappingURL=smoothPolygon.js.map