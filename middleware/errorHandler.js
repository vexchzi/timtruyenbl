/**
 * Error Handler Middleware
 * 
 * Centralized error handling cho Express
 */

/**
 * Custom error class với status code
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper
 * - Tự động catch errors từ async functions
 * - Không cần try/catch trong mỗi controller
 * 
 * @param {Function} fn - Async controller function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Route ${req.method} ${req.path} not found`, 404);
  next(error);
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('[Error]', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'Dữ liệu đã tồn tại'
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'ID không hợp lệ'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Token không hợp lệ'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.isOperational 
    ? err.message 
    : 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  errorHandler
};
