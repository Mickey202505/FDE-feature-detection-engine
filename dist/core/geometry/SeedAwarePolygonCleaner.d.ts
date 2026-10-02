export interface SeedAwarePolygonPoint {
    readonly x: number;
    readonly y: number;
}
export declare class SeedAwarePolygonCleaner {
    clean(points: readonly SeedAwarePolygonPoint[], seed: SeedAwarePolygonPoint): SeedAwarePolygonPoint[];
    private isSuspiciousVertex;
    private calculateTurningAngle;
    private isValidRemoval;
    private hasDuplicatePoints;
    private isPointInsidePolygon;
    private calculatePolygonArea;
    private distance;
}
