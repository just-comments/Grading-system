import { FileSpreadsheet, UploadCloud } from "lucide-react";

export default function UploadPanel({ dataset, onFileChange, loading, error }) {
  return (
    <section className="section-divider py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl">
          <p className="section-kicker">01 · Ingest</p>
          <h1 className="mt-6 max-w-5xl text-5xl font-bold leading-[0.94] tracking-[-0.05em] text-white md:text-7xl">
            Upload, weight, grade.
            <br />
            <span className="text-slate-400">Relative. Statistical. Custom.</span>
          </h1>
          <p className="mt-8 max-w-4xl text-xl leading-9 text-slate-300">
            Drop a CSV or Excel file. We auto-detect students, groups and score columns, compute weighted
            totals and apply your chosen grading curve in real-time.
          </p>
        </div>

        <div className="panel mt-14 border-dashed px-6 py-16 text-center md:px-12">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-white/10 bg-white/[0.05]">
              <FileSpreadsheet size={28} className="text-white" />
            </div>
            <h2 className="mt-8 text-3xl font-bold text-white">
              {dataset ? dataset.filename : "Upload a grading sheet"}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-400">
              Auto-detects student names, group IDs and numeric score components. Supported: <span className="font-mono text-slate-200">.csv</span>{" "}
              <span className="font-mono text-slate-200">.xlsx</span>
            </p>

            <label className="mt-10 inline-flex cursor-pointer items-center justify-center gap-3 bg-[#4f8cff] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#3d73d7]">
              <UploadCloud size={18} />
              {loading ? "Analyzing file..." : dataset ? "Replace file" : "Choose file"}
              <input className="hidden" type="file" accept=".csv,.xlsx" onChange={onFileChange} />
            </label>

            {dataset ? (
              <div className="mt-10 grid gap-4 text-left md:grid-cols-4">
                <SummaryBadge label="Rows" value={dataset.rowCount} />
                <SummaryBadge label="Detected Type" value={dataset.detectedType} />
                <SummaryBadge label="Numeric Components" value={dataset.numericColumns.length} />
                <SummaryBadge label="Missing Values" value={dataset.missingValueCount} />
              </div>
            ) : null}

            {error ? <p className="mt-6 text-sm text-rose-400">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryBadge({ label, value }) {
  return (
    <div className="border border-white/10 bg-[#0b0d11] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold capitalize text-white">{value}</p>
    </div>
  );
}
