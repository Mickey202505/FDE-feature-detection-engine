import type {
  DetectionRequest,
  DetectionResult,
} from "../../domain/src";

import { DetectionPipeline } from "./pipeline/DetectionPipeline";

/**
 * Main Feature Detection Engine.
 */
export class FeatureDetectionEngine {
  private readonly pipeline = new DetectionPipeline();

  async detect(
    request: DetectionRequest,
  ): Promise<DetectionResult> {
    return this.pipeline.run(request);
  }
}