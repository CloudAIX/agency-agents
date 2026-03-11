# Claude Cowork Integration

The Agency maps naturally to Claude Cowork's plugin system — each division becomes
a plugin, and each agent becomes a skill inside that plugin.

## Structure

```
claude-cowork/
├── agency-design/
│   ├── .claude-plugin/plugin.json   # plugin manifest
│   └── skills/
│       ├── brand-guardian/SKILL.md
│       ├── ui-designer/SKILL.md
│       └── ...
├── agency-engineering/
│   ├── .claude-plugin/plugin.json
│   └── skills/
│       ├── frontend-developer/SKILL.md
│       └── ...
└── ... (one plugin per division)
```

## Install

```bash
# Generate the integration files (if not already present)
./scripts/convert.sh --tool claude-cowork

# Install all plugins to your Claude Cowork plugins directory
./scripts/install.sh --tool claude-cowork
```

The installer copies each `agency-*` plugin folder to:
- **macOS:** `~/Library/Application Support/Claude/cowork-plugins/`
- **Linux:** `~/.config/claude/cowork-plugins/`
- **Custom:** Set `CLAUDE_COWORK_PLUGINS_DIR=/your/path` before running

Restart Claude after installing to load the new plugins.

## Available Plugins

| Plugin | Agents |
|--------|--------|
| `agency-design` | Brand Guardian, UI Designer, UX Architect, UX Researcher, Visual Storyteller, Image Prompt Engineer, Whimsy Injector |
| `agency-engineering` | Frontend Developer, Backend Architect, AI Engineer, DevOps Automator, Mobile App Builder, Rapid Prototyper, Security Engineer, Senior Developer |
| `agency-marketing` | Content Creator, Growth Hacker, Social Media Strategist, App Store Optimizer, Reddit Community Builder, Instagram Curator, TikTok Strategist, Twitter Engager, WeChat, Xiaohongshu, Zhihu |
| `agency-product` | Feedback Synthesizer, Sprint Prioritizer, Trend Researcher |
| `agency-project-management` | Project Shepherd, Studio Producer, Studio Operations, Experiment Tracker, Senior Project Manager |
| `agency-support` | Support Responder, Analytics Reporter, Finance Tracker, Executive Summary Generator, Infrastructure Maintainer, Legal Compliance Checker |
| `agency-testing` | Reality Checker, Accessibility Auditor, API Tester, Performance Benchmarker, Tool Evaluator, Evidence Collector, Test Results Analyzer, Workflow Optimizer |
| `agency-specialized` | Agents Orchestrator, Data Analytics Reporter, Data Consolidation Agent, LSP Index Engineer, Report Distribution Agent, Sales Data Extraction Agent, Agentic Identity Trust |
| `agency-spatial-computing` | visionOS Spatial Engineer, macOS Spatial Metal Engineer, XR Immersive Developer, XR Interface Architect, XR Cockpit Interaction Specialist, Terminal Integration Specialist |

## Usage

Once installed, activate any agent by mentioning its skill name in Claude Cowork:

```
Activate Brand Guardian and create a brand identity for my startup.
```

```
Use the Reality Checker to review this feature spec.
```

```
Switch to Frontend Developer mode and build me a React component.
```

## Why These Agents Work Great in Cowork

Most of The Agency's specialists — design, marketing, product, project management,
support — are knowledge-work agents, not coding agents. Claude Cowork is built for
exactly this kind of work: long-running tasks, file reading/writing, research, and
multi-step workflows without a code environment.

Claude Code is the right tool for engineering agents; Claude Cowork is the right
tool for everything else.
