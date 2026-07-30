import { z } from "zod";
import type { ReviewRequest } from "./types.js";

export const reviewRepositoryToolInput = z.object({
  repo_path: z.string(),
  baseRef: z.string().optional(),
  validationCommands: z.array(z.string()).optional(),
});

export type ReviewRepositoryToolInput = z.infer<typeof reviewRepositoryToolInput>;

export function toReviewRequest(input: ReviewRepositoryToolInput): ReviewRequest {
  return {
    repositoryPath: input.repo_path,
    baseRef: input.baseRef,
    validationCommands: input.validationCommands,
  };
}
