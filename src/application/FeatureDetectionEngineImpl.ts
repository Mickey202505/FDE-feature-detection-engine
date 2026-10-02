import type { DetectionRequest } from "../api/DetectionRequest.js";
import type { DetectionResult } from "../api/DetectionResult.js";
import { GolfGreenDetector } from "./detectors/GolfGreenDetector.js";
import { BunkerDetector } from "./detectors/BunkerDetector.js";
import { DetectionPipeline } from "./pipeline/DetectionPipeline.js";
import { OpenCvJsAdapter } from "./opencv/OpenCvJsAdapter.js";
import type { OpenCvRuntime } from "./opencv/OpenCvTypes.js";

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