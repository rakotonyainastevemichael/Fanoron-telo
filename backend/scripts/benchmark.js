/**
 * Benchmark IA vs IA : mesure les temps de réponse, le nombre de nœuds
 * explorés et les taux de victoire selon les difficultés.
 *
 * Lancer : node scripts/benchmark.js [partiesParAffrontement]
 */
const { createInitialState } = require('../src/engine/board');
const { applyMove, getGameStatus } = require('../src/engine/rules');
const { chooseMove } = require('../src/engine/ai');

function playGame(diffA, diffB) {
  // diffA = Joueur 1 (Mena), diffB = Joueur 2 (Fotsy)
  let s = createInitialState();
  const times = [];
  const nodes = [];
  let guard = 0;
  while (guard < 400) {
    guard += 1;
    const st = getGameStatus(s);
    if (st.isOver) {
      return {
        winner: st.isDraw ? 0 : st.winner, reason: st.reason, times, nodes,
      };
    }
    const diff = s.current === 1 ? diffA : diffB;
    const { move, metrics } = chooseMove(s, diff);
    times.push(metrics.timeMs);
    nodes.push(metrics.nodes);
    s = applyMove(s, move);
  }
  return { winner: 0, reason: 'guard', times, nodes };
}

function runMatchup(diffA, diffB, games) {
  const res = { p1: 0, p2: 0, draw: 0 };
  let totalTime = 0; let totalNodes = 0; let moveCount = 0;
  let maxTime = 0;
  for (let g = 0; g < games; g += 1) {
    const r = playGame(diffA, diffB);
    if (r.winner === 1) res.p1 += 1;
    else if (r.winner === 2) res.p2 += 1;
    else res.draw += 1;
    for (const t of r.times) { totalTime += t; maxTime = Math.max(maxTime, t); moveCount += 1; }
    for (const n of r.nodes) totalNodes += n;
  }
  return {
    matchup: `${diffA} (J1) vs ${diffB} (J2)`,
    games,
    p1Wins: res.p1,
    p2Wins: res.p2,
    draws: res.draw,
    avgTimeMs: (totalTime / moveCount).toFixed(3),
    maxTimeMs: maxTime.toFixed(1),
    avgNodes: Math.round(totalNodes / moveCount),
  };
}

const games = parseInt(process.argv[2], 10) || 50;
const matchups = [
  ['hard', 'hard'],
  ['hard', 'medium'],
  ['medium', 'medium'],
  ['hard', 'easy'],
  ['medium', 'easy'],
];

console.log(`\n=== Benchmark Fanoron-telo IA (${games} parties/affrontement) ===\n`);
const rows = matchups.map(([a, b]) => runMatchup(a, b, games));
console.table(rows);

// Mesure dédiée du temps de réponse de l'IA difficile sur position d'ouverture.
const s0 = createInitialState();
const samples = [];
for (let i = 0; i < 20; i += 1) samples.push(chooseMove(s0, 'hard').metrics.timeMs);
samples.sort((a, b) => a - b);
console.log(`\nIA difficile — 1er coup : médiane ${samples[10].toFixed(1)} ms, `
  + `min ${samples[0].toFixed(1)} ms, max ${samples[samples.length - 1].toFixed(1)} ms`);
