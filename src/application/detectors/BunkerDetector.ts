export class BunkerDetector implements FeatureDetector {
    public readonly featureType = FeatureType.Bunker;
    private readonly openCv: OpenCvAdapter;

    public constructor(openCv: OpenCvAdapter) {
        this.openCv = openCv;
    }

    public detect(request: DetectionRequest): readonly Feature[] {
        if (request.seed !== undefined) {
            const boundaryPoints = this.openCv.detectBunkerBoundary(
                request.image,
                request.seed,
            );

            if (boundaryPoints.length < 3) {
                return [];
            }

            const worldPoints = boundaryPoints.map(
                (point) =>
                    new WorldPoint(
                        point.x * request.metresPerPixel,
                        point.y * request.metresPerPixel,
                    ),
            );

            return [
                new Feature(FeatureType.Bunker, new Polygon(worldPoints), 0.5),
            ];
        }

        return [];
    }
}