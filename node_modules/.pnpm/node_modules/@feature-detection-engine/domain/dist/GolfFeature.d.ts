import type { Geometry } from "./Geometry";
import type { CourseCoordinate } from "./CourseCoordinate";
import { GolfFeatureType } from "./GolfFeatureType";
export interface GolfFeature {
    id: string;
    type: GolfFeatureType;
    confidence: number;
    /**
     * Reference location of the feature.
     */
    location: CourseCoordinate;
    geometry: Geometry;
}
//# sourceMappingURL=GolfFeature.d.ts.map