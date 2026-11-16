import assert from "node:assert/strict"
import { readFile, readdir, stat } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { renderArtifacts } from "./build.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const read = (file) => readFile(resolve(root, file), "utf8")
const prompt = await read("src/prompt.md")
const harnesses = JSON.parse(await read("scripts/harnesses.json"))
const artifacts = renderArtifacts(prompt, harnesses)
const artifact = (file) => artifacts.find((entry) => entry.file === file).content

test("all four committed artifacts match the shared source and have no placeholders", async () => {
  assert.equal(artifacts.length, 4)
  for (const { file, content } of artifacts) {
    assert.equal(await read(file), content, `${file} needs npm run build`)
    assert.doesNotMatch(content, /\{\{[^{}]+\}\}/)
  }
  assert.deepEqual(renderArtifacts(prompt, harnesses), artifacts)
})

test("native policies and frontmatter stay harness-specific", () => {
  const claude = artifact("claude/skills/planner/SKILL.md")
  assert.match(claude, /^name: planner$/m)
  assert.match(claude, /disable-model-invocation: true/)
  assert.match(claude, /Ask every question through the `AskUserQuestion` tool — never write questions as plain text\./)
  assert.match(claude, /`\.claude\/plans\//)
  assert.doesNotMatch(claude, /Otherwise, ask the same questions as plain text/)
  assert.match(artifact("claude/agents/planner.md"), /tools: Read, Grep, Glob, WebFetch, WebSearch, TodoWrite, Task, AskUserQuestion, Write/)
  const opencode = artifact("opencode/agents/planner.md")
  assert.match(opencode, /mode: primary/)
  assert.match(opencode, /Ask every question through the `question` tool/)
  assert.match(opencode, /resource: "\.opencode\/plans\/\*"/)
})

test("portable skill waits for answers and falls back to chat without native dependencies", () => {
  const generic = artifact("skills/planner/SKILL.md")
  assert.match(generic, /^name: planner$/m)
  assert.match(generic, /question tool when one is available and callable/)
  assert.match(generic, /Otherwise, ask the same questions as plain text in the conversation/)
  assert.match(generic, /stop and wait for the user's answers before continuing/)
  assert.match(generic, /`plans\/\{yyyyMMddHHmm\}-let-me-plan-\{plan_name\}\.md`/)
  assert.match(generic, /don't overwrite an existing file/)
  assert.match(generic, /on failure give the full plan in chat and say it wasn't saved/)
  assert.match(generic, /Do not implement anything/)
  assert.doesNotMatch(generic, /AskUserQuestion|\.claude\/|\.opencode\/|disable-model-invocation|tools:|permissions:/)
})

test("a new skill-only harness needs no new frontmatter or agent", () => {
  const extended = structuredClone(harnesses)
  extended.example = {
    replacements: { QUESTION_POLICY: "Ask and wait.", PLANS_DIRECTORY: "example/plans" },
    artifacts: [{ file: "example/skills/planner/SKILL.md", frontmatter: "skill" }],
  }
  const result = renderArtifacts(prompt, extended)
  assert.equal(result.length, 5)
  assert.match(result.at(-1).content, /Ask and wait\./)
  assert.match(result.at(-1).content, /example\/plans/)
})

test("invalid targets fail before writing artifacts", () => {
  assert.throws(() => renderArtifacts(prompt, {}), /no harness profiles/)
  assert.throws(() => renderArtifacts(prompt, { bad: {} }), /needs replacements and artifacts/)
  const config = () => structuredClone(harnesses)
  let invalid = config()
  delete invalid.generic.replacements.QUESTION_POLICY
  assert.throws(() => renderArtifacts(prompt, invalid), /no replacement for/)
  invalid = config()
  invalid.generic.artifacts[0].frontmatter = "missing"
  assert.throws(() => renderArtifacts(prompt, invalid), /unknown frontmatter/)
  invalid = config()
  invalid.generic.artifacts[0].file = "../outside.md"
  assert.throws(() => renderArtifacts(prompt, invalid), /escapes repository/)
  invalid = config()
  invalid.generic.artifacts[0].file = "/absolute.md"
  assert.throws(() => renderArtifacts(prompt, invalid), /invalid artifact path/)
  invalid = config()
  invalid.generic.artifacts[0].file = "claude/agents/planner.md"
  assert.throws(() => renderArtifacts(prompt, invalid), /duplicate artifact path/)
  invalid = config()
  invalid.generic.replacements.QUESTION_POLICY = "{{UNRESOLVED}}"
  assert.throws(() => renderArtifacts(prompt, invalid), /unresolved placeholders/)
})

test("marketplace points to a self-contained plugin with stable published names", async () => {
  const marketplace = JSON.parse(await read(".claude-plugin/marketplace.json"))
  const plugin = JSON.parse(await read("claude/.claude-plugin/plugin.json"))
  const pkg = JSON.parse(await read("package.json"))
  assert.equal(marketplace.name, "let-agent-plan")
  assert.equal(marketplace.plugins[0].name, plugin.name)
  assert.equal(plugin.name, "let-agent-plan")
  assert.equal(marketplace.plugins[0].source, "./claude")
  assert.equal(pkg.version, plugin.version)
  assert.equal(plugin.skills, undefined) // default scan is inside claude/, not the repo root
  assert.deepEqual((await readdir(resolve(root, ".claude-plugin"))).filter((name) => name !== ".DS_Store"), ["marketplace.json"])
  await assert.rejects(stat(resolve(root, "agents/planner.md")), { code: "ENOENT" })
  await assert.rejects(stat(resolve(root, "claude/skills/let-agent-plan/SKILL.md")), { code: "ENOENT" })
  await assert.rejects(stat(resolve(root, "claude/skills/plan/SKILL.md")), { code: "ENOENT" })
  await assert.rejects(stat(resolve(root, "skills/let-agent-plan/SKILL.md")), { code: "ENOENT" })
  assert.ok((await stat(resolve(root, "claude/.claude-plugin/icon.png"))).size > 0)
})

test("README recommendations, guide links and release paths stay current", async () => {
  const readme = await read("README.md")
  const alternative = readme.indexOf("## Alternative: skill-only installation via skills.sh")
  assert.ok(alternative > readme.indexOf("## Claude Code — recommended: plugin"))
  assert.ok(alternative > readme.indexOf("## OpenCode v2 — recommended: primary agent"))
  assert.match(readme, /--skill planner/)
  assert.match(readme, /\/let-agent-plan:planner /)
  assert.doesNotMatch(readme, /let-agent-plan:let-agent-plan/)
  const maintenance = await read("AGENTS.md")
  assert.match(maintenance, /claude plugin tag \.\/claude --push/)
  assert.match(maintenance, /claude\/\.claude-plugin\/plugin.json/)
  assert.doesNotMatch(maintenance, /claude plugin tag \.claude-plugin/)
  for (const file of ["README.md", "claude/README.md", "opencode/README.md", "skills/planner/README.md"]) {
    const text = await read(file)
    for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(https?:|#)/.test(link)) continue
      await stat(resolve(root, dirname(file), link.split("#")[0]))
    }
  }
})

test("standalone distributions include the repository license", async () => {
  const license = await read("LICENSE")
  assert.equal(await read("claude/LICENSE"), license)
  assert.equal(await read("skills/planner/LICENSE"), license)
})
