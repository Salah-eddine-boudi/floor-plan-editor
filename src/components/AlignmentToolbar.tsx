// components/AlignmentToolbar.tsx — Feature 1: Multi-sélection + Alignement
import React from "react";

interface AlignmentToolbarProps {
  count: number;
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onAlignCenterH: () => void;
  onAlignCenterV: () => void;
  onDistributeH: () => void;
  onDistributeV: () => void;
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  count,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onAlignCenterH,
  onAlignCenterV,
  onDistributeH,
  onDistributeV,
}) => {
  if (count < 2) return null;

  return (
    <div className="alignment-toolbar">
      <div className="toolbar-group">
        <span className="alignment-count">{count} sélectionnés</span>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="tb" onClick={onAlignLeft} title="Aligner à gauche">
          ⊢ G
        </button>
        <button className="tb" onClick={onAlignCenterV} title="Centrer verticalement">
          ⊕ Cv
        </button>
        <button className="tb" onClick={onAlignRight} title="Aligner à droite">
          ⊣ D
        </button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="tb" onClick={onAlignTop} title="Aligner en haut">
          ⊤ H
        </button>
        <button className="tb" onClick={onAlignCenterH} title="Centrer horizontalement">
          ⊕ Ch
        </button>
        <button className="tb" onClick={onAlignBottom} title="Aligner en bas">
          ⊥ B
        </button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button
          className="tb"
          onClick={onDistributeH}
          disabled={count < 3}
          title={count < 3 ? "Nécessite 3 objets min." : "Distribuer horizontalement"}
        >
          ⇔ DistH
        </button>
        <button
          className="tb"
          onClick={onDistributeV}
          disabled={count < 3}
          title={count < 3 ? "Nécessite 3 objets min." : "Distribuer verticalement"}
        >
          ⇕ DistV
        </button>
      </div>
    </div>
  );
};
