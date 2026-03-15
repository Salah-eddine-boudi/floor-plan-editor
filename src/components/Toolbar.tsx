// components/Toolbar.tsx
import React from "react";
import { SaveStatus } from "../hooks/useEditorState";

interface ToolbarProps {
  planName: string;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  zoom: number;
  saveStatus: SaveStatus;
  onPlanNameChange: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onExportSVG: () => void;
  onImportJSON: () => void;
  onClearAll: () => void;
}

const SAVE_ICONS: Record<SaveStatus, string> = {
  saved: "✓",
  saving: "⟳",
  unsaved: "●",
};

const SAVE_TITLES: Record<SaveStatus, string> = {
  saved: "Plan sauvegardé automatiquement",
  saving: "Sauvegarde en cours…",
  unsaved: "Modifications non sauvegardées",
};

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  return (
    <div className="toolbar">
      {/* Logo & Nom du plan */}
      <div className="toolbar-group">
        <span className="toolbar-logo">◇</span>
        <input
          className="plan-name-input"
          value={props.planName}
          onChange={(e) => props.onPlanNameChange(e.target.value)}
          spellCheck={false}
        />
        {/* Feature 4: Save indicator */}
        <span
          className="save-indicator"
          data-status={props.saveStatus}
          title={SAVE_TITLES[props.saveStatus]}
        >
          {SAVE_ICONS[props.saveStatus]}
        </span>
      </div>

      <div className="toolbar-sep" />

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onUndo} disabled={!props.canUndo} title="Annuler (Ctrl+Z)">
          ↩ Annuler
        </button>
        <button className="tb" onClick={props.onRedo} disabled={!props.canRedo} title="Rétablir (Ctrl+Y)">
          ↪ Rétablir
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* Zoom */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onZoomOut} title="Zoom -">−</button>
        <span className="zoom-label" onClick={props.onZoomReset} title="Réinitialiser le zoom">
          {Math.round(props.zoom * 100)}%
        </span>
        <button className="tb" onClick={props.onZoomIn} title="Zoom +">+</button>
      </div>

      <div className="toolbar-sep" />

      {/* Grille & Snap */}
      <div className="toolbar-group">
        <button
          className={`tb ${props.gridVisible ? "tb-active" : ""}`}
          onClick={props.onToggleGrid}
          title="Afficher/Masquer la grille"
        >
          ▦ Grille
        </button>
        <button
          className={`tb ${props.snapEnabled ? "tb-active" : ""}`}
          onClick={props.onToggleSnap}
          title="Activer/Désactiver le magnétisme"
        >
          ⊞ Snap
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* Actions objet */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onRotate} disabled={!props.hasSelection} title="Rotation 90° (R)">
          ⟳ Rotation
        </button>
        {/* Feature 2: Flip buttons */}
        <button className="tb" onClick={props.onFlipH} disabled={!props.hasSelection} title="Miroir horizontal">
          ↔ Flip H
        </button>
        <button className="tb" onClick={props.onFlipV} disabled={!props.hasSelection} title="Miroir vertical">
          ↕ Flip V
        </button>
        <button className="tb" onClick={props.onDuplicate} disabled={!props.hasSelection} title="Dupliquer (Ctrl+D)">
          ❐ Dupliquer
        </button>
        <button className="tb" onClick={props.onBringToFront} disabled={!props.hasSelection} title="Premier plan">
          ▲ Devant
        </button>
        <button className="tb" onClick={props.onSendToBack} disabled={!props.hasSelection} title="Arrière-plan">
          ▼ Derrière
        </button>
        <button className="tb tb-danger" onClick={props.onDelete} disabled={!props.hasSelection} title="Supprimer (Suppr)">
          ✕ Supprimer
        </button>
      </div>

      <div className="toolbar-sep" />

      {/* Export / Import */}
      <div className="toolbar-group">
        <button className="tb tb-success" onClick={props.onExportPNG} title="Exporter en PNG">
          📷 PNG
        </button>
        <button className="tb tb-success" onClick={props.onExportJSON} title="Exporter en JSON">
          💾 JSON
        </button>
        <button className="tb tb-success" onClick={props.onExportSVG} title="Exporter en SVG vectoriel">
          ◈ SVG
        </button>
        <button className="tb" onClick={props.onImportJSON} title="Importer un plan JSON">
          📂 Import
        </button>
        <button className="tb tb-warning" onClick={props.onClearAll} title="Tout effacer">
          🗑 Vider
        </button>
      </div>
    </div>
  );
};
