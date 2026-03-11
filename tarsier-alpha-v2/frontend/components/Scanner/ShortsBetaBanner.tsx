/**
 * Shorts opt-in beta banner
 * Shown first time user navigates to Shorts tab
 */
import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ShortsBetaBanner({ onEnable }: { onEnable: () => void }) {
  return (
    <div className="mt-6 max-w-xl mx-auto">
      <div className="bg-brand-panel border border-red-800/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle size={20} />
          <h2 className="font-bold text-lg">Shorts Beta — Read Before Enabling</h2>
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          <p>Short setups suggest <strong className="text-white">put options</strong> — not shorting stock directly. Puts have defined max loss but can expire worthless rapidly.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>All entries are <strong className="text-white">paper trades only</strong> — no real money moves</li>
            <li>Short Score 80+ only (stricter filter during beta)</li>
            <li>Capped at 20% of scanner results</li>
            <li>Every setup shows "Margin Alert" — stock +10% can mean 300%+ put loss</li>
          </ul>
        </div>

        <div className="bg-red-950/40 border border-red-900/40 rounded-lg p-3 text-xs text-red-300">
          ⚠ Short plays are <strong>theta negative</strong> — time decay works against you. Prefer spreads over naked puts. See{' '}
          <Link href="/blog/short-risks" className="underline hover:text-white">Short Risks Guide →</Link>
        </div>

        <button
          onClick={onEnable}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 rounded-xl font-semibold transition-colors"
        >
          I Understand — Enable Shorts Beta (Free)
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
