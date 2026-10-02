import type { Feature } from "../domain/Feature.js";
export interface DetectionResult {
    readonly features: readonly Feature[];
}
