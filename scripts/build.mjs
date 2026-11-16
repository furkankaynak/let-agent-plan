// Generates two agents and a Claude Code skill from the single source of truth.
//
//   src/prompt.md            -> body (harness-specific placeholders templated)
//   scripts/harnesses.json   -> artifact path, question tool, plans directory
//   opencode/agents/planner.md -> OpenCode v2 artifact
//   agents/planner.md          -> Claude Code artifact
//   skills/let-agent-plan/SKILL.md -> Claude Code inline skill
//
// The frontmatter lives here in FRONTMATTER (it is NOT in src/prompt.md).
// Edit `src/prompt.md`, `scripts/harnesses.json`, or the frontmatter below,
// then run:
//   npm run build

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const FRONTMATTER = {
  opencode: `---
description: Plan-mode agent that researches, plans and asks — never implements
mode: primary
permissions:
  - action: question
    resource: "*"
    effect: allow
  - action: edit
    resource: "*"
    effect: deny
  - action: edit
    resource: ".opencode/plans/*"
    effect: allow
---
`,
  claude: `---
name: planner
description: Plan-mode agent that researches, plans and asks — never implements. Use to turn an idea into an approved, implementable plan before writing code.
tools: Read, Grep, Glob, WebFetch, WebSearch, TodoWrite, Task, AskUserQuestion, Write
---
`,
}

const harnesses = JSON.parse(
  await readFile(resolve(root, "scripts/harnesses.json"), "utf8")
)

const body = (await readFile(resolve(root, "src/prompt.md"), "utf8")).trim() + "\n"

const SKILL_FRONTMATTER = `---
name: let-agent-plan
description: Research an idea, ask clarifying questions, and produce an implementable plan without implementing it.
disable-model-invocation: true
---
`

for (const [name, config] of Object.entries(harnesses)) {
  if (!(name in FRONTMATTER)) {
    throw new Error(`no frontmatter defined for harness "${name}"`)
  }

  const renderedBody = body
    .replaceAll("{{QUESTION_TOOL}}", config.questionTool)
    .replaceAll("{{PLANS_DIRECTORY}}", config.plansDirectory)

  const targets = [{ file: config.artifact, frontmatter: FRONTMATTER[name] }]
  if (config.skillArtifact) {
    targets.push({ file: config.skillArtifact, frontmatter: SKILL_FRONTMATTER })
  }

  for (const { file, frontmatter } of targets) {
    const path = resolve(root, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, frontmatter + "\n" + renderedBody)
    console.log(`wrote ${file}`)
  }
}
