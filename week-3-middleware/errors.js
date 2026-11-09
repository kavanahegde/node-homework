class ValidationError extends Error {
  constructor(message = 'Missing required fields') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Dog not found or not available') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

module.exports = { ValidationError, NotFoundError };
