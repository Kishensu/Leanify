import { prisma } from "../src/lib/db";
import { compareHierarchyIds } from "../src/lib/hierarchy";
import type { FlowNode } from "../src/lib/bpmn";

/** Deterministic PRNG (mulberry32) so re-running the seed produces identical data. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function rngFor(key: string) {
  return mulberry32(hashString(key));
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function round(n: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/**
 * A short random-walk-with-drift toward `finalValue`, so backfilled history
 * has realistic variance rather than being flat — each point nudges partway
 * toward the target with noise layered on top, so the series visibly wanders
 * before landing on the metric's current value at the last point.
 */
function generateWalk(rng: () => number, count: number, baseline: number, finalValue: number, noise: number): number[] {
  const points: number[] = [];
  let current = baseline + range(rng, -noise, noise);
  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(1, count - 1);
    const target = baseline + (finalValue - baseline) * progress;
    current = current + (target - current) * 0.5 + range(rng, -noise, noise);
    points.push(current);
  }
  points[points.length - 1] = finalValue; // last point always matches the metric's current value
  return points;
}

const CATEGORY_TEAMS: Record<string, string[]> = {
  "1.0": ["Corporate Strategy", "Strategic Planning"],
  "2.0": ["Product Management", "R&D Engineering"],
  "3.0": ["Marketing Ops", "Sales Ops"],
  "4.0": ["Supply Chain Planning", "Procurement"],
  "5.0": ["Service Delivery", "Service Operations"],
  "6.0": ["Customer Service", "Customer Experience"],
  "7.0": ["HR Business Partners", "Talent Acquisition"],
  "8.0": ["IT Service Management", "Enterprise Architecture"],
  "9.0": ["Treasury Ops", "FP&A", "Controllership"],
  "10.0": ["Facilities & Real Estate", "Asset Management"],
  "11.0": ["Risk & Compliance", "Internal Audit"],
  "12.0": ["Investor Relations", "Corporate Affairs"],
  "13.0": ["Business Process Management", "PMO"],
};

function topLevelCategory(hierarchyId: string): string {
  return `${hierarchyId.split(".")[0]}.0`;
}

function ownerTeamFor(hierarchyId: string): string {
  const category = topLevelCategory(hierarchyId);
  const teams = CATEGORY_TEAMS[category] ?? ["Operations"];
  const rng = rngFor(`team:${hierarchyId}`);
  return pick(teams, rng);
}

type KpiSpec = {
  metricName: string;
  unit: string;
  min: number;
  max: number;
  targetFn: (value: number, rng: () => number) => number;
};

const KPI_SPECS: KpiSpec[] = [
  {
    metricName: "Cycle time",
    unit: "days",
    min: 0.3,
    max: 8,
    targetFn: (v, _rng) => round(v * 0.85, 2),
  },
  {
    metricName: "First-pass yield",
    unit: "%",
    min: 75,
    max: 99,
    targetFn: (v, rng) => round(Math.min(v + range(rng, 2, 5), 99.5), 1),
  },
  {
    metricName: "SLA compliance",
    unit: "%",
    min: 80,
    max: 99.5,
    targetFn: (v, rng) => round(Math.min(v + range(rng, 2, 5), 99.5), 1),
  },
  {
    metricName: "Open backlog",
    unit: "count",
    min: 0,
    max: 50,
    targetFn: (v) => Math.max(0, Math.round(v * 0.7)),
  },
];

