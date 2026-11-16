# AGENTS.md

Distribution repo for **let-agent-plan**: a Claude Code plugin, an OpenCode v2
primary agent and a portable skill for skills.sh. Mostly metadata + codegen —
no dependencies or lint/typecheck. Tests use Node's built-in test runner.

## Source vs generated (the one rule that matters)
- `src/prompt.md` is the single source of truth for the agent system prompt.
- `scripts/build.mjs` generates four artifacts and injects frontmatter from its
  `FRONTMATTER` map. Frontmatter is NOT in `src/prompt.md`.
- `scripts/harnesses.json` contains independent profiles. Each has `replacements`
  for `{{QUESTION_POLICY}}` and `{{PLANS_DIRECTORY}}`, and an `artifacts` array
  of output files and frontmatter keys. A profile may produce only a skill;
  adding a harness does not require adding an agent or special build branch.
- `npm run build` regenerates:
  - `opencode/agents/planner.md` → OpenCode v2 artifact
  - `claude/agents/planner.md` → Claude Code artifact
  - `claude/skills/planner/SKILL.md` → Claude inline skill, `/let-agent-plan:planner`
  - `skills/planner/SKILL.md` → portable skills.sh skill
- Never hand-edit the generated `*.md`; changes are overwritten on the next build.
- Native profiles keep their exact question-tool policies and plan directories.
  The generic profile uses a question tool when callable, otherwise asks in chat
  and waits. Its plan directory is `plans/`, with the shared chat fallback.

## Distribution boundaries
- `claude/` is the self-contained plugin root: manifest, icon, agent, skill, guide.
- `opencode/` contains the OpenCode agent and guide. Its artifact path is stable.
- `skills/planner/` contains the portable skill and its guide.
- Root `.claude-plugin/marketplace.json` remains the stable discovery entry;
  its plugin source is `./claude`. Do not move it or rename either published name.
- All skills and agents are named `planner`. The plugin/repository name stays
  `let-agent-plan`; plugin skills are namespaced as `/let-agent-plan:planner`.
  The skills CLI can discover both same-named skills. It currently searches root
  `skills/` first and deduplicates names; `--skill planner` alone does not isolate
  the portable variant from a future discovery-order change. Recheck installed
  contents when layout or installer behavior changes. An explicit source of
  `skills/planner/` bypasses repository-wide discovery.
- Keep skill-only installation below the recommended native installations in
  the root README. Update the per-distribution READMEs when behavior changes.
- Standalone Claude and portable skill packages include copies of `LICENSE`;
  keep these in sync with the root license (checked by `npm test`).

## Commands
- `npm run build` — regenerate all four prompts, including the skills.sh output.
- `npm run icon` — regenerate `claude/.claude-plugin/icon.png` (pure Node, no deps).
- `npm test` — rendering, distribution, documentation and version checks.
- `claude plugin validate .` — validate the root marketplace.
- `claude plugin validate ./claude` — validate the plugin and its components.
  Marketplace validation alone does not check all nested plugin contents.

## Version bump — two files, must match
- `package.json` → `"version"`
- `claude/.claude-plugin/plugin.json` → `"version"`
Bump both together (patch convention); commit message ends with `(x.y.z)`.

## Publish / release
1. Bump both version fields; build all profiles and regenerate the icon if needed.
2. Run tests and validate both the marketplace and `./claude`. Test the plugin
   through the marketplace as well as directly; check upgrading an older install
   in an isolated environment without changing the user's actual installation.
3. Test a project-local install with the current skills CLI from the repository
   root, selecting `planner`. Record the CLI version and compare the
   installed `SKILL.md` with `skills/planner/SKILL.md`, not the Claude copy.
   Also check the explicit generic skill directory install. Keep test installs
   outside this repository and the user's normal agent configuration.
4. Preview the tag with `claude plugin tag ./claude --dry-run`. On a dirty tree
   the CLI refuses; use a clean isolated checkout for the preview, not `--force`.
5. After explicit release approval, commit and `git push origin main`.
6. Preserve the release tag convention with `claude plugin tag ./claude --push`:
   creates/pushes `let-agent-plan--v{version}`. The target is the plugin root,
   NOT `.claude-plugin` or `claude/.claude-plugin`.
7. Recheck public GitHub installs and the skills.sh detail/search pages. A local
   path install does not establish public discoverability. Telemetry-enabled
   remote installs feed the directory; indexing and caches can take time.

Versioned marketplace updates are published by incrementing the plugin version
and pushing its files. Tags are retained as this repo's release convention and
for consumers resolving version ranges; they are not a universal prerequisite
for ordinary marketplace updates. See Claude's plugin publishing reference.
The portable skill is fetched from GitHub; there is no separate npm publication.
Do not claim it is listed until the public page/search has been checked.

## Gotchas
- The planner's own OpenCode config denies `edit` everywhere except
  `.opencode/plans/*`. Running as the `planner` agent in this repo blocks
  `edit`; use `write`/`shell` or switch to a build-mode agent.
- Validation may warn about `.DS_Store` — it's untracked and
  non-blocking.
