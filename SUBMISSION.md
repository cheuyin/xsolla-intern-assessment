# Submission

## What did you investigate first, and why?

I started by reading the README and running the baseline commands (`npm install`, `typecheck`, `test`) to confirm the starter state. Then I traced the call path from both entry points — `cli.ts` and `mcp-server.ts` — into `core.ts`, and from there into `git.ts`, `validation.ts`, and `report.ts`.

I prioritized contract and reliability bugs over new features because the README says production use exposes weaknesses in correctness and reliability, and because a broken MCP contract or a crashing validation path would undermine both advertised interfaces before any feature work mattered.

The first issues I found:

- MCP schema exposes `repo_path` but the handler read `input.repoPath`.
- Validation failures rejected the promise and crashed the whole review instead of using the existing `status: "failed"` type.
- Git diff defaulted to `main`, which fails on repos whose default branch is something else.

## What did you choose to implement or fix?

- **MCP contract** — map `repo_path` to `repositoryPath`; extract `toReviewRequest` in `src/mcp.ts` for a testable adapter.
- **Validation reliability** — resolve failed commands with `{ status: "failed", output }` instead of throwing; show pass/fail in the report.
- **Git default base ref** — detect `origin/HEAD`, fall back to `main` / `master`, error clearly if none found.
- **Tests** — cover validation failure paths and MCP input mapping.
- **Workflow** — added a Cursor rule for commit-sized chunks and conventional commits.

## What did you intentionally not do?

- **`--format json`** — CLI parses it but core/report only emit markdown.
- **`--output` flag** — report path is still hardcoded to `review-report.md`.
- **Shell injection hardening** — validation still uses `exec` with user-supplied strings.
- **Diff-scoped validation** — validation commands still run against the whole repo, not just changed files.
- **Richer git status handling** — renames/copies and untracked files are not surfaced.
- **CLI exit code on failed validation** — review completes with exit 0 even when a validation fails.

## Interface decision

- **Decision:** hybrid (CLI-primary)
- **Primary user and execution environment:** developers and CI use the CLI locally or in pipelines; AI coding agents invoke the same review via MCP stdio inside an IDE or agent host.
- **Trust boundary and allowed capabilities:** caller supplies a repository path and optional shell commands to run in that repo. The tool reads git state and executes those commands with the repo as cwd. It does not sandbox commands or authenticate repos beyond what the host OS already allows.
- **Reliability, discoverability, latency/context, and output tradeoffs:** CLI is better for scripting, explicit flags, and writing artifacts to disk. MCP is better for agent discoverability and returning report text inline, but large validation output can consume context. Both share `reviewRepository`, so behavior stays aligned; MCP adds a thin typed adapter (`toReviewRequest`).
- **How supported interfaces remain consistent:** one orchestration function (`reviewRepository`) and one markdown formatter; CLI and MCP differ only in argument parsing and transport.
- **Evidence that would change this decision:** if most usage were unattended agent workflows with no local checkout, I would lean MCP-first and add streaming/partial results. If CI were the only consumer, I would drop MCP from the advertised surface and focus on exit codes, `--output`, and JSON.

## How did you use an AI coding agent?

I used Cursor throughout: strategizing scope, identifying bugs from the starter code, implementing fixes in commit-sized chunks, running verification commands, and drafting this write-up. I treated AI output as a draft — I reviewed diffs, rejected bundled changes, and verified behavior with tests and manual CLI runs before committing.

## Where did you check, correct, or reject an AI suggestion? (required)

- **Rejected bundled implementation** — the agent initially changed MCP, validation, git, and report in one pass. I split that into separate fix commits so each commit stayed reviewable and matched conventional-commit scope.
- **Rejected over-focusing on co-author trailers** — I briefly spent time stripping `Co-authored-by: Cursor` from commits and adding rule text about it. I reverted that approach and kept normal commits; the attribution is harmless and not part of the assessment rubric.
- **Rejected committing `package-lock.json` noise** — local `npm install` produced unrelated lockfile diffs (optional `libc` metadata). I restored the file instead of committing 30 lines of dependency noise.

## Commands used to verify the result, with outcomes

```bash
npm install                          # ok — required before first typecheck
npm run typecheck                    # pass
npm test                             # pass (7 tests after adding validation + MCP tests)
npm run build                        # pass
npm run inspector -- review --repo . --validate "false"
                                     # pass — exit 0, report shows `false (failed)`
npm run inspector -- review --repo . --validate "npm test"
                                     # pass — report shows `npm test (passed)`
npm run inspector -- review --repo . --validate "false" --validate "npm test"
                                     # pass — both results appear; batch does not abort early
git stash + inspector --validate "false" (without validation fix)
                                     # baseline reproduced crash with exit 1
git restore package-lock.json        # discarded unrelated local lockfile diff
```

## A blocker you hit and how you approached it

The first `npm run typecheck` failed because dependencies were not installed (`node_modules` missing). I ran `npm install` and re-ran checks before treating any fix as verified.

A few commit attempts were interrupted in the IDE approval flow. I kept commits narrowly scoped (one file group at a time) so partial progress was easy to review and retry.

## Known limitations and the next three things you would do

**Known limitations**

- Validation commands are arbitrary shell strings run with `exec`.
- Failed validations do not change CLI exit code.
- Report format is markdown only despite CLI `--format` flag.
- Changed-file detection depends on a resolvable base ref and simple git status codes.

**Next three**

1. Implement `--format json` end-to-end (or remove the flag until supported).
2. Replace `exec` with safer argument-aware execution and/or restrict MCP Exposed commands.
3. Set CLI exit code from validation results and add an `--output` path flag for CI usage.

## Approximate focused-work time

- Start: Jul 30, 2026 ~2:53 PM
- Finish: Jul 30, 2026 ~3:25 PM
