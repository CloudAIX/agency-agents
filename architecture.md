# 🏗 Architecture Documentation
Overview
Deriverse Dashboard is a modern web application built with Next.js 15 (App Router), React 18, and TypeScript. This document provides a detailed overview of the system architecture, design decisions, and implementation patterns.

Table of Contents
System Architecture
Directory Structure
Component Architecture
Data Layer
State Management
Styling Architecture
Error Handling
Testing Strategy
Performance Considerations
Security Measures
1. System Architecture
High-Level Architecture
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js App Router                      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 Layout (layout.tsx)                  │  │  │
│  │  │  ┌─────────────────────────────────────────────┐    │  │  │
│  │  │  │              Context Providers               │    │  │  │
│  │  │  │  • ThemeProvider (Dark/Light Mode)          │    │  │  │
│  │  │  │  • ErrorBoundary (Error Handling)           │    │  │  │
│  │  │  └─────────────────────────────────────────────┘    │  │  │
│  │  │                        │                             │  │  │
│  │  │  ┌─────────────────────┴─────────────────────────┐  │  │  │
│  │  │  │                 Page Components               │  │  │  │
│  │  │  │  • Dashboard (/)                              │  │  │  │
│  │  │  │  • Portfolio (/portfolio)                     │  │  │  │
│  │  │  │  • Analysis (/advanced)                       │  │  │  │
│  │  │  │  • Journal (/journal)                         │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                         Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Mock Data     │  │    Utilities    │  │   Type Defs     │  │
│  │  (mock-data.ts) │  │   (utils.ts)    │  │   (types.ts)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
Technology Stack
Layer	Technology	Version	Purpose
Framework	Next.js	15.1.0	Server-side rendering, routing
UI Library	React	18.2.0	Component-based UI
Language	TypeScript	5.9	Type safety
Styling	Tailwind CSS	4.1	Utility-first CSS
Charts	Recharts	2.15	Data visualization
Icons	Lucide React	0.400	Icon library
Testing	Jest	30.2	Unit testing
2. Directory Structure
Directory Tree
deriverse-dashboard/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Global styles
│   ├── advanced/page.tsx             # Analysis page
│   ├── journal/page.tsx              # Journal page
│   └── portfolio/page.tsx            # Portfolio page
│
├── components/                       # React Components
│   ├── analysis/                     # Analysis features
│   ├── dashboard/                    # Dashboard widgets
│   ├── filters/                      # Filter controls
│   ├── journal/                      # Journal features
│   ├── layout/                       # Layout components
│   ├── portfolio/                    # Portfolio widgets
│   ├── ui/                           # Reusable UI
│   └── wallet/                       # Wallet integration
│
├── lib/                              # Core library
│   ├── mock-data.ts                  # Mock data
│   ├── types.ts                      # TypeScript types
│   ├── utils.ts                      # Utility functions
│   └── __tests__/                    # Unit tests
│
└── public/                           # Static assets
Directory Responsibilities
Directory	Responsibility	Naming Convention
app/	Page routing and layouts	page.tsx, layout.tsx
components/	UI components	PascalCase.tsx
lib/	Business logic	kebab-case.ts
public/	Static files	lowercase
3. Component Architecture
Component Hierarchy
RootLayout
├── ThemeProvider
│   └── ErrorBoundary
│       ├── Sidebar
│       │   ├── Navigation Links
│       │   ├── ThemeToggle
│       │   └── User Profile
│       │
│       ├── Main Content
│       │   └── [Page Component]
│       │       ├── Header
│       │       ├── Content Grid
│       │       │   ├── StatsGrid
│       │       │   ├── Charts
│       │       │   └── Tables
│       │       └── Footer
│       │
│       └── BottomNav (Mobile)
Component Categories
1. Layout Components
Located in components/layout/

Component	Purpose	Props
Sidebar	Desktop navigation	None
BottomNav	Mobile navigation	None
2. UI Components
Located in components/ui/

Component	Purpose	Key Features
ErrorBoundary	Error handling	Retry functionality
Loading	Loading states	Multiple variants
ThemeToggle	Theme switching	localStorage sync
3. Feature Components
Located in feature-specific directories

Directory	Components	Features
dashboard/	StatsGrid, EquityChart	Metrics display
journal/	JournalTable, AddTradeModal	Trade management
portfolio/	AssetAllocation, RiskMetrics	Portfolio analysis
analysis/	FeeBreakdown, TimeAnalysis	Advanced metrics
Component Design Patterns
Container/Presentation Pattern
// Container: Handles data and logic
function JournalTableContainer() {
  const [trades, setTrades] = useState([]);
  const filteredTrades = filterTrades(trades);
  
  return <JournalTablePresentation trades={filteredTrades} />;
}

// Presentation: Pure UI rendering
function JournalTablePresentation({ trades }) {
  return <table>...</table>;
}
Compound Components Pattern
<Modal>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>
4. Data Layer
Data Flow Diagram
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  mock-data.ts │────▶│   utils.ts   │────▶│  Component   │
│              │      │              │      │              │
│ • trades     │      │ • calculate  │      │ • render     │
│ • assets     │      │ • filter     │      │ • display    │
│ • fees       │      │ • format     │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
Type Definitions
// Core trade data structure
interface TradeData {
  id: string;
  pair: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entry: number;
  exit: number;
  fee: number;
  pnl: number;
  date: string;
  entryTime: string;
  exitTime: string;
  duration: number;
  notes: string;
  tags: string[];
  volume: number;
}
Utility Functions Architecture
utils.ts
│
├── Formatting Layer
│   ├── formatCurrency()
│   ├── formatPercentage()
│   ├── formatDuration()
│   └── getProfitColor()
│
├── Calculation Layer
│   ├── calculateWinRate()
│   ├── calculateProfitFactor()
│   ├── calculateAverageDuration()
│   ├── calculateTotalVolume()
│   └── getBestAndWorstTrade()
│
└── Filter Layer
    ├── filterTradesBySymbol()
    ├── filterTradesByDateRange()
    └── getUniqueSymbols()
