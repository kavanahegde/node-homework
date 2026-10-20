function register(req, res) {
  const { name, email, password } = req.body;
  const user = { id: global.users.length + 1, name, email, password };

  global.users.push(user);
  global.user_id = user;

  return res.status(201).json({ name: user.name, email: user.email });
}

function logon(req, res) {
  const { email, password } = req.body;
  const user = global.users.find(
    (user) => user.email === email && user.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  global.user_id = user;
  return res.status(200).json({ name: user.name, email: user.email });
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200).json({ message: 'Logged off successfully' });
}

module.exports = { register, logon, logoff };
