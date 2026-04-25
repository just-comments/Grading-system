import { Download } from "lucide-react";
import { displayCell, formatNumber } from "../lib/helpers";

export default function ResultsTable({ dataset, results, onExport, boundaries }) {
  if (!dataset || !results) {
    return null;
  }

  const leadingColumns = [dataset.nameColumn];
  if (dataset.groupColumn) {
    leadingColumns.push(dataset.groupColumn);
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-kicker">06 · Results</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">Final graded output</h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Export the computed table once the weight distribution and grading boundaries look right.
              </p>
            </div>
            <button className="btn-primary gap-2" onClick={onExport} type="button">
              <Download size={16} />
              Download CSV
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {boundaries.map((boundary) => (
              <div key={boundary.grade} className="border border-white/10 bg-[#0b0d11] px-4 py-2 text-sm text-slate-200">
                <span className="font-semibold text-white">{boundary.grade}</span> {">="} {formatNumber(boundary.min)}
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-b from-white/10 to-white/[0.03]">
            <tr>
              {leadingColumns.map((column) => (
                <th key={column} className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-slate-300">
                  {column}
                </th>
              ))}
              {dataset.numericColumns.map((column) => (
                <th key={column} className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-slate-300">
                  {column}
                </th>
              ))}
              <th className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-slate-300">Weighted Score</th>
              <th className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-slate-300">Group Score</th>
              <th className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-slate-300">Grade</th>
              <th className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-slate-300">Missing Fields</th>
            </tr>
              </thead>
              <tbody>
            {results.rows.map((row, index) => (
                <tr key={index} className="border-b border-white/[0.06] last:border-b-0">
                {leadingColumns.map((column) => (
                    <td key={`${index}-${column}`} className="whitespace-nowrap px-4 py-4 text-white">
                    {displayCell(row[column])}
                  </td>
                ))}
                {dataset.numericColumns.map((column) => (
                    <td key={`${index}-${column}`} className="whitespace-nowrap px-4 py-4 text-slate-300">
                    {displayCell(row[column])}
                  </td>
                ))}
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-white">{formatNumber(row.weightedScore)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-300">{row.groupScore == null ? "--" : formatNumber(row.groupScore)}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="border border-[#4f8cff] bg-[#0f1728] px-3 py-1 text-xs font-semibold text-white">
                    {row.finalGrade}
                  </span>
                </td>
                  <td className="px-4 py-4 text-slate-500">{row.missingFields?.join(", ") || "--"}</td>
              </tr>
            ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
