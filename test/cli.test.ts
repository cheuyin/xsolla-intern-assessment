import { describe, expect, it } from "vitest";
import { parseArgs, resolveOutputPath } from "../src/cli-args.js";

describe("resolveOutputPath", () => {
  it("uses --output when provided", () => {
    expect(resolveOutputPath({ outputPath: "/tmp/custom.md", format: "json" })).toBe("/tmp/custom.md");
  });

  it("defaults to markdown report path", () => {
    expect(resolveOutputPath({})).toBe("review-report.md");
  });

  it("defaults to json report path when format is json", () => {
    expect(resolveOutputPath({ format: "json" })).toBe("review-report.json");
  });
});

describe("parseArgs", () => {
  it("parses --output", () => {
    expect(
      parseArgs(["review", "--repo", ".", "--output", "/tmp/report.md", "--validate", "npm test"]),
    ).toEqual({
      command: "review",
      repositoryPath: ".",
      outputPath: "/tmp/report.md",
      validations: ["npm test"],
    });
  });
});
