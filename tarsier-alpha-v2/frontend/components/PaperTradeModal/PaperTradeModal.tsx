/**
 * Paper Trade Entry Modal
 * Shows: entry price (Polygon mid + 0.5% slippage), strike, qty, Greeks
 * On confirm: POST /api/agent/paper-trade (user authed) or prompts sign in
 */
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  scan: any;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PaperTradeModal({ open, onClose, scan }: Props) {
  const { user, signIn, getToken } = useAuth();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState('');

  const isShort = scan?.side === 'short';
  const entryPrice = scan?.paperEntryPrice || 0;
  const totalCost = entryPrice * qty * 100;

  const handleConfirm = async () => {
    if (!user) { await signIn(); return; }
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${API}/api/agent/paper-trade`,
        {
          ticker: scan.ticker,
          strike: scan.chain.strike,
          side: scan.side,
          qty,
          expiry: scan.chain.expiry,
          setupType: scan.setupType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to enter trade. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(null);
    setError('');
    setQty(1);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-brand-panel border border-brand-border rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {isShort
                ? <TrendingDown size={18} className="text-red-400" />
                : <TrendingUp size={18} className="text-green-400" />
              }
              <Dialog.Title className="font-bold text-white text-lg">
                Paper {isShort ? 'Short' : 'Long'} — {scan?.ticker}
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 rounded-lg hover:bg-brand-border transition-colors text-gray-400">
              <X size={16} />
            </Dialog.Close>
          </div>

          {success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h3 className="text-white font-semibold">Trade Logged!</h3>
              <div className="bg-brand-dark rounded-xl p-4 text-sm font-mono text-left space-y-1.5">
                <div className="flex justify-between"><span className="text-gray-400">Entry Price</span><span className="text-white">${success.entryPrice?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Qty</span><span className="text-white">{qty} contract{qty > 1 ? 's' : ''}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Timestamp</span><span className="text-gray-300 text-xs">{new Date(success.timestamp).toLocaleString()}</span></div>
              </div>
              <p className="text-xs text-gray-500">Track in My Portfolio → Dashboard</p>
              <button onClick={handleClose} className="btn-primary w-full">Done</button>
            </div>
          ) : (
            /* Entry form */
            <div className="space-y-4">
              {/* Setup summary */}
              <div className="bg-brand-dark rounded-xl p-4 text-sm font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Setup</span>
                  <span className="text-white capitalize">{scan?.setupType?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Option</span>
                  <span className="text-white">{scan?.chain?.optionType?.toUpperCase()} ${scan?.chain?.strike} exp {scan?.chain?.expiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Price</span>
                  <span className={isShort ? 'text-red-300' : 'text-green-300'}>${entryPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Δ {scan?.chain?.delta?.toFixed(2)}</span>
                  <span>θ {scan?.chain?.theta?.toFixed(3)}</span>
                  <span>IV {((scan?.chain?.iv || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Qty selector */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Contracts</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-brand-border hover:bg-gray-600 transition-colors text-white font-bold">−</button>
                  <span className="w-8 text-center text-white font-mono">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(50, q + 1))} className="w-8 h-8 rounded-lg bg-brand-border hover:bg-gray-600 transition-colors text-white font-bold">+</button>
                </div>
              </div>

              {/* Total cost */}
              <div className="flex justify-between text-sm border-t border-brand-border pt-3">
                <span className="text-gray-400">Total Cost (paper)</span>
                <span className="text-white font-semibold font-mono">${totalCost.toFixed(2)}</span>
              </div>

              {/* Margin alert for shorts */}
              {isShort && (
                <div className="flex gap-2 bg-red-950/40 border border-red-900/40 rounded-lg p-3 text-xs text-red-300">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{scan?.riskNote || 'Puts carry downside risk if stock moves up sharply.'}</span>
                </div>
              )}

              {/* Error */}
              {error && <p className="text-sm text-red-400">{error}</p>}

              {/* Confirm */}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={clsx(
                  'w-full py-3 rounded-xl text-sm font-semibold transition-colors',
                  loading && 'opacity-50 cursor-not-allowed',
                  isShort
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-green-700 hover:bg-green-600 text-white'
                )}
              >
                {loading ? 'Logging…' : user ? `Paper ${isShort ? 'Short' : 'Long'} — ${qty} Contract${qty > 1 ? 's' : ''}` : 'Sign In to Paper Trade'}
              </button>
              <p className="text-center text-[11px] text-gray-600">No real trades. Simulated fill at mid + 0.5% slippage.</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
