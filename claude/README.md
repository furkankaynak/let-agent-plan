# let-agent-plan for Claude Code

**Recommended for Claude Code:** install the plugin, not the portable skills.sh
variant. The plugin includes a manually invoked inline skill and the `planner`
agent, both configured for Claude's question tool and `.claude/plans/` directory.

You need Claude Code installed and signed in with model access. The planner is
MIT licensed; Claude's usage limits and model costs still apply.
[Need Claude Code itself?](#install-claude-code)

## Start your first plan

### 1. Install the plugin

Run these commands in your terminal; no clone is needed:

```sh
claude plugin marketplace add furkankaynak/let-agent-plan
claude plugin install let-agent-plan@let-agent-plan
```

### 2. Open the project you want to plan

Use your app's directory, not this plugin's checkout. For a new project, create
and open an empty target directory first.

```sh
cd /path/to/your-project
claude
```

Start a **normal session, not built-in Plan mode**: the planner supplies the
planning workflow. If you installed while Claude was already open, run
`/reload-plugins` or start a new session.

### 3. Describe one concrete feature or idea

Invoke the inline skill in your conversation, for example:

```text
/let-agent-plan:planner Plan adding team invitations to this app. Read the existing code first. Help me define a small v1. Do not implement anything.
```

The skill runs in the current conversation, starts only when invoked and uses
normal session permissions. It does not impose a tool sandbox or implement your
feature. Replace the example with your own feature or new-project idea.

## What happens next

1. **Research:** the planner reads the relevant project context.
2. **Understanding map:** you see what is known, assumed and still open.
3. **Questions:** answer the decision questions; they can change the scope.
4. **Scope confirmation:** confirm the understanding before design starts.
5. **Full plan:** review the design, milestones, dependencies and acceptance criteria.

This needs your answers, not just one prompt. There is no fixed question count
or completion time; the team-invitations request is a suggested first exercise,
not a recorded result.

Saving to `.claude/plans/` requires approval. The filename follows
`{yyyyMMddHHmm}-let-me-plan-{plan_name}.md`. After saving, the planner reports the
path and presents the same full plan in chat, including all sections and
diagrams, before asking for plan approval. If saving is blocked, it still
delivers the full plan in chat and reports that it wasn't saved.

Approve the plan or ask for changes. When ready to build, start a **separate
implementation session**, provide the saved path (or paste the plan), and ask:

> Read the approved plan and implement only its first milestone. Keep later
> milestones out of scope.

The planner itself stops at planning; it does not implement the approved plan.

## Alternatives and naming

Alternatively, start the agent as the main session agent:

```sh
claude --agent let-agent-plan:planner
```

The agent also appears as `@let-agent-plan:planner`, but subagents cannot call
`AskUserQuestion`. Use the inline skill above or the main session agent for
interactive planning, not a delegated subagent.

### Why the plugin prefix?

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

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| The skill command is missing | Check `claude plugin list` for `let-agent-plan@let-agent-plan`; reload plugins or start a new session after installation. Use the full `/let-agent-plan:planner` name. |
| You used the old `/let-agent-plan:plan` command | Update the plugin and use `/let-agent-plan:planner`; the plugin/repository name has not changed. |
| Questions or the plan-file write are blocked | Start a normal session, not built-in Plan mode, and invoke the inline skill rather than delegating to `@let-agent-plan:planner`. Normal session permissions still apply. |
| The planner is reading the wrong code | Start a new session in your target app directory and invoke the skill there. |
| You denied the plan-file write | Read the full plan in chat; it should explicitly say it wasn't saved. You can hand that text to a separate implementation session. |
| You installed the old standalone skill | Follow the [portable skill migration](../skills/planner/README.md#migrate-from-the-old-skill-name), not plugin removal. Avoid loading both distributions in one session. |

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

## Install Claude Code

Skip this if Claude Code already works on your machine. Install and sign in
following the [official setup guide](https://code.claude.com/docs/en/setup).

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
