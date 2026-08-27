import { createHash } from "crypto";
// @ts-expect-error — bpmn-moddle's types live under the "bpmn-moddle/types" subpath,
// which TS's bundler resolution doesn't pick up for a plain "bpmn-moddle" import.
import { BpmnModdle } from "bpmn-moddle";
// @ts-expect-error — bpmn-auto-layout ships no type declarations.
import { layoutProcess } from "bpmn-auto-layout";
import CAMUNDA_DESCRIPTOR from "camunda-bpmn-moddle/resources/camunda.json";
import type { ElementType } from "@prisma/client";

export type FlowNode = {
  id: string;
  name: string;
  elementType: ElementType;
  sequenceOrder: number;
  approverRole?: string | null;
  systemRef?: string | null;
  decisionRef?: string | null;
  branchLabels: string[];
  branchOfId?: string | null;
  branchLabel?: string | null;
};

type Edge = { id: string; sourceId: string; targetId: string; label?: string | null };

/**
 * Computes the sequence-flow graph for a set of activities. This is the
 * "structure step" — deliberately NOT an LLM call (see README), but it
 * implements exactly the flow semantics an LLM would be prompted to produce:
 * linear by default, forking at approval_gateway nodes into named branches,
 * multiple branches allowed to reach their own independent end events.
 *
 * Nodes are grouped into "lanes" — one per branch. A node with branchOfId
 * starts a new lane off that gateway. A node without one continues whichever
 * lane is currently active; if that lane already terminated at an end_event
 * (which cannot have outgoing flows), the most recently opened still-open
 * lane is resumed instead — this is what lets a dead-ended "rejected" branch
 * hand control back to the still-open "approved" branch's next step.
 */
export function buildFlow(nodes: FlowNode[]): { allNodes: FlowNode[]; edges: Edge[] } {
  const sorted = [...nodes].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  for (const n of sorted) {
    if (n.elementType === "approval_gateway" && n.branchLabels.length !== 2) {
      throw new Error(
        `BPMN structure error: approval_gateway "${n.name}" must have exactly 2 branchLabels, got ${n.branchLabels.length}.`,
      );
    }
  }

  let startNode = sorted.find((n) => n.elementType === "start_event") ?? null;
  const explicitStart = startNode !== null;
  if (!startNode) {
    startNode = { id: "synthetic_start", name: "Start", elementType: "start_event", sequenceOrder: -1, branchLabels: [] };
  }

  const lanes = new Map<string, { tipId: string; closed: boolean }>();
  const MAIN = "main";
  lanes.set(MAIN, { tipId: startNode.id, closed: false });
  let activeLaneKey = MAIN;

  const edges: Edge[] = [];
  let edgeCounter = 0;
  const nextEdgeId = () => `flow_${edgeCounter++}`;

  const toProcess = sorted.filter((n) => n !== startNode);

  for (const node of toProcess) {
    if (node.branchOfId) {
      const laneKey = `${node.branchOfId}:${node.branchLabel ?? ""}`;
      if (!lanes.has(laneKey)) {
        lanes.set(laneKey, { tipId: node.branchOfId, closed: false });
      }
      // Whichever lane's tip WAS this gateway is now superseded by branching —
      // its linear continuation is over, so it must not linger as a phantom
      // "still open" lane that later picks up a spurious extra edge out of
      // the gateway when we patch dangling lanes to a synthetic end event.
      for (const [key, l] of lanes) {
        if (key !== laneKey && l.tipId === node.branchOfId) l.closed = true;
      }
      const lane = lanes.get(laneKey)!;
      edges.push({ id: nextEdgeId(), sourceId: lane.tipId, targetId: node.id, label: node.branchLabel });
      lane.tipId = node.id;
      lane.closed = node.elementType === "end_event";
      activeLaneKey = laneKey;
      continue;
    }

    let lane = lanes.get(activeLaneKey);
    if (!lane || lane.closed) {
      const openEntry = [...lanes.entries()].reverse().find(([key, l]) => key !== activeLaneKey && !l.closed);
      if (openEntry) {
        activeLaneKey = openEntry[0];
        lane = openEntry[1];
      } else {
        // No open lane anywhere (malformed input) — reopen the main trunk from start
        // rather than emitting a node with no incoming flow.
        activeLaneKey = MAIN;
        lanes.set(MAIN, { tipId: startNode.id, closed: false });
        lane = lanes.get(MAIN)!;
      }
    }

    edges.push({ id: nextEdgeId(), sourceId: lane.tipId, targetId: node.id });
    lane.tipId = node.id;
    lane.closed = node.elementType === "end_event";
  }

  // Anything still open needs somewhere to go — synthesize a shared end event.
  const dangling = [...lanes.values()].filter((l) => !l.closed);
  const allNodes = [...(explicitStart ? [] : [startNode]), ...sorted];
  if (dangling.length > 0) {
    const syntheticEnd: FlowNode = {
      id: "synthetic_end",
      name: "End",
      elementType: "end_event",
      sequenceOrder: Infinity,
      branchLabels: [],
    };
    allNodes.push(syntheticEnd);
    for (const lane of dangling) {
      edges.push({ id: nextEdgeId(), sourceId: lane.tipId, targetId: syntheticEnd.id });
    }
  }

  for (const node of allNodes) {
    if (node.elementType === "approval_gateway") {
      const out = edges.filter((e) => e.sourceId === node.id);
      if (out.length !== 2) {
        throw new Error(
          `BPMN structure error: approval_gateway "${node.name}" resolved to ${out.length} outgoing flow(s), expected 2.`,
        );
      }
    }
  }

  return { allNodes, edges };
}

