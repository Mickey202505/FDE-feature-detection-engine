export class DetectionPipeline {
    detectors;
    constructor(detectors) {
        this.detectors = [...detectors];
    }
    detect(request) {
        const features = [];
        for (const detector of this.detectors) {
            if (detector.featureType !== request.featureType) {
                continue;
            }
            features.push(...detector.detect(request));
        }
        return features;
    }
}
//# sourceMappingURL=DetectionPipeline.js.map