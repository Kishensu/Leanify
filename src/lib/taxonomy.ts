import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Taxonomy } from "@prisma/client";
import { compareHierarchyIds } from "@/lib/hierarchy";

export type TaxonomyTreeNode = {
  pcfId: number;
  hierarchyId: string;
  level: string;
  name: string;
  description: string;
  children: TaxonomyTreeNode[];
};

/** Category -> group -> process tree, used for the Library sidebar and Add-Process browser. */
export const getTaxonomyTree = cache(async (): Promise<TaxonomyTreeNode[]> => {
  const rows = await prisma.taxonomy.findMany({
    where: { level: { in: ["category", "group", "process"] } },
    orderBy: { hierarchyId: "asc" },
  });
  return buildTree(rows);
});

/** Full ~2,017-row taxonomy, used for the Add-Process classification search. */
export const getFullTaxonomy = cache(async (): Promise<Taxonomy[]> => {
  return prisma.taxonomy.findMany({ orderBy: { hierarchyId: "asc" } });
});

export const getCategories = cache(async (): Promise<Taxonomy[]> => {
  return prisma.taxonomy.findMany({
    where: { level: "category" },
    orderBy: { hierarchyId: "asc" },
  });
});

function buildTree(rows: Taxonomy[]): TaxonomyTreeNode[] {
  const byHierarchyId = new Map<string, TaxonomyTreeNode>();
  for (const row of rows) {
    byHierarchyId.set(row.hierarchyId, {
      pcfId: row.pcfId,
      hierarchyId: row.hierarchyId,
      level: row.level,
      name: row.name,
      description: row.description,
      children: [],
    });
  }

  const roots: TaxonomyTreeNode[] = [];
  for (const row of rows) {
    const node = byHierarchyId.get(row.hierarchyId)!;
    if (row.parentHierarchyId && byHierarchyId.has(row.parentHierarchyId)) {
      byHierarchyId.get(row.parentHierarchyId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursively = (nodes: TaxonomyTreeNode[]) => {
    nodes.sort((a, b) => compareHierarchyIds(a.hierarchyId, b.hierarchyId));
    for (const node of nodes) sortRecursively(node.children);
  };
  sortRecursively(roots);

  return roots;
}
