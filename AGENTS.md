# AGENTS.md

Plugin repo for **let-agent-plan**: a read-only "planner" agent for Claude Code
and OpenCode v2. Mostly metadata + codegen — no library code, no tests, no
dependencies, no lint/typecheck.

## Source vs generated (the one rule that matters)
- `src/prompt.md` is the single source of truth for the agent system prompt.
- `scripts/build.mjs` generates the three shipped artifacts and injects the
  frontmatter (name, permissions, `tools:`) from the `FRONTMATTER` map in
  `build.mjs` (skill frontmatter uses `SKILL_FRONTMATTER`). The frontmatter is NOT in `src/prompt.md` — edit `build.mjs` to
  change it.
- `scripts/harnesses.json` maps each harness to its artifact path, question
  tool name, and plans directory. The prompt body's `{{QUESTION_TOOL}}` and
  `{{PLANS_DIRECTORY}}` placeholders are filled from here at build time.
- `npm run build` regenerates:
  - `opencode/agents/planner.md` → OpenCode v2 artifact
  - `agents/planner.md` → Claude Code artifact
  - `skills/let-agent-plan/SKILL.md` → Claude Code inline, manually invoked skill
- Never hand-edit the generated `*.md`; changes are overwritten on the next build.

## Commands
- `npm run build` — regenerate both agents and the Claude Code skill.
- `npm run icon` — regenerate `.claude-plugin/icon.png` (pure Node, no deps).
- `claude plugin validate .` — validate the plugin/marketplace manifests.

## Version bump — two files, must match
- `package.json` → `"version"`
- `.claude-plugin/plugin.json` → `"version"`
Bump both together (patch convention); commit message ends with `(x.y.z)`.

## Publish / release
1. `npm run build` if `src/prompt.md`, `scripts/harnesses.json`, or
   `build.mjs` changed.
2. Bump both version fields.
3. Commit and `git push origin main`.
4. `claude plugin tag .claude-plugin --push` — creates and pushes the
   `let-agent-plan--v{version}` tag. A plain `git push` does NOT publish a
   version; the marketplace resolves releases from this tag.

## Gotchas
- The planner's own OpenCode config denies `edit` everywhere except
  `.opencode/plans/*`. Running as the `planner` agent in this repo blocks
  `edit`; use `write`/`shell` or switch to a build-mode agent.
- `claude plugin validate .` may warn about `.DS_Store` — it's untracked and
  non-blocking.
