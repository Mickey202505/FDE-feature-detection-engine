import { describe, expect, it } from "vitest";

import { RequestValidator } from "../src/pipeline/RequestValidator";

describe("RequestValidator", () => {
  it("throws when request is undefined", () => {
    const validator = new RequestValidator();

    expect(() =>
      validator.validate(undefined as never),
    ).toThrow();
  });
});