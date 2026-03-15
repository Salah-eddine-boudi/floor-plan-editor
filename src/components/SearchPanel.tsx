// components/SearchPanel.tsx — Recherche et filtre d'objets
import React, { useState } from "react";
import { FloorObject, ObjectType, LayerName, OBJECT_ICONS } from "../types/floorPlan";

interface Props {
  objects: FloorObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ALL_TYPES: ObjectType[] = [
  "wall", "column", "staircase", "stairs-spiral", "elevator",
  "door", "window",
  "bed", "sofa", "desk", "chair", "meeting-table", "cabinet", "wardrobe",
  "kitchen-counter", "stove", "fridge",
  "toilet", "bathtub", "shower", "sink",
  "plant", "text",
];

const ALL_LAYERS: LayerName[] = ["structure", "openings", "furniture", "decoration"];

const LAYER_LABELS: Record<LayerName, string> = {
  structure: "Structure",
  openings: "Ouvertures",
  furniture: "Mobilier",
  decoration: "Décoration",
};

export const SearchPanel: React.FC<Props> = ({ objects, selectedId, onSelect }) => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLayer, setFilterLayer] = useState<string>("all");

  const filtered = objects.filter((obj) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      obj.label.toLowerCase().includes(q) ||
      obj.type.toLowerCase().includes(q) ||
      (obj.content && obj.content.toLowerCase().includes(q));
    const matchesType = filterType === "all" || obj.type === filterType;
    const matchesLayer = filterLayer === "all" || obj.layer === filterLayer;
    return matchesQuery && matchesType && matchesLayer;
  });

  const hasFilters = query !== "" || filterType !== "all" || filterLayer !== "all";

  return (
    <div className="right-panel search-panel">
      <h3 className="panel-title">🔍 Objets</h3>

      {/* Barre de recherche */}
      <input
        className="prop-input search-input"
        placeholder="Rechercher par nom ou type…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Filtres */}
      <div className="search-filters">
        <select
          className="prop-input search-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          title="Filtrer par type"
        >
          <option value="all">Tous les types</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>
              {OBJECT_ICONS[t]} {t}
            </option>
          ))}
        </select>

        <select
          className="prop-input search-select"
          value={filterLayer}
          onChange={(e) => setFilterLayer(e.target.value)}
          title="Filtrer par calque"
        >
          <option value="all">Tous les calques</option>
          {ALL_LAYERS.map((l) => (
            <option key={l} value={l}>
              {LAYER_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      {/* Compteur résultats */}
      <div className="search-count">
        {filtered.length} / {objects.length} objet{objects.length !== 1 ? "s" : ""}
        {hasFilters && (
          <button
            className="search-reset"
            onClick={() => {
              setQuery("");
              setFilterType("all");
              setFilterLayer("all");
            }}
            title="Réinitialiser les filtres"
          >
            ✕
          </button>
        )}
      </div>

      {/* Liste des objets filtrés */}
      <div className="object-search-list">
        {filtered.length === 0 && (
          <div className="search-empty">Aucun objet trouvé</div>
        )}
        {filtered.map((obj) => (
          <div
            key={obj.id}
            className={`search-item ${obj.id === selectedId ? "search-item-selected" : ""}`}
            onClick={() => onSelect(obj.id)}
            title={`${obj.type} — ${obj.layer}`}
          >
            <span className="search-item-icon">{OBJECT_ICONS[obj.type]}</span>
            <span className="search-item-label">
              {obj.type === "text" ? (obj.content || "Annotation") : obj.label}
            </span>
            <span className="search-item-layer">{obj.layer}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
