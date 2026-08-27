"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusPill from "@/components/StatusPill";
import TaxonomyTree from "@/components/TaxonomyTree";
import type { TaxonomyTreeNode } from "@/lib/taxonomy";
import type { ProcessStatus } from "@/lib/status";

type ProcessRow = {
  id: string;
  name: string;
  apqcHierarchyId: string;
  ownerTeam: string;
  status: ProcessStatus;
  cycleTime: { value: number; unit: string } | null;
  sla: { value: number; unit: string } | null;
  fpy: { value: number; unit: string } | null;
};

const PAGE_SIZE = 50;

export default function LibraryPage() {
  const router = useRouter();
  const [tree, setTree] = useState<TaxonomyTreeNode[]>([]);
  const [rows, setRows] = useState<ProcessRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taxonomy/tree")
      .then((r) => r.json())
      .then((data) => setTree(data.tree ?? []));
  }, []);

  const load = useCallback((nextOffset: number, q: string, cat: string | null, append: boolean) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(nextOffset),
    });
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);

    fetch(`/api/processes?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRows((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setOffset(nextOffset);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(0, query, category, false), 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  return (
    <div className="flex h-screen">
      <div className="w-72 shrink-0 overflow-y-auto border-r border-ink-100 bg-white px-2 py-4">
        <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          APQC taxonomy
        </div>
        <TaxonomyTree
          nodes={tree}
          onSelectProcess={(node) => {
            setQuery(node.hierarchyId);
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-ink-900">Process library</h1>
          <p className="text-sm text-ink-600">
            {total.toLocaleString()} processes across the APQC Process Classification Framework
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by process name or hierarchy ID…"
            className="w-80 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {tree.map((cat) => (
            <button
              key={cat.hierarchyId}
              onClick={() => setCategory(category === cat.hierarchyId ? null : cat.hierarchyId)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                category === cat.hierarchyId
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5">Process</th>
                <th className="px-4 py-2.5">Hierarchy ID</th>
                <th className="px-4 py-2.5">Owner</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Cycle time</th>
                <th className="px-4 py-2.5">SLA</th>
                <th className="px-4 py-2.5">FPY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/dashboard?process=${row.id}`)}
                  className="cursor-pointer border-b border-ink-50 last:border-0 hover:bg-teal-50/40"
                >
                  <td className="px-4 py-2.5 font-medium text-ink-900">{row.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-500">{row.apqcHierarchyId}</td>
                  <td className="px-4 py-2.5 text-ink-600">{row.ownerTeam}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-700">
                    {row.cycleTime ? `${row.cycleTime.value} ${row.cycleTime.unit}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-700">
                    {row.sla ? `${row.sla.value}%` : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-700">
                    {row.fpy ? `${row.fpy.value}%` : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                    No processes match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length < total && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => load(offset + PAGE_SIZE, query, category, true)}
              disabled={loading}
              className="rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:border-ink-300 disabled:opacity-50"
            >
              {loading ? "Loading…" : `Load more (${rows.length} of ${total})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
