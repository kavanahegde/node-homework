function authMiddleware(req, res, next) {
  if (!global.user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

module.exports = authMiddleware;
