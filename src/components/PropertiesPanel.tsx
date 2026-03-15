// components/PropertiesPanel.tsx
import React from "react";
import { FloorObject } from "../types/floorPlan";
import { pxToMeters, calculateArea } from "../utils/helpers";

interface Props {
  object: FloorObject | null;
  onUpdate: (id: string, key: keyof FloorObject, value: any) => void;
}

export const PropertiesPanel: React.FC<Props> = ({ object, onUpdate }) => {
  if (!object) {
    return (
      <div className="properties-panel">
        <h3 className="panel-title">⚙ Propriétés</h3>
        <p className="panel-hint">Sélectionnez un objet pour voir ses propriétés</p>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <h3 className="panel-title">⚙ Propriétés</h3>

      {/* Nom */}
      {object.type !== "text" && (
        <div className="prop-group">
          <label className="prop-label">Nom</label>
          <input
            className="prop-input"
            value={object.label}
            onChange={(e) => onUpdate(object.id, "label", e.target.value)}
          />
        </div>
      )}

      {/* Type */}
      <div className="prop-group">
        <label className="prop-label">Type</label>
        <span className="prop-value">{object.type}</span>
      </div>

      {/* Feature 3: Text content & font settings */}
      {object.type === "text" && (
        <>
          <div className="prop-group">
            <label className="prop-label">Contenu</label>
            <textarea
              className="prop-input prop-textarea"
              value={object.content || ""}
              rows={3}
              onChange={(e) => onUpdate(object.id, "content", e.target.value)}
            />
          </div>
          <div className="prop-group">
            <label className="prop-label">Taille police</label>
            <input
              className="prop-input"
              type="number"
              min={8}
              max={72}
              value={object.fontSize || 14}
              onChange={(e) => onUpdate(object.id, "fontSize", Number(e.target.value))}
            />
          </div>
          <div className="prop-group">
            <label className="prop-label">Couleur texte</label>
            <div className="prop-color-row">
              <input
                className="prop-color"
                type="color"
                value={object.stroke || "#FBBF24"}
                onChange={(e) => onUpdate(object.id, "stroke", e.target.value)}
              />
              <span className="prop-value">{object.stroke}</span>
            </div>
          </div>
        </>
      )}

      {/* Position */}
      <div className="prop-row">
        <div className="prop-group prop-half">
          <label className="prop-label">X (px)</label>
          <input
            className="prop-input"
            type="number"
            value={object.x}
            onChange={(e) => onUpdate(object.id, "x", Number(e.target.value))}
          />
        </div>
        <div className="prop-group prop-half">
          <label className="prop-label">Y (px)</label>
          <input
            className="prop-input"
            type="number"
            value={object.y}
            onChange={(e) => onUpdate(object.id, "y", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="prop-row">
        <div className="prop-group prop-half">
          <label className="prop-label">Largeur</label>
          <input
            className="prop-input"
            type="number"
            value={object.width}
            onChange={(e) => onUpdate(object.id, "width", Number(e.target.value))}
          />
        </div>
        <div className="prop-group prop-half">
          <label className="prop-label">Hauteur</label>
          <input
            className="prop-input"
            type="number"
            value={object.height}
            onChange={(e) => onUpdate(object.id, "height", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Dimensions réelles */}
      {object.type !== "text" && (
        <>
          <div className="prop-group">
            <label className="prop-label">Dimensions réelles</label>
            <span className="prop-value">
              {pxToMeters(object.width)}m × {pxToMeters(object.height)}m
            </span>
          </div>

          <div className="prop-group">
            <label className="prop-label">Surface</label>
            <span className="prop-value">{calculateArea(object.width, object.height)} m²</span>
          </div>
        </>
      )}

      {/* Rotation */}
      <div className="prop-group">
        <label className="prop-label">Rotation</label>
        <span className="prop-value">{object.rotation}°</span>
      </div>

      {/* Couleur (non-text) */}
      {object.type !== "text" && (
        <div className="prop-group">
          <label className="prop-label">Couleur</label>
          <div className="prop-color-row">
            <input
              className="prop-color"
              type="color"
              value={object.fill}
              onChange={(e) => onUpdate(object.id, "fill", e.target.value)}
            />
            <span className="prop-value">{object.fill}</span>
          </div>
        </div>
      )}

      {/* Opacité */}
      <div className="prop-group">
        <label className="prop-label">Opacité</label>
        <input
          className="prop-range"
          type="range"
          min={0.1}
          max={1}
          step={0.1}
          value={object.opacity}
          onChange={(e) => onUpdate(object.id, "opacity", Number(e.target.value))}
        />
        <span className="prop-value">{Math.round(object.opacity * 100)}%</span>
      </div>

      {/* Calque */}
      <div className="prop-group">
        <label className="prop-label">Calque</label>
        <span className="prop-value prop-badge">{object.layer}</span>
      </div>

      {/* ID */}
      <div className="prop-group">
        <label className="prop-label">ID</label>
        <span className="prop-value prop-id">{object.id}</span>
      </div>
    </div>
  );
};
