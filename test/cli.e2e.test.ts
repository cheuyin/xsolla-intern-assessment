import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function runInspector(args: string[]) {
  return spawnSync("npx", ["tsx", "src/cli.ts", ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });
}

describe("inspector CLI", () => {
  it("exits 1 when validation fails but still writes the report", () => {
    const outputPath = join(tmpdir(), `inspector-failed-${Date.now()}.md`);

    const result = runInspector(["review", "--repo", projectRoot, "--output", outputPath, "--validate", "false"]);

    try {
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(`Review report written to ${outputPath}`);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    }
  });

  it("exits 0 when validation passes", () => {
    const outputPath = join(tmpdir(), `inspector-passed-${Date.now()}.md`);

    const result = runInspector(["review", "--repo", projectRoot, "--output", outputPath, "--validate", "echo ok"]);

    try {
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`Review report written to ${outputPath}`);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    }
  });

  it("exits 1 for an invalid repository path", () => {
    const result = runInspector(["review", "--repo", "/path/that/does/not/exist"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Repository path does not exist");
  });
});
