#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { CLI_USAGE, parseArgs, resolveOutputPath } from "./cli-args.js";
import { reviewRepository } from "./core.js";
import { validationExitCode } from "./validation.js";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command !== "review" || !args.repositoryPath) {
    console.error(CLI_USAGE);
    process.exitCode = 1;
    return;
  }

  const result = await reviewRepository({
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    validationCommands: args.validations,
    format: args.format,
  });
  const outputPath = resolveOutputPath(args);
  writeFileSync(outputPath, result.report, "utf8");
  console.log(`Review report written to ${outputPath}`);
  process.exitCode = validationExitCode(result.validationResults);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
