#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { reviewRepository } from "./core.js";
import { reviewRepositoryToolInput, toReviewRequest } from "./mcp.js";

const server = new McpServer({ name: "repository-inspector", version: "2.0.0" });

server.tool(
  "review_repository",
  "Inspects a Git repository and returns a review report.",
  {
    repo_path: reviewRepositoryToolInput.shape.repo_path.describe("Repository path to inspect."),
    baseRef: reviewRepositoryToolInput.shape.baseRef,
    validationCommands: reviewRepositoryToolInput.shape.validationCommands,
  },
  async (input) => {
    const report = await reviewRepository(toReviewRequest(reviewRepositoryToolInput.parse(input)));
    return { content: [{ type: "text", text: report }] };
  },
);

await server.connect(new StdioServerTransport());