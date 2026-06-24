// Géométrie d'affichage du plateau Fanoron-telo (présentation uniquement ;
// l'autorité des règles reste le backend).

export const VIEW = 360;
export const MARGIN = 56;
export const GAP = (VIEW - 2 * MARGIN) / 2; // 124

// Adjacence (mêmes liaisons que le moteur) : sert à dessiner les traits.
export const ADJACENCY = [
  [1, 3, 4], [0, 2, 4], [1, 5, 4],
  [0, 6, 4], [0, 1, 2, 3, 5, 6, 7, 8], [2, 8, 4],
  [3, 7, 4], [6, 8, 4], [5, 7, 4],
];

export const LABELS = ['a3', 'b3', 'c3', 'a2', 'b2', 'c2', 'a1', 'b1', 'c1'];
export const COLS = ['a', 'b', 'c'];
export const ROWS = ['3', '2', '1'];

export function center(cell) {
  const col = cell % 3;
  const row = Math.floor(cell / 3);
  return { x: MARGIN + col * GAP, y: MARGIN + row * GAP };
}

// Paires d'adjacence uniques (i<j) -> segments du plateau.
export const EDGES = (() => {
  const seen = new Set();
  const edges = [];
  ADJACENCY.forEach((neigh, i) => {
    neigh.forEach((j) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) { seen.add(key); edges.push([Math.min(i, j), Math.max(i, j)]); }
    });
  });
  return edges;
})();
