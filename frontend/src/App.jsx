import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import Board from './components/Board';
import { api } from './api';
import { LABELS } from './boardGeometry';

const WIN_THRESHOLD = 99000;
const PLAYER = {
  1: { name: 'Mena', tag: 'rouge', cls: 'mena' },
  2: { name: 'Fotsy', tag: 'ivoire', cls: 'fotsy' },
};
const LEVELS = [
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Moyen' },
  { id: 'hard', label: 'Difficile' },
];
const SPEEDS = [
  { id: 900, label: 'Lent' },
  { id: 500, label: 'Normal' },
  { id: 220, label: 'Rapide' },
];

function notation(move) {
  if (!move) return '';
  if (move.type === 'place') return LABELS[move.to];
  return `${LABELS[move.from]}→${LABELS[move.to]}`;
}

function Segmented({ value, options, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`seg ${value === o.id ? 'is-active' : ''}`}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const initialSnap = (state, status) => ({
  state, status, lastMove: null, metrics: null, pieces: [],
});

export default function App() {
  const [mode, setMode] = useState('hvai');
  const [humanSide, setHumanSide] = useState(1);
  const [aiLevel, setAiLevel] = useState('hard');
  const [menaLevel, setMenaLevel] = useState('hard');
  const [fotsyLevel, setFotsyLevel] = useState('medium');
  const [demoSpeed, setDemoSpeed] = useState(500);

  const [tl, setTl] = useState(null); // { snaps, cursor }
  const [selected, setSelected] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [error, setError] = useState(null);

  const busyRef = useRef(false);
  const nidRef = useRef(0);

  const applyMoveLocal = useCallback((prevSnap, move, resState, resStatus, metrics) => {
    const mover = prevSnap.state.current;
    let pieces;
    if (move.type === 'place') {
      pieces = [...prevSnap.pieces, { id: nidRef.current, player: mover, cell: move.to }];
      nidRef.current += 1;
    } else {
      pieces = prevSnap.pieces.map((p) => (
        p.player === mover && p.cell === move.from ? { ...p, cell: move.to } : p
      ));
    }
    return {
      state: resState, status: resStatus, lastMove: move, metrics, pieces,
    };
  }, []);

  const commit = useCallback((snap) => {
    setTl((prev) => ({
      snaps: prev.snaps.slice(0, prev.cursor + 1).concat(snap),
      cursor: prev.cursor + 1,
    }));
    setSelected(null);
    setError(null);
  }, []);

  const newGame = useCallback(async () => {
    busyRef.current = false;
    nidRef.current = 0;
    setThinking(false);
    setDemoRunning(false);
    setSelected(null);
    setError(null);
    try {
      const res = await api.newGame();
      setTl({ snaps: [initialSnap(res.state, res.status)], cursor: 0 });
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Nouvelle partie au montage et à chaque changement de mode / camp.
  useEffect(() => { newGame(); /* eslint-disable-next-line */ }, [mode, humanSide, newGame]);

  // Déclenchement automatique des coups de l'IA.
  useEffect(() => {
    if (!tl) return undefined;
    const { snaps, cursor } = tl;
    const snap = snaps[cursor];
    if (!snap || snap.status.isOver) return undefined;
    if (cursor !== snaps.length - 1) return undefined; // navigation dans l'historique

    const aiTurn = mode === 'aivai'
      ? demoRunning
      : (mode === 'hvai' && snap.state.current !== humanSide);
    if (!aiTurn || busyRef.current) return undefined;

    busyRef.current = true;
    setThinking(true);
    let cancelled = false;
    const diff = mode === 'hvai'
      ? aiLevel
      : (snap.state.current === 1 ? menaLevel : fotsyLevel);
    const delay = mode === 'aivai' ? demoSpeed : 320;

    const timer = setTimeout(async () => {
      try {
        const res = await api.aiMove(snap.state, diff);
        if (cancelled) return;
        commit(applyMoveLocal(snap, res.move, res.state, res.status, res.metrics));
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        busyRef.current = false;
        if (!cancelled) setThinking(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      busyRef.current = false;
      setThinking(false);
    };
  }, [tl, mode, demoRunning, humanSide, aiLevel, menaLevel, fotsyLevel, demoSpeed, commit, applyMoveLocal]);

  // --- Dérivés ---
  const snap = tl ? tl.snaps[tl.cursor] : null;
  const status = snap ? snap.status : null;
  const isLive = tl ? tl.cursor === tl.snaps.length - 1 : false;
  const isHumanTurn = useMemo(() => {
    if (!snap || status.isOver) return false;
    if (mode === 'hvh') return true;
    if (mode === 'hvai') return snap.state.current === humanSide;
    return false;
  }, [snap, status, mode, humanSide]);

  const legal = status ? status.legalMoves : [];
  const validTargets = useMemo(() => {
    if (!status || status.isOver || !isHumanTurn || !isLive) return [];
    if (status.phase === 'placement') return legal.map((m) => m.to);
    if (selected === null) return [...new Set(legal.map((m) => m.from))];
    return legal.filter((m) => m.from === selected).map((m) => m.to);
  }, [status, isHumanTurn, isLive, legal, selected]);

  const boardDisabled = !isHumanTurn || !isLive || (status && status.isOver) || thinking;

  const handleCell = useCallback((cell) => {
    if (boardDisabled || busyRef.current) return;
    const phase = status.phase;
    const doHumanMove = async (move) => {
      busyRef.current = true;
      try {
        const res = await api.move(snap.state, move);
        commit(applyMoveLocal(snap, move, res.state, res.status, null));
      } catch (e) {
        setError(e.message);
      } finally {
        busyRef.current = false;
      }
    };
    if (phase === 'placement') {
      if (legal.some((m) => m.type === 'place' && m.to === cell)) doHumanMove({ type: 'place', to: cell });
      return;
    }
    // mouvement
    if (selected === null) {
      if (legal.some((m) => m.from === cell)) setSelected(cell);
    } else if (selected === cell) {
      setSelected(null);
    } else if (legal.some((m) => m.from === selected && m.to === cell)) {
      doHumanMove({ type: 'move', from: selected, to: cell });
    } else if (legal.some((m) => m.from === cell)) {
      setSelected(cell);
    } else {
      setSelected(null);
    }
  }, [boardDisabled, status, legal, selected, snap, commit, applyMoveLocal]);

  const undo = useCallback(() => {
    setSelected(null);
    setDemoRunning(false);
    setTl((prev) => {
      if (!prev || prev.cursor <= 0) return prev;
      let c = prev.cursor - 1;
      if (mode === 'hvai') {
        while (c > 0 && prev.snaps[c].state.current !== humanSide) c -= 1;
      }
      return { ...prev, cursor: c };
    });
  }, [mode, humanSide]);

  const redo = useCallback(() => {
    setTl((prev) => {
      if (!prev || prev.cursor >= prev.snaps.length - 1) return prev;
      let c = prev.cursor + 1;
      if (mode === 'hvai') {
        while (c < prev.snaps.length - 1 && prev.snaps[c].state.current !== humanSide) c += 1;
      }
      return { ...prev, cursor: c };
    });
  }, [mode]);

  if (!tl || !snap) {
    return <div className="app"><div className="loading">Chargement…</div></div>;
  }

  const canUndo = tl.cursor > 0;
  const canRedo = tl.cursor < tl.snaps.length - 1;
  const current = snap.state.current;
  const metrics = snap.metrics;

  let statusMsg;
  if (status.isOver) {
    if (status.isDraw) statusMsg = { text: 'Match nul', tone: 'draw' };
    else {
      const reason = status.reason === 'blocked' ? ' (adversaire bloqué)' : '';
      statusMsg = { text: `${PLAYER[status.winner].name} gagne${reason}`, tone: PLAYER[status.winner].cls };
    }
  } else {
    const phaseLabel = status.phase === 'placement' ? 'Placement' : 'Mouvement';
    statusMsg = { text: `${phaseLabel} — au tour de ${PLAYER[current].name}`, tone: PLAYER[current].cls };
  }

  // Journal des coups.
  const log = [];
  for (let i = 1; i < tl.snaps.length; i += 1) {
    const mover = tl.snaps[i - 1].state.current;
    log.push({ i, mover, move: tl.snaps[i].lastMove, current: i === tl.cursor });
  }

  const evalLabel = (() => {
    if (!metrics) return null;
    if (metrics.evaluation >= WIN_THRESHOLD) return 'gain forcé';
    if (metrics.evaluation <= -WIN_THRESHOLD) return 'défaite forcée';
    return metrics.evaluation > 0 ? `+${metrics.evaluation}` : `${metrics.evaluation}`;
  })();

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark" aria-hidden>◇</span>
          <div>
            <h1 className="title">Fanoron-telo</h1>
            <p className="subtitle">Jeu malgache · IA Minimax Alpha-Bêta</p>
          </div>
        </div>
        <a className="inst" href="https://www.ispm-edu.com" target="_blank" rel="noreferrer">
          ISPM — Institut Supérieur Polytechnique de Madagascar
        </a>
      </header>

      <main className="layout">
        <section className="stage" aria-label="Plateau de jeu">
          <div className={`turn-banner ${statusMsg.tone}`}>
            <span className={`dot ${statusMsg.tone}`} aria-hidden />
            <span>{statusMsg.text}</span>
            {thinking && <span className="thinking">l'IA réfléchit…</span>}
          </div>
          <Board
            pieces={snap.pieces}
            validTargets={validTargets}
            selected={selected}
            winningLine={status.line}
            lastMove={snap.lastMove}
            onCell={handleCell}
            disabled={boardDisabled}
          />
          <div className="board-actions">
            <button type="button" className="btn" onClick={undo} disabled={!canUndo}>↶ Annuler</button>
            <button type="button" className="btn" onClick={redo} disabled={!canRedo}>Rétablir ↷</button>
            <button type="button" className="btn btn--primary" onClick={newGame}>Nouvelle partie</button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>

        <aside className="panel" aria-label="Réglages et informations">
          <div className="card">
            <h2 className="card-title">Mode de jeu</h2>
            <Segmented
              ariaLabel="Mode de jeu"
              value={mode}
              onChange={setMode}
              options={[
                { id: 'hvh', label: 'Humain · Humain' },
                { id: 'hvai', label: 'Humain · IA' },
                { id: 'aivai', label: 'IA · IA (démo)' },
              ]}
            />

            {mode === 'hvai' && (
              <div className="field-group">
                <label className="field">
                  <span className="field-label">Votre camp</span>
                  <Segmented
                    ariaLabel="Votre camp"
                    value={humanSide}
                    onChange={setHumanSide}
                    options={[{ id: 1, label: 'Mena (1er)' }, { id: 2, label: 'Fotsy (2e)' }]}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Niveau de l'IA</span>
                  <Segmented ariaLabel="Niveau de l'IA" value={aiLevel} onChange={setAiLevel} options={LEVELS} />
                </label>
              </div>
            )}

            {mode === 'aivai' && (
              <div className="field-group">
                <label className="field">
                  <span className="field-label">Niveau Mena (J1)</span>
                  <Segmented ariaLabel="Niveau Mena" value={menaLevel} onChange={setMenaLevel} options={LEVELS} />
                </label>
                <label className="field">
                  <span className="field-label">Niveau Fotsy (J2)</span>
                  <Segmented ariaLabel="Niveau Fotsy" value={fotsyLevel} onChange={setFotsyLevel} options={LEVELS} />
                </label>
                <label className="field">
                  <span className="field-label">Vitesse</span>
                  <Segmented ariaLabel="Vitesse" value={demoSpeed} onChange={setDemoSpeed} options={SPEEDS} />
                </label>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => setDemoRunning((r) => !r)}
                  disabled={status.isOver}
                >
                  {demoRunning ? '⏸ Pause' : '▶ Lancer la démo'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Dernier calcul de l'IA</h2>
            {metrics ? (
              <dl className="metrics">
                <div><dt>Temps</dt><dd className="mono">{metrics.timeMs} ms</dd></div>
                <div><dt>Nœuds explorés</dt><dd className="mono">{metrics.nodes.toLocaleString('fr-FR')}</dd></div>
                <div><dt>Profondeur</dt><dd className="mono">{metrics.depth}</dd></div>
                <div><dt>Évaluation</dt><dd className="mono">{evalLabel}</dd></div>
                <div><dt>Niveau</dt><dd className="mono">{metrics.difficulty}</dd></div>
              </dl>
            ) : (
              <p className="muted">Aucun coup d'IA joué pour l'instant.</p>
            )}
          </div>

          <div className="card card--log">
            <h2 className="card-title">Journal des coups</h2>
            {log.length === 0 ? (
              <p className="muted">La partie n'a pas encore commencé.</p>
            ) : (
              <ol className="movelog">
                {log.map((e) => (
                  <li key={e.i} className={e.current ? 'is-current' : ''}>
                    <span className="ply">{e.i}</span>
                    <span className={`pdot ${PLAYER[e.mover].cls}`} aria-hidden />
                    <span className="mono">{notation(e.move)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
