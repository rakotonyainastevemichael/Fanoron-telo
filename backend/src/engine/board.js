/**
 * Représentation de l'état du plateau et détection de victoire.
 *
 * L'état du jeu est un objet immuable (jamais muté en place) :
 *   {
 *     cells:    Int8Array(9)  // 0 vide, 1 Mena, 2 Fotsy
 *     current:  1 | 2          // joueur dont c'est le tour
 *     placed:   number         // nombre total de pions déjà posés (0..6)
 *     plies:    number         // demi-coups joués en phase mouvement
 *   }
 *
 * La phase est dérivée de `placed` : tant que placed < 6 => placement.
 */

const { EMPTY, P1, P2, LINES, TOTAL_PLACEMENTS } = require('./constants');

function createInitialState() {
  return {
    cells: new Array(9).fill(EMPTY),
    current: P1,
    placed: 0,
    plies: 0,
  };
}

function cloneState(state) {
  return {
    cells: state.cells.slice(),
    current: state.current,
    placed: state.placed,
    plies: state.plies,
  };
}

function getPhase(state) {
  return state.placed < TOTAL_PLACEMENTS ? 'placement' : 'movement';
}

/**
 * Renvoie le joueur (1 ou 2) qui possède un alignement complet, ou 0.
 * Renvoie aussi la ligne gagnante pour l'affichage.
 */
function findWinningLine(cells) {
  for (const [a, b, c] of LINES) {
    const v = cells[a];
    if (v !== EMPTY && v === cells[b] && v === cells[c]) {
      return { winner: v, line: [a, b, c] };
    }
  }
  return { winner: EMPTY, line: null };
}

function checkWinner(cells) {
  return findWinningLine(cells).winner;
}

/** Sérialisation compacte d'un état (clé de table de transposition / répétition). */
function stateKey(state) {
  return state.cells.join('') + ':' + state.current + ':' + state.placed;
}

module.exports = {
  createInitialState,
  cloneState,
  getPhase,
  findWinningLine,
  checkWinner,
  stateKey,
};
