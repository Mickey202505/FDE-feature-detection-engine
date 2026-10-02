export class Polygon {
    _points;
    constructor(points) {
        if (points.length < 3) {
            throw new Error("A polygon must contain at least three points.");
        }
        const first = points[0];
        const last = points[points.length - 1];
        if (first === undefined || last === undefined) {
            throw new Error("A polygon must contain at least three points.");
        }
        const normalisedPoints = [...points];
        if (first.x !== last.x || first.y !== last.y) {
            normalisedPoints.push(first);
        }
        this._points = normalisedPoints;
    }
    get points() {
        return this._points;
    }
}
//# sourceMappingURL=Polygon.js.map