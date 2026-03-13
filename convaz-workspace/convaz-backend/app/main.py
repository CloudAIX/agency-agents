import re
from pathlib import Path
from typing import Optional

import frontmatter
import markdown
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Convaz Workspace API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Root of the repo containing all agent markdown files
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent

DEPARTMENTS = {
    "engineering": {
        "name": "Engineering",
        "icon": "Code2",
        "color": "#3b82f6",
        "description": "Building the future, one commit at a time.",
    },
    "design": {
        "name": "Design",
        "icon": "Palette",
        "color": "#ec4899",
        "description": "Making it beautiful, usable, and delightful.",
    },
    "marketing": {
        "name": "Marketing",
        "icon": "Megaphone",
        "color": "#f97316",
        "description": "Growing your audience, one authentic interaction at a time.",
    },
    "sales": {
        "name": "Sales",
        "icon": "BadgeDollarSign",
        "color": "#10b981",
        "description": "Turning pipeline into revenue through craft, not CRM busywork.",
    },
    "product": {
        "name": "Product",
        "icon": "Lightbulb",
        "color": "#8b5cf6",
        "description": "Building the right thing at the right time.",
    },
    "project-management": {
        "name": "Project Management",
        "icon": "Kanban",
        "color": "#06b6d4",
        "description": "Keeping the trains running on time (and under budget).",
    },
    "testing": {
        "name": "Testing",
        "icon": "TestTube2",
        "color": "#eab308",
        "description": "Breaking things so users don't have to.",
    },
    "support": {
        "name": "Support",
        "icon": "LifeBuoy",
        "color": "#14b8a6",
        "description": "The backbone of the operation.",
    },
    "spatial-computing": {
        "name": "Spatial Computing",
        "icon": "Glasses",
        "color": "#6366f1",
        "description": "Building the immersive future.",
    },
    "specialized": {
        "name": "Specialized",
        "icon": "Sparkles",
        "color": "#f43f5e",
        "description": "The unique specialists who don't fit in a box.",
    },
    "game-development": {
        "name": "Game Development",
        "icon": "Gamepad2",
        "color": "#a855f7",
        "description": "Building worlds, systems, and experiences across every major engine.",
    },
    "paid-media": {
        "name": "Paid Media",
        "icon": "DollarSign",
        "color": "#22c55e",
        "description": "Turning ad spend into measurable business outcomes.",
    },
    "integrations": {
        "name": "Integrations",
        "icon": "Plug",
        "color": "#64748b",
        "description": "Multi-tool integration support for various AI coding platforms.",
    },
    "strategy": {
        "name": "Strategy",
        "icon": "Target",
        "color": "#dc2626",
        "description": "NEXUS operational playbooks and coordination frameworks.",
    },
    "examples": {
        "name": "Examples",
        "icon": "BookOpen",
        "color": "#0ea5e9",
        "description": "Real-world workflow examples and use cases.",
    },
}

SUBDEPARTMENTS = {
    "game-development": ["unity", "unreal-engine", "godot", "roblox-studio"],
    "strategy": ["playbooks", "runbooks", "coordination"],
    "integrations": [
        "aider", "antigravity", "claude-code", "cursor", "gemini-cli",
        "github-copilot", "mcp-memory", "openclaw", "opencode", "windsurf",
    ],
}


def parse_agent_file(file_path: Path, department: str) -> Optional[dict]:
    """Parse a markdown agent file and extract structured data."""
    try:
        post = frontmatter.load(str(file_path))
        content = post.content
        meta = dict(post.metadata)

        relative = file_path.relative_to(REPO_ROOT / department)
        subdepartment = None
        if len(relative.parts) > 1:
            subdepartment = relative.parts[0]

        return {
            "id": file_path.stem,
            "name": meta.get("name", file_path.stem.replace("-", " ").title()),
            "description": meta.get("description", ""),
            "color": meta.get("color", "gray"),
            "emoji": meta.get("emoji", ""),
            "vibe": meta.get("vibe", ""),
            "department": department,
            "subdepartment": subdepartment,
            "file_path": str(file_path.relative_to(REPO_ROOT)),
            "sections": extract_sections(content),
            "content_html": markdown.markdown(
                content, extensions=["fenced_code", "tables", "toc"],
            ),
            "content_raw": content,
        }
    except Exception:
        return None


