import type { Point } from "./Point";

/**
 * Represents editable geometry returned by the detection engine.
 */
export interface Geometry {
  /**
   * Ordered collection of points defining the geometry.
   */
  readonly points: readonly Point[];
}