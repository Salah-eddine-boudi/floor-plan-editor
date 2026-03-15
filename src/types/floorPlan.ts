// types/floorPlan.ts — Interfaces strictes pour tous les objets du plan

export type ObjectType =
  | "wall"       | "column"       | "staircase"    | "stairs-spiral" | "elevator"
  | "door"       | "window"
  | "desk"       | "chair"        | "bed"          | "sofa"
  | "meeting-table" | "cabinet"   | "wardrobe"     | "kitchen-counter"
  | "toilet"     | "bathtub"      | "shower"       | "sink"
  | "stove"      | "fridge"
  | "plant"      | "text";

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
  flipX?: boolean;
  flipY?: boolean;
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

// ─── TEMPLATES ──────────────────────────────────────────────────────────────
export const OBJECT_TEMPLATES: Record<ObjectType, Omit<FloorObject, "id" | "x" | "y">> = {
  // Structure
  wall: {
    type: "wall", width: 200, height: 16, rotation: 0, layer: "structure",
    fill: "#475569", stroke: "#1E293B", label: "Mur", locked: false, opacity: 1,
  },
  column: {
    type: "column", width: 30, height: 30, rotation: 0, layer: "structure",
    fill: "#374151", stroke: "#111827", label: "Poteau", locked: false, opacity: 1,
  },
  staircase: {
    type: "staircase", width: 100, height: 180, rotation: 0, layer: "structure",
    fill: "#F1F5F9", stroke: "#334155", label: "Escalier", locked: false, opacity: 1,
  },
  "stairs-spiral": {
    type: "stairs-spiral", width: 100, height: 100, rotation: 0, layer: "structure",
    fill: "#F1F5F9", stroke: "#334155", label: "Escalier hélicoïdal", locked: false, opacity: 1,
  },
  elevator: {
    type: "elevator", width: 120, height: 120, rotation: 0, layer: "structure",
    fill: "#EDE9FE", stroke: "#5B21B6", label: "Ascenseur", locked: false, opacity: 1,
  },
  // Openings
  door: {
    type: "door", width: 80, height: 80, rotation: 0, layer: "openings",
    fill: "#FFFFFF", stroke: "#1E293B", label: "Porte", locked: false, opacity: 1,
  },
  window: {
    type: "window", width: 100, height: 14, rotation: 0, layer: "openings",
    fill: "#FFFFFF", stroke: "#1E293B", label: "Fenêtre", locked: false, opacity: 1,
  },
  // Furniture
  desk: {
    type: "desk", width: 120, height: 60, rotation: 0, layer: "furniture",
    fill: "#F8FAFC", stroke: "#334155", label: "Bureau", locked: false, opacity: 1,
  },
  chair: {
    type: "chair", width: 45, height: 45, rotation: 0, layer: "furniture",
    fill: "#F1F5F9", stroke: "#334155", label: "Chaise", locked: false, opacity: 1,
  },
  bed: {
    type: "bed", width: 80, height: 140, rotation: 0, layer: "furniture",
    fill: "#F8FAFC", stroke: "#334155", label: "Lit", locked: false, opacity: 1,
  },
  sofa: {
    type: "sofa", width: 160, height: 80, rotation: 0, layer: "furniture",
    fill: "#F1F5F9", stroke: "#334155", label: "Canapé", locked: false, opacity: 1,
  },
  "meeting-table": {
    type: "meeting-table", width: 200, height: 100, rotation: 0, layer: "furniture",
    fill: "#F8FAFC", stroke: "#334155", label: "Table réunion", locked: false, opacity: 1,
  },
  cabinet: {
    type: "cabinet", width: 80, height: 40, rotation: 0, layer: "furniture",
    fill: "#F1F5F9", stroke: "#334155", label: "Placard", locked: false, opacity: 1,
  },
  wardrobe: {
    type: "wardrobe", width: 200, height: 60, rotation: 0, layer: "furniture",
    fill: "#F8FAFC", stroke: "#334155", label: "Armoire", locked: false, opacity: 1,
  },
  "kitchen-counter": {
    type: "kitchen-counter", width: 200, height: 60, rotation: 0, layer: "furniture",
    fill: "#FFFBEB", stroke: "#92400E", label: "Plan de travail", locked: false, opacity: 1,
  },
  // Sanitaire
  toilet: {
    type: "toilet", width: 40, height: 70, rotation: 0, layer: "furniture",
    fill: "#FFFFFF", stroke: "#334155", label: "WC", locked: false, opacity: 1,
  },
  bathtub: {
    type: "bathtub", width: 70, height: 140, rotation: 0, layer: "furniture",
    fill: "#BAE6FD", stroke: "#0369A1", label: "Baignoire", locked: false, opacity: 1,
  },
  shower: {
    type: "shower", width: 80, height: 80, rotation: 0, layer: "furniture",
    fill: "#EFF6FF", stroke: "#1E40AF", label: "Douche", locked: false, opacity: 1,
  },
  sink: {
    type: "sink", width: 50, height: 50, rotation: 0, layer: "furniture",
    fill: "#FFFFFF", stroke: "#334155", label: "Évier", locked: false, opacity: 1,
  },
  // Cuisine
  stove: {
    type: "stove", width: 60, height: 60, rotation: 0, layer: "furniture",
    fill: "#FFFBEB", stroke: "#92400E", label: "Cuisinière", locked: false, opacity: 1,
  },
  fridge: {
    type: "fridge", width: 60, height: 70, rotation: 0, layer: "furniture",
    fill: "#F0FDF4", stroke: "#166534", label: "Réfrigérateur", locked: false, opacity: 1,
  },
  // Décoration
  plant: {
    type: "plant", width: 30, height: 30, rotation: 0, layer: "decoration",
    fill: "#22C55E", stroke: "#15803D", label: "Plante", locked: false, opacity: 1,
  },
  text: {
    type: "text", width: 150, height: 30, rotation: 0, layer: "decoration",
    fill: "transparent", stroke: "#FBBF24", label: "", locked: false, opacity: 1,
    content: "Annotation", fontSize: 14, fontFamily: "Inter,sans-serif",
  },
};

