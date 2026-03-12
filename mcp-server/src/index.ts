#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Agent loading
// ---------------------------------------------------------------------------

interface Agent {
  name: string;
  description: string;
  emoji: string;
  division: string;
  file: string;
  body: string;
}

const DIVISIONS = [
  "design", "engineering", "game-development", "marketing", "paid-media",
  "sales", "product", "project-management", "testing", "support",
  "spatial-computing", "specialized",
];

function parseAgent(filePath: string, division: string): Agent | null {
  const content = readFileSync(filePath, "utf-8");
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2].trim();

  const get = (key: string) => {
    const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].replace(/^["']|["']$/g, "") : "";
  };

  const name = get("name");
  if (!name) return null;

  return { name, description: get("description"), emoji: get("emoji"), division, file: filePath, body };
}

function loadAgents(repoRoot: string): Agent[] {
  const agents: Agent[] = [];
  for (const div of DIVISIONS) {
    const dirPath = join(repoRoot, div);
    if (!existsSync(dirPath)) continue;
    for (const f of readdirSync(dirPath).filter(f => f.endsWith(".md")).sort()) {
      const agent = parseAgent(join(dirPath, f), div);
      if (agent) agents.push(agent);
    }
  }
  return agents;
}

// ---------------------------------------------------------------------------
// Resolve repo root (mcp-server lives inside the repo)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const agents = loadAgents(repoRoot);

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({ name: "agency-agents", version: "1.0.0" });

// --- list_agents ---
server.registerTool(
  "list_agents",
  {
    description: "List all available agents. Optionally filter by division.",
    inputSchema: z.object({
      division: z.string().optional().describe("Filter by division name (e.g. 'engineering', 'design')"),
    }),
  },
  async ({ division }) => {
    let results = agents;
    if (division) {
      const d = division.toLowerCase();
      results = agents.filter(a => a.division === d);
    }
    const text = results.length === 0
      ? `No agents found${division ? ` in division '${division}'` : ""}.`
      : results.map(a => `${a.emoji} ${a.name} [${a.division}] — ${a.description}`).join("\n");
    return { content: [{ type: "text", text: `${results.length} agent(s):\n\n${text}` }] };
  },
);

// --- get_agent ---
server.registerTool(
  "get_agent",
  {
    description: "Get the full prompt/content of a specific agent by name.",
    inputSchema: z.object({
      name: z.string().describe("Agent name (e.g. 'Frontend Developer', 'SRE')"),
    }),
  },
  async ({ name }) => {
    const q = name.toLowerCase();
    const agent = agents.find(a => a.name.toLowerCase() === q)
      || agents.find(a => a.name.toLowerCase().includes(q));
    if (!agent) {
      return { content: [{ type: "text", text: `Agent '${name}' not found. Use list_agents to see available agents.` }] };
    }
    return { content: [{ type: "text", text: `# ${agent.emoji} ${agent.name}\n**Division:** ${agent.division}\n**Description:** ${agent.description}\n\n${agent.body}` }] };
  },
);

// --- search_agents ---
server.registerTool(
  "search_agents",
  {
    description: "Search agents by keyword in name, description, or content.",
    inputSchema: z.object({
      query: z.string().describe("Search keyword (e.g. 'React', 'security', 'API')"),
    }),
  },
  async ({ query }) => {
    const q = query.toLowerCase();
    const results = agents.filter(a =>
      a.name.toLowerCase().includes(q)
      || a.description.toLowerCase().includes(q)
      || a.body.toLowerCase().includes(q)
    );
    if (results.length === 0) {
      return { content: [{ type: "text", text: `No agents found matching '${query}'.` }] };
    }
    const text = results.map(a => `${a.emoji} ${a.name} [${a.division}] — ${a.description}`).join("\n");
    return { content: [{ type: "text", text: `${results.length} result(s) for '${query}':\n\n${text}` }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`agency-agents MCP server running (${agents.length} agents loaded)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
