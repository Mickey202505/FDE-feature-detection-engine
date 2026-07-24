import type { Geometry } from "./Geometry";
import { GolfFeatureType } from "./GolfFeatureType";

export interface GolfFeature {
  id: string;
  type: GolfFeatureType;
  confidence: number;
  geometry: Geometry;
}