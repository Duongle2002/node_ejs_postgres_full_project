const jwt = require('jsonwebtoken');

module.exports = (opts = { redirect: true }) => (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    if (opts.redirect) return res.redirect('/login');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch (err) {
    if (opts.redirect) return res.redirect('/login');
    return res.status(401).json({ error: 'Invalid token' });
  }
};
