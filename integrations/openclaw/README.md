# OpenClaw Integration

OpenClaw support is generated as per-agent workspaces. Each workspace contains
`SOUL.md`, `AGENTS.md`, and `IDENTITY.md` so persona and operational guidance
can be loaded separately.

## Generate

```bash
./scripts/convert.sh --tool openclaw
```

This writes generated workspaces to `integrations/openclaw/<agent-slug>/`.

## Install

```bash
./scripts/install.sh --tool openclaw
```

The installer copies generated workspaces to `~/.openclaw/agency-agents/`.
If the `openclaw` CLI is available, it also registers each workspace. Run
`openclaw gateway restart` after installation to activate the new agents.

## Regenerate After Changes

If you add or edit agents, regenerate the OpenClaw workspaces before
reinstalling:

```bash
./scripts/convert.sh --tool openclaw
./scripts/install.sh --tool openclaw
```
