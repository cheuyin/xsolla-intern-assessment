import { execFileSync } from "node:child_process";
import type { ChangedFile } from "./types.js";

function git(repositoryPath: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    encoding: "utf8",
  }).trim();
}

function defaultBaseRef(repositoryPath: string): string {
  try {
    const ref = git(repositoryPath, ["symbolic-ref", "refs/remotes/origin/HEAD"]);
    const match = ref.match(/^refs\/remotes\/origin\/(.+)$/);
    if (match) {
      return match[1];
    }
  } catch {
    // fall through to local branch names
  }

  for (const candidate of ["main", "master"]) {
    try {
      git(repositoryPath, ["rev-parse", "--verify", candidate]);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Could not determine default base ref for ${repositoryPath}`);
}

export function changedFiles(repositoryPath: string, baseRef?: string): ChangedFile[] {
  const base = baseRef ?? defaultBaseRef(repositoryPath);
  const output = git(repositoryPath, ["diff", "--name-status", `${base}...HEAD`]);

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [code, ...pathParts] = line.split("\t");
      const status = code === "A" ? "added" : code === "D" ? "deleted" : "modified";
      return { path: pathParts.join("\t"), status };
    });
}