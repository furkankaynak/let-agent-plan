# let-agent-plan

A read-only plan-mode AI agent that researches, plans and asks clarifying
questions — and never implements. It runs as a **primary agent** in OpenCode v2
and as a **subagent** (or main session agent) in Claude Code.

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

### 2. Install this agent from the marketplace

```sh
claude plugin marketplace add furkankaynak/let-agent-plan
claude plugin install let-agent-plan@let-agent-plan
```

### 3. Use it

Run Claude Code with the agent as the main session agent:

```sh
claude --agent let-agent-plan:planner
```

Or start Claude Code normally and mention it as a subagent in your prompt:

```text
@let-agent-plan:planner plan this feature for me
```

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

- **Never implements.** Read-only: it researches (files + web), plans and asks —
  it does not edit your code.
- Four roles in one: Analyst, Product Owner, Scrum Master, Software Architect.
- Turns one idea into an approved, implementable plan in a single session.

## Repo layout

```
src/prompt.md                   # single source of truth (the agent's system prompt)
scripts/build.mjs               # generates the two artifacts below
opencode/agents/planner.md      # OpenCode v2 artifact (generated)
agents/planner.md               # Claude Code artifact (generated)
.claude-plugin/plugin.json      # Claude Code plugin manifest
.claude-plugin/marketplace.json # Claude Code marketplace catalog
.claude-plugin/icon.png         # plugin icon (generated)
scripts/gen-icon.mjs            # generates the plugin icon
```

The agent files and the icon are generated. To regenerate them after editing
`src/prompt.md` or the icon design:

```sh
npm run build   # regenerate the agent artifacts
npm run icon    # regenerate the plugin icon
```

## License

MIT
