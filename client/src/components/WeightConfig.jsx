import { Check, SlidersHorizontal } from "lucide-react";

export default function WeightConfig({
  components,
  weights,
  onWeightChange,
  onEqualizeWeights,
  totalWeight,
  dataset,
}) {
  if (!dataset) {
    return null;
  }

  const totalIsValid = Math.abs(totalWeight - 100) <= 0.001;

  return (
    <section className="section-divider py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="panel">
          <div className="mb-6 flex items-center gap-3">
            <SlidersHorizontal size={16} className="text-[#9db5ec]" />
            <p className="section-kicker">03 · Weights</p>
          </div>

          <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-sm uppercase tracking-[0.26em] text-slate-300">Component Weightage</p>
            <div className="flex items-center gap-6 text-sm">
              <button className="font-mono uppercase tracking-[0.26em] text-[#9db5ec]" onClick={onEqualizeWeights} type="button">
                Equalize
              </button>
              <span className={`font-mono text-2xl ${totalIsValid ? "text-white" : "text-amber-300"}`}>
                Σ = {totalWeight.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-4">
        {components.map((component) => (
            <div key={component} className="grid items-center gap-4 border-b border-white/10 pb-4 last:border-b-0 md:grid-cols-[280px,1fr,140px]">
              <div className="flex items-center gap-4">
                <span className="flex h-6 w-6 items-center justify-center bg-[#4f8cff] text-white">
                  <Check size={14} />
                </span>
                <span className="text-2xl font-semibold text-white">{component}</span>
              </div>
              <input
                min="0"
                max="100"
                step="0.5"
                type="range"
                value={weights[component] ?? 0}
                onChange={(event) => onWeightChange(component, event.target.value)}
              />
              <input
                className="input text-right font-mono text-2xl"
                min="0"
                max="100"
                step="0.5"
                type="number"
                value={weights[component] ?? 0}
                onChange={(event) => onWeightChange(component, event.target.value)}
              />
            </div>
        ))}
          </div>
        </div>
      </div>
    </section>
  );
}
