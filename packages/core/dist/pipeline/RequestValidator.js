export class RequestValidator {
    validate(request) {
        if (!request) {
            throw new Error("Detection request is required.");
        }
    }
}
//# sourceMappingURL=RequestValidator.js.map