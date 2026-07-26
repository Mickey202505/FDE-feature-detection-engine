import type {
  DetectionRequest,
  DetectionResult,
} from "../../../domain/src";

import { RequestValidator } from "./RequestValidator";

export class DetectionPipeline {
  private readonly validator = new RequestValidator();

  async run(
    request: DetectionRequest,
  ): Promise<DetectionResult> {
    this.validator.validate(request);

    return {
      geometry: [],
      confidence: 0,
    };
  }
}