import type { Geometry } from "../../../domain/src";

export class PolygonBuilder {
  build(_: unknown): Geometry {
    return {
      points: [],
    };
  }
}