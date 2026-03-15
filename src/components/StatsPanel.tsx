// components/StatsPanel.tsx — Panneau de statistiques du plan
import React from "react";
import { FloorObject, CanvasConfig, OBJECT_ICONS } from "../types/floorPlan";
import { computeStats } from "../utils/helpers";

interface Props {
  objects: FloorObject[];
  canvas: CanvasConfig;
}

export const StatsPanel: React.FC<Props> = ({ objects, canvas }) => {
  const stats = computeStats(objects, canvas);

  const barColor = (rate: number) =>
    rate < 50 ? "var(--success)" : rate < 80 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="right-panel">
      <h3 className="panel-title">📊 Statistiques</h3>

      {/* Grille de métriques */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Surface plan</span>
          <span className="stat-value">{stats.canvasAreaM2.toFixed(1)} m²</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Surface occupée</span>
          <span className="stat-value" style={{ color: "var(--accent)" }}>
            {stats.occupiedAreaM2.toFixed(1)} m²
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Surface libre</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>
            {stats.freeAreaM2.toFixed(1)} m²
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total objets</span>
          <span className="stat-value">{stats.totalObjects}</span>
        </div>
      </div>

      {/* Barre d'occupation */}
      <div className="occ-label">
        Occupation : <strong>{stats.occupationRate.toFixed(1)}%</strong>
      </div>
      <div className="occ-bar-bg">
        <div
          className="occ-bar-fill"
          style={{
            width: `${stats.occupationRate}%`,
            backgroundColor: barColor(stats.occupationRate),
          }}
        />
      </div>

      {/* Répartition par type */}
      {Object.keys(stats.byType).length > 0 && (
        <>
          <div className="stats-subtitle">Par type</div>
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="stats-row">
              <span className="stats-row-label">
                {OBJECT_ICONS[type as keyof typeof OBJECT_ICONS] ?? "▪"}{" "}
                <span className="stats-type-name">{type}</span>
              </span>
              <span className="layer-count">{count}</span>
            </div>
          ))}
        </>
      )}

      {objects.length === 0 && (
        <div className="stats-empty">Ajoutez des objets pour voir les statistiques</div>
      )}
    </div>
  );
};