function createBpmnElement(moddle: InstanceType<typeof BpmnModdle>, node: FlowNode) {
  switch (node.elementType) {
    case "start_event":
      return moddle.create("bpmn:StartEvent", { id: node.id, name: node.name });
    case "end_event":
      return moddle.create("bpmn:EndEvent", { id: node.id, name: node.name });
    case "user_task": {
      const props: Record<string, unknown> = { id: node.id, name: node.name };
      if (node.approverRole) props["camunda:candidateGroups"] = node.approverRole;
      return moddle.create("bpmn:UserTask", props);
    }
    case "manual_task":
      return moddle.create("bpmn:ManualTask", { id: node.id, name: node.name });
    case "system_task": {
      const task = moddle.create("bpmn:ServiceTask", { id: node.id, name: node.name });
      if (node.systemRef) {
        const doc = moddle.create("bpmn:Documentation", { text: node.systemRef });
        task.set("documentation", [doc]);
      }
      return task;
    }
    case "decision_task": {
      const props: Record<string, unknown> = { id: node.id, name: node.name };
      if (node.decisionRef) props["camunda:decisionRef"] = node.decisionRef;
      return moddle.create("bpmn:BusinessRuleTask", props);
    }
    case "approval_gateway":
      return moddle.create("bpmn:ExclusiveGateway", { id: node.id, name: node.name });
    case "parallel_gateway":
      return moddle.create("bpmn:ParallelGateway", { id: node.id, name: node.name });
    case "timer_event": {
      const timerDef = moddle.create("bpmn:TimerEventDefinition", {});
      return moddle.create("bpmn:IntermediateCatchEvent", {
        id: node.id,
        name: node.name,
        eventDefinitions: [timerDef],
      });
    }
    default:
      throw new Error(`Unsupported element type: ${node.elementType}`);
  }
}

/**
 * Turns a process's configured activities into a valid, laid-out BPMN 2.0
 * diagram, respecting element_type (real BPMN element per node) and
 * branchOf/branchLabel (approval_gateway forks). See buildFlow() for the
 * structure step and README for why this is a local heuristic, not an LLM call.
 */
export async function generateBpmnXml(processName: string, nodes: FlowNode[]): Promise<string> {
  const { allNodes, edges } = buildFlow(nodes);

  const moddle = new BpmnModdle({ camunda: CAMUNDA_DESCRIPTOR });

  const bpmnProcess = moddle.create("bpmn:Process", {
    id: "Process_1",
    name: processName,
    isExecutable: false,
  });

  const elementsById = new Map<string, ReturnType<typeof createBpmnElement>>();
  for (const node of allNodes) {
    elementsById.set(node.id, createBpmnElement(moddle, node));
  }

  const flowElements = edges.map((e) =>
    moddle.create("bpmn:SequenceFlow", {
      id: e.id,
      name: e.label || undefined,
      sourceRef: elementsById.get(e.sourceId),
      targetRef: elementsById.get(e.targetId),
    }),
  );

  // See the note in the previous version of this file / commit history: plain
  // bpmn-moddle does not back-populate incoming/outgoing on flow nodes just
  // because a sequenceFlow references them, but bpmn-auto-layout's traversal
  // depends on exactly those arrays to walk the graph. Populate by hand.
  for (const node of allNodes) {
    const el = elementsById.get(node.id)!;
    el.incoming = flowElements.filter((f: { targetRef: unknown }) => f.targetRef === el);
    el.outgoing = flowElements.filter((f: { sourceRef: unknown }) => f.sourceRef === el);
  }

  bpmnProcess.get("flowElements").push(...elementsById.values(), ...flowElements);

  const attachedFlowCount = bpmnProcess
    .get("flowElements")
    .filter((el: { $type: string }) => el.$type === "bpmn:SequenceFlow").length;
  if (attachedFlowCount !== flowElements.length) {
    throw new Error(
      `BPMN build error: created ${flowElements.length} sequence flows but only ${attachedFlowCount} were attached to the process's flowElements.`,
    );
  }

  const definitions = moddle.create("bpmn:Definitions", {
    targetNamespace: "http://leanify.local/bpmn",
    rootElements: [bpmnProcess],
  });

  const { xml: semanticXml } = await moddle.toXML(definitions, { format: true });
  const laidOutXml: string = await layoutProcess(semanticXml);

  const flowElementCount = (semanticXml.match(/<bpmn:sequenceFlow[\s/]/g) || []).length;
  const edgeCount = (laidOutXml.match(/<bpmndi:BPMNEdge[\s>]/g) || []).length;
  if (edgeCount !== flowElementCount) {
    throw new Error(
      `BPMN layout error: ${flowElementCount} sequence flows went into auto-layout but only ${edgeCount} edges came out.`,
    );
  }

  return laidOutXml;
}

/** Hash of the node set used to build a cached diagram, to detect staleness. */
export function hashActivities(nodes: FlowNode[]): string {
  const sorted = [...nodes].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const fingerprint = sorted
    .map((n) =>
      [
        n.id,
        n.sequenceOrder,
        n.name,
        n.elementType,
        n.approverRole ?? "",
        n.systemRef ?? "",
        n.decisionRef ?? "",
        (n.branchLabels ?? []).join(","),
        n.branchOfId ?? "",
        n.branchLabel ?? "",
      ].join(":"),
    )
    .join("|");
  return createHash("sha256").update(fingerprint).digest("hex");
}
