# let-agent-cook

A kitchen of ready-to-use AI agents. One command to install, zero config.

Ships **`let-me-plan`** — a read-only plan-mode agent that researches, plans and
asks clarifying questions, and never implements. It runs as a **primary agent**
in OpenCode v2 and as a **subagent** (or main session agent) in Claude Code.

---

## Install

### OpenCode v2

Copy (or symlink) the agent into your global agents directory:

```sh
mkdir -p ~/.config/opencode/agents
cp opencode/agents/let-me-plan.md ~/.config/opencode/agents/let-me-plan.md

# or, to keep it linked to this checkout:
ln -sf "$PWD/opencode/agents/let-me-plan.md" ~/.config/opencode/agents/let-me-plan.md
```

Then open OpenCode and switch to the `let-me-plan` agent (Tab / agent picker),
or set it as the default in `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "let-me-plan"
}
```

### Claude Code

Register the marketplace and install the plugin:

```sh
claude plugin marketplace add furkankaynak/let-agent-cook
claude plugin install let-agent-cook@let-agent-cook
```

Use it as the main session agent:

```sh
claude --agent let-agent-cook:let-me-plan
```

Or invoke it as a subagent with `@let-agent-cook:let-me-plan` in the prompt.

> If your fork lives under a different GitHub owner, swap `furkankaynak` in the
> `marketplace add` command for your own.

---

## What let-me-plan does

- **Never implements.** Read-only: it researches (files + web), plans and asks —
  it does not edit your code.
- Four roles in one: Analyst, Product Owner, Scrum Master, Software Architect.
- Turns one idea into an approved, implementable plan in a single session.

## Repo layout

```
src/prompt.md                      # single source of truth (the agent's system prompt)
scripts/build.mjs                  # generates the two artifacts below
opencode/agents/let-me-plan.md     # OpenCode v2 artifact (generated)
agents/let-me-plan.md              # Claude Code artifact (generated)
.claude-plugin/plugin.json         # Claude Code plugin manifest
.claude-plugin/marketplace.json    # Claude Code marketplace catalog
```

The two agent files are generated. To regenerate them after editing
`src/prompt.md`:

```sh
npm run build
```

## License

MIT
