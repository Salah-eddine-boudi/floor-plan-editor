// components/ContextMenu.tsx — Menu contextuel (clic-droit)
import React, { useEffect, useRef } from "react";

interface MenuItem {
  label: string;
  icon: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  x: number;
  y: number;
  hasClipboard: boolean;
  isLocked: boolean;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onLock: () => void;
}

export const ContextMenu: React.FC<Props> = ({
  x, y, hasClipboard, isLocked, onClose,
  onCopy, onPaste, onDuplicate, onDelete,
  onRotate, onFlipH, onFlipV,
  onBringToFront, onSendToBack, onLock,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  const menuW = 188;
  const menuH = 310;
  const adjustedX = x + menuW > window.innerWidth  ? x - menuW : x;
  const adjustedY = y + menuH > window.innerHeight ? y - menuH : y;

  const wrap = (fn: () => void) => () => { fn(); onClose(); };

  const groups: MenuItem[][] = [
    [
      { icon: "⎘", label: "Copier",     action: wrap(onCopy) },
      { icon: "⎗", label: "Coller",     action: wrap(onPaste), disabled: !hasClipboard },
      { icon: "❐", label: "Dupliquer",  action: wrap(onDuplicate) },
    ],
    [
      { icon: "⟳", label: "Rotation 90°", action: wrap(onRotate) },
      { icon: "↔", label: "Flip H",        action: wrap(onFlipH) },
      { icon: "↕", label: "Flip V",        action: wrap(onFlipV) },
    ],
    [
      { icon: "▲", label: "Premier plan",  action: wrap(onBringToFront) },
      { icon: "▼", label: "Arrière-plan",  action: wrap(onSendToBack) },
      { icon: isLocked ? "🔓" : "🔒", label: isLocked ? "Déverrouiller" : "Verrouiller", action: wrap(onLock) },
    ],
    [
      { icon: "✕", label: "Supprimer", action: wrap(onDelete), danger: true },
    ],
  ];

  return (
    <div
      ref={ref}
      className="ctx-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div className="ctx-sep" />}
          {group.map((item) => (
            <button
              key={item.label}
              className={`ctx-item${item.danger ? " ctx-danger" : ""}${item.disabled ? " ctx-disabled" : ""}`}
              onClick={item.disabled ? undefined : item.action}
              disabled={item.disabled}
            >
              <span className="ctx-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
