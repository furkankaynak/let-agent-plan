# let-agent-plan for OpenCode v2

**Recommended for OpenCode v2:** install the primary `planner` agent rather than
the portable skills.sh variant. It uses OpenCode's `question` tool, saves plans
to `.opencode/plans/` and declares harness-specific edit permissions.

## Install OpenCode v2

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

## Install the agent

```sh
mkdir -p ~/.config/opencode/agents
curl -fsSL https://raw.githubusercontent.com/furkankaynak/let-agent-plan/main/opencode/agents/planner.md \
  -o ~/.config/opencode/agents/planner.md
```

Or clone and symlink:

```sh
git clone https://github.com/furkankaynak/let-agent-plan.git ~/let-agent-plan
ln -sf "$HOME/let-agent-plan/opencode/agents/planner.md" ~/.config/opencode/agents/planner.md
```

## Use and update

Switch to `planner` in OpenCode's agent list, or set `default_agent` to `planner`
in your OpenCode configuration. It researches, asks and writes the finished plan;
it does not implement source changes.

To update a downloaded copy, repeat the download. For a symlinked checkout, pull
the latest repository changes. Start a fresh session to pick up the new prompt.
The existing artifact path and installation method are unchanged.

See the [repository guide](../README.md) for default-agent configuration and
the [maintenance guide](../AGENTS.md) for build details.
