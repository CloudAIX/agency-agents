/**
 * Banner that pops up when a new scan alert arrives over WebSocket
 */
import { useEffect, useState } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import clsx from 'clsx';

export default function AlertBanner() {
  const { latestScan } = useAlerts();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  useEffect(() => {
    if (!latestScan) return;
    setCurrent(latestScan);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, [latestScan]);

  if (!visible || !current) return null;

  const isShort = current.side === 'short';

  return (
    <div className={clsx(
      'fixed top-16 right-4 z-50 max-w-sm rounded-xl border p-4 shadow-2xl animate-fade-in',
      isShort
        ? 'bg-red-950/90 border-red-700 text-red-100'
        : 'bg-green-950/90 border-green-700 text-green-100'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isShort ? <TrendingDown size={18} className="text-red-400 shrink-0" /> : <TrendingUp size={18} className="text-green-400 shrink-0" />}
          <div>
            <p className="font-bold text-sm">
              {isShort ? '📉 SHORT' : '📈 LONG'} {current.ticker}
              <span className="ml-2 text-xs font-normal opacity-70">{current.setupType?.replace('_', ' ')}</span>
            </p>
            <p className="text-xs opacity-80">
              Score: {current.score}/100 · {current.chain?.optionType?.toUpperCase()} ${current.chain?.strike} exp {current.chain?.expiry}
            </p>
            <p className="text-xs opacity-70 mt-0.5">Paper entry: ${current.paperEntryPrice}</p>
          </div>
        </div>
        <button onClick={() => setVisible(false)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