5. State Management
State Categories
Category	Solution	Scope	Persistence
Theme	React Context	Global	localStorage
UI State	useState	Component	Memory
Form State	useState	Component	Memory
URL State	Next.js Router	Page	URL
Theme Context Architecture
// Provider structure
ThemeContext
├── theme: 'dark' | 'light'
├── toggleTheme: () => void
└── mounted: boolean

// Usage
const { theme, toggleTheme } = useTheme();
Local State Patterns
// Component with multiple state concerns
function JournalTable() {
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter state
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start, end });
  
  // Loading state
  const [isExporting, setIsExporting] = useState(false);
}
6. Styling Architecture
CSS Custom Properties
/* Theme variables in globals.css */
:root {
  /* Colors */
  --color-primary: #f2b90d;
  --color-profit: #10B981;
  --color-loss: #EF4444;
  
  /* Backgrounds */
  --bg-primary: #0F0F0F;
  --bg-surface: #1A1A1A;
  
  /* Typography */
  --font-display: "Space Grotesk";
  --font-body: "Inter";
  --font-mono: "Roboto Mono";
  
  /* Shadows */
  --shadow-neobrutal: 4px 4px 0px 0px rgba(0,0,0,1);
}
Design Tokens
Token	Dark	Light
--bg-primary	#0F0F0F	#F8F8F5
--bg-surface	#1A1A1A	#FFFFFF
--text-primary	#FFFFFF	#1F2937
--text-secondary	#9CA3AF	#6B7280
--border-color	#333333	#E5E7EB
Neobrutalist Design System
/* Standard card styling */
.card {
  @apply bg-surface-dark;
  @apply neobrutal-border;
  @apply p-4;
  @apply shadow-neobrutal;
}

/* Primary button */
.btn-primary {
  @apply bg-primary text-black;
  @apply border-2 border-black;
  @apply shadow-neobrutal-sm;
  @apply hover:translate-x-[1px] hover:translate-y-[1px];
  @apply hover:shadow-none;
}
7. Error Handling
Error Boundary Pattern
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
Input Validation
// Sanitization constants
const MAX_SEARCH_LENGTH = 100;
const INVALID_CHARS_REGEX = /[<>{}[\]\\]/g;

// Validation function
function sanitizeSearchInput(input: string): string {
  return input
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(INVALID_CHARS_REGEX, '')
    .trim();
}
8. Testing Strategy
Test Pyramid
         ┌───────────┐
         │    E2E    │  (Future)
         │   Tests   │
        ┌┴───────────┴┐
        │ Integration │  (Future)
        │    Tests    │
       ┌┴─────────────┴┐
       │  Unit Tests   │  ✅ Implemented
       │  (20+ tests)  │
       └───────────────┘
Unit Test Coverage
Function	Tests	Coverage
formatCurrency	3	100%
calculateWinRate	3	100%
calculateProfitFactor	3	100%
filterTradesBySymbol	3	100%
Test Patterns
describe('calculateWinRate', () => {
  it('calculates correctly for mixed trades', () => {
    expect(calculateWinRate(mockTrades)).toBeCloseTo(66.67, 1);
  });

  it('handles empty array', () => {
    expect(calculateWinRate([])).toBe(0);
  });

  it('handles all winners', () => {
    const winners = mockTrades.filter(t => t.pnl > 0);
    expect(calculateWinRate(winners)).toBe(100);
  });
});
9. Performance Considerations
Client-Side Optimizations
Technique	Implementation
Code Splitting	Next.js automatic
Lazy Loading	Dynamic imports
Memoization	useCallback, useMemo
Debouncing	Search input
Bundle Optimization
// next.config.ts
module.exports = {
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
};
Loading States
// Skeleton loading for tables
function TableRowSkeleton({ columns = 8 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <div className="h-4 bg-white/5 rounded" />
        </td>
      ))}
    </tr>
  );
}
10. Security Measures
Input Sanitization
Attack Vector	Protection
XSS	Regex character filtering
Injection	Input length limits
CSRF	Next.js built-in
Security Implementations
// XSS prevention
const INVALID_CHARS = /[<>{}[\]\\]/g;
input.replace(INVALID_CHARS, '');

// Length limiting
const MAX_LENGTH = 100;
input.slice(0, MAX_LENGTH);

// Safe defaults
if (context === undefined) {
  return { theme: 'dark', toggleTheme: () => {} };
}
Content Security Policy (Recommended)
// next.config.ts
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'",
  },
];
Appendix
Development Workflow
1. Create feature branch
2. Implement changes
3. Add tests
4. Run lint: npm run lint
5. Run tests: npm test
6. Build: npm run build
7. Create PR
Code Standards
TypeScript strict mode
JSDoc for public functions
Functional components
Custom hooks for logic
Future Considerations
Real Data Integration

Solana wallet adapter
WebSocket for real-time data
Backend API integration
Testing Expansion

Component tests with RTL
E2E tests with Playwright
Performance

Virtual scrolling for tables
Service worker caching
Last updated: January 29, 2026
