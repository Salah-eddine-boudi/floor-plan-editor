// components/Sidebar.tsx
import React from "react";
import {
  OBJECT_CATEGORIES,
  OBJECT_TEMPLATES,
  OBJECT_ICONS,
  ObjectType,
} from "../types/floorPlan";
import { formatDimensions } from "../utils/helpers";

export const Sidebar: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, type: ObjectType) => {
    e.dataTransfer.setData("objectType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="sidebar">
      <h3 className="panel-title">⬚ Objets</h3>
      <p className="panel-hint">Glisser-déposer sur le plan</p>

      <div className="object-categories">
        {OBJECT_CATEGORIES.map((cat) => (
          <div key={cat.label} className="object-category">
            <h4 className="category-label">{cat.label}</h4>
            <div className="object-list">
              {cat.types.map((type) => {
                const t = OBJECT_TEMPLATES[type];
                return (
                  <div
                    key={type}
                    className="object-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                  >
                    <span className="object-icon">{OBJECT_ICONS[type]}</span>
                    <div className="object-info">
                      <span className="object-name">{t.label}</span>
                      <span className="object-dims">
                        {formatDimensions(t.width, t.height)}
                      </span>
                    </div>
                    <span
                      className="object-color-dot"
                      style={{ backgroundColor: t.fill }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-shortcuts">
        <h4 className="category-label">Raccourcis</h4>
        <div className="sc"><kbd>Suppr</kbd> Supprimer</div>
        <div className="sc"><kbd>R</kbd> Rotation</div>
        <div className="sc"><kbd>Ctrl+D</kbd> Dupliquer</div>
        <div className="sc"><kbd>Ctrl+Z</kbd> Annuler</div>
        <div className="sc"><kbd>Ctrl+Y</kbd> Rétablir</div>
        <div className="sc"><kbd>Molette</kbd> Zoom</div>
      </div>
    </div>
  );
};
