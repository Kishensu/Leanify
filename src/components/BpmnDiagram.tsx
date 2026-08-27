"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BpmnCanvas, { BpmnCanvasHandle } from "@/components/BpmnCanvas";

function downloadXml(xml: string, processName: string) {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${processName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.bpmn`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ZoomControls({ canvasRef }: { canvasRef: React.RefObject<BpmnCanvasHandle> }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => canvasRef.current?.zoomBy(-0.2)}
        className="rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 hover:bg-ink-50"
      >
        −
      </button>
      <button
        onClick={() => canvasRef.current?.zoomBy(0.2)}
        className="rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 hover:bg-ink-50"
      >
        +
      </button>
      <button
        onClick={() => canvasRef.current?.zoomFit()}
        className="rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 hover:bg-ink-50"
      >
        Fit
      </button>
    </div>
  );
}

export default function BpmnDiagram({
  xml,
  processId,
  processName,
}: {
  xml: string;
  processId: string;
  processName: string;
}) {
  const [currentXml, setCurrentXml] = useState(xml);
  const [fullscreen, setFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const inlineCanvasRef = useRef<BpmnCanvasHandle>(null);
  const modalCanvasRef = useRef<BpmnCanvasHandle>(null);

  function openFullscreen() {
    setFullscreen(true);
  }

  function closeFullscreen() {
    // Discard-on-close: if we were editing without saving, the canvas is
    // simply unmounted (its in-progress edits go with it) — currentXml, the
    // source of truth, was only ever updated by a successful save.
    setEditing(false);
    setFullscreen(false);
    setSaveError(null);
  }

  function startEditing() {
    setFullscreen(true);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const edited = await modalCanvasRef.current?.getXml();
      if (!edited) throw new Error("Nothing to save yet.");

      const res = await fetch("/api/process-map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId, bpmnXml: edited }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      const data = await res.json();
      setCurrentXml(data.bpmnXml);
      setEditing(false);
      setFullscreen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save the edited diagram.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!fullscreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeFullscreen();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  return (
    <div className="w-full max-w-2xl rounded-lg border border-ink-200 bg-white p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-ink-600">Process map — {processName}</span>
        <div className="flex items-center gap-2">
          <ZoomControls canvasRef={inlineCanvasRef} />
          <button
            onClick={openFullscreen}
            title="Open fullscreen"
            className="rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 hover:bg-ink-50"
          >
            ⤢
          </button>
        </div>
      </div>

      <BpmnCanvas ref={inlineCanvasRef} xml={currentXml} editable={false} heightClassName="h-[380px]" />

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => downloadXml(currentXml, processName)}
          className="flex-1 rounded-md border border-ink-200 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
        >
          Download .bpmn
        </button>
        <button
          onClick={startEditing}
          className="flex-1 rounded-md border border-ink-200 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
        >
          Edit diagram
        </button>
      </div>

      {fullscreen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-ink-900/60 p-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <div>
                  <span className="text-sm font-semibold text-ink-900">Process map — {processName}</span>
                  {editing && <span className="ml-2 text-xs font-medium text-teal-600">Editing</span>}
                </div>
                <div className="flex items-center gap-3">
                  {!editing && <ZoomControls canvasRef={modalCanvasRef} />}
                  {!editing && (
                    <button
                      onClick={startEditing}
                      className="rounded-md border border-ink-200 px-3 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50"
                    >
                      Edit diagram
                    </button>
                  )}
                  {editing && (
                    <>
                      <button
                        onClick={save}
                        disabled={saving}
                        className="rounded-md bg-teal-500 px-3 py-1 text-xs font-medium text-white hover:bg-teal-600 disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="rounded-md border border-ink-200 px-3 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeFullscreen}
                    title="Close (Esc)"
                    className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-600 hover:bg-ink-50"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {saveError && (
                <div className="border-b border-coral-100 bg-coral-50 px-4 py-2 text-xs text-coral-600">
                  {saveError}
                </div>
              )}

              <div className="flex-1 p-4">
                <BpmnCanvas
                  key={editing ? "edit" : "view"}
                  ref={modalCanvasRef}
                  xml={currentXml}
                  editable={editing}
                  heightClassName="h-full"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
