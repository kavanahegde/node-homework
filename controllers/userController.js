const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const { userSchema } = require('../validation/userSchema');
const pool = require('../db/pg-pool');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);

  return `${salt}:${key.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
  if (typeof storedPassword !== 'string' || !storedPassword.includes(':')) {
    return false;
  }

  const separatorIndex = storedPassword.indexOf(':');
  const salt = storedPassword.slice(0, separatorIndex);
  const storedHex = storedPassword.slice(separatorIndex + 1);

  if (!salt || !/^[0-9a-f]+$/i.test(storedHex) || storedHex.length === 0) {
    return false;
  }

  const storedKey = Buffer.from(storedHex, 'hex');
  const derivedKey = await scrypt(password, salt, 64);

  return (
    storedKey.length === derivedKey.length &&
    crypto.timingSafeEqual(storedKey, derivedKey)
  );
}

async function register(req, res, next) {
  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.details,
    });
  }

  try {
    const hashedPassword = await hashPassword(value.password);
    const email = value.email.trim().toLowerCase();

    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email, value.name, hashedPassword]
    );

    const user = result.rows[0];
    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    return next(err);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (
      result.rows.length === 0 ||
      !(await verifyPassword(password, result.rows[0].hashed_password))
    ) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const user = result.rows[0];
    global.user_id = user.id;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return next(err);
  }
}

function logon(req, res, next) {
  return login(req, res, next);
}

function logoff(req, res) {
  global.user_id = null;

  return res.status(200).json({
    message: 'Logged off successfully',
  });
}

module.exports = {
  register,
  login,
  logon,
  logoff,
};
