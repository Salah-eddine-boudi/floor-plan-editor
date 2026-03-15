// types/floorPlan.ts — Interfaces strictes pour tous les objets du plan

export type ObjectType =
  | "desk"
  | "chair"
  | "wall"
  | "door"
  | "window"
  | "meeting-table"
  | "cabinet"
  | "plant"
  | "text";

export type LayerName = "structure" | "furniture" | "openings" | "decoration";

export interface FloorObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layer: LayerName;
  fill: string;
  stroke: string;
  label: string;
  locked: boolean;
  opacity: number;
  // Feature 2: Flip / Miroir
  flipX?: boolean;
  flipY?: boolean;
  // Feature 3: Annotations texte
  content?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface Layer {
  name: LayerName;
  label: string;
  visible: boolean;
  locked: boolean;
  color: string;
  icon: string;
}

export interface CanvasConfig {
  width: number;
  height: number;
  gridSize: number;
  gridVisible: boolean;
  snapEnabled: boolean;
  backgroundColor: string;
}

export interface PlanData {
  version: string;
  name: string;
  exportDate: string;
  canvas: CanvasConfig;
  layers: Layer[];
  objects: FloorObject[];
}

// Palette d'objets
export const OBJECT_TEMPLATES: Record<ObjectType, Omit<FloorObject, "id" | "x" | "y">> = {
  desk: {
    type: "desk",
    width: 120,
    height: 60,
    rotation: 0,
    layer: "furniture",
    fill: "#3B82F6",
    stroke: "#2563EB",
    label: "Bureau",
    locked: false,
    opacity: 1,
  },
  chair: {
    type: "chair",
    width: 40,
    height: 40,
    rotation: 0,
    layer: "furniture",
    fill: "#8B5CF6",
    stroke: "#7C3AED",
    label: "Chaise",
    locked: false,
    opacity: 1,
  },
  "meeting-table": {
    type: "meeting-table",
    width: 200,
    height: 100,
    rotation: 0,
    layer: "furniture",
    fill: "#0EA5E9",
    stroke: "#0284C7",
    label: "Table réunion",
    locked: false,
    opacity: 1,
  },
  cabinet: {
    type: "cabinet",
    width: 80,
    height: 40,
    rotation: 0,
    layer: "furniture",
    fill: "#F59E0B",
    stroke: "#D97706",
    label: "Armoire",
    locked: false,
    opacity: 1,
  },
  wall: {
    type: "wall",
    width: 200,
    height: 16,
    rotation: 0,
    layer: "structure",
    fill: "#64748B",
    stroke: "#475569",
    label: "Mur",
    locked: false,
    opacity: 1,
  },
  door: {
    type: "door",
    width: 80,
    height: 12,
    rotation: 0,
    layer: "openings",
    fill: "#F97316",
    stroke: "#EA580C",
    label: "Porte",
    locked: false,
    opacity: 1,
  },
  window: {
    type: "window",
    width: 100,
    height: 10,
    rotation: 0,
    layer: "openings",
    fill: "#06B6D4",
    stroke: "#0891B2",
    label: "Fenêtre",
    locked: false,
    opacity: 1,
  },
  plant: {
    type: "plant",
    width: 30,
    height: 30,
    rotation: 0,
    layer: "decoration",
    fill: "#22C55E",
    stroke: "#16A34A",
    label: "Plante",
    locked: false,
    opacity: 1,
  },
  text: {
    type: "text",
    width: 150,
    height: 30,
    rotation: 0,
    layer: "decoration",
    fill: "transparent",
    stroke: "#FBBF24",
    label: "",
    locked: false,
    opacity: 1,
    content: "Annotation",
    fontSize: 14,
    fontFamily: "Inter,sans-serif",
  },
};

// Layers par défaut
export const DEFAULT_LAYERS: Layer[] = [
  { name: "structure", label: "Structure", visible: true, locked: false, color: "#64748B", icon: "🧱" },
  { name: "openings", label: "Ouvertures", visible: true, locked: false, color: "#F97316", icon: "🚪" },
  { name: "furniture", label: "Mobilier", visible: true, locked: false, color: "#3B82F6", icon: "🪑" },
  { name: "decoration", label: "Décoration", visible: true, locked: false, color: "#22C55E", icon: "🌱" },
];

// Canvas par défaut
export const DEFAULT_CANVAS: CanvasConfig = {
  width: 1200,
  height: 750,
  gridSize: 20,
  gridVisible: true,
  snapEnabled: true,
  backgroundColor: "#FFFFFF",
};

// Catégories pour la sidebar
export const OBJECT_CATEGORIES = [
  { label: "Structure", types: ["wall"] as ObjectType[] },
  { label: "Ouvertures", types: ["door", "window"] as ObjectType[] },
  { label: "Mobilier", types: ["desk", "chair", "meeting-table", "cabinet"] as ObjectType[] },
  { label: "Décoration", types: ["plant"] as ObjectType[] },
  { label: "Annotations", types: ["text"] as ObjectType[] },
];

// Icônes
export const OBJECT_ICONS: Record<ObjectType, string> = {
  desk: "🖥️",
  chair: "🪑",
  wall: "🧱",
  door: "🚪",
  window: "🪟",
  "meeting-table": "📋",
  cabinet: "🗄️",
  plant: "🌱",
  text: "T",
};
