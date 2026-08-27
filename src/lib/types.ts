import type { ProcessStatus, MetricStatus, ReactionStep } from "@/lib/status";

export type KpiReadingDto = { periodLabel: string; value: number; recordedAt: string };

export type KpiMetricDto = {
  id: string;
  metricName: string;
  value: number;
  unit: string;
  targetValue: number;
  readings: KpiReadingDto[];
};

export type ControlReadingDto = { sequenceIndex: number; value: number; recordedAt: string };

export type ReactionPlanDto = {
  id: string;
  notifyRole: string;
  escalationTrigger: string;
  steps: ReactionStep[];
  automatedCount: number;
  totalSteps: number;
};

export type ControlTowerMetricDto = {
  id: string;
  metricName: string;
  value: number;
  ucl: number;
  lcl: number | null;
  warningUcl: number | null;
  warningLcl: number | null;
  status: MetricStatus;
  activityCode: string | null;
  activityName: string | null;
  measurementMethod: string | null;
  responsibleRole: string | null;
  reviewFrequency: string | null;
  triggerDescription: string | null;
  readings: ControlReadingDto[];
  reactionPlan: ReactionPlanDto | null;
};

export type ControlSummary = { breach: number; watch: number; inControl: number };

export type ProcessDetail = {
  id: string;
  name: string;
  description: string;
  ownerTeam: string;
  apqcHierarchyId: string;
  taxonomy: { hierarchyId: string; name: string; description: string };
  status: ProcessStatus;
  kpiMetrics: KpiMetricDto[];
  controlTowerMetrics: ControlTowerMetricDto[];
  controlSummary: ControlSummary;
};