def extract_sections(content: str) -> dict:
    """Extract named sections from markdown content."""
    sections: dict[str, str] = {}
    current_section: Optional[str] = None
    current_content: list[str] = []

    for line in content.split("\n"):
        header_match = re.match(r"^#{1,3}\s+(.+)$", line)
        if header_match:
            if current_section:
                sections[current_section] = "\n".join(current_content).strip()
            current_section = header_match.group(1).strip()
            current_content = []
        else:
            current_content.append(line)

    if current_section:
        sections[current_section] = "\n".join(current_content).strip()

    return sections


def scan_agents() -> list[dict]:
    """Scan all agent markdown files from the repo."""
    agents: list[dict] = []
    for dept_key in DEPARTMENTS:
        dept_path = REPO_ROOT / dept_key
        if not dept_path.is_dir():
            continue
        for md_file in sorted(dept_path.rglob("*.md")):
            if md_file.name in ("README.md", "CONTRIBUTING.md", "LICENSE"):
                continue
            agent = parse_agent_file(md_file, dept_key)
            if agent:
                agents.append(agent)
    return agents


_agents_cache: list[dict] = []


@app.on_event("startup")
async def load_agents():
    global _agents_cache
    _agents_cache = scan_agents()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/stats")
async def get_stats():
    depts = set(a["department"] for a in _agents_cache)
    return {
        "total_agents": len(_agents_cache),
        "total_departments": len(depts),
        "departments": list(depts),
    }


@app.get("/api/departments")
async def get_departments():
    dept_counts: dict[str, int] = {}
    for a in _agents_cache:
        dept_counts[a["department"]] = dept_counts.get(a["department"], 0) + 1

    return [
        {
            "id": k,
            "name": v["name"],
            "icon": v["icon"],
            "color": v["color"],
            "description": v["description"],
            "agent_count": dept_counts.get(k, 0),
            "subdepartments": SUBDEPARTMENTS.get(k, []),
        }
        for k, v in DEPARTMENTS.items()
    ]


@app.get("/api/departments/{department_id}")
async def get_department(department_id: str):
    if department_id not in DEPARTMENTS:
        raise HTTPException(status_code=404, detail="Department not found")

    info = DEPARTMENTS[department_id]
    agents = [a for a in _agents_cache if a["department"] == department_id]

    grouped: dict[str, list[dict]] = {"root": []}
    for a in agents:
        sub = a["subdepartment"]
        if sub:
            grouped.setdefault(sub, []).append(a)
        else:
            grouped["root"].append(a)

    return {
        "id": department_id,
        **info,
        "subdepartments": SUBDEPARTMENTS.get(department_id, []),
        "agents": agents,
        "grouped_agents": grouped,
    }


@app.get("/api/agents")
async def get_agents(
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    subdepartment: Optional[str] = Query(None),
):
    agents = _agents_cache
    if department:
        agents = [a for a in agents if a["department"] == department]
    if subdepartment:
        agents = [a for a in agents if a["subdepartment"] == subdepartment]
    if search:
        q = search.lower()
        agents = [
            a for a in agents
            if q in a["name"].lower()
            or q in a["description"].lower()
            or q in a["department"].lower()
            or q in (a["vibe"] or "").lower()
        ]
    return [
        {
            "id": a["id"], "name": a["name"], "description": a["description"],
            "color": a["color"], "emoji": a["emoji"], "vibe": a["vibe"],
            "department": a["department"], "subdepartment": a["subdepartment"],
            "file_path": a["file_path"],
        }
        for a in agents
    ]


@app.get("/api/agents/{agent_id}")
async def get_agent(agent_id: str):
    for a in _agents_cache:
        if a["id"] == agent_id:
            return a
    raise HTTPException(status_code=404, detail="Agent not found")


@app.get("/api/workflows")
async def get_workflows():
    examples_dir = REPO_ROOT / "examples"
    workflows = []
    if examples_dir.is_dir():
        for md_file in sorted(examples_dir.glob("*.md")):
            if md_file.name == "README.md":
                continue
            try:
                post = frontmatter.load(str(md_file))
                workflows.append({
                    "id": md_file.stem,
                    "name": md_file.stem.replace("-", " ").title(),
                    "content_html": markdown.markdown(
                        post.content, extensions=["fenced_code", "tables", "toc"],
                    ),
                    "content_raw": post.content,
                })
            except Exception:
                pass
    return workflows


