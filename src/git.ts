import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ChangedFile } from "./types.js";

function git(repositoryPath: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    encoding: "utf8",
  }).trim();
}

export type GitCommandRunner = (repositoryPath: string, args: string[]) => string;

export function resolveDefaultBaseRef(repositoryPath: string, runGit: GitCommandRunner): string {
  try {
    const ref = runGit(repositoryPath, ["symbolic-ref", "refs/remotes/origin/HEAD"]);
    const match = ref.match(/^refs\/remotes\/origin\/(.+)$/);
    if (match) {
      return match[1];
    }
  } catch {
    // fall through to local branch names
  }

  for (const candidate of ["main", "master"]) {
    try {
      runGit(repositoryPath, ["rev-parse", "--verify", candidate]);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Could not determine default base ref for ${repositoryPath}`);
}

export function defaultBaseRef(repositoryPath: string): string {
  return resolveDefaultBaseRef(repositoryPath, git);
}

export function assertGitRepository(repositoryPath: string): void {
  const resolvedPath = resolve(repositoryPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Repository path does not exist: ${repositoryPath}`);
  }

  try {
    git(resolvedPath, ["rev-parse", "--is-inside-work-tree"]);
  } catch {
    throw new Error(`Not a git repository: ${repositoryPath}`);
  }
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