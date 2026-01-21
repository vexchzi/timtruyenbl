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

// Import security middlewares
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

// ...

// ============== MIDDLEWARE ==============

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để tránh chặn script inline của Admin Panel (nếu cần thì bật lại sau)
  crossOriginEmbedderPolicy: false
}));

// Sanitize Data (Chống NoSQL Injection)
app.use(mongoSanitize());

// Prevent Parameter Pollution
app.use(hpp());

// Rate Limiting (Chống DDoS / Spam API)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 200, // Tối đa 200 request mỗi IP
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút.'
  }
});
app.use('/api', limiter);

// CORS - Cho phép frontend gọi API
app.use(cors({
  // ... (giữ nguyên config CORS cũ hoặc siết chặt hơn nếu muốn)
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
  credentials: true
}));

// Parse JSON body
app.use(express.json({ limit: '10kb' })); // Giới hạn body size để chống tràn bộ nhớ

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

// ============== STATIC FILES ==============

const path = require('path');

// Serve admin page and other static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve React frontend (built files)
app.use(express.static(path.join(__dirname, 'client/dist')));

// ============== ROUTES ==============

// API routes
app.use('/api', novelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/updates', updateRoutes);

// API info endpoint
app.get('/api', (req, res) => {
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

// ============== SPA FALLBACK ==============

// Serve React app for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Skip admin page
  if (req.path === '/admin.html' || req.path === '/admin') {
    return res.sendFile(path.join(__dirname, 'public/admin.html'));
  }

  // Serve React SPA
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If React build doesn't exist, send API info
      res.json({
        name: 'Novel Recommender API',
        message: 'Frontend not built. Run: cd client && npm run build'
      });
    }
  });
});

// ============== ERROR HANDLING ==============

// 404 handler for API routes
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
