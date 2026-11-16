# let-agent-plan

A planning assistant that researches, plans and asks clarifying questions —
and never implements. Use the **Claude Code plugin** or the **OpenCode v2 primary
agent** for the harness-specific experience. A separate, portable skill is also
available through the [skills CLI](https://skills.sh/docs/cli).

The agent is named **`planner`**. In Claude Code it appears scoped under the
plugin name as `let-agent-plan:planner`.

---

## Claude Code — recommended: plugin

Install the plugin from the marketplace:

```sh
claude plugin marketplace add furkankaynak/let-agent-plan
claude plugin install let-agent-plan@let-agent-plan
```

**Recommended:** start Claude Code in normal mode (not built-in Plan mode),
then invoke the skill in your conversation:

```text
/let-agent-plan:planner plan this feature for me
```

The plugin installs both the skill and the existing agent. The skill starts
only when you invoke it and runs in the current conversation, not a forked
subagent, so questions and answers stay in the same session. It does not impose
tool restrictions; normal session permissions apply.

Claude Code namespaces plugin skills as `/plugin-name:skill-name`; the plugin's
skill is therefore `/let-agent-plan:planner`. There is no documented plugin
setting to remove that prefix. A standalone project or personal skill can be
invoked as `/planner` instead; see the [skill naming documentation](https://code.claude.com/docs/en/skills#where-skills-live).

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

See the [Claude Code guide](claude/README.md) for setup, updates and local use.

---

## OpenCode v2 — recommended: primary agent

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

Run OpenCode and switch to the `planner` agent (press **Tab** to cycle agents, or
pick it from the agent list). Or set it as the default in `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "planner"
}
```

See the [OpenCode guide](opencode/README.md) for setup and updates. The existing
`opencode/agents/planner.md` download and symlink paths are unchanged.

---

## What it does

- **Never implements.** It researches (files + web), plans and asks — it does
  not edit your source code. Its only write is the finished plan file (below).
- Saves each finished plan to a Markdown file in the project —
  `.opencode/plans/` (OpenCode), `.claude/plans/` (Claude plugin), or `plans/`
  (portable skill) — named
  `{yyyyMMddHHmm}-let-me-plan-{plan_name}.md`, so it survives the session.
- Four roles in one: Analyst, Product Owner, Scrum Master, Software Architect.
- Turns one idea into an approved, implementable plan in a single session.

The skills instruct the model not to implement; they do not enforce a tool
sandbox. Normal session permissions apply. The OpenCode agent additionally
declares edit permissions in its harness-specific configuration.

## Repo layout

```
src/prompt.md                              # shared prompt source
scripts/build.mjs                          # renderer + artifact frontmatter
scripts/harnesses.json                     # profile replacements and outputs
.claude-plugin/marketplace.json            # discovery entry, points to ./claude
claude/.claude-plugin/plugin.json          # Claude plugin manifest
claude/.claude-plugin/icon.png             # generated icon
claude/agents/planner.md                   # generated Claude agent
claude/skills/planner/SKILL.md              # generated Claude-only skill
claude/README.md                           # Claude guide
opencode/agents/planner.md                 # generated OpenCode agent
opencode/README.md                         # OpenCode guide
skills/planner/SKILL.md                     # generated portable skill
skills/planner/README.md                    # portable skill guide
```

The agents, skills and icon are generated. To regenerate them after editing
`src/prompt.md`, the build configuration or the icon design:

```sh
npm run build   # regenerate ALL four prompts, including the skills.sh skill
npm run icon    # regenerate the plugin icon
npm test        # build, compatibility and documentation checks
```

The build has independent Claude, OpenCode and generic profiles. A profile lists
its replacements and artifacts; an artifact selects its frontmatter separately.
New harnesses do not need an agent artifact just to produce a skill. Edit the
shared source/configuration, not the generated Markdown. See [AGENTS.md](AGENTS.md)
for validation and release instructions.

### Layout migration

The Claude plugin moved under `claude/`. Its marketplace name, plugin name and
`let-agent-plan:planner` agent are unchanged. Invoke the Claude skill as
`/let-agent-plan:planner`. Existing plugin users should update the marketplace and plugin; they
do not need a new marketplace registration. The old root `agents/planner.md`
path is no longer shipped. The portable variant lives under `skills/planner/`,
not inside the Claude plugin.

As of 0.1.8, every skill and agent is named `planner`. The Claude skill command
changes from `/let-agent-plan:plan` to `/let-agent-plan:planner`. Existing
standalone `let-agent-plan` skill installs need migration, not just an update:
remove the old skill in its installed scope and install `planner` instead. See
the [portable skill guide](skills/planner/README.md). The plugin and repository
names stay `let-agent-plan`; the Claude agent name is unchanged.

## Alternative: skill-only installation via skills.sh

**For Claude Code, prefer the plugin above. For OpenCode v2, prefer the primary
agent above.** Those are the harness-specific distributions. This alternative
installs only the portable skill, not the plugin or a primary agent.

Requires Node.js compatible with the skills CLI (the current upstream docs
specify 22.20+). Install from this public GitHub repository:

```sh
npx skills add furkankaynak/let-agent-plan --skill planner
```

Choose your agent when prompted. Installation is project-local by default;
add `-g` for a user-wide install. Do not install the portable skill alongside
the existing distribution in the same session unless you intentionally want
both variants.

The portable skill uses the current harness's question tool if available;
otherwise it asks in chat and waits for your answers. It saves plans to `plans/`
at the project root, or returns the full plan in chat if writing is blocked.
Invocation and permissions depend on your agent; compatibility is not guaranteed
for every agent supported by the installer.

See the [portable skill guide](skills/planner/README.md) for explicit agent
selection, updates and removal. The intended directory page is
[skills.sh/furkankaynak/let-agent-plan/planner](https://skills.sh/furkankaynak/let-agent-plan/planner).
Installation uses GitHub directly and does not depend on that page being indexed.
skills.sh lists skills through installation telemetry; visibility and cache
refreshes may lag behind a successful install. There is no separate npm publish.

## License

MIT
