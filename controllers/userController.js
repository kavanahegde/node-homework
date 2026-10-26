
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const { userSchema } = require('../validation/userSchema');
const {
  storedUsers,
  setLoggedOnUser,
} = require('../util/memoryStore');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);

  return `${salt}:${key.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
  if (typeof storedPassword !== 'string') {
    return false;
  }

  // Support legacy plain-text passwords, if any exist.
  if (!storedPassword.includes(':')) {
    return password === storedPassword;
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

async function register(req, res) {
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  const { name, email, password } = value;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = storedUsers.some(
    (user) => user.email.trim().toLowerCase() === normalizedEmail
  );

  if (existingUser) {
    return res.status(400).json({
      error: 'Email already registered',
    });
  }

  const user = {
    id: storedUsers.length + 1,
    name,
    email: normalizedEmail,
    hashedPassword: await hashPassword(password),
  };

  storedUsers.push(user);
  global.users = storedUsers;

  // Set the current user so task ownership tests can identify the user.
  setLoggedOnUser(user);

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = storedUsers.find(
    (item) => item.email.trim().toLowerCase() === normalizedEmail
  );

  const savedPassword = user
    ? user.hashedPassword || user.password
    : undefined;

  if (!user || !(await verifyPassword(password, savedPassword))) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  setLoggedOnUser(user);

  return res.status(200).json({
    name: user.name,
    email: user.email,
  });
}

function logon(req, res) {
  return login(req, res);
}

function logoff(req, res) {
  setLoggedOnUser(null);

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
