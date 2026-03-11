/**
 * WebSocket server — WS /ws/alerts
 * Pushes new high-score setups and vol spikes to connected clients
 *
 * Client receives: { type: 'scan', payload: <ScanObject> }
 *                  { type: 'vol_spike', payload: { ticker, iv, prev_iv } }
 *                  { type: 'ping' }
 */
const { WebSocketServer } = require('ws');

let wss = null;
const PING_INTERVAL = 30000; // 30s

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws/alerts' });

  wss.on('connection', (ws, req) => {
    console.log(`WS client connected: ${req.socket.remoteAddress}`);

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', raw => {
      try {
        const msg = JSON.parse(raw);
        // Clients can subscribe to specific sides: { action: 'subscribe', side: 'short' }
        if (msg.action === 'subscribe') {
          ws.subscribedSide = msg.side || 'both';
        }
      } catch { /* ignore malformed messages */ }
    });

    ws.on('close', () => console.log('WS client disconnected'));
    ws.on('error', err => console.error('WS error:', err.message));

    ws.send(JSON.stringify({ type: 'connected', message: 'TarsierAlpha alerts stream ready' }));
  });

  // Heartbeat — drop dead connections
  const pingInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, PING_INTERVAL);

  wss.on('close', () => clearInterval(pingInterval));

  console.log('WebSocket alert server initialized at /ws/alerts');
  return wss;
}

/**
 * Broadcast a new scan result to all subscribed clients
 * Called by scanner after each qualifying result
 */
function broadcastScan(setup) {
  if (!wss) return;
  const payload = JSON.stringify({ type: 'scan', payload: setup });

  wss.clients.forEach(ws => {
    if (ws.readyState !== 1) return; // OPEN
    const sub = ws.subscribedSide || 'both';
    if (sub === 'both' || sub === setup.side) {
      ws.send(payload);
    }
  });
}

/**
 * Broadcast a volatility spike alert
 */
function broadcastVolSpike(data) {
  if (!wss) return;
  const payload = JSON.stringify({ type: 'vol_spike', payload: data });
  wss.clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload);
  });
}

module.exports = { initWebSocket, broadcastScan, broadcastVolSpike };
