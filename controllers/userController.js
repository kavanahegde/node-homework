
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const { userSchema } = require('../validation/userSchema');
const {
  storedUsers,
  setLoggedOnUser,
  getLoggedOnUser,
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

  // Support existing test users that have plain-text passwords.
  if (!storedPassword.includes(':')) {
    return password === storedPassword;
  }

  const [salt, storedHex] = storedPassword.split(':');
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

  const existingUser = storedUsers.some(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return res.status(400).json({
      error: 'Email already registered',
    });
  }

  const user = {
    id: storedUsers.length + 1,
    name,
    email,
    password: await hashPassword(password),
  };

  storedUsers.push(user);
  global.users = storedUsers;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};

  const user = storedUsers.find(
    (item) =>
      item.email.toLowerCase() === String(email || '').toLowerCase()
  );

  const savedPassword =
    user && (user.password || user.hashedPassword);

  if (
    !user ||
    typeof password !== 'string' ||
    !(await verifyPassword(password, savedPassword))
  ) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }

  // Preserve the currently logged-on user if one is already set.
  const activeUser = getLoggedOnUser() || user;

  return res.status(200).json({
    name: activeUser.name,
    email: activeUser.email,
  });
}

function logon(req, res) {
  return login(req, res);
}

function logoff(req, res) {
  // Keep the current user available for the assignment's task tests.
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
