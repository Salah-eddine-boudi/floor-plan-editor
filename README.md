# Floor Plan Editor

Éditeur de plans architecturaux 2D interactif, entièrement dans le navigateur.

Construit avec **React 19 · TypeScript · Konva.js** — aucune dépendance UI externe.

---

## Aperçu

![Floor Plan Editor](https://raw.githubusercontent.com/Salah-eddine-boudi/floor-plan-editor/main/docs/preview.png)

L'interface se divise en quatre zones :

| Zone | Rôle |
|---|---|
| **Barre d'outils** (haut) | Undo/redo, zoom, grille, copier/coller, exports, paramètres |
| **Catalogue** (gauche) | 23 éléments glissables classés par catégorie |
| **Canvas** (centre) | Plan interactif Konva — pan, zoom, sélection, drag |
| **Panneaux** (droite) | Calques · Propriétés · Statistiques · Recherche |

---

## Fonctionnalités

### Objets disponibles (23 types)

| Catégorie | Éléments |
|---|---|
| Structure | Mur, Poteau, Escalier droit, Escalier hélicoïdal, Ascenseur |
| Ouvertures | Porte (arc de battant), Fenêtre |
| Mobilier | Lit, Canapé, Bureau, Chaise, Table de réunion, Placard, Armoire |
| Cuisine | Plan de travail, Cuisinière, Réfrigérateur |
| Sanitaire | WC, Baignoire, Douche, Évier |
| Décoration | Plante |
| Annotations | Texte libre |

Chaque élément est dessiné avec des symboles architecturaux (Path, Line, Arc Konva) — pas d'images bitmap.

### Interactions canvas

- **Glisser-déposer** depuis le catalogue pour placer un objet
- **Clic** — sélection simple · **Shift+Clic** — ajout à la sélection
- **Ctrl+Drag** sur le fond — sélection par rectangle (rubber-band)
- **Drag** sur le fond — déplacement du plan (pan)
- **Molette** — zoom centré sur le curseur
- **Double-clic** sur le fond — crée une annotation texte
- **Double-clic** sur un texte — édition inline

### Multi-sélection et alignement

Dès que 2 objets ou plus sont sélectionnés, une barre d'alignement apparaît :

- Aligner gauche / droite / haut / bas
- Centrer horizontalement / verticalement
- Distribuer horizontalement / verticalement (≥ 3 objets)

### Historique

Undo/Redo illimité (pile de 50 états) — chaque action est annulable : déplacement, resize, rotation, flip, ajout, suppression, alignement.

### Exports

| Format | Contenu |
|---|---|
| **PNG** | Image raster à la résolution naturelle du plan |
| **PDF** | Fenêtre d'impression navigateur avec l'image haute qualité |
| **SVG** | Vectoriel — labels sur chaque objet, grille optionnelle |
| **JSON** | Format ouvert réimportable — objets + config du plan |

### Sauvegarde automatique

Le plan est sauvegardé dans `localStorage` après chaque modification (debounce 1,5 s). Au rechargement de la page, une bannière propose de restaurer le dernier état.

### Paramètres du plan

- Dimensions en mètres (de 6×4 m à 36×22 m) avec 6 préréglages
- Pas de grille en cm
- Couleur de fond personnalisable

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 19 | UI déclarative |
| TypeScript | 4.9 | Typage strict |
| Konva / react-konva | 10 / 19 | Moteur canvas 2D |
| Create React App | 5 | Bundling, scripts |
| CSS natif | — | Thème dark, mise en page |

---

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/Salah-eddine-boudi/floor-plan-editor.git
cd floor-plan-editor

# Installer les dépendances
npm install

# Démarrer en développement
npm start
# → http://localhost:3000

# Build de production
npm run build
```

**Prérequis** : Node.js ≥ 16

---

## Structure du projet

```
src/
├── components/
│   ├── Canvas.tsx              Moteur de rendu — symboles, interactions, Transformer
│   ├── FloorPlanEditor.tsx     Orchestrateur principal
│   ├── Toolbar.tsx             Barre d'outils
│   ├── Sidebar.tsx             Catalogue glisser-déposer
│   ├── AlignmentToolbar.tsx    Barre d'alignement multi-sélection
│   ├── LayerPanel.tsx          Gestion des 4 calques
│   ├── PropertiesPanel.tsx     Propriétés de l'objet sélectionné
│   ├── StatsPanel.tsx          Surface et taux d'occupation
│   ├── SearchPanel.tsx         Recherche d'objets
│   ├── ContextMenu.tsx         Menu clic droit
│   ├── ShortcutsModal.tsx      Aide raccourcis clavier
│   └── CanvasSettingsModal.tsx Dimensions et apparence du plan
├── hooks/
│   └── useEditorState.ts       Toute la logique métier centralisée
├── types/
│   └── floorPlan.ts            Interfaces TypeScript + templates des 23 objets
└── utils/
    └── helpers.ts              Export SVG, calcul stats, snap à la grille
```

---

## Raccourcis clavier

| Touche | Action |
|---|---|
| `Suppr` / `Backspace` | Supprimer la sélection |
| `Ctrl+Z` / `Ctrl+Y` | Annuler / Rétablir |
| `Ctrl+A` | Tout sélectionner |
| `Ctrl+C` / `Ctrl+V` | Copier / Coller |
| `Ctrl+D` | Dupliquer |
| `R` | Rotation +90° |
| `F` | Zoom pour afficher tout le plan |
| `G` | Afficher/masquer la grille |
| `S` | Activer/désactiver le snap |
| `?` | Liste des raccourcis |
| `Échap` | Désélectionner tout |

---

## Échelle

```
1 pixel = 2 cm   →   1 mètre = 50 pixels
```

Toutes les dimensions affichées (propriétés, statistiques, sidebar) sont converties automatiquement en mètres.

---

## Calques

| Calque | Contenu |
|---|---|
| Structure | Murs, poteaux, escaliers, ascenseurs |
| Ouvertures | Portes, fenêtres |
| Mobilier | Meubles, sanitaires, cuisine |
| Décoration | Plantes, annotations texte |

Chaque calque peut être masqué ou verrouillé indépendamment.

---

## Licence

MIT
