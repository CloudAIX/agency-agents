/**
 * Portfolio Hedge Mode
 * Input: industry, exposure $, risk tolerance → scanner suggests put basket
 */
import { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, DollarSign, BarChart2, ChevronRight, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import HedgeBasketTable from './HedgeBasketTable';

const API = process.env.NEXT_PUBLIC_API_URL;

const INDUSTRIES = [
  { value: 'trucking',   label: '🚛 Trucking / Logistics' },
  { value: 'retail',     label: '🛒 Retail' },
  { value: 'oil',        label: '⛽ Oil & Energy' },
  { value: 'tech',       label: '💻 Technology' },
  { value: 'airlines',   label: '✈️ Airlines' },
  { value: 'housing',    label: '🏠 Homebuilders' },
  { value: 'banking',    label: '🏦 Banking' },
  { value: 'healthcare', label: '🏥 Healthcare' }
];

const RISK_LEVELS = [
  { value: 'low',  label: 'Low (10% hedge)', desc: 'Minimal premium spend' },
  { value: 'med',  label: 'Medium (20% hedge)', desc: 'Balanced coverage' },
  { value: 'high', label: 'High (35% hedge)', desc: 'Aggressive protection' }
];

export default function HedgeMode() {
  const { user, signIn, getToken } = useAuth();
  const [industry, setIndustry] = useState('trucking');
  const [exposure, setExposure] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('med');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSuggest = async () => {
    if (!exposure || isNaN(Number(exposure))) {
      setError('Enter a valid exposure amount');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/api/hedge/suggest`, {
        industry,
        exposureUsd: Number(exposure),
        riskTolerance
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Hedge scan failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterBasket = async () => {
    if (!user) { await signIn(); return; }
    setEntering(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${API}/api/hedge/enter`,
        { industry, exposureUsd: Number(exposure), riskTolerance },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntered(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to enter basket');
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="mt-4 max-w-3xl space-y-6">
      {/* Intro */}
      <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
        <ShieldCheck size={20} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-200">Portfolio Hedge Mode</h3>
          <p className="text-sm text-amber-200/70 mt-0.5">
            Map your real-world business exposure to correlated put baskets.
            e.g. $1M diesel cost → short XPO/JBHT puts. Paper only.
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="bg-brand-panel border border-brand-border rounded-xl p-5 space-y-4">
        <h4 className="text-white font-semibold flex items-center gap-2"><BarChart2 size={16} /> Your Exposure</h4>

        {/* Industry */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-400">Industry / Sector</label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500 transition-colors"
          >
            {INDUSTRIES.map(i => (
              <option key={i.value} value={i.value} className="bg-brand-dark">{i.label}</option>
            ))}
          </select>
        </div>

        {/* Exposure */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-400">Exposure Amount (USD)</label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="number"
              value={exposure}
              onChange={e => setExposure(e.target.value)}
              placeholder="1000000"
              className="w-full bg-brand-dark border border-brand-border rounded-lg pl-8 pr-3 py-2.5 text-white text-sm outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500">e.g. annual fuel cost, contract exposure, stock portfolio value</p>
        </div>

        {/* Risk tolerance */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-400">Risk Tolerance</label>
          <div className="grid grid-cols-3 gap-2">
            {RISK_LEVELS.map(r => (
              <button
                key={r.value}
                onClick={() => setRiskTolerance(r.value)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium text-left border transition-colors',
                  riskTolerance === r.value
                    ? 'bg-amber-900/40 border-amber-700 text-amber-300'
                    : 'bg-brand-dark border-brand-border text-gray-400 hover:border-gray-500'
                )}
              >
                <div className="font-semibold">{r.label.split(' ')[0]}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSuggest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Scanning correlated tickers…' : 'Generate Hedge Basket'}
          {!loading && <ChevronRight size={16} />}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hedge Target', value: `$${result.hedgeTargetUsd?.toLocaleString()}` },
              { label: 'Basket Cost', value: `$${result.totalCost?.toLocaleString()}` },
              { label: 'Expected Gain -5%', value: `$${result.totalExpectedGainAt5pctDrop?.toLocaleString()}` },
              { label: 'Coverage', value: `${result.coverageRatio}%` }
            ].map(stat => (
              <div key={stat.label} className="bg-brand-panel border border-brand-border rounded-xl p-3">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-white font-semibold font-mono mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Basket table */}
          <HedgeBasketTable basket={result.basket} />

          {/* Notes */}
          {result.basket[0]?.hedgeHint && (
            <p className="text-xs text-amber-300/70">{result.basket[0].hedgeHint}</p>
          )}

          {/* Paper hedge button */}
          {!entered ? (
            <button
              onClick={handleEnterBasket}
              disabled={entering}
              className="w-full py-3 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700 text-amber-300 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {entering ? 'Entering basket…' : user ? '🛡 Paper Hedge — Enter All Positions' : 'Sign In to Paper Hedge'}
            </button>
          ) : (
            <div className="bg-green-950/40 border border-green-800 rounded-xl p-4 text-center">
              <p className="text-green-300 font-semibold">✅ Hedge basket entered!</p>
              <p className="text-xs text-gray-400 mt-1">Group ID: {entered.groupId} — Track in Dashboard</p>
            </div>
          )}

          <p className="text-[11px] text-gray-600 text-center">{result.note}</p>
        </div>
      )}
    </div>
  );
}
