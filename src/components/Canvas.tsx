// components/Canvas.tsx
import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Stage, Layer as KonvaLayer, Rect, Line, Text, Group,
  Circle, Transformer, Path, Arrow,
} from "react-konva";
import Konva from "konva";
import { FloorObject, ObjectType, CanvasConfig, Layer } from "../types/floorPlan";

interface CanvasProps {
  objects: FloorObject[];
  layers: Layer[];
  config: CanvasConfig;
  selectedIds: Set<string>;
  zoom: number;
  stagePos: { x: number; y: number };
  onSelect: (id: string | null) => void;
  onShiftSelect: (id: string) => void;
  onRubberBandSelect: (ids: string[]) => void;
  onMove: (id: string, x: number, y: number) => void;
  onBatchMove: (moves: { id: string; x: number; y: number }[]) => void;
  onResize: (id: string, w: number, h: number) => void;
  onDrop: (type: ObjectType, x: number, y: number) => void;
  onZoom: (z: number) => void;
  onStagePosChange: (pos: { x: number; y: number }) => void;
  onTextEdit: (id: string, value: string) => void;
}

// ---- GRILLE ----
const Grid: React.FC<{ config: CanvasConfig }> = ({ config }) => {
  if (!config.gridVisible) return null;
  const lines: React.ReactNode[] = [];
  for (let x = 0; x <= config.width; x += config.gridSize) {
    lines.push(
      <Line key={`v${x}`} points={[x, 0, x, config.height]}
        stroke={x % 100 === 0 ? "#ccc" : "#e8e8e8"}
        strokeWidth={x % 100 === 0 ? 0.7 : 0.3} />
    );
  }
  for (let y = 0; y <= config.height; y += config.gridSize) {
    lines.push(
      <Line key={`h${y}`} points={[0, y, config.width, y]}
        stroke={y % 100 === 0 ? "#ccc" : "#e8e8e8"}
        strokeWidth={y % 100 === 0 ? 0.7 : 0.3} />
    );
  }
  for (let x = 0; x <= config.width; x += 100) {
    lines.push(
      <Text key={`scale_${x}`} x={x + 2} y={2}
        text={`${(x * 2) / 100}m`} fontSize={9} fill="#aaa" />
    );
  }
  return <>{lines}</>;
};

