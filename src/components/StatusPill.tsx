import { ProcessStatus, STATUS_LABEL } from "@/lib/status";

const STYLES: Record<ProcessStatus, string> = {
  out_of_control: "bg-coral-50 text-coral-600 ring-1 ring-inset ring-coral-100",
  in_control: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100",
  not_yet_monitored: "bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200",
};

const DOT: Record<ProcessStatus, string> = {
  out_of_control: "bg-coral-500",
  in_control: "bg-teal-500",
  not_yet_monitored: "bg-ink-400",
};

export default function StatusPill({ status }: { status: ProcessStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
