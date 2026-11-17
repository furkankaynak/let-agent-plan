# let-agent-plan for OpenCode v2

**Recommended for OpenCode v2:** install the primary `planner` agent rather than
the portable skills.sh variant. It uses OpenCode's `question` tool, saves plans
to `.opencode/plans/` and declares harness-specific edit permissions.

You need OpenCode **v2** installed with a working model connection. The planner
is MIT licensed; your provider's usage limits and model costs still apply.
[Need OpenCode v2 itself?](#install-opencode-v2)

## Start your first plan

### 1. Install the agent

Run this in your terminal (macOS / Linux); no clone is needed. If you already
have a custom `~/.config/opencode/agents/planner.md`, back it up first: this
replaces that file. If you use `XDG_CONFIG_HOME`, use its `opencode/agents/`
directory instead of the default `~/.config/opencode/agents/` in these commands.

```sh
mkdir -p ~/.config/opencode/agents
curl -fsSL https://raw.githubusercontent.com/furkankaynak/let-agent-plan/main/opencode/agents/planner.md \
  -o ~/.config/opencode/agents/planner.md
```

### 2. Open the project you want to plan

Use your app's directory, not the planner's checkout. For a new project, create
and open an empty target directory first.

```sh
cd /path/to/your-project
opencode
```

Select **`planner`** from the agent list, not the built-in `plan` agent. The
planner provides its own research-and-question workflow.

### 3. Describe one concrete feature or idea

Send an ordinary message; no skill slash command is needed:

```text
Plan adding team invitations to this app. Read the existing code first. Help me define a small v1. Do not implement anything.
```

Replace the example with your own feature or new-project idea.

## What happens next

1. **Research:** the planner reads the relevant project context.
2. **Understanding map:** you see what is known, assumed and still open.
3. **Questions:** answer the decision questions; they can change the scope.
4. **Scope confirmation:** confirm the understanding before design starts.
5. **Full plan:** review the design, milestones, dependencies and acceptance criteria.

This needs your answers, not just one prompt. There is no fixed question count
or completion time; the team-invitations request is a suggested first exercise,
not a recorded result.

Plans are saved inside your project at
`.opencode/plans/{yyyyMMddHHmm}-let-me-plan-{plan_name}.md`.
After saving, the planner reports the path and presents the same full plan in
chat, including all sections and diagrams, before asking for approval through
the `question` tool. If saving fails, it still delivers the full plan in chat and
reports that it wasn't saved. It does not implement source changes.

Approve the plan or ask for changes. When ready to build, start a **separate
implementation session** with an implementation-capable agent, provide the
saved path (or paste the plan), and ask:

> Read the approved plan and implement only its first milestone. Keep later
> milestones out of scope.

The planner itself stops at planning; it does not implement the approved plan.

## Alternatives

### Clone and symlink

Use this instead of the direct download if you want a checkout you can update.
The same `planner.md` overwrite warning applies; back up any custom agent first.
If `~/let-agent-plan` is already your clone, skip the clone command.

```sh
git clone https://github.com/furkankaynak/let-agent-plan.git ~/let-agent-plan
mkdir -p ~/.config/opencode/agents
ln -sf "$HOME/let-agent-plan/opencode/agents/planner.md" ~/.config/opencode/agents/planner.md
```

### Make planner the default

This is optional. Merge the setting into your existing `opencode.jsonc` rather
than replacing unrelated configuration:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "planner"
}
```

This selects the default for sessions without an explicitly selected agent; it
does not replace the agent already selected in an existing session. See
[OpenCode's agent guide](https://opencode.ai/v2/docs/agents#selection).

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `planner` is missing from the agent list | Check the downloaded/symlinked file under your global `opencode/agents/` directory and that you are running v2. With a custom `XDG_CONFIG_HOME`, check that location. Use `/reload` to force a reload. |
| You selected `plan`, or used a skill command | Select the primary agent named `planner` and send a normal message. The portable skill is a different distribution. |
| The planner is reading the wrong code | Open a new session in your target app directory, not this repository. |
| A custom `planner.md` was already present | Restore your backup if needed; don't overwrite an unrelated agent without reviewing it. |
| Saving the plan is blocked | Check your normal session permissions; the full plan should still appear in chat with an explicit save-failure message. |
| An old skill listing says `let-agent-plan` | The current skill name is `planner`; see the [portable migration guide](../skills/planner/README.md#migrate-from-the-old-skill-name) only if you installed that standalone skill. |

## Update

To update a downloaded copy, repeat the download. For a symlinked checkout, pull
the latest repository changes. OpenCode reloads agent files when they change;
use `/reload` to force a full reload if needed.
The existing artifact path and installation method are unchanged.

## Install OpenCode v2

Skip this if v2 already works on your machine. See the
[official OpenCode v2 guide](https://opencode.ai/v2/docs/) for setup and provider access.

macOS / Linux:

```sh
curl -fsSL https://opencode.ai/v2/install | bash
```

Other options:

```sh
npm install -g @opencode/cli
bun install -g --trust @opencode/cli
brew install anomalyco/tap/opencode-v2
opencode --version
```

Use v2. The unversioned install URL, `opencode-ai` npm package and `opencode`
Homebrew formula install OpenCode 1, which this agent does not target.

See the [repository guide](../README.md) for the real demo and plan excerpts,
and the [maintenance guide](../AGENTS.md) for build details.
