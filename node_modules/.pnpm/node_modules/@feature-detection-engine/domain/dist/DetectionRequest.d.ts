import type { CourseCoordinate } from "./CourseCoordinate";
import type { GolfFeatureType } from "./GolfFeatureType";
import type { ImageSource } from "./ImageSource";
/**
 * Represents a request to detect a single golf feature.
 */
export interface DetectionRequest {
    readonly image: ImageSource;
    readonly featureType: GolfFeatureType;
    readonly location: CourseCoordinate;
}
//# sourceMappingURL=DetectionRequest.d.ts.map