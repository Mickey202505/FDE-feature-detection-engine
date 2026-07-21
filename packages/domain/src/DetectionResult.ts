import type { Geometry } from "./Geometry";

/**
 * Represents the result of a feature detection operation.
 */
export interface DetectionResult {
  /**
   * The detected geometry.
   */
  readonly geometry: readonly Geometry[];

  /**
   * Confidence score between 0.0 and 1.0.
   */
  readonly confidence: number;
}