// Client de l'API du jeu. En développement, Vite redirige /api vers le backend.
const BASE = import.meta.env.VITE_API_BASE || '/api';

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const api = {
  newGame: () => post('/new'),
  move: (state, move) => post('/move', { state, move }),
  aiMove: (state, difficulty) => post('/ai-move', { state, difficulty }),
};
