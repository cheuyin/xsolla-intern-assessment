import { changedFiles } from "./git.js";
import { markdownReport } from "./report.js";
import type { ReviewRequest, ValidationResult } from "./types.js";
import { runValidations } from "./validation.js";

export type ReviewResult = {
  report: string;
  validationResults: ValidationResult[];
};

export async function reviewRepository(request: ReviewRequest): Promise<ReviewResult> {
  const files = changedFiles(request.repositoryPath, request.baseRef);
  const validations = await runValidations(
    request.validationCommands ?? [],
    request.repositoryPath,
  );
  return {
    report: markdownReport({
      repositoryPath: request.repositoryPath,
      changedFiles: files,
      validationResults: validations,
    }),
    validationResults: validations,
  };
}