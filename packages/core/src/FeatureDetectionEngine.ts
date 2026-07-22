import type {
  DetectionRequest,
  DetectionResult,
} from "@feature-detection-engine/domain";

/**
 * The main entry point for the Feature Detection Engine SDK.
 */
export class FeatureDetectionEngine {
  /**
   * Creates a new Feature Detection Engine.
   */
  constructor() {}

  /**
   * Detects a feature within an image.
   */
  async detect(
    request: DetectionRequest,
  ): Promise<DetectionResult> {
    void request;

    return {
      geometry: [],
      confidence: 0,
    };
  }
}