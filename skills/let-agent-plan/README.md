# let-agent-plan — portable skill

Turn an idea into an approved, implementable plan without implementing it.
This is the portable, skill-only distribution for agents that support skills.

**Claude Code users should prefer the [Claude plugin](https://github.com/furkankaynak/let-agent-plan/tree/main/claude).
OpenCode v2 users should prefer the [primary agent](https://github.com/furkankaynak/let-agent-plan/tree/main/opencode).**
Those distributions have harness-specific question tools and plan directories.
This skill does not install a plugin or primary agent and does not enforce a
permission sandbox. Avoid installing both variants for the same session.

## Install

Requires Node.js supported by the skills CLI (currently documented as 22.20+).
Install from GitHub and choose your target agent:

```sh
npx skills add furkankaynak/let-agent-plan --skill let-agent-plan
```

For an explicit agent, use its CLI identifier; for example:

```sh
npx skills add furkankaynak/let-agent-plan --skill let-agent-plan -a codex
```

Installation is project-local by default. Add `-g` for a user-wide install.
For an explicit source that bypasses repository-wide discovery:

```sh
npx skills add https://github.com/furkankaynak/let-agent-plan/tree/main/skills/let-agent-plan
```

The repository also contains the Claude plugin's `plan` skill. The installer
can discover it through the marketplace, so `--skill let-agent-plan` explicitly
selects this portable distribution. Release checks verify the installed content.
Pointing the installer at `claude/` instead selects the Claude-specific distribution.

## Use

Invoke `let-agent-plan` using your agent's skill interface, then describe the
project or feature you want planned. For example: “Use let-agent-plan to plan
adding team invitations to this app. Do not implement it.” Activation syntax
and automatic triggering differ by agent.

The skill reads and researches before asking questions. If a callable question
tool exists, it uses it; otherwise it asks in the conversation. In either case
it waits for your answers before continuing. It confirms its understanding,
designs a proportionate solution and produces a plan with acceptance criteria.

Plans are saved at the project root as
`plans/{yyyyMMddHHmm}-let-me-plan-{plan_name}.md`. Existing files are not
overwritten. If the session cannot write there, it returns the full plan in chat
and reports that saving failed. It stops for approval without implementing.
Your agent's normal permissions still apply; do not enable a separate built-in
planning mode if that mode prevents the required interaction or plan-file write.

## Update or remove

```sh
npx skills check
npx skills update let-agent-plan
npx skills remove let-agent-plan
```

For global installs, select global scope when updating and use `-g` when
removing. See the [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)
for current options and [supported agents](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)
for identifiers. An agent being supported by the installer is not a guarantee
that this workflow has been tested on it.

## Discovery and maintenance

The intended listing is [skills.sh](https://skills.sh/furkankaynak/let-agent-plan/let-agent-plan).
The CLI installs from GitHub even if the directory page has not appeared yet.
Listing is driven by installation telemetry and can lag due to processing and
caching. There is no separate package publication or guaranteed indexing time.

This README is the portable distribution's guide; skills.sh does not document
an option to substitute it for the repository README. Its skill page displays
`SKILL.md` content. Keep the guides separate without assuming custom rendering.

`SKILL.md` is generated from the same prompt source as the native distributions
on every repository build. Do not edit it directly. Source and maintenance
instructions live in the [GitHub repository](https://github.com/furkankaynak/let-agent-plan).
