import { sendSlackNotification } from '../services/logger.service.js';

export const handleHttpError = (res, message = 'Error interno', code = 500) => {
  res.status(code).json({
    error: true,
    message
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Requirements: Only send 5XX errors to Slack 
  if (statusCode >= 500) {
    sendSlackNotification({
      status: statusCode,
      message: message,
      method: req.method,
      route: req.originalUrl,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};