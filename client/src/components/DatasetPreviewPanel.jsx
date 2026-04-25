import { Database } from "lucide-react";
import { displayCell } from "../lib/helpers";

export default function DatasetPreviewPanel({ dataset }) {
  if (!dataset) {
    return null;
  }

  return (
    <section className="section-divider py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="panel overflow-hidden">
          <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Database size={16} className="text-[#9db5ec]" />
              <p className="section-kicker">02 · Dataset</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono uppercase tracking-[0.28em] text-slate-300">
                Preview {dataset.rowCount} rows · {dataset.headers.length} cols
              </span>
              <span className="rounded-[2px] bg-white px-3 py-2 font-semibold text-black">
                {dataset.detectedType === "group" ? "Group Dataset" : "Individual Dataset"}
              </span>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-gradient-to-b from-white/10 to-white/[0.03] text-slate-300">
                <tr>
                  {dataset.headers.map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap border-b border-white/10 px-4 py-4 font-mono text-xs uppercase tracking-[0.22em]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.preview.map((row, index) => (
                  <tr key={index} className="border-b border-white/[0.06] last:border-b-0">
                    {dataset.headers.map((header) => (
                      <td key={`${index}-${header}`} className="whitespace-nowrap px-4 py-4 text-slate-100">
                        {displayCell(row[header])}
                      </td>
                    ))}
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
