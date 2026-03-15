// components/LayerPanel.tsx
import React from "react";
import { Layer } from "../types/floorPlan";

interface Props {
  layers: Layer[];
  totalObjects: number;
  onToggleVisibility: (name: string) => void;
  onToggleLock: (name: string) => void;
  objectCount: (name: string) => number;
}

export const LayerPanel: React.FC<Props> = ({
  layers,
  totalObjects,
  onToggleVisibility,
  onToggleLock,
  objectCount,
}) => {
  return (
    <div className="right-panel">
      <h3 className="panel-title">◈ Calques</h3>

      <div className="layer-list">
        {layers.map((layer) => {
          const count = objectCount(layer.name);
          return (
            <div
              key={layer.name}
              className={`layer-item ${!layer.visible ? "layer-hidden" : ""}`}
            >
              {/* Toggle visibilité */}
              <button
                className="layer-btn"
                onClick={() => onToggleVisibility(layer.name)}
                title={layer.visible ? "Masquer" : "Afficher"}
              >
                {layer.visible ? "👁" : "⊘"}
              </button>

              {/* Toggle verrouillage */}
              <button
                className="layer-btn"
                onClick={() => onToggleLock(layer.name)}
                title={layer.locked ? "Déverrouiller" : "Verrouiller"}
              >
                {layer.locked ? "🔒" : "🔓"}
              </button>

              {/* Couleur */}
              <span
                className="layer-color-dot"
                style={{ backgroundColor: layer.color }}
              />

              {/* Nom */}
              <span className="layer-label">{layer.icon} {layer.label}</span>

              {/* Compteur */}
              <span className="layer-count">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="layer-total">
        Total : <strong>{totalObjects}</strong> objets
      </div>
    </div>
  );
};
