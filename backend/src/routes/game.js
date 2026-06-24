/**
 * Routes de l'API du jeu. Le backend est l'autorité des règles :
 * le frontend ne fait que présenter l'état et solliciter ces endpoints.
 *
 *   POST /api/new                          -> { state, status }
 *   POST /api/move      { state, move }    -> { state, status }
 *   POST /api/ai-move   { state, difficulty } -> { move, metrics, state, status }
 */
const express = require('express');

const { createInitialState } = require('../engine/board');
const { applyMove, getGameStatus } = require('../engine/rules');
const { chooseMove } = require('../engine/ai');

const router = express.Router();

/** Valide et normalise un état reçu du client. */
function parseState(raw) {
  if (!raw || !Array.isArray(raw.cells) || raw.cells.length !== 9) {
    throw new Error('État invalide : "cells" doit être un tableau de 9 entiers.');
  }
  const cells = raw.cells.map((v) => {
    const n = Number(v);
    if (![0, 1, 2].includes(n)) throw new Error('Cases : valeurs autorisées 0, 1, 2.');
    return n;
  });
  const current = raw.current === 2 ? 2 : 1;
  const placed = Number.isInteger(raw.placed) ? raw.placed : cells.filter((v) => v !== 0).length;
  const plies = Number.isInteger(raw.plies) ? raw.plies : 0;
  return { cells, current, placed, plies };
}

function withStatus(state) {
  return { state, status: getGameStatus(state) };
}

router.post('/new', (req, res) => {
  res.json(withStatus(createInitialState()));
});

router.post('/move', (req, res) => {
  try {
    const state = parseState(req.body.state);
    const { move } = req.body;
    const next = applyMove(state, move);
    res.json(withStatus(next));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ai-move', (req, res) => {
  try {
    const state = parseState(req.body.state);
    const difficulty = ['easy', 'medium', 'hard'].includes(req.body.difficulty)
      ? req.body.difficulty : 'hard';
    const status = getGameStatus(state);
    if (status.isOver) {
      return res.status(400).json({ error: 'La partie est terminée.' });
    }
    const { move, metrics } = chooseMove(state, difficulty);
    const next = applyMove(state, move);
    return res.json({ move, metrics, ...withStatus(next) });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
