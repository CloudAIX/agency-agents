/**
 * Main scanner view — Longs | Shorts | Hedge tabs
 */
import { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { TrendingUp, TrendingDown, ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import ScanCard from './ScanCard';
import HedgeMode from '../HedgeMode/HedgeMode';
import ShortsBetaBanner from './ShortsBetaBanner';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ScannerTabs() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'long' | 'short' | 'hedge'>('long');
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(62);
  const [shortsEnabled, setShortsEnabled] = useState(false);

  useEffect(() => {
    if (activeTab !== 'hedge') fetchScans();
  }, [activeTab, minScore]);

  const fetchScans = async (refresh = false) => {
    setLoading(true);
    try {
      const params: any = { type: activeTab, minScore, limit: 25 };
      if (refresh) params.refresh = 'true';
      const { data } = await axios.get(`${API}/api/scans`, { params });
      setScans(data.scans || []);
    } catch (err) {
      console.error('Scan fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Options Scanner</h1>
          <p className="text-xs text-gray-500 mt-0.5">500+ S&P tickers · Score 62+/100 · Paper trades only</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Min score filter */}
          <div className="flex items-center gap-2 bg-brand-panel border border-brand-border rounded-lg px-3 py-1.5">
            <label className="text-xs text-gray-400">Min Score</label>
            <select
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="bg-transparent text-sm text-white outline-none cursor-pointer"
            >
              {[62, 70, 75, 80, 85, 90].map(v => (
                <option key={v} value={v} className="bg-brand-panel">{v}+</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchScans(true)}
            disabled={loading || activeTab === 'hedge'}
            className="btn-primary flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <Tabs.List className="flex gap-1 bg-brand-panel border border-brand-border rounded-xl p-1">
          <TabTrigger value="long" icon={<TrendingUp size={14} />} color="green">
            Longs
          </TabTrigger>
          <TabTrigger
            value="short"
            icon={<TrendingDown size={14} />}
            color="red"
            disabled={!shortsEnabled && !user}
            beta
          >
            Shorts
          </TabTrigger>
          <TabTrigger value="hedge" icon={<ShieldCheck size={14} />} color="amber">
            Hedge
          </TabTrigger>
        </Tabs.List>

        {/* Shorts beta opt-in banner */}
        <Tabs.Content value="short">
          {!shortsEnabled ? (
            <ShortsBetaBanner onEnable={() => setShortsEnabled(true)} />
          ) : (
            <ScanList scans={scans} loading={loading} side="short" />
          )}
        </Tabs.Content>

        <Tabs.Content value="long">
          <ScanList scans={scans} loading={loading} side="long" />
        </Tabs.Content>

        <Tabs.Content value="hedge">
          <HedgeMode />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function TabTrigger({ value, icon, color, children, disabled = false, beta = false }: any) {
  const colors: any = {
    green: 'data-[state=active]:bg-green-900/40 data-[state=active]:text-green-400 data-[state=active]:border-green-700',
    red:   'data-[state=active]:bg-red-900/40   data-[state=active]:text-red-400   data-[state=active]:border-red-700',
    amber: 'data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-400 data-[state=active]:border-amber-700'
  };
  return (
    <Tabs.Trigger
      value={value}
      disabled={disabled}
      className={clsx(
        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-transparent',
        'text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        colors[color]
      )}
    >
      {icon} {children}
      {beta && <span className="text-[10px] px-1 py-0.5 bg-indigo-900/50 text-indigo-300 rounded border border-indigo-700 ml-1">BETA</span>}
    </Tabs.Trigger>
  );
}

function ScanList({ scans, loading, side }: { scans: any[]; loading: boolean; side: string }) {
  if (loading) {
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="scan-card animate-pulse h-44 bg-brand-border/20" />
        ))}
      </div>
    );
  }
  if (!scans.length) {
    return (
      <div className="mt-8 text-center text-gray-500">
        <p className="text-4xl mb-3">🔭</p>
        <p>No {side} setups above threshold right now.</p>
        <p className="text-sm mt-1">Try lowering min score or hit Refresh for a live scan.</p>
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scans.map((scan, i) => <ScanCard key={`${scan.ticker}-${i}`} scan={scan} />)}
    </div>
  );
}
