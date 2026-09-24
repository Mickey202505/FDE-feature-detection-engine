import type { DetectionRequest } from "../api/DetectionRequest";
import type { DetectionResult } from "../api/DetectionResult";
import { GolfGreenDetector } from "./detectors/GolfGreenDetector";
import { BunkerDetector } from "./detectors/BunkerDetector";
import { DetectionPipeline } from "./pipeline/DetectionPipeline";
import { OpenCvJsAdapter } from "./opencv/OpenCvJsAdapter";
import type { OpenCvRuntime } from "./opencv/OpenCvTypes";

export class FeatureDetectionEngineImpl {
    private readonly pipeline: DetectionPipeline;

    public constructor(cv: OpenCvRuntime) {
        const adapter = new OpenCvJsAdapter(cv);

        this.pipeline = new DetectionPipeline([
            new GolfGreenDetector(adapter),
            new BunkerDetector(adapter)
        ]);
    }

    public detect(
        request: DetectionRequest
    ): DetectionResult {
        return {
            features: this.pipeline.detect(request)
        };
    }
}