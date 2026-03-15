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
import { ContextMenu } from "./ContextMenu";
import { ShortcutsModal } from "./ShortcutsModal";
import { useEditorState } from "../hooks/useEditorState";
import { downloadBlob, fileTimestamp, exportToSVG } from "../utils/helpers";

const AUTOSAVE_KEY = "floorplan_autosave";

export const FloorPlanEditor: React.FC = () => {
  const editor = useEditorState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feature 4: Restore banner
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; objId: string } | null>(null);

  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Feature 4: Check localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.objects && data.objects.length > 0) setPendingRestore(saved);
      }
    } catch {}
  }, []);

  // ---- ZOOM TO FIT ----
  const handleZoomToFit = useCallback(() => {
    if (editor.objects.length === 0) { editor.zoomReset(); return; }
    const cw = editor.canvasConfig.width;
    const ch = editor.canvasConfig.height;
    const pad = 60;
    const minX = Math.min(...editor.objects.map((o) => o.x));
    const minY = Math.min(...editor.objects.map((o) => o.y));
    const maxX = Math.max(...editor.objects.map((o) => o.x + o.width));
    const maxY = Math.max(...editor.objects.map((o) => o.y + o.height));
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const newZoom = Math.min((cw - pad * 2) / contentW, (ch - pad * 2) / contentH, 2.5);
    editor.setZoom(newZoom);
    editor.setStagePos({
      x: (cw - contentW * newZoom) / 2 - minX * newZoom,
      y: (ch - contentH * newZoom) / 2 - minY * newZoom,
    });
  }, [editor]);

  // ---- EXPORT PDF (print window) ----
  const handleExportPDF = () => {
    const canvasEl = document.querySelector(".canvas-container canvas") as HTMLCanvasElement;
    if (!canvasEl) return;
    const dataUrl = canvasEl.toDataURL("image/png", 1.0);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html>
<head>
  <title>${editor.planName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; display:flex; flex-direction:column; align-items:center; padding:20px; font-family:sans-serif; }
    h2  { font-size:16px; color:#334155; margin-bottom:12px; }
    img { max-width:100%; border:1px solid #ccc; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
    p   { font-size:11px; color:#94a3b8; margin-top:8px; }
    @media print { body { padding:0; } img { width:100%; border:none; box-shadow:none; } h2,p { display:none; } }
  </style>
</head>
<body>
  <h2>${editor.planName}</h2>
  <img src="${dataUrl}" alt="${editor.planName}"/>
  <p>Généré le ${new Date().toLocaleString("fr-FR")}</p>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
</body></html>`);
    w.document.close();
  };

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
    const blob = new Blob([editor.exportPlan()], { type: "application/json" });
    downloadBlob(blob, `plan-${fileTimestamp()}.json`);
  };

  // ---- EXPORT SVG ----
  const handleExportSVG = () => {
    const svg = exportToSVG(editor.objects, editor.canvasConfig, editor.planName);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    downloadBlob(blob, `plan-${fileTimestamp()}.svg`);
  };

  // ---- IMPORT JSON ----
  const handleImportJSON = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => editor.importPlan(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  // ---- CLEAR ALL ----
  const handleClearAll = () => {
    if (window.confirm("Supprimer tous les objets du plan ?")) editor.clearAll();
  };

  // ---- CONTEXT MENU ----
  const handleContextMenu = useCallback((id: string, clientX: number, clientY: number) => {
    editor.setSelectedId(id);
    setCtxMenu({ x: clientX, y: clientY, objId: id });
  }, [editor]);

  // ---- KEYBOARD SHORTCUTS ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); editor.deleteSelected(); }
      if (e.key === "r" || e.key === "R") editor.rotateSelected();
      if (e.key === "f" || e.key === "F") { e.preventDefault(); handleZoomToFit(); }
      if (e.key === "?") { e.preventDefault(); setShowShortcuts((v) => !v); }
      if (e.key === "Escape") { editor.clearSelection(); setCtxMenu(null); setShowShortcuts(false); }
      if (e.key === "g") editor.toggleGrid();
      if (e.key === "s" && !e.ctrlKey) editor.toggleSnap();
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); editor.undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); editor.redo(); }
      if (e.ctrlKey && e.key === "d") { e.preventDefault(); editor.duplicateSelected(); }
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); editor.selectAll(); }
      if (e.ctrlKey && e.key === "c") { e.preventDefault(); editor.copySelected(); }
      if (e.ctrlKey && e.key === "v") { e.preventDefault(); editor.pasteClipboard(); }
    },
    [editor, handleZoomToFit]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ---- CONTEXT MENU derived values ----
  const ctxObj = ctxMenu ? editor.objects.find((o) => o.id === ctxMenu.objId) : null;

  return (
    <div className="editor">
      <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileChange} />

      <Toolbar
        planName={editor.planName}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        hasSelection={editor.selectedIds.size > 0}
        hasClipboard={editor.clipboard.length > 0}
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
        onZoomToFit={handleZoomToFit}
        onDelete={editor.deleteSelected}
        onRotate={editor.rotateSelected}
        onFlipH={editor.flipSelectedH}
        onFlipV={editor.flipSelectedV}
        onCopy={editor.copySelected}
        onPaste={editor.pasteClipboard}
        onDuplicate={editor.duplicateSelected}
        onBringToFront={editor.bringToFront}
        onSendToBack={editor.sendToBack}
        onToggleGrid={editor.toggleGrid}
        onToggleSnap={editor.toggleSnap}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onExportSVG={handleExportSVG}
        onExportPDF={handleExportPDF}
        onImportJSON={handleImportJSON}
        onClearAll={handleClearAll}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Feature 4: Restore banner */}
      {pendingRestore && (
        <div className="restore-banner">
          <span>💾 Sauvegarde automatique détectée — restaurer votre plan ?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tb tb-success" onClick={() => { editor.importPlan(pendingRestore); setPendingRestore(null); }}>Restaurer</button>
            <button className="tb" onClick={() => setPendingRestore(null)}>Ignorer</button>
          </div>
        </div>
      )}

      {/* Feature 1: Alignment toolbar */}
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
          onContextMenu={handleContextMenu}
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
          <SearchPanel objects={editor.objects} selectedId={editor.selectedId} onSelect={editor.setSelectedId} />
          <PropertiesPanel object={editor.selectedObject} onUpdate={editor.updateObjectProperty} />
        </div>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          hasClipboard={editor.clipboard.length > 0}
          isLocked={ctxObj?.locked ?? false}
          onClose={() => setCtxMenu(null)}
          onCopy={editor.copySelected}
          onPaste={editor.pasteClipboard}
          onDuplicate={editor.duplicateSelected}
          onDelete={editor.deleteSelected}
          onRotate={editor.rotateSelected}
          onFlipH={editor.flipSelectedH}
          onFlipV={editor.flipSelectedV}
          onBringToFront={editor.bringToFront}
          onSendToBack={editor.sendToBack}
          onLock={editor.lockSelected}
        />
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
};
