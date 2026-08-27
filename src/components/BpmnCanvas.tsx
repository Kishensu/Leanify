"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

type ElementRegistryModule = { filter: (fn: (el: { type: string }) => boolean) => unknown[] };
type CanvasModule = { zoom: (level?: number | "fit-viewport") => number };
type BpmnInstance = {
  importXML: (xml: string) => Promise<{ warnings: unknown[] }>;
  saveXML: (opts: { format: boolean }) => Promise<{ xml: string }>;
  get: (module: "canvas" | "elementRegistry") => CanvasModule & ElementRegistryModule;
  destroy: () => void;
};

export type BpmnCanvasHandle = {
  zoomBy: (delta: number) => void;
  zoomFit: () => void;
  /** Serializes the current diagram state (only meaningful in editable mode). */
  getXml: () => Promise<string | null>;
};

const BpmnCanvas = forwardRef<
  BpmnCanvasHandle,
  { xml: string; editable: boolean; heightClassName: string }
>(function BpmnCanvas({ xml, editable, heightClassName }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<BpmnInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    zoomBy(delta) {
      const canvas = instanceRef.current?.get("canvas");
      if (!canvas) return;
      canvas.zoom(canvas.zoom() + delta);
    },
    zoomFit() {
      instanceRef.current?.get("canvas").zoom("fit-viewport");
    },
    async getXml() {
      if (!instanceRef.current) return null;
      const { xml: saved } = await instanceRef.current.saveXML({ format: true });
      return saved;
    },
  }));

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;
      setError(null);

      // Two separate literal import() calls (rather than one with a variable
      // path) so webpack can statically code-split each into its own chunk —
      // the heavier Modeler bundle should only ever load when edit mode is used.
      const { default: BpmnCtor } = editable
        ? await import("bpmn-js/lib/Modeler")
        : await import("bpmn-js/lib/NavigatedViewer");
      if (cancelled) return;

      const instance = new BpmnCtor({ container: containerRef.current }) as unknown as BpmnInstance;
      instanceRef.current = instance;

      try {
        await instance.importXML(xml);
        if (cancelled) return;
        instance.get("canvas").zoom("fit-viewport");

        // Sanity check: the source XML claims sequence flows exist, but did the
        // renderer actually pick them up? (Catches a silent-drop regression.)
        const expectedFlows = (xml.match(/<bpmn:sequenceFlow[\s/]/g) || []).length;
        const renderedFlows = instance
          .get("elementRegistry")
          .filter((el) => el.type === "bpmn:SequenceFlow").length;
        if (expectedFlows > 0 && renderedFlows === 0) {
          console.warn(
            `BpmnCanvas: source XML has ${expectedFlows} sequence flow(s) but the renderer shows 0 — connections may have been dropped.`,
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    }

    render();

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
    // Re-create the instance whenever the mode (view/edit) changes, or the
    // underlying XML is swapped out from under us (e.g. after a fresh generate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml, editable]);

  if (error) {
    return <div className="flex h-64 items-center justify-center text-sm text-coral-500">{error}</div>;
  }

  return <div ref={containerRef} className={`w-full overflow-hidden rounded border border-ink-100 ${heightClassName}`} />;
});

export default BpmnCanvas;
