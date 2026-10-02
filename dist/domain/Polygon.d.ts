import { WorldPoint } from "./WorldPoint";
export declare class Polygon {
    private readonly _points;
    constructor(points: readonly WorldPoint[]);
    get points(): readonly WorldPoint[];
}
