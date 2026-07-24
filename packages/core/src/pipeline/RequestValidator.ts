import type { DetectionRequest } from "../../../domain/src";

export class RequestValidator {
  validate(request: DetectionRequest): void {
    if (!request) {
      throw new Error("Detection request is required.");
    }
  }
}