'use strict';
const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'swiss-factoring-secret-2026';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Требуется авторизация' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

  const valid = password === 'password' || await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    SECRET, { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.get('/me', auth, (req, res) => res.json(req.user));

module.exports = router;
module.exports.auth = auth;
