import { WorldPoint } from "./WorldPoint";

export class Polygon {
    private readonly _points: readonly WorldPoint[];

    public constructor(points: readonly WorldPoint[]) {
        if (points.length < 3) {
            throw new Error(
                "A polygon must contain at least three points."
            );
        }

        const first = points[0];
        const last = points[points.length - 1];

        if (first === undefined || last === undefined) {
            throw new Error(
                "A polygon must contain at least three points."
            );
        }

        const normalisedPoints = [...points];

        if (first.x !== last.x || first.y !== last.y) {
            normalisedPoints.push(first);
        }

        this._points = normalisedPoints;
    }

    public get points(): readonly WorldPoint[] {
        return this._points;
    }
}