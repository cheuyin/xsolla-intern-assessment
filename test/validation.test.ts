import { describe, expect, it } from "vitest";
import { markdownReport } from "../src/report.js";
import { runValidation, runValidations } from "../src/validation.js";

describe("runValidation", () => {
  it("returns failed status for a non-zero exit instead of throwing", async () => {
    const result = await runValidation("false", process.cwd());

    expect(result.status).toBe("failed");
    expect(result.command).toBe("false");
    expect(result.output).toContain("Command failed: false");
  });

  it("returns passed status for a successful command", async () => {
    const result = await runValidation("echo ok", process.cwd());

    expect(result.status).toBe("passed");
    expect(result.output).toContain("ok");
  });
});

describe("runValidations", () => {
  it("continues after a failed command", async () => {
    const results = await runValidations(["false", "echo ok"], process.cwd());

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe("failed");
    expect(results[1]?.status).toBe("passed");
  });
});

describe("markdownReport validation failures", () => {
  it("shows failed validation status in the report", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [],
      validationResults: [{ command: "npm test", status: "failed", output: "tests failed" }],
    });

    expect(report).toContain("### npm test (failed)");
    expect(report).toContain("tests failed");
  });
});
