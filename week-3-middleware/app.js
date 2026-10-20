const express = require('express');
const { randomUUID } = require('crypto');
const path = require('path');
const dogsRouter = require('./routes/dogs');

const app = express();

// Assign a unique ID to each request.
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Basic request logging.
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`
  );
  next();
});

// Request timing and slow-request warnings.
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
      `[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId}) - ${duration}ms`
    );

    if (duration >= 100) {
      console.warn(
        `WARNING: Slow request detected: ${req.method} ${req.path} took ${duration}ms`
      );
    }
  });

  next();
});

// Security headers.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Parse JSON with a 1 MB size limit.
app.use(express.json({ limit: '1mb' }));

// Serve static files from the public directory.
app.use(express.static(path.join(__dirname, 'public')));

// Validate Content-Type on POST requests.
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(400).json({
      error: 'Content-Type must be application/json',
      requestId: req.requestId,
    });
  }

  next();
});

// Dog routes — required by the assignment.
app.use('/', dogsRouter);

// 404 handler.
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

// Central error handler.
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  if (err.name === 'ValidationError' || err.name === 'NotFoundError') {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else if (statusCode >= 500) {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  } else {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  }

  res.status(statusCode).json({
    error: statusCode >= 500
      ? 'Internal Server Error'
      : err.message,
    requestId: req.requestId,
  });
});

module.exports = app; // Do not remove this line

if (require.main === module) {
  app.listen(3000, () => console.log('Server listening on port 3000'));
}
