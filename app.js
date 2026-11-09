const express = require('express');
const prisma = require('./db/prisma');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const timeRoutes = require('./routes/timeRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();

global.user_id = null;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      db: 'not connected',
      error: err.message,
    });
  }
});

app.post('/testpost', (req, res) => {
  res.status(200).json({ message: 'POST route works' });
});

app.use('/api', timeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);

app.use(notFound);
app.use(errorHandler);

let server;

if (require.main === module) {
  const port = process.env.PORT || 3000;

  server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  let isShuttingDown = false;

  async function shutdown(code = 0) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('Shutting down gracefully...');

    try {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('HTTP server closed.');


      await prisma.$disconnect();
      console.log('Prisma disconnected.');
    } catch (err) {
      console.error('Error during shutdown:', err);
      code = 1;
    } finally {
      process.exit(code);
    }
  }

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
}

module.exports = { app, server };
