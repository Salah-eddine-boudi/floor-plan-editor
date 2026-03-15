// components/CanvasSettingsModal.tsx — Modifier les dimensions et propriétés du plan
import React, { useState, useEffect } from "react";
import { CanvasConfig } from "../types/floorPlan";

interface Props {
  config: CanvasConfig;
  onApply: (updates: Partial<CanvasConfig>) => void;
  onClose: () => void;
}

// 1 px = 2 cm → 1 m = 50 px
const pxToM  = (px: number) => +(px / 50).toFixed(2);
const mToPx  = (m: number)  => Math.round(m * 50);
const pxToCm = (px: number) => px * 2;
const cmToPx = (cm: number) => Math.round(cm / 2);

const PRESETS = [
  { label: "Studio (6 × 4 m)",          w: 6,  h: 4  },
  { label: "Appartement T2 (10 × 7 m)", w: 10, h: 7  },
  { label: "Appartement T3 (14 × 10 m)",w: 14, h: 10 },
  { label: "Villa (20 × 14 m)",         w: 20, h: 14 },
  { label: "Bureau standard (24 × 15 m)",w: 24, h: 15 },
  { label: "Grand projet (36 × 22 m)",  w: 36, h: 22 },
];

export const CanvasSettingsModal: React.FC<Props> = ({ config, onApply, onClose }) => {
  const [widthM,   setWidthM]   = useState(pxToM(config.width));
  const [heightM,  setHeightM]  = useState(pxToM(config.height));
  const [gridCm,   setGridCm]   = useState(pxToCm(config.gridSize));
  const [bgColor,  setBgColor]  = useState(config.backgroundColor);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter")  handleApply();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPreset = (w: number, h: number) => {
    setWidthM(w);
    setHeightM(h);
  };

  const handleApply = () => {
    const newW = mToPx(Math.max(1, Math.min(widthM,  200)));
    const newH = mToPx(Math.max(1, Math.min(heightM, 200)));
    const newG = cmToPx(Math.max(10, Math.min(gridCm, 200)));
    onApply({ width: newW, height: newH, gridSize: newG, backgroundColor: bgColor });
    onClose();
  };

  // Real-time area preview
  const areaM2 = (widthM * heightM).toFixed(0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box canvas-settings-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <span>📐 Dimensions du plan</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Presets */}
          <div className="modal-section">Formats prédéfinis</div>
          <div className="cs-presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`cs-preset-btn${widthM === p.w && heightM === p.h ? " cs-preset-active" : ""}`}
                onClick={() => applyPreset(p.w, p.h)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Dimensions */}
          <div className="modal-section">Dimensions personnalisées</div>
          <div className="cs-row">
            <div className="cs-field">
              <label className="prop-label">Largeur (m)</label>
              <input
                className="prop-input"
                type="number" min={1} max={200} step={0.5}
                value={widthM}
                onChange={(e) => setWidthM(+e.target.value)}
              />
              <span className="cs-px-hint">{mToPx(widthM)} px</span>
            </div>
            <div className="cs-field">
              <label className="prop-label">Hauteur (m)</label>
              <input
                className="prop-input"
                type="number" min={1} max={200} step={0.5}
                value={heightM}
                onChange={(e) => setHeightM(+e.target.value)}
              />
              <span className="cs-px-hint">{mToPx(heightM)} px</span>
            </div>
          </div>

          <div className="cs-area-badge">Surface : {areaM2} m²</div>

          {/* Grid */}
          <div className="modal-section">Grille</div>
          <div className="cs-row">
            <div className="cs-field">
              <label className="prop-label">Pas de grille (cm)</label>
              <input
                className="prop-input"
                type="number" min={10} max={200} step={10}
                value={gridCm}
                onChange={(e) => setGridCm(+e.target.value)}
              />
              <span className="cs-px-hint">{cmToPx(gridCm)} px</span>
            </div>
          </div>

          {/* Background */}
          <div className="modal-section">Fond du plan</div>
          <div className="cs-row cs-colors">
            {["#FFFFFF", "#F8FAFC", "#F1F5F9", "#FFF9F0", "#F0FDF4", "#EFF6FF"].map((c) => (
              <button
                key={c}
                className={`cs-color-btn${bgColor === c ? " cs-color-active" : ""}`}
                style={{ background: c }}
                onClick={() => setBgColor(c)}
                title={c}
              />
            ))}
            <input
              type="color"
              className="prop-color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              title="Couleur personnalisée"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="cs-footer">
          <button className="tb" onClick={onClose}>Annuler</button>
          <button className="tb tb-success" onClick={handleApply}>✓ Appliquer</button>
        </div>
      </div>
    </div>
  );
};
