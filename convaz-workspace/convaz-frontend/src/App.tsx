import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Menu,
  ArrowLeft,
  Code2,
  Palette,
  Megaphone,
  BadgeDollarSign,
  Lightbulb,
  Kanban,
  TestTube2,
  LifeBuoy,
  Glasses,
  Sparkles,
  Gamepad2,
  DollarSign,
  Plug,
  Target,
  BookOpen,
  Users,
  Layers,
  Workflow,
  BarChart3,
  Bot,
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Code2, Palette, Megaphone, BadgeDollarSign, Lightbulb, Kanban,
  TestTube2, LifeBuoy, Glasses, Sparkles, Gamepad2, DollarSign,
  Plug, Target, BookOpen,
};

interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  agent_count: number;
  subdepartments: string[];
}

interface AgentSummary {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  vibe: string;
  department: string;
  subdepartment: string | null;
  file_path: string;
}

interface AgentDetail extends AgentSummary {
  sections: Record<string, string>;
  content_html: string;
  content_raw: string;
}

interface PipelinePhase {
  id: string;
  name: string;
  subtitle: string;
  agents: string[];
}

interface Pipeline {
  name: string;
  description: string;
  phases: PipelinePhase[];
  activation_modes: { name: string; agents_active: string; use_case: string; timeline: string }[];
}

interface WorkflowItem {
  id: string;
  name: string;
  content_html: string;
}

interface StrategyDoc {
  id: string;
  name: string;
  category: string;
  file_path: string;
  content_html: string;
}

type View = "dashboard" | "department" | "agent" | "pipeline" | "workflows" | "strategy";

