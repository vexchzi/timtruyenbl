/**
 * Novel Recommender - Express Server
 * 
 * Web app gợi ý truyện Đam Mỹ dựa trên link Wattpad/WordPress
 * 
 * Stack: NodeJS (Express), MongoDB (Mongoose), ReactJS (Vite + Tailwind)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const { novelRoutes } = require('./routes');

// Import utilities
const { warmUpCache } = require('./utils/tagNormalizer');

// ============== CONFIG ==============

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_recommender';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============== EXPRESS APP ==============

const app = express();

// ============== MIDDLEWARE ==============

// CORS - Cho phép frontend gọi API
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://timtruyenbl.vercel.app'].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON body
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// ============== ROUTES ==============

// API routes
app.use('/api', novelRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Novel Recommender API',
    version: '1.0.0',
    description: 'API gợi ý truyện Đam Mỹ dựa trên link Wattpad',
    endpoints: {
      recommend: 'POST /api/recommend',
      novels: 'GET /api/novels',
      novelDetail: 'GET /api/novels/:id',
      similar: 'GET /api/novels/:id/similar',
      tags: 'GET /api/tags',
      stats: 'GET /api/stats',
      health: 'GET /api/health'
    },
    documentation: 'https://github.com/your-repo/novel-recommender'
  });
});

// ============== ERROR HANDLING ==============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============== DATABASE CONNECTION ==============

async function connectDatabase() {
  try {
    console.log('📡 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 8+ không cần các options cũ
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Log database info
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Documents: ${stats.objects}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// ============== GRACEFUL SHUTDOWN ==============

async function gracefulShutdown(signal) {
  console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============== START SERVER ==============

async function startServer() {
  console.log('\n🚀 NOVEL RECOMMENDER SERVER');
  console.log('='.repeat(50));
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  
  // Connect to database
  const dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Warm up tag normalizer cache
  try {
    console.log('🔥 Warming up tag normalizer cache...');
    await warmUpCache();
  } catch (error) {
    console.warn('⚠️  Could not warm up cache:', error.message);
  }
  
  // Start listening
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`📖 API:   http://localhost:${PORT}/api`);
    console.log('='.repeat(50));
    console.log('\n📝 Available endpoints:');
    console.log('   POST /api/recommend      - Gợi ý truyện từ URL');
    console.log('   GET  /api/novels         - Danh sách truyện');
    console.log('   GET  /api/novels/:id     - Chi tiết truyện');
    console.log('   GET  /api/tags           - Danh sách tags');
    console.log('   GET  /api/stats          - Thống kê');
    console.log('\n🎯 Ready to accept requests!\n');
  });
}

// Start the server
startServer();

module.exports = app;
