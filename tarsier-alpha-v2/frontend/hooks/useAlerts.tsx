/**
 * WebSocket alerts hook + context
 * Connects to WS /ws/alerts, plays audio cues, and dispatches new setups
 *
 * Long alert: high-pitched beep (880 Hz)
 * Short alert: low horn (220 Hz)
 */
import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

interface AlertsContextType {
  latestScan: any | null;
  connected: boolean;
  subscribeSide: (side: 'long' | 'short' | 'both') => void;
}

const AlertsContext = createContext<AlertsContextType>({} as AlertsContextType);

function playTone(freq: number, duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* ignore — no audio context */ }
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latestScan, setLatestScan] = useState<any | null>(null);
  const subscribedSide = useRef<string>('both');

  const connect = useCallback(() => {
    if (!process.env.NEXT_PUBLIC_WS_URL) return;
    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/alerts`);

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({ action: 'subscribe', side: subscribedSide.current }));
    };

    socket.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'scan') {
        setLatestScan(msg.payload);
        // Play tone based on side
        if (msg.payload.side === 'long') playTone(880);
        else if (msg.payload.side === 'short') playTone(220);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      // Reconnect after 5s
      setTimeout(connect, 5000);
    };

    socket.onerror = () => socket.close();
    ws.current = socket;
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  const subscribeSide = (side: 'long' | 'short' | 'both') => {
    subscribedSide.current = side;
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'subscribe', side }));
    }
  };

  return (
    <AlertsContext.Provider value={{ latestScan, connected, subscribeSide }}>
      {children}
    </AlertsContext.Provider>
  );
}

export const useAlerts = () => useContext(AlertsContext);