// ---- SYMBOLES ARCHITECTURAUX ----
const ArchSymbol: React.FC<{ obj: FloorObject; isSelected: boolean }> = ({ obj, isSelected }) => {
  const w = obj.width;
  const h = obj.height;
  const sc = isSelected ? "#FBBF24" : obj.stroke;
  const sw = isSelected ? 2 : 1.5;

  switch (obj.type) {

    // ── MUR : remplissage plein avec hachures obliques ──
    case "wall": {
      const hatchLines: React.ReactNode[] = [];
      const step = 5;
      for (let i = -h; i < w + h; i += step) {
        hatchLines.push(
          <Line key={i}
            points={[Math.max(0, i), Math.max(0, -i), Math.min(w, i + h), Math.min(h, h - i + h)]}
            stroke="rgba(255,255,255,0.25)" strokeWidth={0.7} listening={false} />
        );
      }
      return (
        <>
          <Rect width={w} height={h} fill="#475569" stroke={sc} strokeWidth={sw} />
          {hatchLines}
        </>
      );
    }

    // ── PORTE : battant + arc de rotation (plan architectural standard) ──
    case "door": {
      const size = Math.min(w, h);
      return (
        <>
          {/* Hinge point */}
          <Circle x={0} y={0} radius={2.5} fill={sc} />
          {/* Door leaf (thin rectangle) */}
          <Rect x={0} y={0} width={size} height={5}
            fill="#FFFFFF" stroke={sc} strokeWidth={sw} />
          {/* Swing arc: quarter circle from (size,0) → (0,size) */}
          <Path
            data={`M ${size} 0 A ${size} ${size} 0 0 0 0 ${size}`}
            stroke={sc} strokeWidth={1} fill="rgba(200,220,255,0.15)"
          />
          {/* Guide line along wall */}
          <Line points={[0, 0, 0, size]} stroke={sc} strokeWidth={1} dash={[3, 2]} opacity={0.5} />
        </>
      );
    }

    // ── FENÊTRE : coupure de mur avec trois lignes (standard plan) ──
    case "window": {
      const t = h; // thickness = height (sits in a wall)
      return (
        <>
          {/* Wall gap fill */}
          <Rect width={w} height={t} fill="#FFFFFF" stroke={sc} strokeWidth={sw} />
          {/* Outer glass line */}
          <Line points={[0, t * 0.2, w, t * 0.2]} stroke={sc} strokeWidth={1} />
          {/* Inner glass line */}
          <Line points={[0, t * 0.8, w, t * 0.8]} stroke={sc} strokeWidth={1} />
          {/* Glass fill tint */}
          <Rect x={1} y={t * 0.2} width={w - 2} height={t * 0.6}
            fill="rgba(186,230,253,0.45)" stroke="transparent" />
        </>
      );
    }

    // ── ESCALIER : marches parallèles + flèche directionnelle ──
    case "staircase": {
      const stepCount = Math.max(5, Math.floor(h / 16));
      const stepH = h / stepCount;
      const lines: React.ReactNode[] = [];
      for (let i = 0; i <= stepCount; i++) {
        lines.push(
          <Line key={i}
            points={[0, i * stepH, w, i * stepH]}
            stroke={sc}
            strokeWidth={i === 0 || i === stepCount ? sw : 0.7}
          />
        );
      }
      const ax = w / 2;
      return (
        <>
          {/* Outer border */}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} />
          {/* Step lines */}
          {lines}
          {/* Direction arrow */}
          <Arrow
            points={[ax, h - 10, ax, 10]}
            stroke={sc} strokeWidth={1}
            fill={sc}
            pointerLength={6} pointerWidth={6}
            opacity={0.7}
          />
        </>
      );
    }

    // ── BUREAU : surface de travail avec inset ──
    case "desk": {
      const inset = 4;
      return (
        <>
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          <Rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2}
            fill="transparent" stroke={sc} strokeWidth={0.7} cornerRadius={1} opacity={0.5} />
          {/* Front edge (thick line indicating user side) */}
          <Line points={[inset, h - inset, w - inset, h - inset]} stroke={sc} strokeWidth={1.5} />
        </>
      );
    }

    // ── CHAISE : siège + dossier (vue de dessus) ──
    case "chair": {
      const cx = w / 2;
      const seatY = h * 0.3;
      const seatH = h * 0.65;
      const backH = h * 0.22;
      return (
        <>
          {/* Seat */}
          <Rect x={2} y={seatY} width={w - 4} height={seatH}
            fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={3} />
          {/* Backrest arc */}
          <Path
            data={`M 2 ${seatY + 3} A ${cx - 2} ${backH * 1.4} 0 0 1 ${w - 2} ${seatY + 3}`}
            fill={obj.fill} stroke={sc} strokeWidth={sw}
          />
        </>
      );
    }

    // ── LIT : matelas + oreillers + tête de lit ──
    case "bed": {
      const headH = h * 0.28;
      const pillarMargin = w * 0.07;
      const pillarW = (w - pillarMargin * 3) / 2;
      return (
        <>
          {/* Mattress body */}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Head divider */}
          <Line points={[0, headH, w, headH]} stroke={sc} strokeWidth={1} />
          {/* Left pillow */}
          <Rect
            x={pillarMargin} y={pillarMargin * 0.5}
            width={pillarW} height={headH - pillarMargin}
            fill="rgba(148,163,184,0.25)" stroke={sc} strokeWidth={0.8} cornerRadius={3}
          />
          {/* Right pillow */}
          <Rect
            x={pillarMargin * 2 + pillarW} y={pillarMargin * 0.5}
            width={pillarW} height={headH - pillarMargin}
            fill="rgba(148,163,184,0.25)" stroke={sc} strokeWidth={0.8} cornerRadius={3}
          />
          {/* Mattress quilting lines */}
          <Line points={[w * 0.5, headH + 4, w * 0.5, h - 4]}
            stroke={sc} strokeWidth={0.4} opacity={0.3} />
          <Line points={[4, h * 0.6, w - 4, h * 0.6]}
            stroke={sc} strokeWidth={0.4} opacity={0.3} />
        </>
      );
    }

    // ── CANAPÉ : dossier + assise + accoudoirs (vue de dessus) ──
    case "sofa": {
      const backH = h * 0.28;
      const armW = w * 0.12;
      const gap = 3;
      return (
        <>
          {/* Backrest */}
          <Rect width={w} height={backH} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={3} />
          {/* Left armrest */}
          <Rect x={0} y={backH} width={armW} height={h - backH}
            fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Right armrest */}
          <Rect x={w - armW} y={backH} width={armW} height={h - backH}
            fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Seat cushions */}
          <Rect x={armW + gap} y={backH + gap} width={w - armW * 2 - gap * 2} height={h - backH - gap * 2}
            fill="rgba(148,163,184,0.18)" stroke={sc} strokeWidth={0.7} cornerRadius={2} />
          {/* Cushion split */}
          <Line
            points={[w / 2, backH + gap, w / 2, h - gap]}
            stroke={sc} strokeWidth={0.6} opacity={0.5}
          />
        </>
      );
    }

    // ── TABLE DE RÉUNION : plateau ovalisé + places ──
    case "meeting-table": {
      const inset = 6;
      const seatW = 18;
      const seatH = 10;
      const seatCount = Math.max(2, Math.floor((w - 20) / 30));
      const seats: React.ReactNode[] = [];
      for (let i = 0; i < seatCount; i++) {
        const sx = 20 + i * ((w - 40) / (seatCount - 1 || 1)) - seatW / 2;
        seats.push(
          <Rect key={`t${i}`} x={sx} y={-seatH - 2} width={seatW} height={seatH}
            fill="transparent" stroke={sc} strokeWidth={0.7} cornerRadius={2} />,
          <Rect key={`b${i}`} x={sx} y={h + 2} width={seatW} height={seatH}
            fill="transparent" stroke={sc} strokeWidth={0.7} cornerRadius={2} />
        );
      }
      return (
        <>
          {seats}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={h * 0.35} />
          <Rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2}
            fill="transparent" stroke={sc} strokeWidth={0.5} cornerRadius={h * 0.25} opacity={0.4} />
        </>
      );
    }

    // ── ARMOIRE : caisson portes battantes ──
    case "cabinet": {
      return (
        <>
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Center split */}
          <Line points={[w / 2, 2, w / 2, h - 2]} stroke={sc} strokeWidth={0.8} opacity={0.6} />
          {/* Door handles */}
          <Rect x={w / 4 - 5} y={h / 2 - 2} width={10} height={4}
            fill={sc} stroke="transparent" cornerRadius={2} opacity={0.6} />
          <Rect x={(3 * w) / 4 - 5} y={h / 2 - 2} width={10} height={4}
            fill={sc} stroke="transparent" cornerRadius={2} opacity={0.6} />
          {/* Interior rail arc (wardrobe) */}
          <Line points={[4, h * 0.25, w - 4, h * 0.25]}
            stroke={sc} strokeWidth={0.5} opacity={0.3} />
        </>
      );
    }

    // ── WC : réservoir + cuvette ──
    case "toilet": {
      const tankH = h * 0.3;
      const tankW = w * 0.78;
      const bowlY = tankH + 2;
      const bowlH = h - tankH - 2;
      return (
        <>
          {/* Tank */}
          <Rect x={(w - tankW) / 2} y={0} width={tankW} height={tankH}
            fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Bowl outer (D-shape via Path) */}
          <Path
            data={`M ${w * 0.08} ${bowlY} L ${w * 0.92} ${bowlY} Q ${w} ${bowlY + bowlH * 0.45} ${w * 0.92} ${h} L ${w * 0.08} ${h} Q 0 ${bowlY + bowlH * 0.45} ${w * 0.08} ${bowlY} Z`}
            fill={obj.fill} stroke={sc} strokeWidth={sw}
          />
          {/* Seat ring */}
          <Path
            data={`M ${w * 0.16} ${bowlY + bowlH * 0.07} L ${w * 0.84} ${bowlY + bowlH * 0.07} Q ${w * 0.93} ${bowlY + bowlH * 0.48} ${w * 0.84} ${h - bowlH * 0.07} L ${w * 0.16} ${h - bowlH * 0.07} Q ${w * 0.07} ${bowlY + bowlH * 0.48} ${w * 0.16} ${bowlY + bowlH * 0.07} Z`}
            fill="transparent" stroke={sc} strokeWidth={0.7}
          />
        </>
      );
    }

    // ── BAIGNOIRE : caisson + cuvette ovale ──
    case "bathtub": {
      const margin = Math.min(w, h) * 0.1;
      const faucetH = 8;
      return (
        <>
          {/* Tub outer */}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={5} />
          {/* Inner basin (ellipse approximated with rounded rect) */}
          <Rect
            x={margin} y={margin + faucetH}
            width={w - margin * 2} height={h - margin * 2 - faucetH}
            fill="rgba(186,230,253,0.5)" stroke={sc} strokeWidth={0.8} cornerRadius={4}
          />
          {/* Drain circle */}
          <Circle x={w / 2} y={h - margin * 1.4} radius={4}
            fill="#FFFFFF" stroke={sc} strokeWidth={0.8} />
          {/* Faucet bar */}
          <Rect x={w * 0.3} y={margin + 2} width={w * 0.4} height={faucetH - 2}
            fill={sc} stroke="transparent" cornerRadius={2} opacity={0.5} />
        </>
      );
    }

    // ── ÉVIER / LAVABO : bac carré + vasque circulaire ──
    case "sink": {
      const margin = 4;
      const bRadius = Math.min(w, h) / 2 - margin - 2;
      const cx = w / 2;
      const cy = h / 2;
      return (
        <>
          {/* Countertop */}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Inner ledge */}
          <Rect x={margin} y={margin} width={w - margin * 2} height={h - margin * 2}
            fill="transparent" stroke={sc} strokeWidth={0.5} cornerRadius={2} opacity={0.5} />
          {/* Basin */}
          <Circle x={cx} y={cy} radius={bRadius} fill="#BAE6FD" stroke={sc} strokeWidth={0.8} />
          {/* Drain */}
          <Circle x={cx} y={cy} radius={2.5} fill={sc} />
          {/* Faucet */}
          <Line points={[cx - 6, cy - bRadius + 4, cx + 6, cy - bRadius + 4]}
            stroke={sc} strokeWidth={1.8} lineCap="round" />
          <Line points={[cx, cy - bRadius, cx, cy - bRadius + 7]}
            stroke={sc} strokeWidth={1.8} lineCap="round" />
        </>
      );
    }

    // ── PLANTE : cercle + motif feuilles ──
    case "plant": {
      const pr = Math.min(w, h) / 2 - 1;
      const pcx = w / 2;
      const pcy = h / 2;
      return (
        <>
          <Circle x={pcx} y={pcy} radius={pr} fill={obj.fill} stroke={sc} strokeWidth={sw} />
          <Line points={[pcx, pcy - pr + 3, pcx, pcy + pr - 3]}
            stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
          <Line points={[pcx - pr + 3, pcy, pcx + pr - 3, pcy]}
            stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
          <Line points={[pcx - pr * 0.65, pcy - pr * 0.65, pcx + pr * 0.65, pcy + pr * 0.65]}
            stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          <Line points={[pcx + pr * 0.65, pcy - pr * 0.65, pcx - pr * 0.65, pcy + pr * 0.65]}
            stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
        </>
      );
    }

    // ── TEXTE : zone en pointillés ──
    case "text": {
      return (
        <>
          <Rect width={w} height={h}
            fill="transparent"
            stroke={isSelected ? "#FBBF24" : "rgba(251,191,36,0.35)"}
            strokeWidth={isSelected ? 1.5 : 1}
            dash={[4, 3]} />
          <Text
            text={obj.content || ""}
            width={w} height={h}
            align="left" verticalAlign="middle"
            fontSize={obj.fontSize || 14}
            fontFamily={obj.fontFamily || "Inter,sans-serif"}
            fill={obj.stroke || "#FBBF24"}
            padding={4}
            listening={false} />
        </>
      );
    }

    default:
      return <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />;
  }
};