async function main() {
  const processes = await prisma.taxonomy.findMany({
    where: { level: "process" },
    orderBy: { hierarchyId: "asc" },
  });

  console.log(`Seeding ${processes.length} processes...`);

  for (const node of processes) {
    const ownerTeam = ownerTeamFor(node.hierarchyId);

    const process = await prisma.process.upsert({
      where: { sourcePcfId: node.pcfId },
      create: {
        name: node.name,
        apqcHierarchyId: node.hierarchyId,
        sourcePcfId: node.pcfId,
        ownerTeam,
        description: node.description,
      },
      update: {
        name: node.name,
        ownerTeam,
        description: node.description,
      },
    });

    // Complexity proxy: name length normalized to [0, 1].
    const complexity = Math.min(1, Math.max(0, (node.name.length - 15) / 70));

    // --- KPI metrics (4 per process, standard set) ---
    await prisma.kpiMetric.deleteMany({ where: { processId: process.id } });
    const kpiRng = rngFor(`kpi:${node.hierarchyId}`);
    for (const spec of KPI_SPECS) {
      let value: number;
      if (spec.metricName === "Cycle time") {
        // Bias toward higher complexity => longer cycle time.
        value = round(spec.min + complexity * (spec.max - spec.min) * range(kpiRng, 0.6, 1.1), 2);
        value = Math.min(spec.max, Math.max(spec.min, value));
      } else {
        value = round(range(kpiRng, spec.min, spec.max), spec.unit === "count" ? 0 : 1);
      }
      const kpiMetric = await prisma.kpiMetric.create({
        data: {
          processId: process.id,
          metricName: spec.metricName,
          value,
          unit: spec.unit,
          targetValue: spec.targetFn(value, kpiRng),
        },
      });

      const readingCount = 6 + Math.floor(range(kpiRng, 0, 3)); // 6-8 points
      const noise = Math.max(0.05, Math.abs(value) * 0.08);
      const walk = generateWalk(kpiRng, readingCount, value, value, noise);
      const now = Date.now();
      await prisma.kpiMetricReading.createMany({
        data: walk.map((v, i) => ({
          kpiMetricId: kpiMetric.id,
          periodLabel: `Week ${i + 1}`,
          value: round(v, spec.unit === "count" ? 0 : 2),
          recordedAt: new Date(now - (readingCount - 1 - i) * 7 * 24 * 60 * 60 * 1000),
        })),
      });
    }

  }

  const processCount = await prisma.process.count();
  console.log(`Processes and KPIs seeded: ${processCount}`);

  // Activities must exist before control tower metrics, since a subset of
  // metrics link to a specific process_activity.
  await seedProcessActivities();
  await seedControlTowerData();
  await seedLssTools();
}

type ReviewFrequency = "Daily" | "Weekly" | "Monthly";

/**
 * Control tower metrics, their SPC history, and reaction plans — for every
 * *seeded* process (sourcePcfId set), not just the activity-populated demo
 * ones, and NOT custom processes created through the Add Process wizard —
 * those only get control data if the person filled in the Configure step
 * themselves. Three-state mix: ~15% of processes land in breach, ~20% in
 * watch, the rest clean.
 */
