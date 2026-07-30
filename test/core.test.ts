import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/git.js", () => ({
  assertGitRepository: vi.fn(),
  changedFiles: vi.fn(),
}));

vi.mock("../src/validation.js", () => ({
  runValidations: vi.fn(),
}));

import { reviewRepository } from "../src/core.js";
import { assertGitRepository, changedFiles } from "../src/git.js";
import { runValidations } from "../src/validation.js";

const assertGitRepositoryMock = vi.mocked(assertGitRepository);
const changedFilesMock = vi.mocked(changedFiles);
const runValidationsMock = vi.mocked(runValidations);

describe("reviewRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    changedFilesMock.mockReturnValue([{ path: "src/foo.ts", status: "modified" }]);
    runValidationsMock.mockResolvedValue([{ command: "npm test", status: "passed", output: "ok" }]);
  });

  it("orchestrates git inspection, validation, and markdown reporting", async () => {
    const result = await reviewRepository({
      repositoryPath: "/work/sample",
      validationCommands: ["npm test"],
    });

    expect(assertGitRepositoryMock).toHaveBeenCalledWith("/work/sample");
    expect(changedFilesMock).toHaveBeenCalledWith("/work/sample", undefined);
    expect(runValidationsMock).toHaveBeenCalledWith(["npm test"], "/work/sample");
    expect(result.validationResults).toEqual([
      { command: "npm test", status: "passed", output: "ok" },
    ]);
    expect(result.report).toContain("src/foo.ts (modified)");
    expect(result.report).toContain("### npm test (passed)");
  });

  it("returns json when format is json", async () => {
    const result = await reviewRepository({
      repositoryPath: "/work/sample",
      format: "json",
    });

    expect(JSON.parse(result.report)).toEqual({
      repositoryPath: "/work/sample",
      changedFiles: [{ path: "src/foo.ts", status: "modified" }],
      validationResults: [{ command: "npm test", status: "passed", output: "ok" }],
    });
  });

  it("returns failed validation results without throwing", async () => {
    runValidationsMock.mockResolvedValue([
      { command: "false", status: "failed", output: "Command failed: false" },
    ]);

    const result = await reviewRepository({
      repositoryPath: "/work/sample",
      validationCommands: ["false"],
    });

    expect(result.validationResults[0]?.status).toBe("failed");
    expect(result.report).toContain("### false (failed)");
  });
});
