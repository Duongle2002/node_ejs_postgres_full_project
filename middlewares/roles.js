module.exports = {
  admin: (opts = { redirect: false }) => (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    if (opts.redirect) return res.redirect('/');
    return res.status(403).send('Không có quyền');
  }
};
