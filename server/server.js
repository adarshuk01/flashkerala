const express = require('express');
const cors = require('cors');
const newsRoutes = require('./routes/news.routes');
const reelsRoutes = require('./routes/reels.routes');

const app = express();

// CORS — allows localhost dev + production frontend
const ALLOWED_ORIGINS = [
  'https://newsaxis.vercel.app',       // production
  'http://localhost:5500',             // VS Code Live Server
  'http://127.0.0.1:5500',            // VS Code Live Server (IP)
  'http://localhost:3000',             // React dev server
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/news', newsRoutes);
app.use('/api/reels', reelsRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`NewsAxis server running on port ${PORT}`));
