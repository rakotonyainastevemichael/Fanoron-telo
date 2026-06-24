import React from 'react';
import {
  VIEW, EDGES, center, COLS, ROWS, MARGIN, GAP,
} from '../boardGeometry';

const HOLE_R = 16;
const PIECE_R = 30;

/**
 * Plateau Fanoron-telo en SVG.
 * props :
 *   pieces       : [{ id, player, cell }]
 *   validTargets : number[]  (cases jouables à mettre en évidence)
 *   selected     : number|null (pion sélectionné en phase mouvement)
 *   winningLine  : number[]|null
 *   lastMove     : { from?, to } | null
 *   onCell       : (cell) => void
 *   disabled     : bool
 */
export default function Board({
  pieces = [], validTargets = [], selected = null,
  winningLine = null, lastMove = null, onCell, disabled = false,
}) {
  const valid = new Set(validTargets);
  const winSet = new Set(winningLine || []);

  return (
    <svg
      className="board"
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label="Plateau Fanoron-telo 3 par 3"
    >
      <defs>
        <radialGradient id="stone-mena" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ff8a63" />
          <stop offset="45%" stopColor="#e0573a" />
          <stop offset="100%" stopColor="#a8331d" />
        </radialGradient>
        <radialGradient id="stone-fotsy" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="50%" stopColor="#ece0cc" />
          <stop offset="100%" stopColor="#bda77f" />
        </radialGradient>
        <filter id="stone-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Traits gravés du plateau (ombre portée + trait clair) */}
      <g className="board-lines">
        {EDGES.map(([a, b]) => {
          const pa = center(a); const pb = center(b);
          return (
            <line
              key={`sh-${a}-${b}`}
              x1={pa.x} y1={pa.y + 1.5} x2={pb.x} y2={pb.y + 1.5}
              className="edge-shadow"
            />
          );
        })}
        {EDGES.map(([a, b]) => {
          const pa = center(a); const pb = center(b);
          return (
            <line
              key={`ln-${a}-${b}`}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              className="edge"
            />
          );
        })}
      </g>

      {/* Étiquettes de coordonnées */}
      <g className="coords">
        {COLS.map((c, i) => (
          <text key={`c-${c}`} x={MARGIN + i * GAP} y={VIEW - 8} className="coord">{c}</text>
        ))}
        {ROWS.map((r, i) => (
          <text key={`r-${r}`} x={14} y={MARGIN + i * GAP + 5} className="coord">{r}</text>
        ))}
      </g>

      {/* Alvéoles + zones cliquables */}
      <g>
        {Array.from({ length: 9 }, (_, cell) => {
          const { x, y } = center(cell);
          const isValid = valid.has(cell);
          const isSelected = selected === cell;
          const hasPiece = pieces.some((p) => p.cell === cell);
          return (
            <g key={`hole-${cell}`} className="intersection">
              <circle cx={x} cy={y} r={HOLE_R} className="hole" />
              {isValid && <circle cx={x} cy={y} r={hasPiece ? PIECE_R + 8 : HOLE_R + 7} className="target" />}
              {isSelected && <circle cx={x} cy={y} r={PIECE_R + 6} className="select-ring" />}
              <circle
                cx={x} cy={y} r={GAP / 2 - 6}
                className={`hit ${disabled ? 'is-disabled' : ''} ${isValid || isSelected ? 'is-active' : ''}`}
                onClick={() => !disabled && onCell(cell)}
                aria-label={`Intersection ${cell}`}
              />
            </g>
          );
        })}
      </g>

      {/* Pions (galets) — la position transitionne pour animer les déplacements */}
      <g>
        {pieces.map((p) => {
          const { x, y } = center(p.cell);
          const isWin = winSet.has(p.cell);
          const moved = lastMove && lastMove.to === p.cell;
          return (
            <g
              key={p.id}
              className={`piece ${moved ? 'piece--moved' : ''} ${isWin ? 'piece--win' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <circle r={PIECE_R} filter="url(#stone-shadow)" className="piece-shadow-anchor" fill="transparent" />
              <circle
                r={PIECE_R}
                fill={p.player === 1 ? 'url(#stone-mena)' : 'url(#stone-fotsy)'}
                className="stone"
              />
              <circle r={PIECE_R - 6} className="stone-sheen" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
