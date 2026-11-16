# let-agent-plan

A planning assistant that researches, plans and asks clarifying questions —
and never implements. It runs as a **primary agent** in OpenCode v2. The Claude
Code plugin includes both an **inline skill** (recommended) and an **agent**.

The agent is named **`planner`**. In Claude Code it appears scoped under the
plugin name as `let-agent-plan:planner`.

---

## Claude Code

### 1. Install Claude Code (if you don't have it)

macOS / Linux:

```sh
curl -fsSL https://claude.ai/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://claude.ai/install.ps1 | iex
```

Other options:

```sh
brew install --cask claude-code               # macOS with Homebrew
npm install -g @anthropic-ai/claude-code      # requires Node.js 22+
```

Check it works:

```sh
claude --version
```

### 2. Install the plugin from the marketplace

```sh
claude plugin marketplace add furkankaynak/let-agent-plan
claude plugin install let-agent-plan@let-agent-plan
```

### 3. Use it

**Recommended:** start Claude Code in normal mode (not built-in Plan mode),
then invoke the skill in your conversation:

```text
/let-agent-plan:let-agent-plan plan this feature for me
```

The plugin installs both the skill and the existing agent. The skill starts
only when you invoke it and runs in the current conversation, not a forked
subagent, so questions and answers stay in the same session. It does not impose
tool restrictions; normal session permissions apply.

Alternatively, run the existing agent as the main session agent:

```sh
claude --agent let-agent-plan:planner
```

> [!NOTE]
> The agent remains available as `@let-agent-plan:planner`, but subagents
> cannot call `AskUserQuestion`. For interactive planning, use the skill above
> or run the agent as the main session.
>
> Saving to `.claude/plans/` is a protected-path write, so Claude Code asks for
> your approval before creating the plan file. If saving is denied or blocked,
> the full plan is still delivered in chat.

---

## OpenCode v2

### 1. Install OpenCode v2 (if you don't have it)

macOS / Linux:

```sh
curl -fsSL https://opencode.ai/v2/install | bash
```

Other options:

```sh
npm install -g @opencode/cli                  # requires Node.js
bun install -g --trust @opencode/cli          # or bun
brew install anomalyco/tap/opencode-v2        # macOS with Homebrew
```

> **Use v2.** The `curl -fsSL https://opencode.ai/install | bash`,
> `npm install -g opencode-ai`, and `brew install anomalyco/tap/opencode`
> commands install OpenCode 1. This agent targets v2, so use the `/v2/install`
> URL, `@opencode/cli`, or the `opencode-v2` tap above.

Check it works:

```sh
opencode --version
```

### 2. Install the agent

One-liner (no clone needed):

```sh
mkdir -p ~/.config/opencode/agents
curl -fsSL https://raw.githubusercontent.com/furkankaynak/let-agent-plan/main/opencode/agents/planner.md \
  -o ~/.config/opencode/agents/planner.md
```

Or clone the repo and symlink it (easier to keep updated):

```sh
git clone https://github.com/furkankaynak/let-agent-plan.git ~/let-agent-plan
ln -sf "$HOME/let-agent-plan/opencode/agents/planner.md" ~/.config/opencode/agents/planner.md
```

### 3. Use it

Run OpenCode and switch to the `planner` agent (press **Tab** to cycle agents, or
pick it from the agent list). Or set it as the default in `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "planner"
}
```

---

## What it does

- **Never implements.** It researches (files + web), plans and asks — it does
  not edit your source code. Its only write is the finished plan file (below).
- Saves each finished plan to a Markdown file in the project —
  `.opencode/plans/` (OpenCode) or `.claude/plans/` (Claude Code) — named
  `{yyyyMMddHHmm}-let-me-plan-{plan_name}.md`, so it survives the session.
- Four roles in one: Analyst, Product Owner, Scrum Master, Software Architect.
- Turns one idea into an approved, implementable plan in a single session.

## Repo layout

```
src/prompt.md                   # single source of truth (the agent's system prompt)
scripts/build.mjs               # generates the agents and skill below
scripts/harnesses.json          # per-harness artifact path, question tool, plans dir
opencode/agents/planner.md      # OpenCode v2 artifact (generated)
agents/planner.md               # Claude Code artifact (generated)
skills/let-agent-plan/SKILL.md   # Claude Code inline skill (generated)
.claude-plugin/plugin.json      # Claude Code plugin manifest
.claude-plugin/marketplace.json # Claude Code marketplace catalog
.claude-plugin/icon.png         # plugin icon (generated)
scripts/gen-icon.mjs            # generates the plugin icon
```

The agents, skill and icon are generated. To regenerate them after editing
`src/prompt.md`, the build configuration or the icon design:

```sh
npm run build   # regenerate the agent and skill artifacts
npm run icon    # regenerate the plugin icon
```

## License

MIT
