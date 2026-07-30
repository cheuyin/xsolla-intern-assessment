export type CliArgs = {
  command: string;
  repositoryPath?: string;
  baseRef?: string;
  format?: "markdown" | "json";
  outputPath?: string;
  validations: string[];
};

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { command: argv[0] ?? "", validations: [] };
  for (let index = 1; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--repo") {
      args.repositoryPath = argv[++index]?.split(" ")[0];
    } else if (token === "--base-ref") {
      args.baseRef = argv[++index];
    } else if (token === "--format") {
      args.format = argv[++index] as CliArgs["format"];
    } else if (token === "--output") {
      args.outputPath = argv[++index];
    } else if (token === "--validate") {
      args.validations.push(argv[++index]);
    }
  }
  return args;
}

export function resolveOutputPath(args: Pick<CliArgs, "outputPath" | "format">): string {
  if (args.outputPath) {
    return args.outputPath;
  }
  return args.format === "json" ? "review-report.json" : "review-report.md";
}

export const CLI_USAGE =
  "Usage: inspector review --repo <path> [--base-ref <ref>] [--format markdown|json] [--output <path>] [--validate <command>]";