async function seedControlTowerData() {
  const processes = await prisma.process.findMany({ where: { sourcePcfId: { not: null } } });
  let breachCount = 0;
  let watchCount = 0;

  for (const process of processes) {
    const ownerTeam = process.ownerTeam;
    await prisma.reactionPlan.deleteMany({ where: { processId: process.id } });
    await prisma.controlTowerMetric.deleteMany({ where: { processId: process.id } });

    // Keyed by sourcePcfId (stable across DB resets) for seeded processes, so
    // this stays fully reproducible; custom processes (sourcePcfId null, e.g.
    // several filed under the same group) fall back to their own row id to
    // avoid an RNG collision between siblings — reproducibility there is
    // secondary to not handing two different custom processes identical data.
    const ctRng = rngFor(`ct:${process.sourcePcfId ?? process.id}`);
    const roll = ctRng();
    const processState: "breach" | "watch" | "clean" = roll < 0.15 ? "breach" : roll < 0.35 ? "watch" : "clean";
    const affectedMetricIndex = Math.floor(ctRng() * 2);

    // A subset of demo processes (those with a real activity breakdown) get
    // one metric tied to a specific activity rather than the whole process.
    const activities = await prisma.processActivity.findMany({
      where: { processId: process.id, parentActivityId: null },
      orderBy: { sequenceOrder: "asc" },
    });
    const linkedActivity = activities.length > 0 && ctRng() < 0.5 ? pick(activities, ctRng) : null;

    const reviewFrequencies: ReviewFrequency[] = ["Daily", "Weekly", "Monthly"];

    type MetricSpec = {
      metricName: string;
      unit: "hrs" | "%";
      baseline: number;
      ucl: number;
      lcl: number;
      badDirection: "high" | "low"; // which side of the band is the "bad" side
      measurementMethod: string;
      triggerDescription: string;
    };

    const throughputBaseline = round(range(ctRng, 1, 48), 1);
    const qualityBaseline = round(range(ctRng, 90, 99.5), 1);

    const specs: MetricSpec[] = [
      {
        metricName: "Handoff cycle time (hrs)",
        unit: "hrs",
        baseline: throughputBaseline,
        ucl: round(throughputBaseline * 1.2, 1),
        lcl: round(throughputBaseline * 0.75, 1),
        badDirection: "high",
        measurementMethod: "Automated timestamp diff between handoff events in the process log",
        triggerDescription: "Investigate when cycle time exceeds the warning threshold for 2 consecutive readings",
      },
      {
        metricName: "Exception-free rate",
        unit: "%",
        baseline: qualityBaseline,
        ucl: round(Math.min(99.9, qualityBaseline + range(ctRng, 0.3, 1.5)), 1),
        lcl: round(Math.max(0, qualityBaseline - range(ctRng, 2, 6)), 1),
        badDirection: "low",
        measurementMethod: "Percentage of transactions completing without exception, calculated nightly",
        triggerDescription: "Investigate when the exception-free rate drops below the warning threshold for 2 consecutive readings",
      },
    ];

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const isAffected = processState !== "clean" && i === affectedMetricIndex;
      const metricState = isAffected ? processState : "clean";

      // Warning band sits halfway between baseline and the hard limit on the bad side.
      const warningUcl =
        spec.badDirection === "high" ? round(spec.baseline + (spec.ucl - spec.baseline) * 0.5, 1) : null;
      const warningLcl =
        spec.badDirection === "low" ? round(spec.baseline - (spec.baseline - spec.lcl) * 0.5, 1) : null;

      let value: number;
      if (metricState === "breach") {
        value =
          spec.badDirection === "high"
            ? round(spec.ucl * range(ctRng, 1.05, 1.3), 1)
            : round(Math.max(0, spec.lcl * range(ctRng, 0.5, 0.9)), 1);
      } else if (metricState === "watch") {
        value =
          spec.badDirection === "high"
            ? round(range(ctRng, warningUcl!, spec.ucl * 0.98), 1)
            : round(range(ctRng, spec.lcl * 1.02, warningLcl!), 1);
      } else {
        // Comfortably inside the warning band, not just inside the hard limits.
        const safeMax = spec.badDirection === "high" ? warningUcl! : spec.ucl;
        const safeMin = spec.badDirection === "low" ? warningLcl! : spec.lcl;
        value = round(range(ctRng, safeMin, safeMax), 1);
      }

      const metric = await prisma.controlTowerMetric.create({
        data: {
          processId: process.id,
          metricName: spec.metricName,
          value,
          ucl: spec.ucl,
          lcl: spec.lcl,
          warningUcl,
          warningLcl,
          processActivityId: i === 1 ? linkedActivity?.id : null,
          measurementMethod: spec.measurementMethod,
          responsibleRole: `${ownerTeam} lead`,
          reviewFrequency: pick(reviewFrequencies, ctRng),
          triggerDescription: spec.triggerDescription,
        },
      });

      const readingCount = 8 + Math.floor(range(ctRng, 0, 5)); // 8-12 points
      const noise = Math.max(0.1, Math.abs(spec.baseline) * 0.06);
      const walk = generateWalk(ctRng, readingCount, spec.baseline, value, noise);
      const now = Date.now();
      await prisma.controlMetricReading.createMany({
        data: walk.map((v, idx) => ({
          controlTowerMetricId: metric.id,
          sequenceIndex: idx,
          value: round(v, 1),
          recordedAt: new Date(now - (readingCount - 1 - idx) * 24 * 60 * 60 * 1000),
        })),
      });

      if (metricState === "breach") {
        const escalationHours = spec.unit === "hrs" ? 4 : 24;
        await prisma.reactionPlan.create({
          data: {
            processId: process.id,
            controlTowerMetricId: metric.id,
            notifyRole: `${ownerTeam} lead`,
            escalationTrigger: `${spec.metricName} breaches its control limit for 2 consecutive readings`,
            steps: [
              { text: `${ownerTeam} lead notified within 15 minutes of breach`, automated: true },
              { text: `Pull the last 10 exceptions on ${spec.metricName} for root cause`, automated: true },
              { text: `Escalate to process owner if unresolved in ${escalationHours} hours`, automated: false },
            ],
          },
        });
      }
    }

    if (processState === "breach") breachCount++;
    if (processState === "watch") watchCount++;
  }

  console.log(
    `Control tower data seeded for ${processes.length} processes: ${breachCount} breach (${round((breachCount / processes.length) * 100, 1)}%), ${watchCount} watch (${round((watchCount / processes.length) * 100, 1)}%).`,
  );
}

