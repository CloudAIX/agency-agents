# 🔌 Agency Agents MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes The Agency's 100+ AI agent prompts to any MCP-compatible client — Claude Desktop, Kiro CLI, VS Code, Cursor, and more.

No installation scripts, no file copying. Just connect and use.

## Quick Start

```bash
cd mcp-server
npm install
npm run build
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agency-agents": {
      "command": "node",
      "args": ["/path/to/agency-agents/mcp-server/build/index.js"]
    }
  }
}
```

### Kiro CLI

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "agency-agents": {
      "command": "node",
      "args": ["/path/to/agency-agents/mcp-server/build/index.js"]
    }
  }
}
```

### VS Code / Cursor

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "agency-agents": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/agency-agents/mcp-server/build/index.js"]
    }
  }
}
```

## Tools

### `list_agents`

List all available agents, optionally filtered by division.

```
list_agents()                          → all 106 agents
list_agents(division: "engineering")   → 16 engineering agents
list_agents(division: "design")        → 8 design agents
```

### `get_agent`

Get the full prompt/content of a specific agent by name.

```
get_agent(name: "Frontend Developer")  → full agent prompt
get_agent(name: "SRE")                → fuzzy match works
```

### `search_agents`

Search agents by keyword across name, description, and content.

```
search_agents(query: "React")          → agents mentioning React
search_agents(query: "security")       → security-related agents
```

## Divisions

| Division | Agents |
|----------|--------|
| design | 8 |
| engineering | 16 |
| game-development | 19 |
| marketing | 18 |
| paid-media | 7 |
| sales | 8 |
| product | 4 |
| project-management | 6 |
| testing | 8 |
| support | 6 |
| spatial-computing | 6 |
| specialized | 14 |
