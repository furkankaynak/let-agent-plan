// Generates the two agent artifacts from the single source of truth.
//
//   src/prompt.md                          -> body (no frontmatter)
//   opencode/agents/planner.md         -> OpenCode v2 artifact
//   agents/planner.md                  -> Claude Code artifact
//
// Edit `src/prompt.md` (or the frontmatter blocks below), then run:
//   npm run build

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const OPENCODE_FRONTMATTER = `---
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
    resource: "~/.opencode/plan/*"
    effect: allow
---
`

const CLAUDE_FRONTMATTER = `---
name: planner
description: Plan-mode agent that researches, plans and asks — never implements. Use to turn an idea into an approved, implementable plan before writing code.
tools: Read, Grep, Glob, WebFetch, WebSearch, TodoWrite, Task, AskUserQuestion
---
`

const body = (await readFile(resolve(root, "src/prompt.md"), "utf8")).trim() + "\n"

const targets = [
  {
    file: "opencode/agents/planner.md",
    content: OPENCODE_FRONTMATTER + "\n" + body,
  },
  {
    file: "agents/planner.md",
    content: CLAUDE_FRONTMATTER + "\n" + body,
  },
]

for (const { file, content } of targets) {
  const path = resolve(root, file)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
  console.log(`wrote ${file}`)
}
