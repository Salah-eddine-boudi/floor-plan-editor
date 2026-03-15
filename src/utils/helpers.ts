// utils/helpers.ts — Fonctions utilitaires
import { FloorObject, CanvasConfig } from "../types/floorPlan";

// Snap to grid : arrondi au point de grille le plus proche
export const snapToGrid = (value: number, gridSize: number = 20): number =>
  Math.round(value / gridSize) * gridSize;

// Générer un ID unique
export const generateId = (): string =>
  `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Calculer la distance entre deux points
export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Convertir les pixels en mètres (échelle 1px = 2cm)
export const pxToMeters = (px: number): string => ((px * 2) / 100).toFixed(2);

// Convertir les mètres en pixels
export const metersToPx = (m: number): number => (m * 100) / 2;

// Formater les dimensions pour affichage
export const formatDimensions = (w: number, h: number): string =>
  `${pxToMeters(w)}m × ${pxToMeters(h)}m`;

// Calculer la surface en m²
export const calculateArea = (w: number, h: number): string =>
  (((w * 2) / 100) * ((h * 2) / 100)).toFixed(1);

// Télécharger un fichier blob
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Timestamp pour noms de fichiers
export const fileTimestamp = (): string => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
};

// Build SVG transform attribute combining rotation + flip (Feature 2)
const buildSvgTransform = (obj: FloorObject): string => {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const parts: string[] = [];
  if (obj.rotation !== 0) {
    parts.push(`rotate(${obj.rotation},${cx},${cy})`);
  }
  if (obj.flipX) {
    parts.push(`translate(${2 * cx},0) scale(-1,1)`);
  }
  if (obj.flipY) {
    parts.push(`translate(0,${2 * cy}) scale(1,-1)`);
  }
  return parts.length ? ` transform="${parts.join(" ")}"` : "";
};

// ---- EXPORT SVG ----
// Génère un SVG vectoriel du plan à partir des objets et de la config
export const exportToSVG = (
  objects: FloorObject[],
  canvas: CanvasConfig,
  planName: string
): string => {
  const CIRCLE_TYPES = new Set(["chair", "plant"]);

  const gridLines: string[] = [];
  if (canvas.gridVisible) {
    for (let x = 0; x <= canvas.width; x += canvas.gridSize) {
      gridLines.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${canvas.height}" stroke="#E2E8F015" stroke-width="0.5"/>`
      );
    }
    for (let y = 0; y <= canvas.height; y += canvas.gridSize) {
      gridLines.push(
        `<line x1="0" y1="${y}" x2="${canvas.width}" y2="${y}" stroke="#E2E8F015" stroke-width="0.5"/>`
      );
    }
  }

  const shapes = objects.map((obj) => {
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const transform = buildSvgTransform(obj);
    const opacity = obj.opacity < 1 ? ` opacity="${obj.opacity}"` : "";

    // Feature 3: text type
    if (obj.type === "text") {
      return [
        `<rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" fill="none" stroke="${obj.stroke || "#FBBF24"}" stroke-width="1" stroke-dasharray="4 3"${opacity}${transform}/>`,
        `<text x="${obj.x + 4}" y="${cy + (obj.fontSize || 14) / 2}" font-size="${obj.fontSize || 14}" fill="${obj.stroke || "#FBBF24"}" font-family="${obj.fontFamily || "Inter,sans-serif"}"${opacity}${transform}>${obj.content || ""}</text>`,
      ].join("\n  ");
    }

    if (CIRCLE_TYPES.has(obj.type)) {
      const r = Math.min(obj.width, obj.height) / 2;
      return [
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${obj.fill}" stroke="${obj.stroke}" stroke-width="1.5"${opacity}${transform}/>`,
        `<text x="${cx}" y="${cy + r + 10}" text-anchor="middle" font-size="9" fill="#94A3B8" font-family="Inter,sans-serif">${obj.label}</text>`,
      ].join("\n  ");
    }

    return [
      `<rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" rx="2" fill="${obj.fill}" stroke="${obj.stroke}" stroke-width="1.5"${opacity}${transform}/>`,
      `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="9" fill="white" font-family="Inter,sans-serif" font-weight="600">${obj.label}</text>`,
    ].join("\n  ");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`,
    `  <title>${planName}</title>`,
    `  <rect width="${canvas.width}" height="${canvas.height}" fill="${canvas.backgroundColor}"/>`,
    gridLines.length ? `  ${gridLines.join("\n  ")}` : "",
    shapes.map((s) => `  ${s}`).join("\n"),
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");
};

// ---- STATISTIQUES DU PLAN ----
export interface PlanStats {
  canvasAreaM2: number;
  occupiedAreaM2: number;
  freeAreaM2: number;
  occupationRate: number;
  totalObjects: number;
  byType: Record<string, number>;
  byLayer: Record<string, number>;
}

export const computeStats = (objects: FloorObject[], canvas: CanvasConfig): PlanStats => {
  const toM = (px: number) => (px * 2) / 100;
  const canvasAreaM2 = toM(canvas.width) * toM(canvas.height);

  const occupiedAreaM2 = objects.reduce((sum, obj) => {
    if (obj.type === "text") return sum;
    return sum + toM(obj.width) * toM(obj.height);
  }, 0);

  const byType = objects.reduce<Record<string, number>>((acc, obj) => {
    acc[obj.type] = (acc[obj.type] || 0) + 1;
    return acc;
  }, {});

  const byLayer = objects.reduce<Record<string, number>>((acc, obj) => {
    acc[obj.layer] = (acc[obj.layer] || 0) + 1;
    return acc;
  }, {});

  return {
    canvasAreaM2,
    occupiedAreaM2: Math.min(occupiedAreaM2, canvasAreaM2),
    freeAreaM2: Math.max(0, canvasAreaM2 - occupiedAreaM2),
    occupationRate: canvasAreaM2 > 0 ? Math.min(100, (occupiedAreaM2 / canvasAreaM2) * 100) : 0,
    totalObjects: objects.length,
    byType,
    byLayer,
  };
};
