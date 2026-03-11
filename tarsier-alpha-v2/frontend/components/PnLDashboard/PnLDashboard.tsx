/**
 * My Paper Portfolio — P&L dashboard
 * Shows: open trades, closed trades, win rate, net %, drawdown
 * Split: Longs vs Shorts columns
 */
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart2, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import OpenTradesTable from './OpenTradesTable';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PnLDashboard() {
  const { user, getToken } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [pnl, setPnl] = useState<any>(null);
  const [publicPnl, setPublicPnl] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchPublicPnl(); }, []);
  useEffect(() => { if (user) fetchPnl(); }, [user, period]);

  const fetchPnl = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get(`${API}/api/pnl?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPnl(data);
    } catch (err) {
      console.error('P&L fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicPnl = async () => {
    try {
      const { data } = await axios.get(`${API}/api/pnl/public`);
      setPublicPnl(data);
    } catch { /* non-critical */ }
  };

  if (!user) {
    return (
      <div className="text-center py-16 text-gray-500">
        <BarChart2 size={40} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg">Sign in to see your paper portfolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-brand-accent" /> My Paper Portfolio
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Paper trades only — not financial advice</p>
        </div>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                period === p ? 'bg-brand-accent text-white' : 'bg-brand-panel border border-brand-border text-gray-400 hover:text-white'
              )}
            >{p}</button>
          ))}
          <button onClick={fetchPnl} className="p-1.5 rounded-lg bg-brand-panel border border-brand-border text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Public weekly leaderboard */}
      {publicPnl && (
        <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4">
          <p className="text-xs text-indigo-300 font-semibold mb-1">📊 This Week — Community Results</p>
          <p className="text-white font-mono text-sm">{publicPnl.summary}</p>
          <p className="text-xs text-gray-500 mt-1">{publicPnl.disclaimer}</p>
        </div>
      )}

      {/* Stats cards */}
      {pnl && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PnLCard side="long" stats={pnl.longs} />
          <PnLCard side="short" stats={pnl.shorts} />
        </div>
      )}

      {/* Net P&L */}
      {pnl?.net && (
        <div className="bg-brand-panel border border-brand-border rounded-xl p-4 grid grid-cols-3 gap-4">
          <Stat label="Net P&L" value={`${pnl.net.netPct >= 0 ? '+' : ''}${pnl.net.netPct?.toFixed(1)}%`} positive={pnl.net.netPct >= 0} />
          <Stat label="Total Trades" value={pnl.net.count} />
          <Stat label="Max Drawdown" value={`$${pnl.net.maxDrawdown?.toFixed(0)}`} />
        </div>
      )}

      {/* Open trades */}
      <OpenTradesTable />
    </div>
  );
}

function PnLCard({ side, stats }: { side: 'long' | 'short'; stats: any }) {
  const isShort = side === 'short';
  const sign = stats.netPct >= 0 ? '+' : '';
  return (
    <div className={clsx(
      'rounded-xl border p-4 space-y-3',
      isShort ? 'bg-red-950/20 border-red-900/40' : 'bg-green-950/20 border-green-900/40'
    )}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {isShort ? <TrendingDown size={16} className="text-red-400" /> : <TrendingUp size={16} className="text-green-400" />}
        <span className={isShort ? 'text-red-300' : 'text-green-300'}>{isShort ? 'Shorts' : 'Longs'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Net" value={`${sign}${stats.netPct?.toFixed(1)}%`} positive={stats.netPct >= 0} />
        <Stat label="Win Rate" value={`${stats.winRate?.toFixed(0)}%`} />
        <Stat label="Trades" value={stats.count} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Clock size={11} />
        Avg hold: {stats.avgHoldHrs?.toFixed(1)}h
      </div>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: any; positive?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={clsx(
        'font-semibold font-mono mt-0.5',
        positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-white'
      )}>{value}</p>
    </div>
  );
}
