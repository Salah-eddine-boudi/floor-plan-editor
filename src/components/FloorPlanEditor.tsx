// components/FloorPlanEditor.tsx
import React, { useEffect, useCallback, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { LayerPanel } from "./LayerPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatsPanel } from "./StatsPanel";
import { SearchPanel } from "./SearchPanel";
import { AlignmentToolbar } from "./AlignmentToolbar";
import { useEditorState } from "../hooks/useEditorState";
import { downloadBlob, fileTimestamp, exportToSVG } from "../utils/helpers";

const AUTOSAVE_KEY = "floorplan_autosave";

export const FloorPlanEditor: React.FC = () => {
  const editor = useEditorState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Feature 4: Restore banner
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);

  // Feature 4: Check localStorage for autosave on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.objects && data.objects.length > 0) {
          setPendingRestore(saved);
        }
      }
    } catch {}
  }, []);

  // ---- RACCOURCIS CLAVIER ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        editor.deleteSelected();
      }
      if (e.key === "r" || e.key === "R") editor.rotateSelected();
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        editor.undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        editor.redo();
      }
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        editor.duplicateSelected();
      }
      // Feature 1: Ctrl+A = select all, Escape = clear selection
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        editor.selectAll();
      }
      if (e.key === "Escape") editor.clearSelection();
      if (e.key === "g") editor.toggleGrid();
      if (e.key === "s" && !e.ctrlKey) editor.toggleSnap();
    },
    [editor]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ---- EXPORT PNG ----
  const handleExportPNG = () => {
    const canvasEl = document.querySelector(".canvas-container canvas") as HTMLCanvasElement;
    if (!canvasEl) return;
    canvasEl.toBlob((blob) => {
      if (blob) downloadBlob(blob, `plan-${fileTimestamp()}.png`);
    }, "image/png");
  };

  // ---- EXPORT JSON ----
  const handleExportJSON = () => {
    const json = editor.exportPlan();
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `plan-${fileTimestamp()}.json`);
  };

  // ---- EXPORT SVG ----
  const handleExportSVG = () => {
    const svg = exportToSVG(editor.objects, editor.canvasConfig, editor.planName);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    downloadBlob(blob, `plan-${fileTimestamp()}.svg`);
  };

  // ---- IMPORT JSON ----
  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      editor.importPlan(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ---- CLEAR ALL ----
  const handleClearAll = () => {
    if (window.confirm("Supprimer tous les objets du plan ?")) {
      editor.clearAll();
    }
  };

  return (
    <div className="editor">
      {/* Input caché pour import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Toolbar
        planName={editor.planName}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        hasSelection={editor.selectedIds.size > 0}
        gridVisible={editor.canvasConfig.gridVisible}
        snapEnabled={editor.canvasConfig.snapEnabled}
        zoom={editor.zoom}
        saveStatus={editor.saveStatus}
        onPlanNameChange={editor.setPlanName}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onZoomIn={editor.zoomIn}
        onZoomOut={editor.zoomOut}
        onZoomReset={editor.zoomReset}
        onDelete={editor.deleteSelected}
        onRotate={editor.rotateSelected}
        onFlipH={editor.flipSelectedH}
        onFlipV={editor.flipSelectedV}
        onDuplicate={editor.duplicateSelected}
        onBringToFront={editor.bringToFront}
        onSendToBack={editor.sendToBack}
        onToggleGrid={editor.toggleGrid}
        onToggleSnap={editor.toggleSnap}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onExportSVG={handleExportSVG}
        onImportJSON={handleImportJSON}
        onClearAll={handleClearAll}
      />

      {/* Feature 4: Restore banner */}
      {pendingRestore && (
        <div className="restore-banner">
          <span>💾 Sauvegarde automatique détectée — restaurer votre plan ?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="tb tb-success"
              onClick={() => {
                editor.importPlan(pendingRestore);
                setPendingRestore(null);
              }}
            >
              Restaurer
            </button>
            <button className="tb" onClick={() => setPendingRestore(null)}>
              Ignorer
            </button>
          </div>
        </div>
      )}

      {/* Feature 1: Alignment toolbar (shown when 2+ objects selected) */}
      <AlignmentToolbar
        count={editor.selectedIds.size}
        onAlignLeft={editor.alignLeft}
        onAlignRight={editor.alignRight}
        onAlignTop={editor.alignTop}
        onAlignBottom={editor.alignBottom}
        onAlignCenterH={editor.alignCenterH}
        onAlignCenterV={editor.alignCenterV}
        onDistributeH={editor.distributeH}
        onDistributeV={editor.distributeV}
      />

      <div className="editor-body">
        <Sidebar />

        <Canvas
          objects={editor.visibleObjects}
          layers={editor.layers}
          config={editor.canvasConfig}
          selectedIds={editor.selectedIds}
          zoom={editor.zoom}
          stagePos={editor.stagePos}
          onSelect={editor.setSelectedId}
          onShiftSelect={editor.toggleSelection}
          onRubberBandSelect={(ids) => editor.setSelectedIds(new Set(ids))}
          onMove={editor.moveObject}
          onBatchMove={editor.batchMoveObjects}
          onResize={editor.resizeObject}
          onDrop={editor.addObject}
          onZoom={editor.setZoom}
          onStagePosChange={editor.setStagePos}
          onTextEdit={(id, value) => editor.updateObjectProperty(id, "content", value)}
        />

        <div className="right-panels">
          <LayerPanel
            layers={editor.layers}
            totalObjects={editor.totalObjects}
            onToggleVisibility={editor.toggleLayerVisibility}
            onToggleLock={editor.toggleLayerLock}
            objectCount={editor.objectCountByLayer}
          />
          <StatsPanel objects={editor.objects} canvas={editor.canvasConfig} />
          <SearchPanel
            objects={editor.objects}
            selectedId={editor.selectedId}
            onSelect={editor.setSelectedId}
          />
          <PropertiesPanel
            object={editor.selectedObject}
            onUpdate={editor.updateObjectProperty}
          />
        </div>
      </div>
    </div>
  );
};
