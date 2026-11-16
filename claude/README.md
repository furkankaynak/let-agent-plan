# let-agent-plan for Claude Code

**Recommended for Claude Code:** install the plugin, not the portable skills.sh
variant. The plugin includes a manually invoked inline skill and the `planner`
agent, both configured for Claude's question tool and `.claude/plans/` directory.

## Install Claude Code

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
brew install --cask claude-code
npm install -g @anthropic-ai/claude-code
claude --version
```

## Install the plugin

```sh
claude plugin marketplace add furkankaynak/let-agent-plan
claude plugin install let-agent-plan@let-agent-plan
```

Start a normal Claude session (not built-in Plan mode), then invoke:

```text
/let-agent-plan:planner plan this feature for me
```

The skill runs in the current conversation, starts only when invoked and uses
normal session permissions. It does not impose a tool sandbox. It researches,
asks questions, produces a plan and stops without implementing.

Alternatively, start the agent as the main session agent:

```sh
claude --agent let-agent-plan:planner
```

The agent also appears as `@let-agent-plan:planner`, but subagents cannot call
`AskUserQuestion`. Use the inline skill or the main session agent for interactive
planning. Saving to `.claude/plans/` requires approval; if blocked, the full plan
is delivered in chat.

## Why the plugin prefix?

Claude Code loads plugin skills under `/plugin-name:skill-name`, so the skill
command is `/let-agent-plan:planner`. There is no documented manifest option to
export it as an unscoped `/planner`. The agent is also named `planner`, but it
is a separate component, selected with `--agent` or `@let-agent-plan:planner`.

For `/planner` without a prefix, install a standalone skill under your project's
`.claude/skills/planner/` or your personal `~/.claude/skills/planner/`, rather than
as a plugin skill. The [portable distribution](../skills/planner/README.md) is
one option; it uses `plans/` and a generic question policy instead of the
Claude-specific profile. Avoid loading both variants in the same session.
See [Claude's skills documentation](https://code.claude.com/docs/en/skills#where-skills-live).

## Update

```sh
claude plugin marketplace update let-agent-plan
claude plugin update let-agent-plan@let-agent-plan
```

Start a new session or reload plugins to use the updated copy. Moving the plugin
into `claude/` does not require re-registering the marketplace. The skill command
is `/let-agent-plan:planner`; the agent remains `let-agent-plan:planner`.
From 0.1.8 onward, use this skill command instead of the former
`/let-agent-plan:plan` command.
Direct references to the former root agent file must use the new path.

## Local development

From the repository root, build and validate both the marketplace and plugin:

```sh
npm run build
claude plugin validate .
claude plugin validate ./claude
claude --plugin-dir ./claude
```

The root marketplace points to this directory. This package is self-contained:
the root portable skill is not part of it. Do not hand-edit the generated agent
or skill. See the [repository guide](../README.md) and [maintenance guide](../AGENTS.md)
for build and release details.