function App() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [strategyDocs, setStrategyDocs] = useState<StrategyDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAgents, setFilteredAgents] = useState<AgentSummary[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ total_agents: 0, total_departments: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDoc | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/departments`).then((r) => r.json()),
      fetch(`${API_URL}/api/stats`).then((r) => r.json()),
      fetch(`${API_URL}/api/agents`).then((r) => r.json()),
    ]).then(([depts, st, ag]) => {
      setDepartments(depts);
      setStats(st);
      setAgents(ag);
      setFilteredAgents(ag);
      setLoading(false);
    });
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredAgents(selectedDept ? agents.filter((a) => a.department === selectedDept) : agents);
        return;
      }
      const q = query.toLowerCase();
      const base = selectedDept ? agents.filter((a) => a.department === selectedDept) : agents;
      setFilteredAgents(
        base.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.department.toLowerCase().includes(q) ||
            (a.vibe || "").toLowerCase().includes(q)
        )
      );
    },
    [agents, selectedDept]
  );

  const selectDepartment = (deptId: string) => {
    setSelectedDept(deptId);
    setView("department");
    setSearchQuery("");
    setFilteredAgents(agents.filter((a) => a.department === deptId));
    setSelectedAgent(null);
  };

  const selectAgent = async (agentId: string) => {
    const res = await fetch(`${API_URL}/api/agents/${agentId}`);
    const data = await res.json();
    setSelectedAgent(data);
    setView("agent");
  };

  const openPipeline = async () => {
    if (!pipeline) {
      const res = await fetch(`${API_URL}/api/pipeline`);
      setPipeline(await res.json());
    }
    setView("pipeline");
  };

  const openWorkflows = async () => {
    if (workflows.length === 0) {
      const res = await fetch(`${API_URL}/api/workflows`);
      setWorkflows(await res.json());
    }
    setView("workflows");
  };

  const openStrategy = async () => {
    if (strategyDocs.length === 0) {
      const res = await fetch(`${API_URL}/api/strategy`);
      setStrategyDocs(await res.json());
    }
    setView("strategy");
  };

  const goBack = () => {
    if (view === "agent" && selectedDept) {
      setView("department");
      setSelectedAgent(null);
    } else {
      setView("dashboard");
      setSelectedDept(null);
      setSelectedAgent(null);
      setSearchQuery("");
      setFilteredAgents(agents);
      setSelectedWorkflow(null);
      setSelectedStrategy(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading Convaz Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        } bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Convaz</h1>
              <p className="text-xs text-gray-500">AI Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => { setView("dashboard"); setSelectedDept(null); setSelectedAgent(null); setSearchQuery(""); setFilteredAgents(agents); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              view === "dashboard" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Dashboard
          </button>

          <button onClick={openPipeline}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              view === "pipeline" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            <Workflow className="w-4 h-4" />
            NEXUS Pipeline
          </button>

          <button onClick={openWorkflows}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              view === "workflows" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Workflows
          </button>

          <button onClick={openStrategy}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              view === "strategy" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            <Target className="w-4 h-4" />
            Strategy
          </button>

          <div className="mt-4 mb-2 px-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Departments</p>
          </div>

          {departments.map((dept) => {
            const Icon = ICON_MAP[dept.icon] || Sparkles;
            return (
              <button
                key={dept.id}
                onClick={() => selectDepartment(dept.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                  selectedDept === dept.id ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: dept.color }} />
                <span className="truncate">{dept.name}</span>
                <span className="ml-auto text-xs text-gray-600 shrink-0">{dept.agent_count}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{stats.total_agents} agents</span>
            <span className="mx-1">|</span>
            <span>{stats.total_departments} depts</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          {view !== "dashboard" && (
            <button onClick={goBack} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search agents, departments, functions..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (view !== "department") setView("dashboard"); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-8 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            C
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {view === "dashboard" && <DashboardView departments={departments} agents={searchQuery ? filteredAgents : []} stats={stats} searchQuery={searchQuery} onSelectDept={selectDepartment} onSelectAgent={selectAgent} onOpenPipeline={openPipeline} onOpenWorkflows={openWorkflows} onOpenStrategy={openStrategy} />}
          {view === "department" && selectedDept && <DepartmentView department={departments.find((d) => d.id === selectedDept)!} agents={filteredAgents} onSelectAgent={selectAgent} />}
          {view === "agent" && selectedAgent && <AgentDetailView agent={selectedAgent} />}
          {view === "pipeline" && pipeline && <PipelineView pipeline={pipeline} expandedPhase={expandedPhase} setExpandedPhase={setExpandedPhase} onSelectAgent={selectAgent} />}
          {view === "workflows" && <WorkflowsView workflows={workflows} selectedWorkflow={selectedWorkflow} setSelectedWorkflow={setSelectedWorkflow} />}
          {view === "strategy" && <StrategyView docs={strategyDocs} selectedDoc={selectedStrategy} setSelectedDoc={setSelectedStrategy} />}
        </div>
      </main>
    </div>
  );
}

/* ===== Dashboard View ===== */

function DashboardView({ departments, agents, stats, searchQuery, onSelectDept, onSelectAgent, onOpenPipeline, onOpenWorkflows, onOpenStrategy }: {
  departments: Department[]; agents: AgentSummary[]; stats: { total_agents: number; total_departments: number };
  searchQuery: string; onSelectDept: (id: string) => void; onSelectAgent: (id: string) => void;
  onOpenPipeline: () => void; onOpenWorkflows: () => void; onOpenStrategy: () => void;
}) {
  if (searchQuery && agents.length > 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Search Results <span className="text-gray-500 text-base font-normal">({agents.length} agents)</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (<AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent.id)} />))}
        </div>
      </div>
    );
  }
  if (searchQuery && agents.length === 0) {
    return (<div className="text-center py-20"><Search className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 text-lg">No agents found for &quot;{searchQuery}&quot;</p></div>);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Convaz Workspace</span>
        </h1>
        <p className="text-gray-400 text-lg">Your complete AI development environment with {stats.total_agents} specialized agents across {stats.total_departments} departments.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Agents" value={stats.total_agents} color="blue" />
        <StatCard icon={<Layers className="w-5 h-5" />} label="Departments" value={stats.total_departments} color="purple" />
        <StatCard icon={<Workflow className="w-5 h-5" />} label="Pipeline Phases" value={7} color="emerald" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Activation Modes" value={3} color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button onClick={onOpenPipeline} className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700/30 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors group">
          <Workflow className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white mb-1">NEXUS Pipeline</h3>
          <p className="text-sm text-gray-400">7-phase orchestration framework for multi-agent coordination</p>
        </button>
        <button onClick={onOpenWorkflows} className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-700/30 rounded-xl p-5 text-left hover:border-emerald-500/50 transition-colors group">
          <BookOpen className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white mb-1">Workflow Examples</h3>
          <p className="text-sm text-gray-400">Real-world use cases from startup MVP to marketing campaigns</p>
        </button>
        <button onClick={onOpenStrategy} className="bg-gradient-to-br from-red-900/40 to-orange-900/40 border border-red-700/30 rounded-xl p-5 text-left hover:border-red-500/50 transition-colors group">
          <Target className="w-8 h-8 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white mb-1">Strategy Docs</h3>
          <p className="text-sm text-gray-400">Playbooks, runbooks, and coordination frameworks</p>
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Departments (SDK)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const Icon = ICON_MAP[dept.icon] || Sparkles;
          return (
            <button key={dept.id} onClick={() => onSelectDept(dept.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-gray-600 transition-all hover:shadow-lg group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color: dept.color }} />
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: dept.color + "20", color: dept.color }}>{dept.agent_count} agents</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{dept.name}</h3>
              <p className="text-sm text-gray-400 line-clamp-2">{dept.description}</p>
              {dept.subdepartments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {dept.subdepartments.slice(0, 3).map((sub) => (<span key={sub} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{sub}</span>))}
                  {dept.subdepartments.length > 3 && <span className="text-xs text-gray-500">+{dept.subdepartments.length - 3} more</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Stat Card ===== */

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-900/40 to-blue-800/20 border-blue-700/30 text-blue-400",
    purple: "from-purple-900/40 to-purple-800/20 border-purple-700/30 text-purple-400",
    emerald: "from-emerald-900/40 to-emerald-800/20 border-emerald-700/30 text-emerald-400",
    orange: "from-orange-900/40 to-orange-800/20 border-orange-700/30 text-orange-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

/* ===== Agent Card ===== */

function AgentCard({ agent, onClick }: { agent: AgentSummary; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-gray-600 transition-all hover:shadow-lg group w-full">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{agent.emoji || "🤖"}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">{agent.name}</h3>
          <p className="text-xs text-gray-500 mb-2 capitalize">{agent.department.replace(/-/g, " ")}</p>
          <p className="text-sm text-gray-400 line-clamp-2">{agent.description || agent.vibe}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0 mt-1" />
      </div>
    </button>
  );
}

/* ===== Department View ===== */

function DepartmentView({ department, agents, onSelectAgent }: { department: Department; agents: AgentSummary[]; onSelectAgent: (id: string) => void }) {
  const Icon = ICON_MAP[department.icon] || Sparkles;
  const grouped: Record<string, AgentSummary[]> = { root: [] };
  agents.forEach((a) => {
    if (a.subdepartment) { grouped[a.subdepartment] = grouped[a.subdepartment] || []; grouped[a.subdepartment].push(a); }
    else { grouped["root"].push(a); }
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: department.color + "20" }}>
          <Icon className="w-6 h-6" style={{ color: department.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{department.name}</h1>
          <p className="text-gray-400">{department.description}</p>
        </div>
        <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: department.color + "20", color: department.color }}>{agents.length} agents</span>
      </div>
      {grouped["root"].length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {grouped["root"].map((agent) => (<AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent.id)} />))}
        </div>
      )}
      {Object.entries(grouped).filter(([key]) => key !== "root").map(([sub, subAgents]) => (
        <div key={sub} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3 capitalize border-b border-gray-800 pb-2">{sub.replace(/-/g, " ")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subAgents.map((agent) => (<AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent.id)} />))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== Agent Detail View ===== */

function AgentDetailView({ agent }: { agent: AgentDetail }) {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [{ id: "overview", label: "Overview" }, { id: "sections", label: "Sections" }, { id: "raw", label: "Raw Markdown" }];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{agent.emoji || "🤖"}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">{agent.name}</h1>
            <p className="text-gray-400 mb-3">{agent.description}</p>
            {agent.vibe && <p className="text-sm text-gray-500 italic mb-3">&quot;{agent.vibe}&quot;</p>}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded capitalize">{agent.department.replace(/-/g, " ")}</span>
              {agent.subdepartment && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded capitalize">{agent.subdepartment.replace(/-/g, " ")}</span>}
            </div>
          </div>
          <a href={`https://github.com/Abdullakala/All-in-one-ai/blob/main/${agent.file_path}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors" title="View on GitHub">
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 border border-gray-800">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="prose prose-invert prose-sm max-w-none bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-auto agent-content" dangerouslySetInnerHTML={{ __html: agent.content_html }} />
      )}
      {activeTab === "sections" && (
        <div className="space-y-4">
          {Object.entries(agent.sections).map(([title, content]) => (<SectionAccordion key={title} title={title} content={content} />))}
        </div>
      )}
      {activeTab === "raw" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-screen">{agent.content_raw}</pre>
        </div>
      )}
    </div>
  );
}

