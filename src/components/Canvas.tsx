// components/Canvas.tsx
import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Stage, Layer as KonvaLayer, Rect, Line, Text, Group,
  Circle, Transformer, Path,
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
      const step = 6;
      for (let i = -(h); i < w + h; i += step) {
        hatchLines.push(
          <Line key={i}
            points={[Math.max(0, i), Math.max(0, -i), Math.min(w, i + h), Math.min(h, h - i + h)]}
            stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} listening={false} />
        );
      }
      return (
        <>
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} />
          {hatchLines}
        </>
      );
    }

    // ── PORTE : battant + arc de rotation ──
    case "door": {
      const leafH = Math.max(3, Math.round(h * 0.6));
      const r = w; // swing radius = door width
      // Arc path: M (w,0) A r r 0 0 0 0 w  → quarter circle hinge at (0,0)
      return (
        <>
          {/* Hinge pin */}
          <Circle x={0} y={0} radius={2} fill={sc} />
          {/* Door leaf */}
          <Rect x={0} y={0} width={w} height={leafH} fill="white" stroke={sc} strokeWidth={sw} cornerRadius={1} />
          {/* Swing arc */}
          <Path
            data={`M ${w} 0 A ${r} ${r} 0 0 0 0 ${w}`}
            stroke={sc} strokeWidth={1} fill="transparent" opacity={0.55}
          />
          {/* Open door guide line */}
          <Line points={[0, 0, 0, w]} stroke={sc} strokeWidth={0.6} opacity={0.4} />
        </>
      );
    }

    // ── FENÊTRE : cadre + deux vitres ──
    case "window": {
      return (
        <>
          {/* Outer frame (wall gap) */}
          <Rect width={w} height={h} fill="white" stroke={sc} strokeWidth={sw} />
          {/* Glass pane divider */}
          <Line points={[0, h / 2, w, h / 2]} stroke={sc} strokeWidth={1.5} />
          {/* Inner glass reflections */}
          <Rect x={1} y={1} width={w - 2} height={h / 2 - 1.5}
            fill="rgba(6,182,212,0.15)" stroke="transparent" />
          <Rect x={1} y={h / 2 + 1.5} width={w - 2} height={h / 2 - 2.5}
            fill="rgba(6,182,212,0.15)" stroke="transparent" />
        </>
      );
    }

    // ── BUREAU : plateau + moniteur ──
    case "desk": {
      const monW = Math.min(30, w * 0.3);
      const monH = Math.min(16, h * 0.35);
      return (
        <>
          {/* Main desk surface */}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={2} />
          {/* Inner work surface */}
          <Rect x={4} y={4} width={w - 8} height={h - 8}
            fill="transparent" stroke={sc} strokeWidth={0.6} opacity={0.4} cornerRadius={1} />
          {/* Monitor */}
          <Rect x={w / 2 - monW / 2} y={h / 2 - monH / 2}
            width={monW} height={monH}
            fill="rgba(0,0,0,0.35)" stroke={sc} strokeWidth={0.8} cornerRadius={1} />
          {/* Monitor stand */}
          <Line
            points={[w / 2, h / 2 + monH / 2, w / 2, h - 5]}
            stroke={sc} strokeWidth={1} />
        </>
      );
    }

    // ── CHAISE : siège circulaire + dossier ──
    case "chair": {
      const seatR = Math.min(w, h) * 0.33;
      const cx = w / 2;
      const cy = h * 0.58;
      const backW = seatR * 1.5;
      const backH = seatR * 0.45;
      return (
        <>
          {/* Seat */}
          <Circle x={cx} y={cy} radius={seatR}
            fill={obj.fill} stroke={sc} strokeWidth={sw} />
          {/* Backrest */}
          <Rect x={cx - backW / 2} y={h * 0.05}
            width={backW} height={backH}
            fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={3} />
          {/* Seat cushion detail */}
          <Circle x={cx} y={cy} radius={seatR * 0.55}
            fill="transparent" stroke={sc} strokeWidth={0.5} opacity={0.4} />
        </>
      );
    }

    // ── TABLE DE RÉUNION : plateau arrondi ──
    case "meeting-table": {
      const inset = 8;
      return (
        <>
          {/* Table surface */}
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={h * 0.35} />
          {/* Inner edge detail */}
          <Rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2}
            fill="transparent" stroke={sc} strokeWidth={0.6} cornerRadius={h * 0.25} opacity={0.4} />
          {/* Center line */}
          <Line points={[w * 0.15, h / 2, w * 0.85, h / 2]}
            stroke={sc} strokeWidth={0.5} opacity={0.3} />
        </>
      );
    }

    // ── ARMOIRE : caisson avec croix et poignée ──
    case "cabinet": {
      return (
        <>
          <Rect width={w} height={h} fill={obj.fill} stroke={sc} strokeWidth={sw} cornerRadius={3} />
          {/* Panel lines */}
          <Line points={[w / 2, 2, w / 2, h - 2]} stroke={sc} strokeWidth={0.8} opacity={0.5} />
          <Line points={[2, h / 2, w - 2, h / 2]} stroke={sc} strokeWidth={0.5} opacity={0.3} />
          {/* Door handles */}
          <Rect x={w / 4 - 4} y={h / 2 - 2} width={8} height={4}
            fill={sc} stroke="transparent" cornerRadius={2} opacity={0.7} />
          <Rect x={(3 * w) / 4 - 4} y={h / 2 - 2} width={8} height={4}
            fill={sc} stroke="transparent" cornerRadius={2} opacity={0.7} />
        </>
      );
    }

    // ── PLANTE : pot + feuillage ──
    case "plant": {
      const pr = Math.min(w, h) / 2 - 1;
      const pcx = w / 2;
      const pcy = h / 2;
      return (
        <>
          {/* Main circle */}
          <Circle x={pcx} y={pcy} radius={pr}
            fill={obj.fill} stroke={sc} strokeWidth={sw} />
          {/* Leaf cross */}
          <Line points={[pcx, pcy - pr + 3, pcx, pcy + pr - 3]}
            stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />
          <Line points={[pcx - pr + 3, pcy, pcx + pr - 3, pcy]}
            stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />
          {/* Leaf diagonals */}
          <Line points={[pcx - pr * 0.65, pcy - pr * 0.65, pcx + pr * 0.65, pcy + pr * 0.65]}
            stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
          <Line points={[pcx + pr * 0.65, pcy - pr * 0.65, pcx - pr * 0.65, pcy + pr * 0.65]}
            stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
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
