/**
 * Individual scan result card
 * Shows: ticker, setup type, score, option details, badges, Paper Enter button
 */
import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Flame } from 'lucide-react';
import clsx from 'clsx';
import PaperTradeModal from '../PaperTradeModal/PaperTradeModal';

export default function ScanCard({ scan }: { scan: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const isShort = scan.side === 'short';
  const scoreColor = scan.score >= 85 ? 'score-high' : 'score-medium';

  return (
    <>
      <div className="scan-card flex flex-col gap-3 animate-fade-in">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg font-mono">{scan.ticker}</span>
              {isShort
                ? <span className="pill-short"><TrendingDown size={10} /> SHORT</span>
                : <span className="pill-long"><TrendingUp size={10} /> LONG</span>
              }
            </div>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {scan.setupType?.replace(/_/g, ' ')}
            </p>
          </div>
          <span className={scoreColor}>{scan.score}</span>
        </div>

        {/* Price & change */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white font-mono">${scan.price?.toFixed(2)}</span>
          <span className={clsx('text-xs font-mono', (scan.change1d || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
            {(scan.change1d || 0) >= 0 ? '+' : ''}{(scan.change1d || 0).toFixed(2)}%
          </span>
          {scan.rsi && (
            <span className={clsx('text-xs', scan.rsi < 30 ? 'text-blue-400' : scan.rsi > 70 ? 'text-orange-400' : 'text-gray-500')}>
              RSI {scan.rsi}
            </span>
          )}
        </div>

        {/* Option details */}
        {scan.chain && (
          <div className="bg-brand-dark/60 rounded-lg p-2.5 text-xs font-mono space-y-1">
            <div className="flex justify-between text-gray-300">
              <span>{scan.chain.optionType?.toUpperCase()} ${scan.chain.strike}</span>
              <span className="text-gray-400">{scan.chain.expiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Entry</span>
              <span className="text-white">${scan.paperEntryPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Δ {scan.chain.delta?.toFixed(2)} | θ {scan.chain.theta?.toFixed(3)}</span>
              <span>IV {((scan.chain.iv || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Entry zone */}
        {scan.entryZone && (
          <p className="text-xs text-gray-400">Zone: {scan.entryZone}</p>
        )}

        {/* Leverage (shorts) */}
        {scan.leverage && (
          <p className="text-xs text-orange-300">~{scan.leverage}x leverage</p>
        )}

        {/* Badges */}
        {scan.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scan.badges.includes('theta_burn') && (
              <span className="badge-warning"><Flame size={10} /> Theta Burn</span>
            )}
            {scan.badges.includes('margin_alert') && (
              <span className="badge-warning"><AlertTriangle size={10} /> Margin Alert</span>
            )}
          </div>
        )}

        {/* Risk note (shorts) */}
        {scan.riskNote && (
          <p className="text-[11px] text-red-400/70 border border-red-900/30 rounded px-2 py-1">
            ⚠ {scan.riskNote}
          </p>
        )}

        {/* Paper Enter button */}
        <button
          onClick={() => setModalOpen(true)}
          className={clsx(
            'mt-auto w-full py-2 rounded-lg text-sm font-semibold transition-colors',
            isShort
              ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800'
              : 'bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800'
          )}
        >
          Paper {isShort ? 'Short' : 'Long'} →
        </button>
      </div>

      <PaperTradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        scan={scan}
      />
    </>
  );
}
