# 🔌 Integrations

This directory contains converted integration assets and installation notes for
the current Agency roster.

## Supported Tools

- **[Claude Code](#claude-code)** — `.md` agents, use the repo directly
- **[GitHub Copilot](#github-copilot)** — native `.md` agents, no conversion needed
- **[Antigravity](#antigravity)** — `SKILL.md` per agent in `antigravity/`
- **[Gemini CLI](#gemini-cli)** — extension + `SKILL.md` files in `gemini-cli/`
- **[OpenCode](#opencode)** — `.md` agent files in `opencode/`
- **[OpenClaw](#openclaw)** — generated workspaces for `~/.openclaw/agency-agents/`
- **[Cursor](#cursor)** — `.mdc` rule files in `cursor/`
- **[Aider](#aider)** — `CONVENTIONS.md` in `aider/`
- **[Windsurf](#windsurf)** — `.windsurfrules` in `windsurf/`

## Quick Install

```bash
# Install for all detected tools automatically
./scripts/install.sh

# Install for a specific tool
./scripts/install.sh --tool claude-code
./scripts/install.sh --tool copilot
./scripts/install.sh --tool antigravity
./scripts/install.sh --tool gemini-cli
./scripts/install.sh --tool opencode
./scripts/install.sh --tool openclaw
./scripts/install.sh --tool cursor
./scripts/install.sh --tool aider
./scripts/install.sh --tool windsurf
```

## Regenerating Integration Files

If you add or modify agents, regenerate all integration files:

```bash
./scripts/convert.sh
```

---

## Claude Code

The Agency was originally designed for Claude Code. Agents work natively
without conversion.

```bash
cp -r <category>/*.md ~/.claude/agents/
# or install everything at once:
./scripts/install.sh --tool claude-code
```

See [claude-code/README.md](claude-code/README.md) for details.

---

## GitHub Copilot

The Agency also works natively with GitHub Copilot using the same `.md` + YAML
frontmatter files used for Claude Code.

```bash
./scripts/install.sh --tool copilot
```

See [github-copilot/README.md](github-copilot/README.md) for details.

---

## Antigravity

Skills are installed to `~/.gemini/antigravity/skills/`. Each agent becomes
a separate skill prefixed with `agency-` to avoid naming conflicts.

```bash
./scripts/install.sh --tool antigravity
```

See [antigravity/README.md](antigravity/README.md) for details.

---

## Gemini CLI

Agents are packaged as a Gemini CLI extension with individual skill files.
The extension is installed to `~/.gemini/extensions/agency-agents/`.

```bash
./scripts/install.sh --tool gemini-cli
```

See [gemini-cli/README.md](gemini-cli/README.md) for details.

---

## OpenCode

OpenCode agents are generated as `.md` files in `.opencode/agents/`. This is a
project-scoped install, so run the installer from your project root.

```bash
cd /your/project && /path/to/agency-agents/scripts/install.sh --tool opencode
```

See [opencode/README.md](opencode/README.md) for details.

---

## OpenClaw

OpenClaw support is generated on demand and installs agent workspaces into
`~/.openclaw/agency-agents/`.

```bash
./scripts/convert.sh --tool openclaw
./scripts/install.sh --tool openclaw
```

The installer also registers generated workspaces with OpenClaw when the
`openclaw` CLI is available. Run `openclaw gateway restart` after installation
to activate the new agents.

See [openclaw/README.md](openclaw/README.md) for details.

---

## Cursor

Each agent becomes a `.mdc` rule file. Rules are project-scoped — run the
installer from your project root.

```bash
cd /your/project && /path/to/agency-agents/scripts/install.sh --tool cursor
```

See [cursor/README.md](cursor/README.md) for details.

---

## Aider

All agents are consolidated into a single `CONVENTIONS.md` file that Aider
reads automatically when present in your project root.

```bash
cd /your/project && /path/to/agency-agents/scripts/install.sh --tool aider
```

See [aider/README.md](aider/README.md) for details.

---

## Windsurf

All agents are consolidated into a single `.windsurfrules` file for your
project root.

```bash
cd /your/project && /path/to/agency-agents/scripts/install.sh --tool windsurf
```

See [windsurf/README.md](windsurf/README.md) for details.
