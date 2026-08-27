"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProcessCombobox, { LiteProcess } from "@/components/ProcessCombobox";
import BpmnDiagram from "@/components/BpmnDiagram";

type Tool = { id: string; name: string; icon: string; promptTemplate: string };
type Message =
  | { role: "user"; kind: "text"; text: string }
  | { role: "assistant"; kind: "text"; text: string }
  | { role: "assistant"; kind: "gate"; text: string; processId: string }
  | { role: "assistant"; kind: "diagram"; processId: string; processName: string; xml: string };

const PROCESS_MAP_TOOL = "Generate process map";

function LssExpertInner() {
  const searchParams = useSearchParams();
  const initialProcessId = searchParams.get("process");

  const [selected, setSelected] = useState<LiteProcess | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/lss-tools")
      .then((r) => r.json())
      .then((data) => setTools(data.tools ?? []));
  }, []);

  useEffect(() => {
    if (!initialProcessId) return;
    fetch("/api/processes/lite")
      .then((r) => r.json())
      .then((data) => {
        const match = (data.processes ?? []).find((p: LiteProcess) => p.id === initialProcessId);
        if (match) setSelected(match);
      });
  }, [initialProcessId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", kind: "text", text }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, processId: selected?.id }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", kind: "text", text: data.reply ?? "No response." }]);
    } finally {
      setSending(false);
    }
  }

  async function generateProcessMap() {
    if (!selected) return;
    setMessages((prev) => [...prev, { role: "user", kind: "text", text: `Generate a process map for ${selected.name}.` }]);
    setSending(true);
    try {
      const res = await fetch("/api/process-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId: selected.id }),
      });
      const data = await res.json();

      if (res.status === 422) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", kind: "gate", text: data.message ?? "This process has no activity breakdown yet.", processId: selected.id },
        ]);
        return;
      }

      if (res.status === 409) {
        // Activities changed since a manual edit — show the existing edited
        // diagram plus a note, rather than silently regenerating over it.
        setMessages((prev) => [
          ...prev,
          { role: "assistant", kind: "text", text: data.message ?? "This diagram was hand-edited and is now out of sync with the process's activities." },
          { role: "assistant", kind: "diagram", processId: selected.id, processName: selected.name, xml: data.bpmnXml },
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", kind: "text", text: "Couldn't generate a process map for that process. Try again in a moment." },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", kind: "diagram", processId: selected.id, processName: selected.name, xml: data.bpmnXml },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", kind: "text", text: "Couldn't generate a process map — something went wrong building the diagram." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function tapTool(tool: Tool) {
    if (tool.name === PROCESS_MAP_TOOL) {
      generateProcessMap();
      return;
    }
    const filled = tool.promptTemplate
      .replace("{process_name}", selected?.name ?? "the process")
      .replace("{metric_name}", "the flagged metric");
    send(filled);
  }

  return (
    <div className="flex h-screen flex-col px-8 py-6">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">LSS expert</h1>
          {selected && <p className="text-sm text-ink-600">Scoped to {selected.name}</p>}
        </div>
        <div className="w-72">
          <ProcessCombobox value={selected} onChange={setSelected} placeholder="Scope to a process (optional)" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tools.map((tool) => {
          const isProcessMap = tool.name === PROCESS_MAP_TOOL;
          const disabled = isProcessMap && (!selected || !selected.hasActivities);
          return (
            <button
              key={tool.id}
              onClick={() => tapTool(tool)}
              disabled={disabled}
              title={
                disabled
                  ? selected
                    ? `${selected.name} has no activity breakdown yet — add one to generate a map`
                    : "Scope a process first to generate its map"
                  : undefined
              }
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                disabled
                  ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300"
                  : "border-ink-200 bg-white text-ink-700 hover:border-teal-500 hover:text-teal-700"
              }`}
            >
              <span>{tool.icon}</span>
              {tool.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-ink-100 bg-white p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-ink-400">
            Ask about a Lean Six Sigma tool, or tap a card above to get started.
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => {
            if (m.kind === "diagram") {
              return (
                <div key={i} className="mr-auto">
                  <BpmnDiagram xml={m.xml} processId={m.processId} processName={m.processName} />
                </div>
              );
            }
            if (m.kind === "gate") {
              return (
                <div key={i} className="mr-auto max-w-2xl rounded-lg bg-coral-50 px-3 py-2 text-sm text-ink-800">
                  <p>{m.text}</p>
                  <Link
                    href={`/processes/${m.processId}/activities`}
                    className="mt-1 inline-block text-xs font-medium text-teal-700 hover:underline"
                  >
                    Add activity breakdown →
                  </Link>
                </div>
              );
            }
            return (
              <div
                key={i}
                className={`max-w-2xl whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-teal-500 text-white" : "mr-auto bg-ink-50 text-ink-800"
                }`}
              >
                {m.text}
              </div>
            );
          })}
          {sending && <div className="mr-auto text-xs text-ink-400">Thinking…</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the LSS expert…"
          className="flex-1 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function LssExpertPage() {
  return (
    <Suspense fallback={<div className="px-8 py-6 text-sm text-ink-400">Loading…</div>}>
      <LssExpertInner />
    </Suspense>
  );
}
