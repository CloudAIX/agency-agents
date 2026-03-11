require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const scansRouter = require('./routes/scans');
const pnlRouter = require('./routes/pnl');
const agentRouter = require('./routes/agent');
const authRouter = require('./routes/auth');
const hedgeRouter = require('./routes/hedge');
const tradesRouter = require('./routes/trades');
const { initWebSocket } = require('./websocket/alerts');

const app = express();
const server = http.createServer(app);

// Security & middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Rate limiting — public API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down.' }
});
app.use('/api/', apiLimiter);

// OpenAPI docs
try {
  const swaggerDoc = YAML.load('./openapi.yaml');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch (e) {
  console.warn('OpenAPI spec not found — skipping Swagger UI');
}

// Routes
app.use('/api/scans', scansRouter);
app.use('/api/pnl', pnlRouter);
app.use('/api/agent', agentRouter);
app.use('/api/auth', authRouter);
app.use('/api/hedge', hedgeRouter);
app.use('/api/trades', tradesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tarsieralpha')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// WebSocket alerts
initWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`TarsierAlpha v2 backend running on port ${PORT}`));

module.exports = app;