// ─── LAYERS ──────────────────────────────────────────────────────────────────
export const DEFAULT_LAYERS: Layer[] = [
  { name: "structure", label: "Structure",  visible: true, locked: false, color: "#64748B", icon: "🧱" },
  { name: "openings",  label: "Ouvertures", visible: true, locked: false, color: "#F97316", icon: "🚪" },
  { name: "furniture", label: "Mobilier",   visible: true, locked: false, color: "#3B82F6", icon: "🪑" },
  { name: "decoration",label: "Décoration", visible: true, locked: false, color: "#22C55E", icon: "🌱" },
];

// ─── CANVAS ───────────────────────────────────────────────────────────────────
export const DEFAULT_CANVAS: CanvasConfig = {
  width: 1200, height: 750, gridSize: 20,
  gridVisible: true, snapEnabled: true, backgroundColor: "#FFFFFF",
};

// ─── CATÉGORIES (sidebar) ─────────────────────────────────────────────────────
export const OBJECT_CATEGORIES = [
  { label: "Structure",   types: ["wall", "column", "staircase", "stairs-spiral", "elevator"] as ObjectType[] },
  { label: "Ouvertures",  types: ["door", "window"] as ObjectType[] },
  { label: "Mobilier",    types: ["bed", "sofa", "desk", "chair", "meeting-table", "cabinet", "wardrobe"] as ObjectType[] },
  { label: "Cuisine",     types: ["kitchen-counter", "stove", "fridge"] as ObjectType[] },
  { label: "Sanitaire",   types: ["toilet", "bathtub", "shower", "sink"] as ObjectType[] },
  { label: "Décoration",  types: ["plant"] as ObjectType[] },
  { label: "Annotations", types: ["text"] as ObjectType[] },
];

// ─── ICÔNES ───────────────────────────────────────────────────────────────────
export const OBJECT_ICONS: Record<ObjectType, string> = {
  wall: "🧱", column: "⬛", staircase: "🪜", "stairs-spiral": "🌀", elevator: "🛗",
  door: "🚪", window: "🪟",
  desk: "🖥️", chair: "🪑", bed: "🛏️", sofa: "🛋️",
  "meeting-table": "📋", cabinet: "🗄️", wardrobe: "👔", "kitchen-counter": "🍳",
  toilet: "🚽", bathtub: "🛁", shower: "🚿", sink: "🫧",
  stove: "🔥", fridge: "🧊",
  plant: "🌱", text: "T",
};
