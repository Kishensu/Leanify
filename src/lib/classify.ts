import { prisma } from "@/lib/db";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "with", "by",
  "is", "are", "be", "as", "at", "this", "that", "it", "its", "our", "we",
  "into", "from", "such", "any", "all", "their", "these", "those", "will",
  "process", "processes", "organization", "organizations", "activity",
  "activities", "management", "manage", "managing", "related",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

export type ClassificationMatch = {
  groupHierarchyId: string;
  groupName: string;
  categoryHierarchyId: string;
  categoryName: string;
  confidence: number; // 0-1
};

/**
 * Ranks APQC groups against a free-text process description using TF-IDF cosine
 * similarity over the group's own text plus its child processes' names/descriptions.
 * Runs entirely against the imported taxonomy table — no external API required.
 */
export async function classifyDescription(
  name: string,
  description: string,
): Promise<ClassificationMatch[]> {
  const groups = await prisma.taxonomy.findMany({ where: { level: "group" } });
  const categories = await prisma.taxonomy.findMany({ where: { level: "category" } });
  const processes = await prisma.taxonomy.findMany({ where: { level: "process" } });

  const categoryByHierarchyId = new Map(categories.map((c) => [c.hierarchyId, c]));
  // Weight process *names* higher than their descriptions — names are short and
  // specific, descriptions are long and share a lot of generic boilerplate phrasing
  // across unrelated groups (e.g. "Enlist senior management...").
  const childProcessTextByGroup = new Map<string, string[]>();
  for (const p of processes) {
    if (!p.parentHierarchyId) continue;
    const list = childProcessTextByGroup.get(p.parentHierarchyId) ?? [];
    list.push(`${p.name} ${p.name} ${p.description}`);
    childProcessTextByGroup.set(p.parentHierarchyId, list);
  }

  const groupDocs = groups.map((g) => {
    const category = categoryByHierarchyId.get(g.parentHierarchyId ?? "");
    const childText = (childProcessTextByGroup.get(g.hierarchyId) ?? []).join(" ");
    // The group's own name and its parent category name are the most authoritative,
    // specific signal (e.g. a category literally named "Manage Information
    // Technology (IT)"), so they're repeated to outweigh dilution from long
    // boilerplate-heavy child process descriptions.
    const weightedText = [
      g.name, g.name, g.name,
      category?.name ?? "", category?.name ?? "",
      g.description,
      childText,
    ].join(" ");
    return { group: g, tokens: tokenize(weightedText) };
  });

  // Document frequency across the group corpus, for IDF.
  const df = new Map<string, number>();
  for (const doc of groupDocs) {
    for (const term of new Set(doc.tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const N = groupDocs.length;
  const idf = (term: string) => Math.log((N + 1) / ((df.get(term) ?? 0) + 1)) + 1;

  function vectorize(tokens: string[]): Map<string, number> {
    const tf = termFrequency(tokens);
    const vec = new Map<string, number>();
    for (const [term, count] of tf) {
      vec.set(term, count * idf(term));
    }
    return vec;
  }

  function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
    let dot = 0;
    for (const [term, weight] of a) {
      const other = b.get(term);
      if (other) dot += weight * other;
    }
    const normA = Math.sqrt([...a.values()].reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt([...b.values()].reduce((s, v) => s + v * v, 0));
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  }

  const queryVec = vectorize(tokenize(`${name} ${name} ${name} ${description}`));

  const scored = groupDocs
    .map((doc) => ({
      group: doc.group,
      score: cosineSim(queryVec, vectorize(doc.tokens)),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  const maxScore = top[0]?.score || 1;

  return top.map(({ group, score }) => {
    const category = categoryByHierarchyId.get(
      group.parentHierarchyId ?? `${group.hierarchyId.split(".")[0]}.0`,
    );
    return {
      groupHierarchyId: group.hierarchyId,
      groupName: group.name,
      categoryHierarchyId: category?.hierarchyId ?? "",
      categoryName: category?.name ?? "",
      // Normalize against the top score so the best match reads as a meaningful
      // confidence, then scale down: cosine similarity on short text rarely nears 1.0.
      confidence: maxScore > 0 ? Math.min(0.98, (score / maxScore) * 0.55 + score * 0.45) : 0,
    };
  });
}
