/**
 * Constantes du moteur de jeu Fanoron-telo.
 *
 * Le plateau possède 9 intersections, indexées 0..8 en ordre de lecture
 * (haut-gauche -> bas-droite) :
 *
 *      0 ── 1 ── 2          a3   b3   c3
 *      │ ╲  │  ╱ │
 *      3 ── 4 ── 5    ≈     a2   b2   c2
 *      │ ╱  │  ╲ │
 *      6 ── 7 ── 8          a1   b1   c1
 *
 * Le plateau Fanoron-telo relie les intersections par les lignes
 * orthogonales (horizontales/verticales) ET les deux diagonales qui
 * traversent le centre. Le centre (4) est donc connecté aux 8 autres.
 */

const EMPTY = 0;
const P1 = 1; // Mena  (rouge)
const P2 = 2; // Fotsy (ivoire)

// Étiquettes d'affichage (colonnes a,b,c de gauche à droite ; lignes 3,2,1 de haut en bas)
const LABELS = ['a3', 'b3', 'c3', 'a2', 'b2', 'c2', 'a1', 'b1', 'c1'];

// Les 8 alignements gagnants : 3 lignes, 3 colonnes, 2 diagonales.
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
  [0, 4, 8], [2, 4, 6],            // diagonales
];

// Adjacence (déplacements autorisés en phase 2), suivant les traits du plateau.
const ADJACENCY = [
  [1, 3, 4],             // 0  (coin haut-gauche)
  [0, 2, 4],             // 1  (bord haut)
  [1, 5, 4],             // 2  (coin haut-droite)
  [0, 6, 4],             // 3  (bord gauche)
  [0, 1, 2, 3, 5, 6, 7, 8], // 4  (centre)
  [2, 8, 4],             // 5  (bord droite)
  [3, 7, 4],             // 6  (coin bas-gauche)
  [6, 8, 4],             // 7  (bord bas)
  [5, 7, 4],             // 8  (coin bas-droite)
];

const TOTAL_PLACEMENTS = 6; // 3 pions par joueur
const MOVEMENT_DRAW_LIMIT = 60; // demi-coups sans gain en phase 2 => nul

module.exports = {
  EMPTY, P1, P2, LABELS, LINES, ADJACENCY,
  TOTAL_PLACEMENTS, MOVEMENT_DRAW_LIMIT,
  opponent: (p) => (p === P1 ? P2 : P1),
};
