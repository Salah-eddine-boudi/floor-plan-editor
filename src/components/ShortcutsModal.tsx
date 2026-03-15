// components/ShortcutsModal.tsx — Aide raccourcis clavier
import React, { useEffect } from "react";

interface Props { onClose: () => void; }

const SHORTCUTS = [
  { section: "Édition" },
  { key: "Ctrl+Z",     desc: "Annuler" },
  { key: "Ctrl+Y",     desc: "Rétablir" },
  { key: "Ctrl+D",     desc: "Dupliquer la sélection" },
  { key: "Ctrl+C",     desc: "Copier la sélection" },
  { key: "Ctrl+V",     desc: "Coller" },
  { key: "Suppr",      desc: "Supprimer la sélection" },
  { section: "Sélection" },
  { key: "Ctrl+A",     desc: "Tout sélectionner" },
  { key: "Shift+clic", desc: "Ajouter à la sélection" },
  { key: "Ctrl+drag",  desc: "Sélection rectangulaire" },
  { key: "Échap",      desc: "Désélectionner" },
  { section: "Objet" },
  { key: "R",          desc: "Rotation 90°" },
  { key: "Clic droit", desc: "Menu contextuel" },
  { key: "Dbl-clic",   desc: "Éditer texte / créer annotation" },
  { section: "Vue" },
  { key: "Ctrl +/-",   desc: "Zoom avant / arrière" },
  { key: "F",          desc: "Adapter au contenu (Zoom to Fit)" },
  { key: "G",          desc: "Afficher/masquer la grille" },
  { key: "S",          desc: "Activer/désactiver le snap" },
  { key: "?",          desc: "Afficher cette aide" },
  { section: "Export" },
  { key: "PNG / SVG",  desc: "Export image dans la barre" },
  { key: "PDF",        desc: "Impression / Export PDF" },
];

export const ShortcutsModal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "?") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>⌨ Raccourcis clavier</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {SHORTCUTS.map((row, i) =>
            "section" in row ? (
              <div key={i} className="modal-section">{row.section}</div>
            ) : (
              <div key={i} className="modal-row">
                <kbd className="modal-kbd">{row.key}</kbd>
                <span className="modal-desc">{row.desc}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
