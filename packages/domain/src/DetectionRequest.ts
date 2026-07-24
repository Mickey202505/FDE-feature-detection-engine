import type { GolfFeature } from "./GolfFeature";

export interface DetectionResult {
  features: GolfFeature[];
  confidence: number;
}