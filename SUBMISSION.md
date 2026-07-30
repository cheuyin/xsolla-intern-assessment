# Submission

## What did you investigate first, and why?

I read the README and ran the starter commands (`npm install`, `typecheck`, `test`). Then I followed the code from `cli.ts` and `mcp-server.ts` into `core.ts`, and from there into `git.ts`, `validation.ts`, and `report.ts`.

I focused on bugs and broken contracts first. The README says the happy path works but real use breaks down. If MCP or validation is wrong, neither interface is trustworthy, so I did not want to add features on top of that.

First problems I found:

- MCP schema says `repo_path` but the handler read `input.repoPath`.
- Failed validation commands threw and killed the whole review. The types already had `status: "failed"` but nothing used it.
- Git diff always used `main` as the base branch.

After those fixes, I looked at the CLI again. `--format json` was accepted but ignored. The report always went to `review-report.md`. Failed validations did not change the exit code. Those matter for CI and for the CLI doing what it claims.

## What did you choose to implement or fix?

Reliability fixes:

- Fixed MCP input mapping (`repo_path` -> `repositoryPath`). Pulled `toReviewRequest` into `src/mcp.ts` so it is easy to test.
- Validation failures now return `{ status: "failed", output }` instead of throwing. The report shows pass/fail.
- Default git base ref comes from `origin/HEAD`, with fallback to `main` or `master`.
- Check up front that the repo path exists and is a git repo.

CLI polish:

- Exit code 1 when validation fails, 0 when it passes. The report still gets written either way.
- `--format json` works end to end. Default output file is `review-report.json`.
- Added `--output` for a custom report path. Moved arg parsing to `cli-args.ts` for tests.

Tests:

- Unit tests for validation, MCP mapping, git base ref, CLI args, and report output.
- One integration test for `reviewRepository` with mocked git and validation.
- CLI e2e tests that run the real process and check exit codes.
- 34 tests total across 10 files.

Also added a Cursor rule for small commits and conventional commit messages.

## What did you intentionally not do?

- Hardening validation command execution. Still uses `exec` with user-provided strings.
- Running validation only on changed files. Commands still run against the whole repo.
- Better git status handling for renames, copies, and untracked files.
- MCP does not expose exit codes. The agent only gets report text back.
- No limit on validation output size for MCP (big test logs could fill context).
- Tests assume Unix shell commands like `false` and `echo`.

## Interface decision

- Decision: hybrid, CLI-primary
- Primary user: developers and CI on the CLI; AI agents on MCP stdio.
- Trust boundary: the caller picks a repo path and optional shell commands. The tool reads git state and runs those commands in the repo. No sandboxing beyond what the OS already gives you.
- Tradeoffs: CLI is better for scripts, exit codes, file output, and JSON. MCP is easier for agents to discover and call, but long validation output goes straight into context. Both call the same `reviewRepository` function. The adapters only differ in how they parse input and return output.
- Consistency: shared core (`reviewRepository`), shared report builders, thin CLI and MCP wrappers. CLI adds exit codes and `--output`. MCP returns markdown text.
- What would change my mind: if agents were the main user, I would push harder on MCP (streaming, truncation, structured results). If CI were the only user, I would focus on JSON and exit codes and care less about MCP.

## How did you use an AI coding agent?

I used Cursor for planning, finding bugs, writing code in small commits, running checks, and drafting this doc. I did not commit blindly. I read diffs, split big changes apart, and ran tests plus manual CLI checks before committing.

## Where did you check, correct, or reject an AI suggestion? (required)

- The agent tried to fix MCP, validation, git, and report in one go. I split that into separate commits instead.
- It wanted to commit `package-lock.json` changes from a local `npm install`. Those were unrelated so I restored the file.
- For git tests, `vi.spyOn(execFileSync)` failed in ESM. I extracted `resolveDefaultBaseRef` with an injectable git runner instead of trying to mock subprocess calls.

## Commands used to verify the result, with outcomes

```bash
npm install                          # ok, needed before first typecheck
npm run typecheck                    # pass
npm run build                        # pass
npm test                             # pass, 34 tests

npm run inspector -- review --repo . --validate "false"
                                     # exit 1, report shows false (failed)
npm run inspector -- review --repo . --validate "npm test"
                                     # exit 0, report shows npm test (passed)
npm run inspector -- review --repo . --validate "false" --validate "npm test"
                                     # both results show up, no early abort

npm run inspector -- review --repo . --format json --validate "npm test"
                                     # valid review-report.json
npm run inspector -- review --repo . --output /tmp/inspector-report.md
                                     # writes to custom path

npm run inspector -- review --repo /no/such/repo
                                     # exit 1, path does not exist
npm run inspector -- review --repo /tmp
                                     # exit 1, not a git repo

git stash + inspector --validate "false"   # reproduced original crash
```

## A blocker you hit and how you approached it

`npm run typecheck` failed at first because `node_modules` was missing. Ran `npm install` and tried again.

A couple commits got interrupted in the IDE. Keeping each commit small made it easy to retry without losing work.

Git unit tests blocked on ESM: could not spy on `execFileSync`. Refactored to inject a git runner function so the logic is testable without mocks on node builtins.

## Known limitations and the next three things you would do

Known limitations:

- Validation uses `exec` with arbitrary shell strings.
- Validation is not limited to changed files.
- Git diff parsing is basic (no rename/copy/untracked).
- MCP only returns text, no separate failure signal or output cap.

Next three:

1. Safer command execution (`execFile` or an allowlist for MCP).
2. Truncate or summarize validation output for MCP.
3. Tests and support for rename/copy/untracked in `changedFiles`.

## Approximate focused-work time

- Start: Jul 30, 2026 ~2:53 PM
- Finish: Jul 30, 2026 ~3:45 PM
