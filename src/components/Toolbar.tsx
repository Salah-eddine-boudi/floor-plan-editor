// components/Toolbar.tsx
import React from "react";
import { SaveStatus } from "../hooks/useEditorState";

interface ToolbarProps {
  planName: string;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasClipboard: boolean;
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
  onZoomToFit: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
  onImportJSON: () => void;
  onClearAll: () => void;
  onShowShortcuts: () => void;
  onShowCanvasSettings: () => void;
}

const SAVE_ICONS: Record<SaveStatus, string> = { saved: "✓", saving: "⟳", unsaved: "●" };
const SAVE_TITLES: Record<SaveStatus, string> = {
  saved:   "Plan sauvegardé automatiquement",
  saving:  "Sauvegarde en cours…",
  unsaved: "Modifications non sauvegardées",
};

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  return (
    <div className="toolbar">
      {/* Logo & Nom */}
      <div className="toolbar-group">
        <span className="toolbar-logo">◇</span>
        <input
          className="plan-name-input"
          value={props.planName}
          onChange={(e) => props.onPlanNameChange(e.target.value)}
          spellCheck={false}
        />
        <span className="save-indicator" data-status={props.saveStatus} title={SAVE_TITLES[props.saveStatus]}>
          {SAVE_ICONS[props.saveStatus]}
        </span>
      </div>

      <div className="toolbar-sep" />

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onUndo} disabled={!props.canUndo} title="Annuler (Ctrl+Z)">↩</button>
        <button className="tb" onClick={props.onRedo} disabled={!props.canRedo} title="Rétablir (Ctrl+Y)">↪</button>
      </div>

      <div className="toolbar-sep" />

      {/* Zoom */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onZoomOut} title="Zoom −">−</button>
        <span className="zoom-label" onClick={props.onZoomReset} title="Réinitialiser le zoom">
          {Math.round(props.zoom * 100)}%
        </span>
        <button className="tb" onClick={props.onZoomIn} title="Zoom +">+</button>
        <button className="tb" onClick={props.onZoomToFit} title="Adapter au contenu (F)">⊡ Fit</button>
      </div>

      <div className="toolbar-sep" />

      {/* Vue */}
      <div className="toolbar-group">
        <button className={`tb ${props.gridVisible ? "tb-active" : ""}`} onClick={props.onToggleGrid} title="Grille (G)">▦</button>
        <button className={`tb ${props.snapEnabled ? "tb-active" : ""}`} onClick={props.onToggleSnap} title="Snap (S)">⊞</button>
      </div>

      <div className="toolbar-sep" />

      {/* Copy / Paste */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onCopy}  disabled={!props.hasSelection} title="Copier (Ctrl+C)">⎘ Copier</button>
        <button className="tb" onClick={props.onPaste} disabled={!props.hasClipboard} title="Coller (Ctrl+V)">⎗ Coller</button>
      </div>

      <div className="toolbar-sep" />

      {/* Actions objet */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onRotate}       disabled={!props.hasSelection} title="Rotation (R)">⟳</button>
        <button className="tb" onClick={props.onFlipH}        disabled={!props.hasSelection} title="Flip H">↔</button>
        <button className="tb" onClick={props.onFlipV}        disabled={!props.hasSelection} title="Flip V">↕</button>
        <button className="tb" onClick={props.onDuplicate}    disabled={!props.hasSelection} title="Dupliquer (Ctrl+D)">❐</button>
        <button className="tb" onClick={props.onBringToFront} disabled={!props.hasSelection} title="Premier plan">▲</button>
        <button className="tb" onClick={props.onSendToBack}   disabled={!props.hasSelection} title="Arrière-plan">▼</button>
        <button className="tb tb-danger" onClick={props.onDelete} disabled={!props.hasSelection} title="Supprimer (Suppr)">✕</button>
      </div>

      <div className="toolbar-sep" />

      {/* Export / Import */}
      <div className="toolbar-group">
        <button className="tb tb-success" onClick={props.onExportPNG}  title="Exporter PNG">📷 PNG</button>
        <button className="tb tb-success" onClick={props.onExportSVG}  title="Exporter SVG">◈ SVG</button>
        <button className="tb tb-success" onClick={props.onExportPDF}  title="Imprimer / PDF">🖨 PDF</button>
        <button className="tb tb-success" onClick={props.onExportJSON} title="Exporter JSON">💾 JSON</button>
        <button className="tb" onClick={props.onImportJSON} title="Importer JSON">📂</button>
        <button className="tb tb-warning" onClick={props.onClearAll} title="Tout effacer">🗑</button>
      </div>

      <div className="toolbar-sep" />

      {/* Surface & Aide */}
      <div className="toolbar-group">
        <button className="tb" onClick={props.onShowCanvasSettings} title="Modifier les dimensions du plan">📐 Surface</button>
        <button className="tb" onClick={props.onShowShortcuts} title="Raccourcis clavier (?)">?</button>
      </div>
    </div>
  );
};
