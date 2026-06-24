/**
 * Règles du jeu Fanoron-telo : génération des coups légaux, validation,
 * application d'un coup et calcul du statut de la partie.
 *
 * Un coup est représenté par :
 *   - phase placement : { type: 'place', to }
 *   - phase mouvement : { type: 'move', from, to }
 */

const {
  EMPTY, P1, P2, ADJACENCY, TOTAL_PLACEMENTS, MOVEMENT_DRAW_LIMIT, opponent,
} = require('./constants');
const {
  cloneState, getPhase, findWinningLine,
} = require('./board');

/** Liste tous les coups légaux pour le joueur courant. */
function getLegalMoves(state) {
  const moves = [];
  const me = state.current;
  if (getPhase(state) === 'placement') {
    for (let i = 0; i < 9; i++) {
      if (state.cells[i] === EMPTY) moves.push({ type: 'place', to: i });
    }
  } else {
    for (let i = 0; i < 9; i++) {
      if (state.cells[i] !== me) continue;
      for (const j of ADJACENCY[i]) {
        if (state.cells[j] === EMPTY) moves.push({ type: 'move', from: i, to: j });
      }
    }
  }
  return moves;
}

function sameMove(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'place') return a.to === b.to;
  return a.from === b.from && a.to === b.to;
}

function isLegalMove(state, move) {
  return getLegalMoves(state).some((m) => sameMove(m, move));
}

/**
 * Applique un coup et renvoie un NOUVEL état. Lève une erreur si le coup
 * est illégal (la robustesse des règles passe par cette validation stricte).
 */
function applyMove(state, move) {
  if (!isLegalMove(state, move)) {
    throw new Error(`Coup illégal: ${JSON.stringify(move)}`);
  }
  const next = cloneState(state);
  if (move.type === 'place') {
    next.cells[move.to] = state.current;
    next.placed += 1;
  } else {
    next.cells[move.from] = EMPTY;
    next.cells[move.to] = state.current;
    next.plies += 1;
  }
  next.current = opponent(state.current);
  return next;
}

/**
 * Statut complet de la partie au sens des règles :
 *   { winner, line, isDraw, isOver, phase, current, legalMoves, reason }
 *
 * Règles de fin :
 *   - alignement de 3 pions => victoire (placement ou mouvement) ;
 *   - en phase mouvement, joueur sans coup légal => il perd (bloqué) ;
 *   - limite de demi-coups atteinte sans gain => match nul.
 */
function getGameStatus(state) {
  const { winner, line } = findWinningLine(state.cells);
  const phase = getPhase(state);
  if (winner !== EMPTY) {
    return {
      winner, line, isDraw: false, isOver: true, phase,
      current: state.current, legalMoves: [], reason: 'alignment',
    };
  }
  const legalMoves = getLegalMoves(state);
  if (phase === 'movement') {
    if (legalMoves.length === 0) {
      // Joueur courant bloqué : il perd.
      return {
        winner: opponent(state.current), line: null, isDraw: false, isOver: true,
        phase, current: state.current, legalMoves: [], reason: 'blocked',
      };
    }
    if (state.plies >= MOVEMENT_DRAW_LIMIT) {
      return {
        winner: EMPTY, line: null, isDraw: true, isOver: true, phase,
        current: state.current, legalMoves, reason: 'draw-limit',
      };
    }
  }
  return {
    winner: EMPTY, line: null, isDraw: false, isOver: false, phase,
    current: state.current, legalMoves, reason: null,
  };
}

module.exports = {
  getLegalMoves, isLegalMove, sameMove, applyMove, getGameStatus,
};
