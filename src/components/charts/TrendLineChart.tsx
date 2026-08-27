"use client";

type ReferenceLine = { value: number; color: string; dashed?: boolean; label?: string };

/** A minimal SVG line chart — no charting library needed for this shape. */
export default function TrendLineChart({
  points,
  labels,
  referenceLines = [],
  lineColor = "#0f9488",
  height = 160,
  unit = "",
}: {
  points: number[];
  labels: string[];
  referenceLines?: ReferenceLine[];
  lineColor?: string;
  height?: number;
  unit?: string;
}) {
  if (points.length === 0) {
    return <div className="flex h-40 items-center justify-center text-xs text-ink-400">No history yet.</div>;
  }

  const width = 600;
  const padding = 28;
  const allValues = [...points, ...referenceLines.map((r) => r.value)];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;
  const pad = span * 0.15;
  const scaledMin = min - pad;
  const scaledMax = max + pad;
  const scaledSpan = scaledMax - scaledMin || 1;

  const x = (i: number) => padding + (i / Math.max(1, points.length - 1)) * (width - padding * 2);
  const y = (v: number) => height - padding - ((v - scaledMin) / scaledSpan) * (height - padding * 2);

  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {referenceLines.map((ref, i) => (
        <g key={i}>
          <line
            x1={padding}
            x2={width - padding}
            y1={y(ref.value)}
            y2={y(ref.value)}
            stroke={ref.color}
            strokeWidth={1}
            strokeDasharray={ref.dashed ? "4 3" : undefined}
          />
          {ref.label && (
            <text x={width - padding} y={y(ref.value) - 3} textAnchor="end" className="fill-current text-[9px]" fill={ref.color}>
              {ref.label}
            </text>
          )}
        </g>
      ))}
      <path d={path} fill="none" stroke={lineColor} strokeWidth={2} />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={lineColor} />
      ))}
      {labels.map((l, i) =>
        i === 0 || i === labels.length - 1 ? (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : "end"} className="fill-ink-400 text-[9px]">
            {l}
          </text>
        ) : null,
      )}
      <text x={padding} y={12} className="fill-ink-400 text-[9px]">
        {points[points.length - 1]}
        {unit}
      </text>
    </svg>
  );
}
