function errorHandler(err, req, res, next) {
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.log("The database connection was refused. Is your database service running?");
  }

  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }

  console.error(err.stack || err);

  res.status(500).json({
    error: 'Internal Server Error',
  });
}

module.exports = errorHandler;
