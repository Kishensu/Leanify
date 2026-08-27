import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isMetricInControl } from "@/lib/status";

function dataSummary(process: {
  name: string;
  kpiMetrics: { metricName: string; value: number; unit: string; targetValue: number }[];
  controlTowerMetrics: { metricName: string; value: number; ucl: number; lcl: number | null }[];
}): string {
  const lines: string[] = [`Scoped to **${process.name}**. Current data:`];

  for (const k of process.kpiMetrics) {
    const gap = k.value - k.targetValue;
    const dir = gap > 0 ? "above" : "at/below";
    lines.push(`- ${k.metricName}: ${k.value}${k.unit === "%" ? "%" : ` ${k.unit}`} (target ${k.targetValue}${k.unit === "%" ? "%" : ` ${k.unit}`}, ${dir} target)`);
  }

  const breaches = process.controlTowerMetrics.filter((m) => !isMetricInControl(m));
  if (breaches.length) {
    lines.push(`- Out of control: ${breaches.map((b) => `${b.metricName} (${b.value}, limits ${b.lcl ?? "0"}-${b.ucl})`).join(", ")}`);
  } else if (process.controlTowerMetrics.length) {
    lines.push(`- All control tower metrics currently within limits.`);
  }

  return lines.join("\n");
}

function toolResponse(toolName: string, processName: string, metricName: string): string {
  const p = processName || "this process";
  const m = metricName || "the flagged metric";

  switch (toolName) {
    case "SIPOC":
      return [
        `**SIPOC — ${p}**`,
        `Suppliers: upstream teams and systems feeding ${p}`,
        `Inputs: requests, data, and materials ${p} consumes`,
        `Process: the core steps of ${p}`,
        `Outputs: what ${p} produces for its customers`,
        `Customers: downstream teams or external customers relying on ${p}`,
      ].join("\n");
    case "5 Whys":
      return [
        `**5 Whys — why is ${m} off target on ${p}?**`,
        `1. Why? — Identify the immediate cause visible in the data.`,
        `2. Why? — Trace it to the upstream step or handoff.`,
        `3. Why? — Check whether it's a resourcing, training, or system gap.`,
        `4. Why? — Determine whether the root process design allows this failure mode.`,
        `5. Why? — Confirm the systemic root cause and the fix that prevents recurrence.`,
      ].join("\n");
    case "Fishbone / Ishikawa":
      return [
        `**Fishbone — ${m} on ${p}**`,
        `People: training gaps, staffing levels`,
        `Process: handoffs, approval steps, rework loops`,
        `Systems: tooling, automation, data quality`,
        `Environment: seasonality, upstream dependencies`,
      ].join("\n");
    case "FMEA":
      return [
        `**FMEA — ${p}**`,
        `Failure mode: ${m} exceeding its control limit`,
        `Effect: downstream delay/quality impact on customers of ${p}`,
        `Cause: (fill in from root-cause analysis)`,
        `Detection: current control tower monitoring`,
        `Recommended action: tighten the reaction plan trigger and assign an owner`,
      ].join("\n");
    case "Value Stream Map":
      return `**Value stream map — ${p}**\nMap each step of ${p} with cycle time and wait time; flag the step nearest the ${m} breach as the likely bottleneck.`;
    case "DMAIC Charter":
      return [
        `**DMAIC Charter — ${p}**`,
        `Define: improve ${m} for ${p}`,
        `Measure: current vs. target from the KPI dashboard`,
        `Analyze: root cause of the ${m} deviation`,
        `Improve: countermeasure and owner`,
        `Control: control tower threshold + reaction plan`,
      ].join("\n");
    case "Control Plan":
      return `**Control plan — ${p}**\nMonitor ${m} against its UCL/LCL; trigger the existing reaction plan on breach, and review the control limits quarterly.`;
    case "A3 Report":
      return `**A3 — ${p}**\nBackground, current condition (${m} data), goal, root cause, countermeasures, and follow-up plan.`;
    default:
      return `Here's what I can do for ${p}: SIPOC, 5 Whys, Fishbone, FMEA, Value Stream Map, DMAIC Charter, Control Plan, or A3 — tap a tool card or ask directly.`;
  }
}

export async function POST(req: NextRequest) {
  const { message, processId } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  let process = null;
  if (processId) {
    process = await prisma.process.findUnique({
      where: { id: processId },
      include: { kpiMetrics: true, controlTowerMetrics: true },
    });
  }

  const tools = await prisma.lssTool.findMany();
  const matchedTool = tools.find((t) => message.toLowerCase().includes(t.name.toLowerCase()));

  const breachedMetric = process?.controlTowerMetrics.find((m) => !isMetricInControl(m));
  const metricName = breachedMetric?.metricName ?? process?.kpiMetrics[0]?.metricName ?? "";

  const parts: string[] = [];
  if (process) parts.push(dataSummary(process));
  parts.push(toolResponse(matchedTool?.name ?? "", process?.name ?? "", metricName));

  return NextResponse.json({ reply: parts.join("\n\n") });
}
