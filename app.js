const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const { rateLimit } = require('express-rate-limit');

const prisma = require('./db/prisma');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const timeRoutes = require('./routes/timeRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const jwtMiddleware = require('./middleware/jwtMiddleware');

const app = express();

app.set('trust proxy', 1);

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(xss());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Task Manager API');
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

app.post('/testpost', (req, res) => {
  res.json({ message: 'POST request received', body: req.body });
});

app.use('/api', timeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', jwtMiddleware, taskRoutes);
app.use('/api/analytics', jwtMiddleware, analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  if (require.main === module) {
    console.log(`Server is running on port ${PORT}`);
  }
});

if (require.main === module) {
  const shutdown = async () => {
    console.log('Shutting down server...');

    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { app, server };
