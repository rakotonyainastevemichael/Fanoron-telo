/**
 * Intelligence artificielle du Fanoron-telo.
 *
 * Algorithme : Negamax avec élagage Alpha-Bêta.
 * Optimisations : table de transposition (TT), approfondissement itératif
 * (iterative deepening), ordonnancement des coups (move ordering) et
 * détection de répétition sur le chemin de recherche (nul par répétition).
 *
 * Trois difficultés :
 *   - 'easy'   : coup aléatoire parmi les coups légaux ;
 *   - 'medium' : Alpha-Bêta à profondeur limitée (tactique mais faillible) ;
 *   - 'hard'   : approfondissement itératif profond => jeu quasi parfait.
 */

const {
  EMPTY, LINES, MOVEMENT_DRAW_LIMIT, opponent,
} = require('./constants');
const {
  cloneState, getPhase, checkWinner, stateKey,
} = require('./board');
const { getLegalMoves, sameMove } = require('./rules');

const WIN = 100000;

const CONFIG = {
  easy: { maxDepth: 0, timeMs: 0 },
  medium: { maxDepth: 4, timeMs: 250 },
  hard: { maxDepth: 24, timeMs: 900 },
};

/** Application rapide d'un coup déjà connu comme légal (sans revalidation). */
function fastApply(state, move) {
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
 * Fonction d'évaluation heuristique, du point de vue du joueur au trait.
 * Récompense les menaces (2 pions + 1 case libre sur une ligne), le contrôle
 * du centre (case la plus connectée) et pénalise symétriquement l'adversaire.
 */
function evaluate(state) {
  const S = state.current;
  const O = opponent(S);
  const c = state.cells;
  let score = 0;
  for (const [a, b, d] of LINES) {
    let s = 0; let o = 0; let e = 0;
    for (const idx of [a, b, d]) {
      const v = c[idx];
      if (v === S) s += 1; else if (v === O) o += 1; else e += 1;
    }
    if (s === 2 && e === 1) score += 12;
    else if (s === 1 && e === 2) score += 2;
    if (o === 2 && e === 1) score -= 12;
    else if (o === 1 && e === 2) score -= 2;
  }
  if (c[4] === S) score += 4; else if (c[4] === O) score -= 4;
  return score;
}

/** Ordonnancement : coup de la TT > gain immédiat > centre > reste. */
function orderMoves(state, moves, ttMove) {
  const scored = moves.map((m) => {
    let s = 0;
    if (ttMove && sameMove(m, ttMove)) s += 1e9;
    const child = fastApply(state, m);
    if (checkWinner(child.cells) === state.current) s += 1e8;
    if (m.to === 4) s += 50;
    return { m, s };
  });
  scored.sort((x, y) => y.s - x.s);
  return scored.map((x) => x.m);
}

function negamax(state, depth, alpha, beta, ply, ctx) {
  ctx.nodes += 1;
  const key = stateKey(state);

  // Nul par répétition sur le chemin courant (phase mouvement).
  if (ctx.path.has(key)) return 0;

  // L'adversaire (qui vient de jouer) a-t-il aligné ? Si oui, le camp au trait perd.
  if (checkWinner(state.cells) !== EMPTY) return -(WIN - ply);

  const phase = getPhase(state);
  const moves = getLegalMoves(state);
  if (phase === 'movement') {
    if (moves.length === 0) return -(WIN - ply); // bloqué => perd
    if (state.plies >= MOVEMENT_DRAW_LIMIT) return 0; // nul
  }
  if (depth === 0) return evaluate(state);

  // Sonde de la table de transposition.
  const tt = ctx.tt.get(key);
  let ttMove = tt ? tt.move : null;
  if (tt && tt.depth >= depth) {
    if (tt.flag === 'EXACT') return tt.value;
    if (tt.flag === 'LOWER') { if (tt.value > alpha) alpha = tt.value; }
    else if (tt.flag === 'UPPER') { if (tt.value < beta) beta = tt.value; }
    if (alpha >= beta) return tt.value;
  }

  const ordered = orderMoves(state, moves, ttMove);
  const alphaOrig = alpha;
  let best = -Infinity;
  let bestMove = ordered[0];

  ctx.path.add(key);
  for (const m of ordered) {
    const child = fastApply(state, m);
    const val = -negamax(child, depth - 1, -beta, -alpha, ply + 1, ctx);
    if (val > best) { best = val; bestMove = m; }
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // coupure Alpha-Bêta
  }
  ctx.path.delete(key);

  let flag = 'EXACT';
  if (best <= alphaOrig) flag = 'UPPER';
  else if (best >= beta) flag = 'LOWER';
  ctx.tt.set(key, { depth, value: best, flag, move: bestMove });

  return best;
}

/** Recherche racine à fenêtre complète : valeur exacte de chaque coup. */
function searchRoot(state, depth, ctx) {
  const moves = getLegalMoves(state);
  const ttRoot = ctx.tt.get(stateKey(state));
  const ordered = orderMoves(state, moves, ttRoot ? ttRoot.move : null);
  const key = stateKey(state);

  let best = -Infinity;
  let bestMove = ordered[0];
  const equalMoves = [];

  ctx.path.add(key);
  for (const m of ordered) {
    const child = fastApply(state, m);
    const val = -negamax(child, depth - 1, -Infinity, Infinity, 1, ctx);
    if (val > best) {
      best = val; bestMove = m;
      equalMoves.length = 0; equalMoves.push(m);
    } else if (val === best) {
      equalMoves.push(m);
    }
  }
  ctx.path.delete(key);
  ctx.tt.set(key, { depth, value: best, flag: 'EXACT', move: bestMove });
  return { best, bestMove, equalMoves };
}

function iterativeDeepening(state, maxDepth, timeBudgetMs, ctx) {
  const start = Date.now();
  let result = { best: 0, bestMove: getLegalMoves(state)[0], equalMoves: [] };
  let reached = 0;
  for (let d = 1; d <= maxDepth; d += 1) {
    result = searchRoot(state, d, ctx);
    reached = d;
    if (Math.abs(result.best) >= WIN - 1000) break; // gain/perte forcé prouvé
    if (timeBudgetMs > 0 && Date.now() - start >= timeBudgetMs) break;
  }
  return { ...result, depth: reached };
}

/**
 * Choisit le coup de l'IA pour l'état donné.
 * @returns {{ move, metrics }}
 */
function chooseMove(state, difficulty = 'hard') {
  const t0 = Date.now();
  const legal = getLegalMoves(state);
  if (legal.length === 0) {
    return { move: null, metrics: { difficulty, timeMs: 0, nodes: 0, depth: 0, evaluation: 0 } };
  }

  if (difficulty === 'easy') {
    const move = legal[Math.floor(Math.random() * legal.length)];
    return {
      move,
      metrics: {
        difficulty, timeMs: Date.now() - t0, nodes: legal.length, depth: 0, evaluation: 0, ttSize: 0,
      },
    };
  }

  const cfg = CONFIG[difficulty] || CONFIG.hard;
  const ctx = { nodes: 0, tt: new Map(), path: new Set() };
  const r = iterativeDeepening(state, cfg.maxDepth, cfg.timeMs, ctx);

  // Variété : tirage au sort parmi les coups de valeur maximale (force identique).
  const pool = r.equalMoves && r.equalMoves.length ? r.equalMoves : [r.bestMove];
  const move = pool[Math.floor(Math.random() * pool.length)];

  return {
    move,
    metrics: {
      difficulty,
      timeMs: Date.now() - t0,
      nodes: ctx.nodes,
      depth: r.depth,
      evaluation: r.best,
      ttSize: ctx.tt.size,
    },
  };
}

module.exports = { chooseMove, evaluate, WIN, CONFIG };
