"use client";

import { useState } from "react";
import type { TaxonomyTreeNode } from "@/lib/taxonomy";

export default function TaxonomyTree({
  nodes,
  onSelectProcess,
  onSelectGroup,
  selectedHierarchyId,
}: {
  nodes: TaxonomyTreeNode[];
  onSelectProcess?: (node: TaxonomyTreeNode) => void;
  onSelectGroup?: (node: TaxonomyTreeNode) => void;
  selectedHierarchyId?: string;
}) {
  return (
    <div className="text-sm">
      {nodes.map((node) => (
        <TreeItem
          key={node.hierarchyId}
          node={node}
          depth={0}
          onSelectProcess={onSelectProcess}
          onSelectGroup={onSelectGroup}
          selectedHierarchyId={selectedHierarchyId}
        />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  depth,
  onSelectProcess,
  onSelectGroup,
  selectedHierarchyId,
}: {
  node: TaxonomyTreeNode;
  depth: number;
  onSelectProcess?: (node: TaxonomyTreeNode) => void;
  onSelectGroup?: (node: TaxonomyTreeNode) => void;
  selectedHierarchyId?: string;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isProcess = node.level === "process";
  const isSelected = selectedHierarchyId === node.hierarchyId;

  const handleClick = () => {
    if (isProcess) {
      onSelectProcess?.(node);
      return;
    }
    if (node.level === "group") {
      onSelectGroup?.(node);
    }
    if (hasChildren) setOpen((o) => !o);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left hover:bg-ink-50 ${
          isSelected ? "bg-teal-50 text-teal-700" : "text-ink-800"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <span className="w-3 shrink-0 text-ink-400">{open ? "▾" : "▸"}</span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span
          className={`truncate ${
            node.level === "category" ? "font-semibold" : node.level === "group" ? "font-medium" : ""
          }`}
          title={node.name}
        >
          {node.name}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-400">{node.hierarchyId}</span>
      </button>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.hierarchyId}
              node={child}
              depth={depth + 1}
              onSelectProcess={onSelectProcess}
              onSelectGroup={onSelectGroup}
              selectedHierarchyId={selectedHierarchyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
