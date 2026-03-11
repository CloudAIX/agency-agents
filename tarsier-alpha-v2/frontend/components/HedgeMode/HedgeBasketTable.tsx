/**
 * Hedge basket results table
 * Ticker | Strike | Premium | Expected Gain -5% | Greeks | Badges
 */
import { AlertTriangle, Flame } from 'lucide-react';

export default function HedgeBasketTable({ basket }: { basket: any[] }) {
  if (!basket?.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-border text-gray-400 text-xs">
            <th className="text-left px-3 py-2.5">Ticker</th>
            <th className="text-left px-3 py-2.5">Strike / Exp</th>
            <th className="text-right px-3 py-2.5">Premium</th>
            <th className="text-right px-3 py-2.5">Contracts</th>
            <th className="text-right px-3 py-2.5">Cost</th>
            <th className="text-right px-3 py-2.5">Gain @−5%</th>
            <th className="text-left px-3 py-2.5">Greeks</th>
            <th className="text-left px-3 py-2.5">Flags</th>
          </tr>
        </thead>
        <tbody>
          {basket.map((item, i) => (
            <tr key={i} className="border-b border-brand-border/50 hover:bg-brand-panel/60 transition-colors">
              <td className="px-3 py-3 font-mono font-bold text-white">{item.ticker}</td>
              <td className="px-3 py-3 font-mono text-gray-300 text-xs">
                ${item.strike} PUT<br />
                <span className="text-gray-500">{item.expiry}</span>
              </td>
              <td className="px-3 py-3 text-right font-mono text-amber-300">${item.premium?.toFixed(2)}</td>
              <td className="px-3 py-3 text-right text-gray-300">{item.contracts}</td>
              <td className="px-3 py-3 text-right font-mono text-white">${item.totalCost?.toLocaleString()}</td>
              <td className="px-3 py-3 text-right font-mono text-green-400">+${item.expectedGainAt5pctDrop?.toLocaleString()}</td>
              <td className="px-3 py-3 text-xs font-mono text-gray-400">
                Δ {item.greeks?.delta?.toFixed(2)}<br />
                IV {((item.iv || 0) * 100).toFixed(0)}%
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-col gap-1">
                  {item.badges?.includes('theta_burn') && (
                    <span className="badge-warning text-[10px]"><Flame size={9} /> θ Burn</span>
                  )}
                  {item.badges?.includes('margin_alert') && (
                    <span className="badge-warning text-[10px]"><AlertTriangle size={9} /> Margin</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-xs text-gray-500 border-t border-brand-border">
            <td colSpan={4} className="px-3 py-2">Total</td>
            <td className="px-3 py-2 text-right font-mono text-white font-semibold">
              ${basket.reduce((s, b) => s + b.totalCost, 0).toLocaleString()}
            </td>
            <td className="px-3 py-2 text-right font-mono text-green-400 font-semibold">
              +${basket.reduce((s, b) => s + b.expectedGainAt5pctDrop, 0).toLocaleString()}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
