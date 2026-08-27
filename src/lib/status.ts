export type ProcessStatus = "out_of_control" | "in_control" | "not_yet_monitored";

export type ControlMetricLike = {
  value: number;
  ucl: number;
  lcl: number | null;
};

export function isMetricInControl(metric: ControlMetricLike): boolean {
  const withinUpper = metric.value <= metric.ucl;
  const withinLower = metric.lcl === null ? true : metric.value >= metric.lcl;
  return withinUpper && withinLower;
}

export function computeProcessStatus(controlMetrics: ControlMetricLike[]): ProcessStatus {
  if (controlMetrics.length === 0) return "not_yet_monitored";
  return controlMetrics.every(isMetricInControl) ? "in_control" : "out_of_control";
}

export const STATUS_LABEL: Record<ProcessStatus, string> = {
  out_of_control: "Out of control",
  in_control: "In control",
  not_yet_monitored: "Not yet monitored",
};

/** Per-metric three-state status, used only on the Dashboard's Control Tower tab. */
export type MetricStatus = "breach" | "watch" | "in_control";

export type MetricWithWarningBand = ControlMetricLike & {
  warningUcl: number | null;
  warningLcl: number | null;
};

export function computeMetricStatus(metric: MetricWithWarningBand): MetricStatus {
  if (!isMetricInControl(metric)) return "breach";

  const inWarningUpper = metric.warningUcl !== null && metric.value > metric.warningUcl;
  const inWarningLower = metric.warningLcl !== null && metric.value < metric.warningLcl;
  if (inWarningUpper || inWarningLower) return "watch";

  return "in_control";
}

export const METRIC_STATUS_LABEL: Record<MetricStatus, string> = {
  breach: "Breach",
  watch: "Watch",
  in_control: "In control",
};

export type ReactionStep = { text: string; automated: boolean };
