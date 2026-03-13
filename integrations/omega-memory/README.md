# OMEGA — Persistent MCP Memory Server for AI Coding Agents

> Long-term memory for Claude Code, Cursor, Windsurf, and any MCP-compatible AI coding assistant. Local-first, offline, no API keys required.

## What It Does

[OMEGA](https://github.com/omega-memory/omega-memory) is an open-source MCP memory server that gives AI coding agents persistent, semantically searchable memory across sessions. It runs locally on SQLite — your data never leaves your machine.

Unlike simple key-value memory stores or conversation history workarounds, OMEGA provides:

- **Semantic search**: Query memories by meaning, not just keywords. Local ONNX embeddings find relevant context even when the wording differs — no API calls, no cloud dependency.
- **Typed memories**: Store decisions, lessons learned, error patterns, user preferences, and session summaries as distinct types with different retention behaviors.
- **Memory decay and consolidation**: Low-value memories fade over time. Important memories are reinforced through access. The memory store stays relevant without manual pruning.
- **Contradiction detection**: When a new memory conflicts with an existing one, OMEGA flags the contradiction so agents don't act on stale information.
- **Cross-session continuity**: Agents pick up exactly where they left off. Checkpoint a task mid-session, resume it days later.
- **Multi-agent coordination**: Memories are scoped by agent type, entity, and project. Multiple agents share a memory store without stepping on each other.

### Why OMEGA over other memory solutions?

| | OMEGA | Generic MCP memory | No memory (default) |
|---|---|---|---|
| Semantic search | Local embeddings (ONNX) | Keyword only | N/A |
| Memory types | 6 types with different behaviors | Untyped blobs | N/A |
| Decay/consolidation | Automatic | Manual cleanup | N/A |
| Contradiction detection | Built-in | No | N/A |
| Cross-session resume | Checkpoint/resume API | Manual | Lost on session end |
| Privacy | 100% local, SQLite, offline | Varies | N/A |
| API keys required | None | Varies | N/A |

## Setup

### Requirements

- Python 3.11+
- Any MCP-compatible client: Claude Code, Cursor, Windsurf, Zed, or any tool supporting the Model Context Protocol

### Install

```bash
pip install omega-memory
```

Or run the setup script:

```bash
./integrations/omega-memory/setup.sh
```

### Configure Your MCP Client

Add OMEGA to your MCP client config. For Claude Code (`~/.claude.json`):

```json
{
  "mcpServers": {
    "omega": {
      "command": "python3.11",
      "args": ["-m", "omega.server.mcp_server"]
    }
  }
}
```

For other clients, adapt the command/args to your MCP config format.

## Available Tools

OMEGA exposes these MCP tools:

| Tool | Description |
|------|-------------|
| `omega_store` | Store a memory with type, metadata, priority, and entity/project scoping |
| `omega_query` | Search memories by semantic similarity, exact phrase, timeline, or browse by type |
| `omega_welcome` | Session greeting with context briefing from recent memories |
| `omega_protocol` | Returns the agent's operating protocol and instructions |
| `omega_profile` | Load or update an entity/project profile |
| `omega_checkpoint` | Save current task state for later resumption |
| `omega_resume_task` | Resume a previously checkpointed task |
| `omega_memory` | Direct memory operations (read, update, delete) |
| `omega_remind` | Set and retrieve reminders |
| `omega_maintain` | Run maintenance operations (decay, consolidation, cleanup) |
| `omega_stats` | Memory store statistics and health metrics |
| `omega_lessons` | Cross-session lessons ranked by access frequency |

## How to Add OMEGA Memory to Any Agent

Add a **Memory Integration** section to an agent's prompt. See [memory-section-template.md](memory-section-template.md) for a ready-to-use template.

The key differences from generic MCP memory instructions:

1. **Use typed storage**: Instead of generic `remember`, use `omega_store` with `event_type` to categorize what you're storing (decision, lesson_learned, error_pattern, user_preference).
2. **Use semantic search**: `omega_query` with mode `semantic` finds relevant memories even when the exact wording differs from what was stored.
3. **Use checkpoints**: `omega_checkpoint` and `omega_resume_task` handle mid-session saves and cross-session continuity without manual bookkeeping.
4. **Session start protocol**: Call `omega_welcome()` at session start to get a context briefing, then `omega_protocol()` for operating instructions.

## How It Enhances Agency Agents

When agents in The Agency use OMEGA:

- **Session continuity**: An agent resumes work without re-explaining context. The Backend Architect remembers the database schema it designed last week.
- **Cross-agent handoffs**: When the Backend Architect hands off to the Frontend Developer, the API spec is already in memory, tagged and searchable.
- **Learning from mistakes**: Error patterns and lessons learned persist. An agent that hit a race condition once will remember the fix next time.
- **Decision tracking**: Architecture decisions, their reasoning, and their outcomes are stored and searchable. No more re-litigating settled questions.

## Example: Memory-Enhanced Workflow

```
Session 1 (Backend Architect):
  -> omega_welcome() — gets context from prior sessions
  -> Designs API schema
  -> omega_store("API uses REST with JWT auth, rate limited at 100 req/min",
                  event_type="decision", metadata={"project": "acme"})
  -> omega_checkpoint("api-design-phase-1")

Session 2 (Frontend Developer):
  -> omega_welcome() — sees the Backend Architect's API decisions
  -> omega_query("API authentication approach", mode="semantic")
  -> Builds the frontend against the documented API contract
```

## Supported MCP Clients

OMEGA works with any client that supports the Model Context Protocol:

- **Claude Code** (Anthropic CLI)
- **Cursor**
- **Windsurf**
- **Zed**
- **Any MCP-compatible editor or agent framework**

## Links

- **GitHub**: [omega-memory/omega-memory](https://github.com/omega-memory/omega-memory)
- **PyPI**: [omega-memory](https://pypi.org/project/omega-memory/)
- **Skills**: [omega-memory/omega-skills](https://github.com/omega-memory/omega-skills) — battle-tested Claude Code skills enhanced by OMEGA memory
- **Documentation**: See the GitHub README for full setup and usage guide
