"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContourToPolygon = void 0;
const Polygon_1 = require("../domain/Polygon");
const WorldPoint_1 = require("../domain/WorldPoint");
class ContourToPolygon {
    static convert(contour, metresPerPixel) {
        if (metresPerPixel <= 0) {
            throw new Error("metresPerPixel must be greater than zero.");
        }
        if (contour.length < 3) {
            throw new Error("A contour must contain at least three points.");
        }
        const worldPoints = contour.map((point) => new WorldPoint_1.WorldPoint(point.x * metresPerPixel, point.y * metresPerPixel));
        return new Polygon_1.Polygon(worldPoints);
    }
}
exports.ContourToPolygon = ContourToPolygon;
//# sourceMappingURL=ContourToPolygon.js.map