// ---- OBJET SUR LE CANVAS ----
const FloorShape: React.FC<{
  obj: FloorObject;
  isSelected: boolean;
  isLayerLocked: boolean;
  onSelect: () => void;
  onShiftSelect: () => void;
  onDragStart: () => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
  groupRef: (node: Konva.Group | null) => void;
}> = ({
  obj, isSelected, isLayerLocked,
  onSelect, onShiftSelect,
  onDragStart, onDragMove, onDragEnd, onDblClick,
  groupRef,
}) => {
  const flipX = obj.flipX ?? false;
  const flipY = obj.flipY ?? false;
  const prevPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <Group
      id={obj.id}
      ref={groupRef}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation}
      scaleX={flipX ? -1 : 1}
      scaleY={flipY ? -1 : 1}
      offsetX={flipX ? obj.width : 0}
      offsetY={flipY ? obj.height : 0}
      draggable={!isLayerLocked && !obj.locked}
      onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (e.evt.shiftKey) onShiftSelect();
        else onSelect();
      }}
      onTap={onSelect}
      onDblClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        onDblClick();
      }}
      onDragStart={(e: Konva.KonvaEventObject<DragEvent>) => {
        prevPos.current = { x: e.target.x(), y: e.target.y() };
        onDragStart();
      }}
      onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (prevPos.current) {
          const dx = e.target.x() - prevPos.current.x;
          const dy = e.target.y() - prevPos.current.y;
          prevPos.current = { x: e.target.x(), y: e.target.y() };
          onDragMove(dx, dy);
        }
      }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        onDragEnd(e.target.x(), e.target.y());
        prevPos.current = null;
      }}
      onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const c = e.target.getStage()?.container();
        if (c) c.style.cursor = isLayerLocked ? "not-allowed" : "move";
      }}
      onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const c = e.target.getStage()?.container();
        if (c) c.style.cursor = "default";
      }}
      opacity={obj.opacity}
    >
      <ArchSymbol obj={obj} isSelected={isSelected} />

      {/* Dimension indicator (counter-transformed so it's always readable) */}
      {isSelected && obj.type !== "text" && (
        <Text
          text={`${obj.width}\u00D7${obj.height}`}
          x={flipX ? obj.width : 0}
          y={obj.height + 4}
          scaleX={flipX ? -1 : 1}
          offsetX={flipX ? obj.width : 0}
          fontSize={9}
          fill="#FBBF24"
          listening={false}
        />
      )}
    </Group>
  );
};

