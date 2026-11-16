// Generates all harness artifacts from src/prompt.md and scripts/harnesses.json.
// Frontmatter belongs here, not in the source prompt. Run: npm run build

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const FRONTMATTER = {
  "opencode-agent": `---
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
  "claude-agent": `---
name: planner
description: Plan-mode agent that researches, plans and asks — never implements. Use to turn an idea into an approved, implementable plan before writing code.
tools: Read, Grep, Glob, WebFetch, WebSearch, TodoWrite, Task, AskUserQuestion, Write
---
`,
  "claude-skill": `---
name: plan
description: Research an idea, ask clarifying questions, and produce an implementable plan without implementing it.
disable-model-invocation: true
---
`,
  skill: `---
name: let-agent-plan
description: Research an idea, ask clarifying questions, and produce an implementable plan without implementing it. Use when planning a project or feature before writing code.
---
`,
}

export function renderArtifacts(prompt, harnesses) {
  const artifacts = []
  const paths = new Set()
  const body = prompt.trim() + "\n"

  if (!harnesses || typeof harnesses !== "object" || Array.isArray(harnesses) || !Object.keys(harnesses).length) {
    throw new Error("no harness profiles defined")
  }

  for (const [name, config] of Object.entries(harnesses)) {
    if (!config?.replacements || !Array.isArray(config.artifacts) || !config.artifacts.length) {
      throw new Error(`harness "${name}" needs replacements and artifacts`)
    }

    const renderedBody = body.replace(/\{\{([A-Z_]+)\}\}/g, (placeholder, key) => {
      const value = config.replacements[key]
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`harness "${name}" has no replacement for ${placeholder}`)
      }
      return value
    })
    if (/\{\{[^{}]+\}\}/.test(renderedBody)) {
      throw new Error(`harness "${name}" has unresolved placeholders`)
    }

    for (const { file, frontmatter } of config.artifacts) {
      if (!Object.hasOwn(FRONTMATTER, frontmatter)) {
        throw new Error(`unknown frontmatter "${frontmatter}" in harness "${name}"`)
      }
      if (typeof file !== "string" || !file.endsWith(".md") || isAbsolute(file) || file.includes("\\")) {
        throw new Error(`invalid artifact path in harness "${name}": ${file}`)
      }
      const path = resolve(root, file)
      if (relative(root, path).startsWith("..")) {
        throw new Error(`artifact path escapes repository: ${file}`)
      }
      if (paths.has(path)) throw new Error(`duplicate artifact path: ${file}`)
      paths.add(path)
      artifacts.push({ file, content: FRONTMATTER[frontmatter] + "\n" + renderedBody })
    }
  }

  return artifacts
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const harnesses = JSON.parse(await readFile(resolve(root, "scripts/harnesses.json"), "utf8"))
  const prompt = await readFile(resolve(root, "src/prompt.md"), "utf8")
  // Validate every target before writing any files.
  for (const { file, content } of renderArtifacts(prompt, harnesses)) {
    const path = resolve(root, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
    console.log(`wrote ${file}`)
  }
}
