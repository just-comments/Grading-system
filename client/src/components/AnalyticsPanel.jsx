import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "../lib/helpers";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPanel({ results }) {
  if (!results) {
    return null;
  }

  const { statistics, analytics } = results;
  const scoreRange = `${formatNumber(analytics.boxPlot.min)} - ${formatNumber(analytics.boxPlot.max)}`;

  return (
    <section className="section-divider py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-10">
        <div className="panel">
          <div className="mb-6 flex items-center gap-3">
            <BarChart3 size={16} className="text-[#9db5ec]" />
            <p className="section-kicker">05 · Analytics</p>
          </div>
          <div className="grid border border-white/10 md:grid-cols-3">
            <MetricCell label="Mean" value={formatNumber(statistics.mean)} />
            <MetricCell label="Median" value={formatNumber(statistics.median)} />
            <MetricCell label="Std Dev" value={formatNumber(statistics.standardDeviation)} />
            <MetricCell label="Min" value={formatNumber(analytics.boxPlot.min)} />
            <MetricCell label="Max" value={formatNumber(analytics.boxPlot.max)} />
            <MetricCell label="N" value={results.rows.length} />
          </div>
        </div>

        <ChartCard title="Score Histogram" meta={`range ${scoreRange}`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1f" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#98a2b3" }} interval={0} angle={0} />
              <YAxis allowDecimals={false} tick={{ fill: "#98a2b3" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f8cff" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Grade Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1f" vertical={false} />
              <XAxis dataKey="grade" tick={{ fill: "#f8fafc", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#98a2b3" }} />
              <Tooltip />
              <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                {analytics.gradeDistribution.map((entry) => (
                  <Cell
                    key={entry.grade}
                    fill={
                      {
                        A: "#14b8a6",
                        B: "#38bdf8",
                        C: "#f59e0b",
                        D: "#fb7185",
                        F: "#ef4444",
                      }[entry.grade] || "#64748b"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Box Plot" meta="min · q1 · median · q3 · max">
          <BoxPlot boxPlot={analytics.boxPlot} />
        </ChartCard>
      </div>
    </section>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="border-b border-r border-white/10 p-8">
      <p className="font-mono text-sm uppercase tracking-[0.28em] text-[#a5b4d6]">{label}</p>
      <p className="mt-4 text-5xl font-bold tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, meta, children }) {
  return (
    <div className="panel">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-mono text-sm uppercase tracking-[0.28em] text-[#a5b4d6]">{title}</h3>
        {meta ? <p className="font-mono text-sm uppercase tracking-[0.22em] text-slate-400">{meta}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function BoxPlot({ boxPlot }) {
  const { min, q1, median, q3, max } = boxPlot;
  const width = 440;
  const height = 180;
  const padding = 24;
  const scale = (value) => {
    const safeRange = max - min || 1;
    return padding + ((value - min) / safeRange) * (width - padding * 2);
  };

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        <line x1={scale(min)} x2={scale(max)} y1="90" y2="90" stroke="#ffffff88" strokeWidth="2" />
        <line x1={scale(min)} x2={scale(min)} y1="70" y2="110" stroke="#ffffffcc" strokeWidth="2" />
        <line x1={scale(max)} x2={scale(max)} y1="70" y2="110" stroke="#ffffffcc" strokeWidth="2" />
        <rect x={scale(q1)} y="56" width={Math.max(scale(q3) - scale(q1), 12)} height="68" fill="#12254a" stroke="#4f8cff" strokeWidth="3" />
        <line x1={scale(median)} x2={scale(median)} y1="56" y2="124" stroke="#8fb7ff" strokeWidth="3" />
        {[min, q1, median, q3, max].map((value, index) => (
          <g key={`${value}-${index}`}>
            <circle cx={scale(value)} cy="140" r="4" fill="#4f8cff" />
            <text x={scale(value)} y="164" textAnchor="middle" className="fill-slate-500 text-[11px]">
              {formatNumber(value)}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-5 gap-2 border-t border-white/10 pt-6 text-center">
        <MetricTick label="Min" value={formatNumber(min)} />
        <MetricTick label="Q1" value={formatNumber(q1)} />
        <MetricTick label="Median" value={formatNumber(median)} />
        <MetricTick label="Q3" value={formatNumber(q3)} />
        <MetricTick label="Max" value={formatNumber(max)} />
      </div>
    </div>
  );
}

function MetricTick({ label, value }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#a5b4d6]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
