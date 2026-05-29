const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token mancante' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non valido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token scaduto o non valido' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso riservato agli amministratori' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
