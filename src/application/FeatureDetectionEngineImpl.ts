import type { DetectionRequest } from "../api/DetectionRequest";
import type { DetectionResult } from "../api/DetectionResult";
import { GolfGreenDetector } from "./opencv/detectors/GolfGreenDetector";
import { DetectionPipeline } from "./pipeline/DetectionPipeline";
import { OpenCvJsAdapter } from "./opencv/OpenCvJsAdapter";
import type { OpenCvRuntime } from "./opencv/OpenCvTypes";

export class FeatureDetectionEngineImpl {
    private readonly pipeline: DetectionPipeline;

    public constructor(cv: OpenCvRuntime) {
        this.pipeline = new DetectionPipeline([
            new GolfGreenDetector(
                new OpenCvJsAdapter(cv)
            )
        ]);
    }

    public detect(request: DetectionRequest): DetectionResult {
        return {
            features: this.pipeline.detect(request)
        };
    }
}