function SectionAccordion({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-800/50 transition-colors">
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        <span className="font-medium text-white">{title}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-gray-800 pt-3">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{content}</pre>
        </div>
      )}
    </div>
  );
}

/* ===== Pipeline View ===== */

function PipelineView({ pipeline, expandedPhase, setExpandedPhase, onSelectAgent }: {
  pipeline: Pipeline; expandedPhase: string | null; setExpandedPhase: (id: string | null) => void; onSelectAgent: (id: string) => void;
}) {
  const phaseColors = ["from-blue-500 to-cyan-500", "from-purple-500 to-pink-500", "from-emerald-500 to-teal-500", "from-orange-500 to-yellow-500", "from-red-500 to-rose-500", "from-green-500 to-emerald-500", "from-indigo-500 to-violet-500"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{pipeline.name}</h1>
        <p className="text-gray-400">{pipeline.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {pipeline.activation_modes.map((mode) => (
          <div key={mode.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-1">{mode.name}</h3>
            <p className="text-sm text-gray-400 mb-2">{mode.use_case}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Agents: {mode.agents_active}</span>
              <span>{mode.timeline}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Pipeline Phases</h2>
      <div className="space-y-3">
        {pipeline.phases.map((phase, idx) => (
          <div key={phase.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-800/50 transition-colors">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${phaseColors[idx]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>{idx}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{phase.name}</h3>
                <p className="text-sm text-gray-400">{phase.subtitle}</p>
              </div>
              <span className="text-xs text-gray-500 mr-2">{phase.agents.length} agents</span>
              {expandedPhase === phase.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedPhase === phase.id && (
              <div className="px-5 pb-4 border-t border-gray-800 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {phase.agents.map((agentId) => (
                    <button key={agentId} onClick={() => onSelectAgent(agentId)} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-left">
                      <Bot className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="truncate">{agentId.replace(/-/g, " ")}</span>
                      <ChevronRight className="w-3 h-3 text-gray-600 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Workflows View ===== */

function WorkflowsView({ workflows, selectedWorkflow, setSelectedWorkflow }: { workflows: WorkflowItem[]; selectedWorkflow: WorkflowItem | null; setSelectedWorkflow: (w: WorkflowItem | null) => void }) {
  if (selectedWorkflow) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedWorkflow(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Workflows
        </button>
        <h1 className="text-2xl font-bold text-white mb-6">{selectedWorkflow.name}</h1>
        <div className="prose prose-invert prose-sm max-w-none bg-gray-900 border border-gray-800 rounded-xl p-6 agent-content" dangerouslySetInnerHTML={{ __html: selectedWorkflow.content_html }} />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Workflow Examples</h1>
      <p className="text-gray-400 mb-6">Real-world examples and use cases for multi-agent orchestration.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((w) => (
          <button key={w.id} onClick={() => setSelectedWorkflow(w)} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-gray-600 transition-all group">
            <BookOpen className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{w.name}</h3>
            <p className="text-sm text-gray-400 mt-1">Click to view workflow details</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== Strategy View ===== */

function StrategyView({ docs, selectedDoc, setSelectedDoc }: { docs: StrategyDoc[]; selectedDoc: StrategyDoc | null; setSelectedDoc: (d: StrategyDoc | null) => void }) {
  if (selectedDoc) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedDoc(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Strategy
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">{selectedDoc.name}</h1>
        <p className="text-sm text-gray-500 mb-6">{selectedDoc.file_path}</p>
        <div className="prose prose-invert prose-sm max-w-none bg-gray-900 border border-gray-800 rounded-xl p-6 agent-content" dangerouslySetInnerHTML={{ __html: selectedDoc.content_html }} />
      </div>
    );
  }

  const grouped: Record<string, StrategyDoc[]> = {};
  docs.forEach((d) => { grouped[d.category] = grouped[d.category] || []; grouped[d.category].push(d); });
  const categoryLabels: Record<string, string> = { root: "Core Strategy", playbooks: "Playbooks", runbooks: "Runbooks", coordination: "Coordination" };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Strategy & Coordination</h1>
      <p className="text-gray-400 mb-6">NEXUS operational playbooks, runbooks, and coordination frameworks.</p>
      {Object.entries(grouped).map(([category, catDocs]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3 border-b border-gray-800 pb-2">{categoryLabels[category] || category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catDocs.map((doc) => (
              <button key={doc.id} onClick={() => setSelectedDoc(doc)} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-gray-600 transition-all group">
                <Target className="w-6 h-6 text-red-400 mb-3" />
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{doc.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{doc.file_path}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App
