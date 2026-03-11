# TarsierAlpha v2 — Shorts, Portfolio Hedge & Agentic API

> Options scanner for 500+ S&P stocks. Longs + shorts. Portfolio hedge mode. Paper trades only.

## What's New in v2

| Feature | Status |
|---------|--------|
| 📉 Shorts Scanner (Gap Fill Short, Overbought, Catalyst) | ✅ |
| 🛡 Portfolio Hedge Mode (industry → put basket) | ✅ |
| 📊 Paper Trade P&L (Longs vs Shorts split) | ✅ |
| 🤖 Agentic API Layer (OpenAPI + WS) | ✅ |
| 🔔 Telegram alerts (high ping = long, low horn = short) | ✅ |
| 📱 PWA manifest + service worker | ✅ |

## Architecture

```
tarsier-alpha-v2/
├── backend/          # Node/Express API
│   ├── routes/       # scans, pnl, agent, hedge, auth
│   ├── services/
│   │   ├── scanner/  # longs.js + shorts.js + index.js
│   │   ├── polygon.js
│   │   ├── technicals.js
│   │   ├── paperTrade.js
│   │   ├── hedge.js
│   │   └── telegram.js
│   ├── models/       # User, Scan, PaperTrade (MongoDB)
│   ├── websocket/    # WS /ws/alerts
│   ├── middleware/   # auth (Firebase + AgentKey)
│   └── openapi.yaml  # Swagger docs at /api/docs
│
└── frontend/         # Next.js 14 + Tailwind + Recharts
    ├── pages/
    ├── components/
    │   ├── Scanner/        # ScannerTabs, ScanCard, ShortsBetaBanner
    │   ├── PaperTradeModal/
    │   ├── HedgeMode/      # HedgeMode, HedgeBasketTable
    │   ├── PnLDashboard/   # PnLDashboard, OpenTradesTable
    │   └── Layout/         # Layout, AlertBanner
    └── hooks/              # useAuth (Firebase), useAlerts (WS)
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
# Fill in POLYGON_API_KEY, MONGO_URI, FIREBASE_SERVICE_ACCOUNT, TELEGRAM_BOT_TOKEN
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Fill in Firebase client config + API URLs
npm install
npm run dev
```

Swagger UI: http://localhost:4000/api/docs

## API Highlights

### Scanner
```
GET /api/scans?type=short&minScore=80&limit=10
GET /api/scans?type=long&minScore=62
GET /api/scans?type=both&refresh=true
```

### Paper Trade (Agent)
```
POST /api/agent/paper-trade
X-Agent-Key: your_key
{ "ticker": "XPO", "strike": 58, "side": "short", "qty": 1 }
```

### Hedge Basket
```
POST /api/hedge/suggest
{ "industry": "trucking", "exposureUsd": 1000000, "riskTolerance": "med" }
```

### WebSocket
```js
const ws = new WebSocket('wss://api.tarsieralpha.com/ws/alerts');
ws.send(JSON.stringify({ action: 'subscribe', side: 'both' }));
ws.onmessage = e => {
  const { type, payload } = JSON.parse(e.data);
  if (type === 'scan') console.log('New setup:', payload.ticker, payload.score);
};
```

## Shorts — Beta Rules

- Short Score 80+ only (first month)
- Capped at 20% of scanner results
- Every short setup shows `margin_alert` badge
- Spreads preferred over naked puts
- See `/blog/short-risks` for full risk disclosure

## Paper Trade Flow

1. User sees high-score setup on scanner
2. Clicks "Paper Long →" or "Paper Short →"
3. Modal shows: strike, entry price (Polygon mid + 0.5% slippage), Greeks
4. Confirms → logged to MongoDB with timestamp
5. Dashboard tracks open P&L, closed trades, win rate
6. Weekly public P&L post: "Longs: +18% | Shorts: -5% | Net: +13%"

---

> All entries are paper (hypothetical). No real broker connections. Educational only.
