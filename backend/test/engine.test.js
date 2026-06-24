/**
 * Tests du moteur (règles + IA). Lancer avec : node --test
 * Utilise le runner natif de Node (aucune dépendance externe).
 */
const test = require('node:test');
const assert = require('node:assert');

const { ADJACENCY, P1, P2 } = require('../src/engine/constants');
const { createInitialState, checkWinner } = require('../src/engine/board');
const {
  getLegalMoves, applyMove, getGameStatus,
} = require('../src/engine/rules');
const { chooseMove } = require('../src/engine/ai');

test('adjacence symétrique', () => {
  for (let i = 0; i < 9; i += 1) {
    for (const j of ADJACENCY[i]) {
      assert.ok(ADJACENCY[j].includes(i), `${i}-${j} doit être symétrique`);
    }
  }
});

test('le centre est connecté aux 8 autres', () => {
  assert.strictEqual(ADJACENCY[4].length, 8);
});

test('détection de victoire sur les 8 lignes', () => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    const cells = new Array(9).fill(0);
    cells[a] = P1; cells[b] = P1; cells[c] = P1;
    assert.strictEqual(checkWinner(cells), P1);
  }
});

test('phase placement : 9 coups au départ', () => {
  const s = createInitialState();
  assert.strictEqual(getLegalMoves(s).length, 9);
  assert.strictEqual(getGameStatus(s).phase, 'placement');
});

test('applyMove rejette un coup illégal', () => {
  let s = createInitialState();
  s = applyMove(s, { type: 'place', to: 0 });
  assert.throws(() => applyMove(s, { type: 'place', to: 0 })); // case occupée
});

test('victoire immédiate possible en phase placement', () => {
  // P1 en 0 et 1, P2 ailleurs ; P1 complète la ligne en 2.
  let s = createInitialState();
  s = applyMove(s, { type: 'place', to: 0 }); // P1
  s = applyMove(s, { type: 'place', to: 3 }); // P2
  s = applyMove(s, { type: 'place', to: 1 }); // P1
  s = applyMove(s, { type: 'place', to: 4 }); // P2
  s = applyMove(s, { type: 'place', to: 2 }); // P1 aligne 0-1-2
  assert.strictEqual(getGameStatus(s).winner, P1);
});

test('transition vers la phase mouvement après 6 poses', () => {
  let s = createInitialState();
  // 6 poses sans alignement : P1={0,1,5}, P2={2,3,4}.
  const order = [0, 2, 1, 3, 5, 4];
  for (const to of order) s = applyMove(s, { type: 'place', to });
  const st = getGameStatus(s);
  assert.strictEqual(st.phase, 'movement');
  assert.strictEqual(st.isOver, false);
});

test("l'IA saisit un gain immédiat (placement)", () => {
  let s = createInitialState();
  s = applyMove(s, { type: 'place', to: 0 }); // P1
  s = applyMove(s, { type: 'place', to: 4 }); // P2
  s = applyMove(s, { type: 'place', to: 1 }); // P1 menace 0-1-2
  // Au tour de P2 : doit-il bloquer en 2 ? Testons plutôt le gain pour P1.
  // On redonne la main à P1 via un état construit : P1 a 0 et 1, doit jouer 2.
  const winState = {
    cells: [P1, P1, 0, P2, P2, 0, 0, 0, 0], current: P1, placed: 4, plies: 0,
  };
  const { move } = chooseMove(winState, 'hard');
  assert.strictEqual(move.to, 2, "l'IA doit compléter l'alignement");
});

test("l'IA difficile bloque une menace adverse", () => {
  // P2 au trait. P1 menace 0-1-(2). P2 doit jouer en 2.
  const state = {
    cells: [P1, P1, 0, 0, P2, 0, 0, 0, 0], current: P2, placed: 3, plies: 0,
  };
  const { move } = chooseMove(state, 'hard');
  assert.strictEqual(move.to, 2, "l'IA doit bloquer en 2");
});

test("l'IA difficile ne perd jamais contre l'IA facile (20 parties)", () => {
  let hardLosses = 0;
  for (let g = 0; g < 20; g += 1) {
    // Alternance du camp de l'IA difficile.
    const hardPlayer = g % 2 === 0 ? P1 : P2;
    let s = createInitialState();
    let guard = 0;
    while (guard < 200) {
      guard += 1;
      const st = getGameStatus(s);
      if (st.isOver) {
        if (st.winner && st.winner !== hardPlayer) hardLosses += 1;
        break;
      }
      const diff = s.current === hardPlayer ? 'hard' : 'easy';
      const { move } = chooseMove(s, diff);
      s = applyMove(s, move);
    }
  }
  assert.strictEqual(hardLosses, 0, "l'IA difficile n'aurait pas dû perdre");
});
