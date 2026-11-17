import assert from "node:assert/strict"
import { readFile, readdir, stat, mkdtemp, mkdir, writeFile, rm, lstat, realpath } from "node:fs/promises"
import { dirname, resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { renderArtifacts } from "./build.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const read = (file) => readFile(resolve(root, file), "utf8")
const prompt = await read("src/prompt.md")
const harnesses = JSON.parse(await read("scripts/harnesses.json"))
const artifacts = renderArtifacts(prompt, harnesses)
const artifact = (file) => artifacts.find((entry) => entry.file === file).content
const exec = promisify(execFile)
const guides = ["README.md", "claude/README.md", "opencode/README.md", "skills/planner/README.md"]

// GitHub heading fragments, excluding examples inside fenced code blocks.
function anchors(markdown) {
  const seen = new Map()
  return new Set(
    markdown.replace(/^```[^\n]*\n[\s\S]*?^```/gm, "")
      .split("\n")
      .filter((line) => /^#{1,6} /.test(line))
      .map((line) => {
        const slug = line.replace(/^#+ /, "").toLowerCase()
          .replace(/[^\p{L}\p{N}_\-\s]/gu, "").replace(/\s/g, "-")
        const count = seen.get(slug) ?? 0
        seen.set(slug, count + 1)
        return count ? `${slug}-${count}` : slug
      }),
  )
}

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
  assert.match(generic, /On failure, present the full plan in chat and explicitly say it wasn't saved/)
  assert.match(generic, /Do not implement anything/)
  assert.doesNotMatch(generic, /AskUserQuestion|\.claude\/|\.opencode\/|disable-model-invocation|tools:|permissions:/)
})

test("every distribution saves and presents the full plan before asking for approval", () => {
  for (const { content } of artifacts) {
    assert.match(content, /The only file you may create or modify is the finished plan file\./)
    assert.match(content, /Before asking approval, write the full plan to/)
    assert.match(content, /On success, report the saved path, then present the full final plan in chat, including all sections and diagrams\./)
    assert.match(content, /A path or summary alone is not sufficient\./)
    assert.match(content, /On failure, present the full plan in chat and explicitly say it wasn't saved\./)
    assert.match(content, /The saved file and the plan shown in chat must contain the same plan\./)
    assert.match(content, /Create or modify no files other than the plan file\./)
    assert.match(content, /Then ask for approval using the question policy and wait\. Do not implement anything\./)
    assert.doesNotMatch(content, /write exactly one thing|Write nothing else\./)
  }
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
  const claude = readme.indexOf("### Claude Code — recommended: plugin")
  const opencode = readme.indexOf("### OpenCode v2 — recommended: primary agent")
  assert.ok(claude >= 0)
  assert.ok(opencode >= 0)
  assert.ok(alternative > claude)
  assert.ok(alternative > opencode)
  assert.match(readme, /--skill planner/)
  assert.match(readme, /\/let-agent-plan:planner /)
  assert.doesNotMatch(readme, /let-agent-plan:let-agent-plan/)
  const maintenance = await read("AGENTS.md")
  assert.match(maintenance, /claude plugin tag \.\/claude --push/)
  assert.match(maintenance, /claude\/\.claude-plugin\/plugin.json/)
  assert.doesNotMatch(maintenance, /claude plugin tag \.claude-plugin/)
  for (const file of guides) {
    const text = await read(file)
    for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(link)) continue
      const [path, fragment] = link.split("#")
      const target = path ? resolve(root, dirname(file), path) : resolve(root, file)
      await stat(target)
      if (fragment && target.endsWith(".md")) {
        assert.ok(anchors(await readFile(target, "utf8")).has(decodeURIComponent(fragment)),
          `${file}: missing heading for ${link}`)
      }
    }
  }
})

test("both native starts precede the long example and describe the first request", async () => {
  const readme = await read("README.md")
  const example = readme.indexOf("## From an idea to decisions: a real example")
  const start = readme.slice(0, example)
  assert.ok(example > 0)
  assert.match(start, /claude plugin marketplace add furkankaynak\/let-agent-plan/)
  assert.match(start, /claude plugin install let-agent-plan@let-agent-plan/)
  assert.match(start, /raw\.githubusercontent\.com\/furkankaynak\/let-agent-plan\/main\/opencode\/agents\/planner\.md/)
  assert.match(start, /cd \/path\/to\/your-project/)
  assert.match(start, /\/let-agent-plan:planner Plan adding team invitations/)
  assert.match(start, /built-in Plan mode/)
  assert.match(start, /model access, usage limits and costs/)
  for (const file of ["claude/README.md", "opencode/README.md"]) {
    const text = await read(file)
    assert.match(text, /cd \/path\/to\/your-project/)
    assert.match(text, /Plan adding team invitations to this app\./)
    assert.match(text, /## What happens next/)
    assert.match(text, /## Troubleshooting/)
    assert.match(text, /first milestone/)
    assert.match(text, /migrate-from-the-old-skill-name/)
    assert.match(text, /full plan in chat/)
  }
})

test("documented symlink steps work with a checkout and no existing agent directory", {
  skip: process.platform === "win32" ? "The documented symlink alternative uses a POSIX shell" : false,
}, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "let-agent-plan-onboarding-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const home = join(directory, "home with spaces")
  const source = join(home, "let-agent-plan/opencode/agents/planner.md")
  await mkdir(dirname(source), { recursive: true })
  await writeFile(source, await read("opencode/agents/planner.md"))
  await assert.rejects(stat(join(home, ".config/opencode/agents")), { code: "ENOENT" })
  const guide = await read("opencode/README.md")
  const block = [...guide.matchAll(/```sh\n([\s\S]*?)```/g)]
    .map(([, commands]) => commands).find((commands) => commands.includes("ln -sf"))
  assert.ok(block, "Missing documented symlink installation")
  // The fixture represents the already-cloned checkout; no network or fake git.
  const commands = block.split("\n").filter((line) => !line.startsWith("git clone ")).join("\n")
  await exec("/bin/sh", ["-eu", "-c", commands], {
    cwd: directory, env: { ...process.env, HOME: home },
  })
  const target = join(home, ".config/opencode/agents/planner.md")
  assert.ok((await lstat(target)).isSymbolicLink())
  assert.equal(await realpath(target), await realpath(source))
  assert.equal(await readFile(target, "utf8"), artifact("opencode/agents/planner.md"))
})

test("social preview is a self-contained source and a GitHub-sized PNG", async () => {
  const svg = await read("assets/social/let-agent-plan.svg")
  assert.match(svg, /width="1280" height="640"/)
  assert.match(svg, /<title[^>]*>let-agent-plan/)
  assert.match(svg, /Claude Code/)
  assert.match(svg, /OpenCode v2/)
  assert.doesNotMatch(svg, /<script|<foreignObject|(?:href|src)=["']https?:/i)
  const png = await readFile(resolve(root, "assets/social/let-agent-plan.png"))
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  assert.equal(png.toString("ascii", 12, 16), "IHDR")
  assert.equal(png.readUInt32BE(16), 1280)
  assert.equal(png.readUInt32BE(20), 640)
  assert.ok(png.length < 1_000_000, "GitHub social previews must be under 1 MB")
})

test("standalone distributions include the repository license", async () => {
  const license = await read("LICENSE")
  assert.equal(await read("claude/LICENSE"), license)
  assert.equal(await read("skills/planner/LICENSE"), license)
})
