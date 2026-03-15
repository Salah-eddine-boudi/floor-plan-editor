// hooks/useEditorState.ts — Gestion centralisée de l'état avec historique
import { useState, useCallback, useEffect, useRef } from "react";
import {
  FloorObject,
  Layer,
  CanvasConfig,
  DEFAULT_LAYERS,
  DEFAULT_CANVAS,
  OBJECT_TEMPLATES,
  ObjectType,
} from "../types/floorPlan";
import { snapToGrid, generateId } from "../utils/helpers";

const MAX_HISTORY = 50;
const AUTOSAVE_KEY = "floorplan_autosave";

export type SaveStatus = "saved" | "saving" | "unsaved";

export const useEditorState = () => {
  const [objects, setObjects] = useState<FloorObject[]>([]);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(DEFAULT_CANVAS);
  // Feature 1: Multi-sélection — Set of selected IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<FloorObject[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [planName, setPlanName] = useState<string>("Plan sans titre");
  // Feature 4: Sauvegarde automatique
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const isFirstRender = useRef(true);

  // Historique undo/redo
  const [history, setHistory] = useState<FloorObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Feature 4: Autosave debounce — skip first render to avoid overwriting saved data
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("unsaved");
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      try {
        const data = JSON.stringify({
          version: "2.0",
          name: planName,
          exportDate: new Date().toISOString(),
          canvas: canvasConfig,
          layers,
          objects,
        });
        localStorage.setItem(AUTOSAVE_KEY, data);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [objects, planName, canvasConfig, layers]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToHistory = useCallback(
    (newObjects: FloorObject[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newObjects.map((o) => ({ ...o })));
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // ---- BACKWARD-COMPAT selectedId ----
  // Derives the "primary" selected id (last in set, or null)
  const selectedId: string | null =
    selectedIds.size > 0 ? Array.from(selectedIds)[selectedIds.size - 1] : null;

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIds(id ? new Set([id]) : new Set());
  }, []);

  // ---- MULTI-SÉLECTION ACTIONS ----
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const ids = new Set<string>();
      // Will be resolved with current objects via closure in setSelectedIds functional form
      return ids; // placeholder, will use the updater below
    });
    // Use direct function to access current objects
    setSelectedIds(() => {
      return new Set(
        objects
          .filter((o) => {
            const layer = layers.find((l) => l.name === o.layer);
            return !o.locked && !layer?.locked;
          })
          .map((o) => o.id)
      );
    });
  }, [objects, layers]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ---- ACTIONS SUR LES OBJETS ----

  const addObject = useCallback(
    (type: ObjectType, x: number, y: number) => {
      const template = OBJECT_TEMPLATES[type];
      const grid = canvasConfig.snapEnabled ? canvasConfig.gridSize : 1;
      const newObj: FloorObject = {
        ...template,
        id: generateId(),
        x: snapToGrid(x - template.width / 2, grid),
        y: snapToGrid(y - template.height / 2, grid),
      };
      const next = [...objects, newObj];
      setObjects(next);
      saveToHistory(next);
      setSelectedId(newObj.id);
    },
    [objects, canvasConfig, saveToHistory, setSelectedId]
  );

  const moveObject = useCallback(
    (id: string, x: number, y: number) => {
      const grid = canvasConfig.snapEnabled ? canvasConfig.gridSize : 1;
      const next = objects.map((o) =>
        o.id === id ? { ...o, x: snapToGrid(x, grid), y: snapToGrid(y, grid) } : o
      );
      setObjects(next);
      saveToHistory(next);
    },
    [objects, canvasConfig, saveToHistory]
  );

  const batchMoveObjects = useCallback(
    (moves: { id: string; x: number; y: number }[]) => {
      const grid = canvasConfig.snapEnabled ? canvasConfig.gridSize : 1;
      const moveMap = new Map(moves.map((m) => [m.id, m]));
      const next = objects.map((o) => {
        const m = moveMap.get(o.id);
        return m ? { ...o, x: snapToGrid(m.x, grid), y: snapToGrid(m.y, grid) } : o;
      });
      setObjects(next);
      saveToHistory(next);
    },
    [objects, canvasConfig, saveToHistory]
  );

  const resizeObject = useCallback(
    (id: string, width: number, height: number) => {
      const grid = canvasConfig.snapEnabled ? canvasConfig.gridSize : 1;
      const next = objects.map((o) =>
        o.id === id
          ? {
              ...o,
              width: Math.max(grid, snapToGrid(width, grid)),
              height: Math.max(grid, snapToGrid(height, grid)),
            }
          : o
      );
      setObjects(next);
      saveToHistory(next);
    },
    [objects, canvasConfig, saveToHistory]
  );

  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const next = objects.filter((o) => !selectedIds.has(o.id));
    setObjects(next);
    saveToHistory(next);
    setSelectedIds(new Set());
  }, [selectedIds, objects, saveToHistory]);

  const rotateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, rotation: (o.rotation + 90) % 360 } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const copies: FloorObject[] = [];
    objects.forEach((o) => {
      if (selectedIds.has(o.id)) {
        copies.push({ ...o, id: generateId(), x: o.x + 30, y: o.y + 30 });
      }
    });
    const next = [...objects, ...copies];
    setObjects(next);
    saveToHistory(next);
    setSelectedIds(new Set(copies.map((c) => c.id)));
  }, [selectedIds, objects, saveToHistory]);

  const updateObjectProperty = useCallback(
    (id: string, key: keyof FloorObject, value: any) => {
      const next = objects.map((o) => (o.id === id ? { ...o, [key]: value } : o));
      setObjects(next);
      saveToHistory(next);
    },
    [objects, saveToHistory]
  );

  const bringToFront = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selected = objects.filter((o) => selectedIds.has(o.id));
    const rest = objects.filter((o) => !selectedIds.has(o.id));
    const next = [...rest, ...selected];
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const sendToBack = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selected = objects.filter((o) => selectedIds.has(o.id));
    const rest = objects.filter((o) => !selectedIds.has(o.id));
    const next = [...selected, ...rest];
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  // ---- COPY / PASTE ----
  const copySelected = useCallback(() => {
    const copies = objects.filter((o) => selectedIds.has(o.id));
    if (copies.length > 0) setClipboard(copies);
  }, [objects, selectedIds]);

  const pasteClipboard = useCallback(() => {
    if (clipboard.length === 0) return;
    const newObjs = clipboard.map((o) => ({ ...o, id: generateId(), x: o.x + 20, y: o.y + 20 }));
    const next = [...objects, ...newObjs];
    setObjects(next);
    saveToHistory(next);
    setSelectedIds(new Set(newObjs.map((o) => o.id)));
  }, [clipboard, objects, saveToHistory]);

  // ---- LOCK TOGGLE ----
  const lockSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const firstSel = objects.find((o) => selectedIds.has(o.id));
    const toLock = !firstSel?.locked;
    const next = objects.map((o) => (selectedIds.has(o.id) ? { ...o, locked: toLock } : o));
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  // Feature 4: clearAll also removes autosave
  const clearAll = useCallback(() => {
    setObjects([]);
    saveToHistory([]);
    setSelectedIds(new Set());
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {}
  }, [saveToHistory]);

  // Feature 2: Flip / Miroir
  const flipSelectedH = useCallback(() => {
    if (selectedIds.size === 0) return;
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, flipX: !o.flipX } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const flipSelectedV = useCallback(() => {
    if (selectedIds.size === 0) return;
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, flipY: !o.flipY } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  // ---- LAYERS ----

  const toggleLayerVisibility = useCallback(
    (name: string) => {
      setLayers(layers.map((l) => (l.name === name ? { ...l, visible: !l.visible } : l)));
    },
    [layers]
  );

  const toggleLayerLock = useCallback(
    (name: string) => {
      setLayers(layers.map((l) => (l.name === name ? { ...l, locked: !l.locked } : l)));
    },
    [layers]
  );

  // ---- CANVAS CONFIG ----

  const updateCanvasConfig = useCallback((updates: Partial<CanvasConfig>) => {
    setCanvasConfig((c) => ({ ...c, ...updates }));
  }, []);

  const toggleGrid = useCallback(() => {
    setCanvasConfig((c) => ({ ...c, gridVisible: !c.gridVisible }));
  }, []);

  const toggleSnap = useCallback(() => {
    setCanvasConfig((c) => ({ ...c, snapEnabled: !c.snapEnabled }));
  }, []);

  // ---- UNDO / REDO ----

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const i = historyIndex - 1;
    setHistoryIndex(i);
    setObjects(history[i].map((o) => ({ ...o })));
    setSelectedIds(new Set());
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const i = historyIndex + 1;
    setHistoryIndex(i);
    setObjects(history[i].map((o) => ({ ...o })));
    setSelectedIds(new Set());
  }, [historyIndex, history]);

  // ---- ZOOM & PAN ----

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.15, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.15, 0.2)), []);
  const zoomReset = useCallback(() => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  // ---- FEATURE 1: ALIGNMENT ACTIONS ----

  const alignLeft = useCallback(() => {
    if (selectedIds.size < 2) return;
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const minX = Math.min(...sel.map((o) => o.x));
    const next = objects.map((o) => (selectedIds.has(o.id) ? { ...o, x: minX } : o));
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const alignRight = useCallback(() => {
    if (selectedIds.size < 2) return;
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const maxRight = Math.max(...sel.map((o) => o.x + o.width));
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, x: maxRight - o.width } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const alignTop = useCallback(() => {
    if (selectedIds.size < 2) return;
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const minY = Math.min(...sel.map((o) => o.y));
    const next = objects.map((o) => (selectedIds.has(o.id) ? { ...o, y: minY } : o));
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const alignBottom = useCallback(() => {
    if (selectedIds.size < 2) return;
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const maxBottom = Math.max(...sel.map((o) => o.y + o.height));
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, y: maxBottom - o.height } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const alignCenterH = useCallback(() => {
    if (selectedIds.size < 2) return;
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const centerY =
      (Math.min(...sel.map((o) => o.y)) + Math.max(...sel.map((o) => o.y + o.height))) / 2;
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, y: centerY - o.height / 2 } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const alignCenterV = useCallback(() => {
    if (selectedIds.size < 2) return;
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const centerX =
      (Math.min(...sel.map((o) => o.x)) + Math.max(...sel.map((o) => o.x + o.width))) / 2;
    const next = objects.map((o) =>
      selectedIds.has(o.id) ? { ...o, x: centerX - o.width / 2 } : o
    );
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const distributeH = useCallback(() => {
    if (selectedIds.size < 3) return;
    const sel = objects
      .filter((o) => selectedIds.has(o.id))
      .sort((a, b) => a.x - b.x);
    const minX = sel[0].x;
    const maxRight = sel[sel.length - 1].x + sel[sel.length - 1].width;
    const totalWidth = sel.reduce((s, o) => s + o.width, 0);
    const gap = (maxRight - minX - totalWidth) / (sel.length - 1);
    let cur = minX;
    const positions = new Map<string, number>();
    sel.forEach((o) => {
      positions.set(o.id, cur);
      cur += o.width + gap;
    });
    const next = objects.map((o) => {
      const nx = positions.get(o.id);
      return nx !== undefined ? { ...o, x: nx } : o;
    });
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  const distributeV = useCallback(() => {
    if (selectedIds.size < 3) return;
    const sel = objects
      .filter((o) => selectedIds.has(o.id))
      .sort((a, b) => a.y - b.y);
    const minY = sel[0].y;
    const maxBottom = sel[sel.length - 1].y + sel[sel.length - 1].height;
    const totalHeight = sel.reduce((s, o) => s + o.height, 0);
    const gap = (maxBottom - minY - totalHeight) / (sel.length - 1);
    let cur = minY;
    const positions = new Map<string, number>();
    sel.forEach((o) => {
      positions.set(o.id, cur);
      cur += o.height + gap;
    });
    const next = objects.map((o) => {
      const ny = positions.get(o.id);
      return ny !== undefined ? { ...o, y: ny } : o;
    });
    setObjects(next);
    saveToHistory(next);
  }, [selectedIds, objects, saveToHistory]);

  // ---- COMPUTED ----

  const selectedObject = objects.find((o) => o.id === selectedId) || null;

  const visibleObjects = objects.filter((obj) => {
    const layer = layers.find((l) => l.name === obj.layer);
    return layer?.visible ?? true;
  });

  const objectCountByLayer = (name: string): number =>
    objects.filter((o) => o.layer === name).length;

  const totalObjects = objects.length;

  // ---- IMPORT / EXPORT ----

  const exportPlan = useCallback((): string => {
    const data = {
      version: "2.0",
      name: planName,
      exportDate: new Date().toISOString(),
      canvas: canvasConfig,
      layers,
      objects,
    };
    return JSON.stringify(data, null, 2);
  }, [planName, canvasConfig, layers, objects]);

  const importPlan = useCallback(
    (json: string) => {
      try {
        const data = JSON.parse(json);
        if (data.objects) {
          setObjects(data.objects);
          saveToHistory(data.objects);
        }
        if (data.layers) setLayers(data.layers);
        if (data.canvas) setCanvasConfig(data.canvas);
        if (data.name) setPlanName(data.name);
        setSelectedIds(new Set());
      } catch (err) {
        alert("Fichier JSON invalide");
      }
    },
    [saveToHistory]
  );

  return {
    // State
    objects,
    visibleObjects,
    layers,
    canvasConfig,
    selectedId,
    selectedIds,
    selectedObject,
    zoom,
    stagePos,
    planName,
    totalObjects,
    saveStatus,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    // Actions objets
    setSelectedId,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    addObject,
    moveObject,
    batchMoveObjects,
    resizeObject,
    deleteSelected,
    rotateSelected,
    duplicateSelected,
    updateObjectProperty,
    bringToFront,
    sendToBack,
    clearAll,
    // Feature 2: Flip
    flipSelectedH,
    flipSelectedV,
    // Copy / Paste
    clipboard,
    copySelected,
    pasteClipboard,
    lockSelected,
    // Layers
    toggleLayerVisibility,
    toggleLayerLock,
    // Canvas
    updateCanvasConfig,
    toggleGrid,
    toggleSnap,
    // History
    undo,
    redo,
    // Zoom
    zoomIn,
    zoomOut,
    zoomReset,
    setZoom,
    setStagePos,
    setPlanName,
    // Computed
    objectCountByLayer,
    // Import/Export
    exportPlan,
    importPlan,
    // Feature 1: Alignment
    alignLeft,
    alignRight,
    alignTop,
    alignBottom,
    alignCenterH,
    alignCenterV,
    distributeH,
    distributeV,
  };
};