@app.get("/api/strategy")
async def get_strategy():
    strategy_dir = REPO_ROOT / "strategy"
    docs = []
    if strategy_dir.is_dir():
        for md_file in sorted(strategy_dir.rglob("*.md")):
            try:
                post = frontmatter.load(str(md_file))
                relative = md_file.relative_to(strategy_dir)
                category = str(relative.parent) if len(relative.parts) > 1 else "root"
                docs.append({
                    "id": md_file.stem,
                    "name": md_file.stem.replace("-", " ").title(),
                    "category": category,
                    "file_path": str(md_file.relative_to(REPO_ROOT)),
                    "content_html": markdown.markdown(
                        post.content, extensions=["fenced_code", "tables", "toc"],
                    ),
                    "content_raw": post.content,
                })
            except Exception:
                pass
    return docs


@app.get("/api/pipeline")
async def get_pipeline():
    return {
        "name": "NEXUS Pipeline",
        "description": "Network of EXperts, Unified in Strategy",
        "phases": [
            {
                "id": "phase-0", "name": "Discovery",
                "subtitle": "Intelligence & Discovery",
                "agents": [
                    "product-trend-researcher", "product-feedback-synthesizer",
                    "design-ux-researcher", "support-analytics-reporter",
                    "support-legal-compliance-checker", "testing-tool-evaluator",
                ],
            },
            {
                "id": "phase-1", "name": "Strategy",
                "subtitle": "Strategy & Architecture",
                "agents": [
                    "project-management-studio-producer", "project-manager-senior",
                    "product-sprint-prioritizer", "design-ux-architect",
                    "design-brand-guardian", "engineering-backend-architect",
                    "engineering-ai-engineer", "support-finance-tracker",
                ],
            },
            {
                "id": "phase-2", "name": "Foundation",
                "subtitle": "Foundation & Scaffolding",
                "agents": [
                    "engineering-devops-automator", "engineering-frontend-developer",
                    "engineering-backend-architect", "design-ux-architect",
                    "support-infrastructure-maintainer",
                    "project-management-studio-operations",
                ],
            },
            {
                "id": "phase-3", "name": "Build",
                "subtitle": "Build & Iterate",
                "agents": [
                    "engineering-frontend-developer", "engineering-backend-architect",
                    "engineering-ai-engineer", "engineering-mobile-app-builder",
                    "engineering-senior-developer", "testing-evidence-collector",
                    "testing-api-tester",
                ],
            },
            {
                "id": "phase-4", "name": "Hardening",
                "subtitle": "Quality & Hardening",
                "agents": [
                    "testing-reality-checker", "testing-performance-benchmarker",
                    "testing-accessibility-auditor", "engineering-security-engineer",
                    "support-legal-compliance-checker",
                ],
            },
            {
                "id": "phase-5", "name": "Launch",
                "subtitle": "Launch & Growth",
                "agents": [
                    "marketing-growth-hacker", "marketing-content-creator",
                    "marketing-social-media-strategist", "marketing-seo-specialist",
                    "support-executive-summary-generator",
                ],
            },
            {
                "id": "phase-6", "name": "Operate",
                "subtitle": "Operate & Evolve",
                "agents": [
                    "engineering-sre", "support-support-responder",
                    "support-analytics-reporter", "support-infrastructure-maintainer",
                    "testing-workflow-optimizer",
                ],
            },
        ],
        "activation_modes": [
            {"name": "NEXUS-Full", "agents_active": "All",
             "use_case": "Enterprise product launch, full lifecycle", "timeline": "12-24 weeks"},
            {"name": "NEXUS-Sprint", "agents_active": "15-25",
             "use_case": "Feature development, MVP build", "timeline": "2-6 weeks"},
            {"name": "NEXUS-Micro", "agents_active": "5-10",
             "use_case": "Bug fix, content campaign, single deliverable", "timeline": "1-5 days"},
        ],
    }
