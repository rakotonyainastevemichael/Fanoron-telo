# Fanoron-telo · IA Minimax / Alpha-Bêta

> Jeu malgache traditionnel sur plateau 3×3, jouable Humain·Humain, Humain·IA et IA·IA (démo), avec une intelligence artificielle Minimax à élagage Alpha-Bêta. Projet d'Algorithmique Avancée.

---

## Section 1 — En-tête institutionnel et identification

- Institut : [ISPM — Institut Supérieur Polytechnique de Madagascar](https://www.ispm-edu.com)
- Site officiel : <https://www.ispm-edu.com>
- Cours : Algorithmique Avancée — Travaux Pratiques
- Thème : Fanoron-telo avec IA
- Nom du groupe de projet : Groupe Fanoron-telo

| Nom complet | Numéro d'étudiant | Classe | Rôle pour ce hackathon |
|-------------|-------------------|--------|------------------------|
| RANDRIAMIHAJA Lantoniaina Rojotiana | N° 17 | ISAIA 4 | Frontend |
| RAKOTO Ny Aina Stève Michaël | N° 26 | IGGLIA 4 | ML Engineer |
| RAKOTOMANGA Titosy Fitia | N° 30 | IGGLIA 4 | Algo Engineer |
| RAMIAKATRARIVO Anjara Fifaliana Tendrin'Iavo | N° 14 | IGGLIA 4 | Designer |

---

## Section 2 — Description du travail réalisé

### Présentation globale

Application web complète du Fanoron-telo, jeu de société traditionnel malgache se jouant sur un plateau de 3×3 intersections connectées, à raison de 3 pions par joueur. La partie se déroule en deux phases :

1. Placement — chaque joueur pose ses 3 pions à tour de rôle. Aligner 3 pions (ligne, colonne ou diagonale) pendant cette phase fait gagner immédiatement.
2. Mouvement — si aucun alignement n'est obtenu après les 6 poses, les joueurs déplacent à tour de rôle un pion vers une intersection adjacente libre (en suivant les lignes du plateau). Le premier à aligner ses 3 pions gagne ; un joueur sans coup légal est bloqué et perd.

### Fonctionnalités implémentées

- Mode Humain vs Humain en local _(Priorité 1)._
- Mode Humain vs IA avec choix du camp et de trois niveaux — Facile / Moyen / Difficile _(Priorité 1)._
- Gestion robuste des règles : phases, adjacence, détection d'alignement, blocage, nul par limite de coups — entièrement validée côté serveur _(Priorité 1)._
- Mode IA vs IA (démo) avec niveaux indépendants par camp et vitesse réglable _(Priorité 2)._
- IA Difficile Alpha-Bêta optimisée (approfondissement itératif, table de transposition) _(Priorité 2)._
- Undo / Redo complet via une timeline d'états _(Priorité 3)._
- Design soigné et animations : plateau SVG gravé, galets *mena* (rouge) / *fotsy* (ivoire), animations de pose et de déplacement, mise en surbrillance de la ligne gagnante, respect de `prefers-reduced-motion` _(Priorité 3)._
- Panneau d'analyse affichant en temps réel les métriques du dernier calcul de l'IA (temps, nœuds explorés, profondeur, évaluation) et un journal des coups en notation algébrique.

### Architecture et pile technologique

L'application sépare nettement l'autorité des règles et l'IA (le cœur « Algorithmique Avancée ») de la présentation.

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Backend | Node.js + Express | Moteur de jeu *stateless*, validation stricte des coups, IA. API REST sous `/api`. |
| Frontend | React + Vite | Interface, plateau SVG, animations, modes de jeu, undo/redo. |
| Intégration | npm workspaces + concurrently | Installation et lancement unifiés (backend + frontend). |

Le backend est sans état : le client envoie l'état courant, le serveur renvoie l'état suivant validé. Cela garantit que les règles ne peuvent pas être contournées depuis le navigateur et rend l'API facilement testable.

```
fanoron-telo-ia/
├── backend/
│   ├── src/
│   │   ├── engine/      # constants, board, rules, ai  (cœur algorithmique)
│   │   ├── routes/      # game.js (API /new /move /ai-move)
│   │   └── server.js    # Express, sert aussi le frontend compilé en prod
│   ├── test/            # 10 tests (node:test natif)
│   └── scripts/         # benchmark.js (IA vs IA)
└── frontend/
    └── src/             # App.jsx, components/Board.jsx, api.js, styles.css
```

### Lien vers la version hébergée

_[https://fanoron-telo.onrender.com/]_

---

## Section 3 — Guide d'installation rapide (3 commandes max)

> Pré-requis : Node.js ≥ 18.

```bash
git clone https://github.com/rakotonyainastevemichael/Fanoron-telo.git
npm install
npm run dev
```

- `npm run dev` lance simultanément le backend (port 3001) et le frontend (port 5173).
- Ouvrir ensuite <http://localhost:5173>.

Autres commandes utiles :

```bash
npm test         # suite de tests du moteur de jeu (10 tests)
npm run benchmark   # affrontements IA vs IA (statistiques)
npm run build    # build de production du frontend
npm start        # serveur unique servant l'API + le frontend compilé (port 3001)
```

---

## Section 4 — Outils d'aide IA utilisés

Le développement a été accéléré par l'assistant Claude (Anthropic), mobilisé sur plusieurs aspects :

- Écriture d'algorithmes — conception du moteur Negamax / Alpha-Bêta, de la table de transposition, de l'approfondissement itératif et de la fonction d'évaluation heuristique, ainsi que de la modélisation de l'adjacence du plateau.
- Génération de tests rapides — élaboration des 10 cas de tests unitaires couvrant les règles (alignements, transitions de phase, blocage) et la non-régression de l'IA.
- Débogage — analyse des cas limites (nul par répétition en phase mouvement, joueur bloqué, validation des coups illégaux).
- CSS / UI — mise en place du design system (thème bois sombre, plateau SVG gravé, animations) et de l'accessibilité (focus clavier, `prefers-reduced-motion`).
- Génération de documentation — structuration et rédaction de ce README.

Retour d'expérience : l'assistance IA a fait gagner un temps considérable sur les parties répétitives et techniques (squelette Alpha-Bêta, table de transposition, CSS), permettant de concentrer l'effort sur la validation des règles et le réglage de l'IA. Le code généré a systématiquement été relu, testé et ajusté pour garantir l'exactitude — en particulier sur la sémantique de gain/perte avec la profondeur et la détection de répétition.

---

## Section 5 — Modélisation et algorithmes de l'IA du jeu

### Représentation de l'état du plateau (structures de données)

Les 9 intersections sont indexées de 0 à 8, de haut-gauche à bas-droite, avec des étiquettes algébriques de type échiquier (colonnes `a b c`, rangées `3 2 1`) :

```
indices            étiquettes
 0 1 2              a3 b3 c3
 3 4 5      ⇔      a2 b2 c2
 6 7 8              a1 b1 c1
```

Un état de partie est un objet compact :

```js
{ cells: [9 entiers],   // 0 = vide, 1 = Mena (J1), 2 = Fotsy (J2)
  current: 1 | 2,       // joueur au trait
  placed: 0..6,         // nombre de pions déjà posés
  plies: entier }       // demi-coups en phase mouvement (pour le nul)
```

La phase est dérivée : `placed < 6` ⇒ placement, sinon mouvement.

Lignes gagnantes (8 alignements) — pré-calculées :

```
lignes :    [0,1,2] [3,4,5] [6,7,8]        (rangées)
            [0,3,6] [1,4,7] [2,5,8]        (colonnes)
            [0,4,8] [2,4,6]                (diagonales)
```

Adjacence — le plateau relie les intersections par les lignes orthogonales et les deux diagonales traversant le centre. Le centre (index 4) est donc connecté aux 8 autres intersections ; les coins à 3 voisins, les milieux de bord à 4 :

```
0 → 1,3,4      1 → 0,2,4        2 → 1,5,4
3 → 0,6,4      4 → 0..8 (tous)  5 → 2,8,4
6 → 3,7,4      7 → 6,8,4        8 → 5,7,4
```

Cette table d'adjacence est l'unique source de vérité : elle sert à générer les coups légaux de la phase mouvement (et à dessiner les traits du plateau côté frontend).

### Fonctionnement du Minimax et fonction d'évaluation

L'IA est un Negamax avec élagage Alpha-Bêta. Le Negamax est la forme condensée du Minimax exploitant la symétrie d'un jeu à somme nulle : `score(joueur) = −score(adversaire)`. La recherche explore l'arbre des coups, l'adversaire étant supposé jouer optimalement.

Conditions terminales :

- Alignement adverse détecté ⇒ `−(WIN − ply)` : le camp au trait a perdu. Le terme `ply` (profondeur) fait préférer les victoires rapides et retarder les défaites.
- Joueur sans coup légal en mouvement ⇒ perd (`−(WIN − ply)`).
- Limite de demi-coups en mouvement atteinte ⇒ nul (0).
- Profondeur 0 sans terminal ⇒ appel de la fonction d'évaluation.

Fonction d'évaluation (du point de vue du joueur au trait) — quantifie l'avantage positionnel pour les feuilles non terminales :

- Menace (2 pions + 1 case libre sur une ligne) : +12 (et −12 pour l'adversaire) — une menace est à un coup de la victoire.
- Amorce (1 pion + 2 cases libres) : +2 / −2.
- Contrôle du centre (case la plus connectée) : +4 / −4.

Les trois niveaux se distinguent par la profondeur de recherche :

| Niveau | Stratégie | Profondeur / budget |
|--------|-----------|---------------------|
| Facile | coup aléatoire parmi les coups légaux | — |
| Moyen | Alpha-Bêta à profondeur limitée (tactique mais faillible) | profondeur 4 / 250 ms |
| Difficile | approfondissement itératif profond ⇒ jeu quasi parfait | profondeur 24 / 900 ms |

Pour éviter un jeu répétitif, l'IA tire au sort parmi les coups de valeur maximale : la force reste identique mais les parties varient.

### Techniques avancées implémentées

- Table de transposition — une `Map` indexée par une clé d'état (`cells` + joueur au trait) mémorise les positions déjà évaluées avec leur valeur, leur profondeur et un drapeau `EXACT` / `LOWER` / `UPPER`. Une position atteinte par des ordres de coups différents (transposition) n'est donc évaluée qu'une fois. Le « meilleur coup » stocké sert aussi à l'ordonnancement.
- Approfondissement itératif (*iterative deepening*) — la recherche est relancée à profondeur croissante (1, 2, 3, …) jusqu'au budget temps ou à la preuve d'un gain/perte forcé. Combiné à la table de transposition, l'ordre issu de l'itération précédente accélère l'élagage de la suivante.
- Ordonnancement des coups (*move ordering*) — les coups sont triés (coup de la table de transposition > gain immédiat > centre > reste) avant exploration, ce qui maximise les coupures Alpha-Bêta.
- Détection de répétition — sur le chemin de recherche en phase mouvement, une position déjà vue est évaluée comme nulle (0), évitant les boucles infinies de déplacements.

### Techniques avancées non retenues (et pourquoi)

- Bitboards — l'état tient déjà en 9 petits entiers ; sur un espace aussi réduit, un encodage bit à bit n'apporterait pas de gain mesurable face à la lisibilité du code.
- Opening book — superflu : l'approfondissement itératif résout déjà la position de départ en quelques millisecondes (cf. Section 6).
- Machine Learning (Q-Learning, classification) — le jeu est suffisamment petit pour être résolu exactement par recherche ; une approche apprise n'améliorerait pas la qualité de jeu et complexifierait inutilement le projet.

---

## Section 6 — Analyse de performances

> Mesures obtenues via `npm run benchmark` (50 parties par affrontement). Les valeurs absolues dépendent de la machine ; les tendances sont stables et reproductibles.

### Temps de réponse de l'IA

| Indicateur | Valeur |
|-----------|--------|
| IA Difficile — temps moyen par coup | ≈ 5,2 ms |
| IA Difficile — temps maximal observé | ≈ 119 ms |
| IA Difficile — premier coup (le plus coûteux) | médiane 26 ms (min 24, max 33) |
| IA Moyenne — temps moyen par coup | ≈ 0,4 ms |
| Nœuds explorés / coup (Difficile) | ≈ 2 600 |

Même sans *opening book*, la position d'ouverture — la plus profonde à analyser — est résolue en quelques dizaines de millisecondes grâce à l'approfondissement itératif, à la table de transposition et à l'ordonnancement des coups.

### Affrontements IA contre IA (50 parties chacun)

| Affrontement (J1 vs J2) | Victoires J1 | Victoires J2 | Nuls | Temps moyen / coup | Nœuds moyens |
|-------------------------|:------------:|:------------:|:----:|:------------------:|:------------:|
| Difficile vs Difficile  | 50 | 0 | 0 | 5,2 ms | 2 604 |
| Difficile vs Moyen      | 50 | 0 | 0 | 3,5 ms | 1 880 |
| Difficile vs Facile     | 50 | 0 | 0 | 5,4 ms | 2 887 |
| Moyen vs Moyen          | 0 | 0 | 50 | 0,4 ms | 213 |
| Moyen vs Facile         | 50 | 0 | 0 | 0,4 ms | 256 |

### Interprétation

- L'IA Difficile ne perd jamais contre les niveaux inférieurs (100 % de victoires en tant que J1) — confirmé par le test automatisé `npm test`.
- Résultat algorithmique notable : le premier joueur dispose d'un gain forcé. Lorsque deux IA Difficiles s'affrontent, J1 gagne systématiquement (50/50). Comme le centre est une intersection connectée aux 8 autres et qu'aucune restriction n'interdit de l'occuper dès la première pose, le joueur qui commence peut forcer la victoire — l'IA, jouant parfaitement, le démontre à chaque partie.
- Moyen vs Moyen aboutit toujours au nul : à profondeur limitée, les deux IA se neutralisent sans percevoir le gain forcé, ce qui illustre concrètement l'effet de la profondeur de recherche sur la qualité de jeu.
- Le nombre de nœuds explorés croît avec la force de l'adversaire (positions plus disputées), tout en restant très faible (≈ 2 600) grâce à l'élagage Alpha-Bêta et à la table de transposition.

---

_Projet réalisé dans le cadre du cours d'Algorithmique Avancée — ISPM._
