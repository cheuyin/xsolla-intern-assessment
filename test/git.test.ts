import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertGitRepository, resolveDefaultBaseRef } from "../src/git.js";

describe("resolveDefaultBaseRef", () => {
  it("uses origin/HEAD when available", () => {
    const baseRef = resolveDefaultBaseRef("/repo", (_repositoryPath, args) => {
      if (args[0] === "symbolic-ref") {
        return "refs/remotes/origin/develop";
      }
      throw new Error(`unexpected git call: ${args.join(" ")}`);
    });

    expect(baseRef).toBe("develop");
  });

  it("falls back to main when origin/HEAD is unavailable", () => {
    const baseRef = resolveDefaultBaseRef("/repo", (_repositoryPath, args) => {
      if (args[0] === "symbolic-ref") {
        throw new Error("no origin");
      }
      if (args[0] === "rev-parse" && args[2] === "main") {
        return "abc123";
      }
      throw new Error(`unexpected git call: ${args.join(" ")}`);
    });

    expect(baseRef).toBe("main");
  });

  it("falls back to master when main is unavailable", () => {
    const baseRef = resolveDefaultBaseRef("/repo", (_repositoryPath, args) => {
      if (args[0] === "symbolic-ref") {
        throw new Error("no origin");
      }
      if (args[0] === "rev-parse" && args[2] === "main") {
        throw new Error("no main");
      }
      if (args[0] === "rev-parse" && args[2] === "master") {
        return "def456";
      }
      throw new Error(`unexpected git call: ${args.join(" ")}`);
    });

    expect(baseRef).toBe("master");
  });

  it("throws when no default base ref can be resolved", () => {
    expect(() =>
      resolveDefaultBaseRef("/repo", () => {
        throw new Error("git failed");
      }),
    ).toThrow("Could not determine default base ref for /repo");
  });
});

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
