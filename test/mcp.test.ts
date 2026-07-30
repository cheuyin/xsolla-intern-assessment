import { describe, expect, it } from "vitest";
import { toReviewRequest } from "../src/mcp.js";

describe("toReviewRequest", () => {
  it("maps repo_path to repositoryPath", () => {
    expect(
      toReviewRequest({
        repo_path: "/work/sample",
      }),
    ).toEqual({
      repositoryPath: "/work/sample",
      baseRef: undefined,
      validationCommands: undefined,
    });
  });

  it("passes through optional MCP fields", () => {
    expect(
      toReviewRequest({
        repo_path: "/work/sample",
        baseRef: "main",
        validationCommands: ["npm test"],
      }),
    ).toEqual({
      repositoryPath: "/work/sample",
      baseRef: "main",
      validationCommands: ["npm test"],
    });
  });
});
