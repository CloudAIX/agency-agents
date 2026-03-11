/**
 * Auth middleware
 * verifyToken — Firebase ID token (user routes)
 * verifyAgentToken — API key (agentic routes)
 */
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin once
let firebaseApp = null;
function getFirebaseApp() {
  if (!firebaseApp) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      firebaseApp = admin.initializeApp(); // fallback: use GOOGLE_APPLICATION_CREDENTIALS
    }
  }
  return firebaseApp;
}

/**
 * Verify Firebase ID token from Authorization: Bearer <token>
 */
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = header.slice(7);
  try {
    const app = getFirebaseApp();
    const decoded = await admin.auth(app).verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Verify agent API key from X-Agent-Key header or Authorization: Bearer <jwt>
 * Agents can use a simple JWT signed with AGENT_SECRET
 */
function verifyAgentToken(req, res, next) {
  const apiKey = req.headers['x-agent-key'];
  const bearerToken = req.headers.authorization?.slice(7);
  const token = apiKey || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'X-Agent-Key or Bearer token required' });
  }

  // Simple API key check
  if (process.env.AGENT_API_KEYS) {
    const validKeys = process.env.AGENT_API_KEYS.split(',');
    if (validKeys.includes(token)) {
      req.agentId = token.slice(-8); // last 8 chars as agent ID
      return next();
    }
  }

  // JWT verification
  try {
    const decoded = jwt.verify(token, process.env.AGENT_SECRET || 'dev_secret');
    req.agentId = decoded.agentId || decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid agent token' });
  }
}

module.exports = { verifyToken, verifyAgentToken };