const LSS_TOOLS: { name: string; icon: string; promptTemplate: string }[] = [
  {
    name: "Generate process map",
    icon: "🧭",
    promptTemplate: "Generate a BPMN process map for {process_name}.",
  },
  {
    name: "SIPOC",
    icon: "🗺️",
    promptTemplate: "Draft a SIPOC (Suppliers, Inputs, Process, Outputs, Customers) for {process_name}.",
  },
  {
    name: "5 Whys",
    icon: "❓",
    promptTemplate: "Run a 5 Whys root-cause analysis on why {metric_name} is out of control for {process_name}.",
  },
  {
    name: "Fishbone / Ishikawa",
    icon: "🐟",
    promptTemplate: "Build a fishbone diagram of likely causes for the {metric_name} deviation in {process_name}.",
  },
  {
    name: "FMEA",
    icon: "⚠️",
    promptTemplate: "Draft a Failure Mode and Effects Analysis (FMEA) for {process_name}, focused on {metric_name}.",
  },
  {
    name: "Value Stream Map",
    icon: "🔄",
    promptTemplate: "Sketch a value stream map for {process_name}, highlighting where {metric_name} could improve.",
  },
  {
    name: "DMAIC Charter",
    icon: "📋",
    promptTemplate: "Draft a DMAIC project charter to improve {metric_name} in {process_name}.",
  },
  {
    name: "Control Plan",
    icon: "🎛️",
    promptTemplate: "Propose a control plan to keep {metric_name} in control for {process_name}.",
  },
  {
    name: "A3 Report",
    icon: "📄",
    promptTemplate: "Draft an A3 problem-solving report for the {metric_name} issue in {process_name}.",
  },
];

async function seedLssTools() {
  for (const tool of LSS_TOOLS) {
    const existing = await prisma.lssTool.findFirst({ where: { name: tool.name } });
    if (existing) {
      await prisma.lssTool.update({ where: { id: existing.id }, data: tool });
    } else {
      await prisma.lssTool.create({ data: tool });
    }
  }
  console.log(`LSS tools seeded: ${LSS_TOOLS.length}`);
}

const DEMO_PROCESS_COUNT = 5;

/**
 * Populates process_activities for a handful of seeded processes, pulling real
 * activity/task nodes from the taxonomy tree under each process's own hierarchy
 * path — so "Generate process map" has real, non-generic data to demo.
 */