// ---- CANVAS PRINCIPAL ----
export const Canvas: React.FC<CanvasProps> = ({
  objects, layers, config, selectedIds, zoom, stagePos,
  onSelect, onShiftSelect, onRubberBandSelect,
  onMove, onBatchMove, onResize, onDrop, onZoom, onStagePosChange,
  onTextEdit,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Group>>(new Map());

  // Feature 3: Text editing overlay
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Panning (manual — no Stage draggable to avoid position conflicts)
  const isPanning = useRef(false);
  const panMouseStart = useRef<{ mx: number; my: number; sx: number; sy: number } | null>(null);

  // Feature 1: Rubber-band (Ctrl+drag on background)
  const [rubberBand, setRubberBand] = useState<{
    x: number; y: number; w: number; h: number
  } | null>(null);
  const rbStart = useRef<{ x: number; y: number } | null>(null);
  const isRubberBanding = useRef(false);

  // Update shared Transformer when selectedIds changes
  useEffect(() => {
    if (!trRef.current) return;
    const nodes = Array.from(selectedIds)
      .map((id) => shapeRefs.current.get(id))
      .filter((n): n is Konva.Group => !!n);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("objectType") as ObjectType;
      if (!type) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.container().getBoundingClientRect();
      // Use actual Konva stage position (not stale React state)
      const x = (e.clientX - rect.left - stage.x()) / zoom;
      const y = (e.clientY - rect.top - stage.y()) / zoom;
      onDrop(type, x, y);
    },
    [zoom, onDrop]
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
      onZoom(Math.max(0.2, Math.min(3, newZoom)));
    },
    [zoom, onZoom]
  );

  // ---- MOUSE HANDLERS (pan + rubber-band) ----
  // Strategy: regular drag on background = PAN (manual, no Stage draggable),
  //           Ctrl+drag on background = rubber-band selection.
  // Using stage.x()/stage.y() (actual Konva pos) avoids stale-React-state bugs.

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      onSelect(null);

      if (e.evt.ctrlKey) {
        // Ctrl+drag → rubber-band
        isRubberBanding.current = true;
        const x = (pos.x - stage.x()) / zoom;
        const y = (pos.y - stage.y()) / zoom;
        rbStart.current = { x, y };
        setRubberBand({ x, y, w: 0, h: 0 });
      } else {
        // Regular drag → pan
        isPanning.current = true;
        panMouseStart.current = {
          mx: pos.x, my: pos.y,
          sx: stage.x(), sy: stage.y(),
        };
      }
    },
    [zoom, onSelect]
  );

  const handleStageMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      if (isRubberBanding.current && rbStart.current) {
        const x = (pos.x - stage.x()) / zoom;
        const y = (pos.y - stage.y()) / zoom;
        const startX = Math.min(rbStart.current.x, x);
        const startY = Math.min(rbStart.current.y, y);
        setRubberBand({
          x: startX, y: startY,
          w: Math.abs(x - rbStart.current.x),
          h: Math.abs(y - rbStart.current.y),
        });
      }

      if (isPanning.current && panMouseStart.current) {
        const dx = pos.x - panMouseStart.current.mx;
        const dy = pos.y - panMouseStart.current.my;
        stage.x(panMouseStart.current.sx + dx);
        stage.y(panMouseStart.current.sy + dy);
        stage.batchDraw();
      }
    },
    [zoom]
  );

  const handleStageMouseUp = useCallback(() => {
    const stage = stageRef.current;

    if (isRubberBanding.current) {
      isRubberBanding.current = false;
      if (rubberBand && rubberBand.w > 5 && rubberBand.h > 5) {
        const { x, y, w, h } = rubberBand;
        const selected = objects
          .filter((obj) => {
            const layer = layers.find((l) => l.name === obj.layer);
            if (layer?.locked || obj.locked) return false;
            return obj.x >= x && obj.y >= y &&
              obj.x + obj.width <= x + w && obj.y + obj.height <= y + h;
          })
          .map((o) => o.id);
        if (selected.length > 0) onRubberBandSelect(selected);
      }
      rbStart.current = null;
      setRubberBand(null);
    }

    if (isPanning.current) {
      isPanning.current = false;
      if (stage) onStagePosChange({ x: stage.x(), y: stage.y() });
      panMouseStart.current = null;
    }
  }, [rubberBand, objects, layers, onRubberBandSelect, onStagePosChange]);

  // Double-click on stage background → create text annotation
  const handleStageDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      // Use actual Konva stage position (not stale React state)
      const x = (pos.x - stage.x()) / zoom;
      const y = (pos.y - stage.y()) / zoom;
      onDrop("text", x, y);
    },
    [zoom, onDrop]
  );

  const isLayerLocked = (layerName: string): boolean => {
    const l = layers.find((la) => la.name === layerName);
    return l?.locked ?? false;
  };

  const commitTextEdit = useCallback(() => {
    if (editingId) {
      onTextEdit(editingId, editValue);
      setEditingId(null);
      setEditValue("");
    }
  }, [editingId, editValue, onTextEdit]);

  // Textarea position for inline text editing
  const getTextareaStyle = (): React.CSSProperties => {
    if (!editingId || !stageRef.current) return { display: "none" };
    const obj = objects.find((o) => o.id === editingId);
    if (!obj) return { display: "none" };
    const containerRect = stageRef.current.container().getBoundingClientRect();
    const parentRect = stageRef.current.container().parentElement?.getBoundingClientRect();
    const offsetLeft = parentRect ? containerRect.left - parentRect.left : 0;
    const offsetTop = parentRect ? containerRect.top - parentRect.top : 0;
    return {
      position: "absolute" as const,
      left: obj.x * zoom + stagePos.x + offsetLeft,
      top: obj.y * zoom + stagePos.y + offsetTop,
      width: obj.width * zoom,
      minHeight: obj.height * zoom,
      fontSize: (obj.fontSize || 14) * zoom,
      fontFamily: obj.fontFamily || "Inter,sans-serif",
      zIndex: 100,
    };
  };

  return (
    <div className="canvas-container" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>

      {/* Feature 3: Text edit overlay textarea */}
      {editingId && (
        <textarea
          className="text-edit-overlay"
          style={getTextareaStyle()}
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitTextEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
            if (e.key === "Escape") { setEditingId(null); setEditValue(""); }
          }}
        />
      )}

      {/* @ts-ignore react-konva Stage children typing known issue */}
      <Stage
        ref={stageRef}
        width={config.width}
        height={config.height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDblClick={handleStageDblClick}
        onWheel={handleWheel}
        style={{ backgroundColor: config.backgroundColor }}
      >
        <KonvaLayer listening={false}>
          <Rect width={config.width} height={config.height} fill={config.backgroundColor} />
          <Grid config={config} />
        </KonvaLayer>

        <KonvaLayer>
          {objects.map((obj) => (
            <FloorShape
              key={obj.id}
              obj={obj}
              isSelected={selectedIds.has(obj.id)}
              isLayerLocked={isLayerLocked(obj.layer)}
              groupRef={(node) => {
                if (node) shapeRefs.current.set(obj.id, node);
                else shapeRefs.current.delete(obj.id);
              }}
              onSelect={() => onSelect(obj.id)}
              onShiftSelect={() => onShiftSelect(obj.id)}
              onDragStart={() => {}}
              onDragMove={(dx, dy) => {
                if (selectedIds.has(obj.id) && selectedIds.size > 1) {
                  Array.from(selectedIds).forEach((id) => {
                    if (id !== obj.id) {
                      const ref = shapeRefs.current.get(id);
                      if (ref) { ref.x(ref.x() + dx); ref.y(ref.y() + dy); }
                    }
                  });
                }
              }}
              onDragEnd={(x, y) => {
                if (selectedIds.has(obj.id) && selectedIds.size > 1) {
                  const moves: { id: string; x: number; y: number }[] = [{ id: obj.id, x, y }];
                  Array.from(selectedIds).forEach((id) => {
                    if (id !== obj.id) {
                      const ref = shapeRefs.current.get(id);
                      if (ref) moves.push({ id, x: ref.x(), y: ref.y() });
                    }
                  });
                  onBatchMove(moves);
                } else {
                  onMove(obj.id, x, y);
                }
              }}
              onDblClick={() => {
                if (obj.type === "text") {
                  setEditingId(obj.id);
                  setEditValue(obj.content || "");
                }
              }}
            />
          ))}

          {/* Shared Transformer */}
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            borderStroke="#FBBF24"
            borderStrokeWidth={1.5}
            anchorFill="#FBBF24"
            anchorStroke="#B45309"
            anchorSize={8}
            anchorCornerRadius={2}
            enabledAnchors={[
              "top-left", "top-right", "bottom-left", "bottom-right",
              "middle-left", "middle-right", "top-center", "bottom-center",
            ]}
            boundBoxFunc={(oldBox: Konva.Box, newBox: Konva.Box) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
            onTransformEnd={() => {
              if (!trRef.current) return;
              trRef.current.nodes().forEach((node: Konva.Node) => {
                const nodeId = node.attrs.id as string;
                const obj = objects.find((o) => o.id === nodeId);
                if (!obj) return;
                const absScaleX = Math.abs(node.scaleX());
                const absScaleY = Math.abs(node.scaleY());
                const newWidth = Math.max(10, Math.round(obj.width * absScaleX));
                const newHeight = Math.max(10, Math.round(obj.height * absScaleY));
                const fx = obj.flipX ?? false;
                const fy = obj.flipY ?? false;
                node.scaleX(fx ? -1 : 1);
                node.scaleY(fy ? -1 : 1);
                node.offsetX(fx ? newWidth : 0);
                node.offsetY(fy ? newHeight : 0);
                onResize(nodeId, newWidth, newHeight);
              });
            }}
          />

          {/* Feature 1: Rubber-band selection rect */}
          {rubberBand && rubberBand.w > 0 && (
            <Rect
              x={rubberBand.x} y={rubberBand.y}
              width={rubberBand.w} height={rubberBand.h}
              fill="rgba(59,130,246,0.06)"
              stroke="#3B82F6"
              strokeWidth={1 / zoom}
              dash={[4 / zoom, 3 / zoom]}
              listening={false}
            />
          )}
        </KonvaLayer>
      </Stage>
    </div>
  );
};
