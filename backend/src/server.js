/**
 * Serveur Express du Fanoron-telo.
 * - expose l'API du jeu sous /api ;
 * - sert le build du frontend (frontend/dist) en production, le cas échéant.
 */
const path = require('path');
const fs = require('fs');
const express = require('express');

const gameRoutes = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '64kb' }));

// CORS permissif (utile en développement quand le front tourne sur un autre port).
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.get('/api/health', (req, res) => res.json({ ok: true, game: 'fanoron-telo' }));
app.use('/api', gameRoutes);

// Service du frontend compilé (production).
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Fanoron-telo API à l'écoute sur http://localhost:${PORT}`);
});

module.exports = app;