async function seedProcessActivities() {
  const activityNodes = await prisma.taxonomy.findMany({ where: { level: "activity" } });
  const taskNodes = await prisma.taxonomy.findMany({ where: { level: "task" } });

  const activitiesByProcess = new Map<string, typeof activityNodes>();
  for (const a of activityNodes) {
    if (!a.parentHierarchyId) continue;
    const list = activitiesByProcess.get(a.parentHierarchyId) ?? [];
    list.push(a);
    activitiesByProcess.set(a.parentHierarchyId, list);
  }

  const tasksByActivity = new Map<string, typeof taskNodes>();
  for (const t of taskNodes) {
    if (!t.parentHierarchyId) continue;
    const list = tasksByActivity.get(t.parentHierarchyId) ?? [];
    list.push(t);
    tasksByActivity.set(t.parentHierarchyId, list);
  }

  // Pick the processes with the richest real activity breakdowns, for the best demo.
  const candidates = [...activitiesByProcess.entries()]
    .map(([processHierarchyId, activities]) => ({ processHierarchyId, count: activities.length }))
    .sort((a, b) => b.count - a.count || compareHierarchyIds(a.processHierarchyId, b.processHierarchyId))
    .slice(0, DEMO_PROCESS_COUNT);

  for (const { processHierarchyId } of candidates) {
    const process = await prisma.process.findFirst({ where: { apqcHierarchyId: processHierarchyId } });
    if (!process) continue;

    await prisma.processActivity.deleteMany({ where: { processId: process.id } });

    const activities = (activitiesByProcess.get(processHierarchyId) ?? []).slice().sort((a, b) =>
      compareHierarchyIds(a.hierarchyId, b.hierarchyId),
    );

    const topLevelForDiagram: FlowNode[] = [];

    for (let i = 0; i < activities.length; i++) {
      const activityNode = activities[i];
      const createdActivity = await prisma.processActivity.create({
        data: {
          processId: process.id,
          elementType: "user_task",
          name: activityNode.name,
          sequenceOrder: i,
          apqcHierarchyId: activityNode.hierarchyId,
        },
      });
      topLevelForDiagram.push({
        id: createdActivity.id,
        name: createdActivity.name,
        elementType: "user_task",
        sequenceOrder: i,
        branchLabels: [],
      });

      const tasks = (tasksByActivity.get(activityNode.hierarchyId) ?? []).slice().sort((a, b) =>
        compareHierarchyIds(a.hierarchyId, b.hierarchyId),
      );

      for (let j = 0; j < tasks.length; j++) {
        await prisma.processActivity.create({
          data: {
            processId: process.id,
            parentActivityId: createdActivity.id,
            elementType: "manual_task",
            name: tasks[j].name,
            sequenceOrder: j,
            apqcHierarchyId: tasks[j].hierarchyId,
          },
        });
      }
    }

    await pregenerateDiagram(process.id, process.name, topLevelForDiagram);
  }

  console.log(
    `Process activities seeded for ${candidates.length} auto-picked demo processes: ${candidates
      .map((c) => c.processHierarchyId)
      .join(", ")}`,
  );

  await seedBranchingDemoProcess();
}

/** Pre-generates and caches the BPMN map for a demo process, so the chat feels instant. */
async function pregenerateDiagram(processId: string, processName: string, nodes: FlowNode[]) {
  const { generateBpmnXml, hashActivities } = await import("../src/lib/bpmn");
  const bpmnXml = await generateBpmnXml(processName, nodes);
  const generatedFrom = hashActivities(nodes);

  await prisma.processDiagram.deleteMany({ where: { processId } });
  await prisma.processDiagram.create({ data: { processId, bpmnXml, generatedFrom } });
}

/**
 * Seeds "Select suppliers and develop/maintain contracts" (4.2.3) with the rich,
 * hand-authored activity breakdown exercising every element type except
 * parallel_gateway (deliberately deferred — see README) — the demo centerpiece
 * for approval-gateway branching, decision tasks, timers, and system tasks.
 */
