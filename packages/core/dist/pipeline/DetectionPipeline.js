import { RequestValidator } from "./RequestValidator";
export class DetectionPipeline {
    validator = new RequestValidator();
    async run(request) {
        this.validator.validate(request);
        return {
            geometry: [],
            confidence: 0,
        };
    }
}
//# sourceMappingURL=DetectionPipeline.js.map