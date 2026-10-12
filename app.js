const express = require('express');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const timeRoutes = require('./routes/timeRoutes');

const app = express();

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/testpost', (req, res) => {
  res.status(200).json({
    message: 'POST route works',
  });
});

// Mount time routes
app.use('/api', timeRoutes);

// Handle unknown routes
app.use(notFound);

// Handle errors
app.use(errorHandler);

let server;

if (require.main === module) {
  const port = process.env.PORT || 3000;

  server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = { app, server };
