const express = require('express');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const timeRoutes = require('./routes/timeRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
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
}

module.exports = { app, server };
