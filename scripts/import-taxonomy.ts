import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../src/lib/db";
import type { TaxonomyLevel } from "@prisma/client";

type Row = {
  pcf_id: string;
  hierarchy_id: string;
  level: string;
  name: string;
  parent_hierarchy_id: string;
  description: string;
};

async function main() {
  const csvPath = join(process.cwd(), "apqc-taxonomy-full.csv");
  const raw = readFileSync(csvPath, "utf-8");
  const rows: Row[] = parse(raw, { columns: true, skip_empty_lines: true });

  console.log(`Parsed ${rows.length} taxonomy rows from apqc-taxonomy-full.csv`);

  for (const row of rows) {
    const data = {
      hierarchyId: row.hierarchy_id,
      level: row.level as TaxonomyLevel,
      name: row.name,
      parentHierarchyId: row.parent_hierarchy_id?.trim() ? row.parent_hierarchy_id.trim() : null,
      description: row.description,
    };

    await prisma.taxonomy.upsert({
      where: { pcfId: Number(row.pcf_id) },
      create: { pcfId: Number(row.pcf_id), ...data },
      update: data,
    });
  }

  const total = await prisma.taxonomy.count();
  const byLevel = await prisma.taxonomy.groupBy({
    by: ["level"],
    _count: true,
  });

  console.log(`Taxonomy import complete. Total rows in DB: ${total}`);
  for (const l of byLevel) {
    console.log(`  ${l.level}: ${l._count}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
