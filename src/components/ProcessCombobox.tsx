"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LiteProcess = {
  id: string;
  name: string;
  apqcHierarchyId: string;
  hasActivities?: boolean;
};

export default function ProcessCombobox({
  value,
  onChange,
  placeholder = "Search processes by name or hierarchy ID…",
}: {
  value: LiteProcess | null;
  onChange: (process: LiteProcess) => void;
  placeholder?: string;
}) {
  const [processes, setProcesses] = useState<LiteProcess[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/processes/lite")
      .then((r) => r.json())
      .then((data) => setProcesses(data.processes ?? []));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? processes.filter(
          (p) => p.name.toLowerCase().includes(q) || p.apqcHierarchyId.toLowerCase().includes(q),
        )
      : processes;
    return base.slice(0, 50);
  }, [processes, query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={open ? query : value?.name ?? query}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-ink-200 bg-white shadow-lg">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-ink-400">No matching processes</div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-teal-50"
            >
              <span className="truncate text-ink-800">{p.name}</span>
              <span className="shrink-0 font-mono text-xs text-ink-400">{p.apqcHierarchyId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
