import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertGitRepository } from "../src/git.js";

describe("assertGitRepository", () => {
  it("throws when path does not exist", () => {
    expect(() => assertGitRepository("/path/that/does/not/exist")).toThrow(
      "Repository path does not exist",
    );
  });

  it("throws when path is not a git repository", () => {
    const dir = mkdtempSync(join(tmpdir(), "inspector-"));
    try {
      expect(() => assertGitRepository(dir)).toThrow("Not a git repository");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("accepts the current repository", () => {
    expect(() => assertGitRepository(process.cwd())).not.toThrow();
  });
});