async function seedBranchingDemoProcess() {
  const process = await prisma.process.findFirst({ where: { apqcHierarchyId: "4.2.3" } });
  if (!process) {
    console.warn("Branching demo process (4.2.3) not found — skipping.");
    return;
  }

  await prisma.processActivity.deleteMany({ where: { processId: process.id } });

  const rows: {
    localId: string;
    sequenceOrder: number;
    elementType: FlowNode["elementType"];
    name: string;
    approverRole?: string;
    systemRef?: string;
    decisionRef?: string;
    branchLabels?: string[];
    branchOfLocalId?: string;
    branchLabel?: string;
  }[] = [
    { localId: "sq-1", sequenceOrder: 1, elementType: "start_event", name: "Qualification request received" },
    { localId: "sq-2", sequenceOrder: 2, elementType: "system_task", name: "Pull vendor tax & compliance documents", systemRef: "Vendor portal API" },
    { localId: "sq-3", sequenceOrder: 3, elementType: "decision_task", name: "Score supplier risk tier", decisionRef: "Supplier risk scoring DMN" },
    { localId: "sq-4", sequenceOrder: 4, elementType: "approval_gateway", name: "Risk tier acceptable?", branchLabels: ["Acceptable", "High risk"] },
    { localId: "sq-5", sequenceOrder: 5, elementType: "user_task", name: "Certify and validate supplier", approverRole: "Vendor ops analyst", branchOfLocalId: "sq-4", branchLabel: "Acceptable" },
    { localId: "sq-6", sequenceOrder: 6, elementType: "user_task", name: "Compliance officer manual review", approverRole: "Compliance officer", branchOfLocalId: "sq-4", branchLabel: "High risk" },
    { localId: "sq-7", sequenceOrder: 7, elementType: "end_event", name: "Supplier rejected — pending compliance sign-off" },
    { localId: "sq-8", sequenceOrder: 8, elementType: "timer_event", name: "Await signed contract (5 business day SLA)" },
    { localId: "sq-9", sequenceOrder: 9, elementType: "manual_task", name: "Collect wet-ink signature where required by jurisdiction" },
    { localId: "sq-10", sequenceOrder: 10, elementType: "system_task", name: "Activate supplier in ERP", systemRef: "SAP" },
    { localId: "sq-11", sequenceOrder: 11, elementType: "end_event", name: "Supplier active" },
  ];

  const localIdToDbId = new Map<string, string>();
  const pendingBranches: { dbId: string; branchOfLocalId: string }[] = [];

  for (const row of rows) {
    const created = await prisma.processActivity.create({
      data: {
        processId: process.id,
        sequenceOrder: row.sequenceOrder,
        name: row.name,
        elementType: row.elementType,
        approverRole: row.approverRole ?? null,
        systemRef: row.systemRef ?? null,
        decisionRef: row.decisionRef ?? null,
        branchLabels: row.branchLabels ?? [],
        branchLabel: row.branchLabel ?? null,
      },
    });
    localIdToDbId.set(row.localId, created.id);
    if (row.branchOfLocalId) pendingBranches.push({ dbId: created.id, branchOfLocalId: row.branchOfLocalId });
  }

  for (const { dbId, branchOfLocalId } of pendingBranches) {
    const branchOfId = localIdToDbId.get(branchOfLocalId);
    if (!branchOfId) continue;
    await prisma.processActivity.update({ where: { id: dbId }, data: { branchOfId } });
  }

  const flowNodes: FlowNode[] = rows.map((row) => ({
    id: localIdToDbId.get(row.localId)!,
    name: row.name,
    elementType: row.elementType,
    sequenceOrder: row.sequenceOrder,
    approverRole: row.approverRole,
    systemRef: row.systemRef,
    decisionRef: row.decisionRef,
    branchLabels: row.branchLabels ?? [],
    branchOfId: row.branchOfLocalId ? localIdToDbId.get(row.branchOfLocalId) : undefined,
    branchLabel: row.branchLabel,
  }));

  await pregenerateDiagram(process.id, process.name, flowNodes);
  console.log(`Branching demo process seeded: ${process.name} (4.2.3), ${rows.length} nodes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
