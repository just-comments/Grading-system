export default function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${accent || "text-slate-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}
