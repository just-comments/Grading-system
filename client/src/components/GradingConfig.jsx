import { Minus, Plus, Save, Sparkles } from "lucide-react";
import { formatNumber } from "../lib/helpers";

const DEFAULT_RULES = [
  { grade: "A", k: 1 },
  { grade: "B", k: 0 },
  { grade: "C", k: -0.5 },
  { grade: "D", k: -1 },
  { grade: "F", k: -100 },
];

const DEFAULT_BOUNDARIES = [
  { grade: "A", min: 85 },
  { grade: "B", min: 75 },
  { grade: "C", min: 65 },
  { grade: "D", min: 50 },
  { grade: "F", min: 0 },
];

export function buildDefaultGradingConfig() {
  return {
    mode: "default",
    groupStrategy: "shared",
    grading: {
      rules: DEFAULT_RULES,
      boundaries: DEFAULT_BOUNDARIES,
    },
  };
}

export default function GradingConfig({
  computedBoundaries,
  dataset,
  gradingConfig,
  onModeChange,
  onRuleChange,
  onBoundaryChange,
  onGroupStrategyChange,
  onSaveConfig,
  savedConfigurations,
  onLoadSavedConfig,
  selectedConfigurationId,
  onAddGrade,
  onRemoveGrade,
  onGradeNameChange,
  statistics,
}) {
  if (!dataset) {
    return null;
  }

  const boundaries = gradingConfig.grading.boundaries;
  const rules = gradingConfig.grading.rules;

  return (
    <section className="section-divider py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="panel">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles size={16} className="text-[#9db5ec]" />
            <p className="section-kicker">04 · Grading Rule</p>
          </div>

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-mono text-sm uppercase tracking-[0.26em] text-slate-300">Grading Mode</p>
            <div className="flex flex-wrap gap-3">
              <select
                className="input min-w-48 bg-[#0b0d11]"
                value={selectedConfigurationId}
                onChange={(event) => onLoadSavedConfig(event.target.value)}
              >
                <option value="">Load saved configuration</option>
                {savedConfigurations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button className="btn-secondary gap-2" onClick={onSaveConfig} type="button">
                <Save size={16} />
                Save preset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 border border-white/10 bg-white/[0.05]">
            {["default", "statistical", "custom"].map((mode) => (
              <button
                key={mode}
                className={`px-4 py-4 text-lg font-semibold capitalize transition ${
                  gradingConfig.mode === mode
                    ? "bg-[#0a0c10] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() => onModeChange(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>

          <p className="mt-6 text-lg text-slate-400">
            {gradingConfig.mode === "default"
              ? "Use the standard weighted-percent thresholds."
              : gradingConfig.mode === "statistical"
                ? "Define each grade as a range based on mean and standard deviation."
                : "Define minimum weighted percent for each grade band."}
          </p>

          {statistics && gradingConfig.mode === "statistical" ? (
            <p className="mt-2 text-sm text-slate-500">
              Mean: {formatNumber(statistics.mean)} | Std Dev: {formatNumber(statistics.standardDeviation)}
            </p>
          ) : null}

          {dataset.detectedType === "group" ? (
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <OptionCard
                active={gradingConfig.groupStrategy === "shared"}
                title="Shared group grade"
                description="Average the group and assign the same final result to all members."
                onClick={() => onGroupStrategyChange("shared")}
              />
              <OptionCard
                active={gradingConfig.groupStrategy === "normalized"}
                title="Individual normalization"
                description="Keep each student's individual weighted score even when group data exists."
                onClick={() => onGroupStrategyChange("normalized")}
              />
            </div>
          ) : null}

          {gradingConfig.mode === "default" || gradingConfig.mode === "custom" ? (
            <div className="mt-8 space-y-4">
              {boundaries.map((boundary, index) => (
                <div key={index} className="grid items-center gap-4 border-b border-white/10 pb-4 md:grid-cols-[180px,1fr,140px,40px]">
                  <input
                    className="input flex items-center text-2xl font-semibold"
                    type="text"
                    value={boundary.grade}
                    onChange={(event) => onGradeNameChange("boundaries", index, event.target.value)}
                  />
                  <input
                    min="0"
                    max="100"
                    step="0.5"
                    type="range"
                    value={boundary.min}
                    onChange={(event) => onBoundaryChange(index, Number(event.target.value))}
                  />
                  <input
                    className="input text-right font-mono text-2xl"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={boundary.min}
                    onChange={(event) => onBoundaryChange(index, Number(event.target.value))}
                  />
                  <button
                    className="flex h-10 w-10 items-center justify-center border border-white/10 text-slate-400 transition hover:border-rose-400 hover:text-rose-400"
                    onClick={() => onRemoveGrade("boundaries", index)}
                    type="button"
                    title="Remove grade"
                    disabled={boundaries.length <= 1}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
              <button
                className="btn-secondary gap-2 mt-2"
                onClick={() => onAddGrade("boundaries")}
                type="button"
              >
                <Plus size={16} />
                Add grade
              </button>
            </div>
          ) : null}

          {gradingConfig.mode === "statistical" ? (
            <div className="mt-8 space-y-4">
              {rules.map((rule, index) => {
                const computed = computedBoundaries.find((b) => b.grade === rule.grade);
                return (
                <div key={index} className="grid items-center gap-4 border-b border-white/10 pb-4 md:grid-cols-[180px,1fr,140px,40px]">
                  <div>
                    <input
                      className="input flex items-center text-2xl font-semibold"
                      type="text"
                      value={rule.grade}
                      onChange={(event) => onGradeNameChange("rules", index, event.target.value)}
                    />
                    {computed ? (
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {formatNumber(computed.min)} – {formatNumber(computed.max)}
                      </p>
                    ) : null}
                  </div>
                  <input
                    min="-2"
                    max="2"
                    step="0.1"
                    type="range"
                    value={rule.k}
                    onChange={(event) => onRuleChange(index, Number(event.target.value))}
                  />
                  <input
                    className="input text-right font-mono text-2xl"
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={rule.k}
                    onChange={(event) => onRuleChange(index, Number(event.target.value))}
                  />
                  <button
                    className="flex h-10 w-10 items-center justify-center border border-white/10 text-slate-400 transition hover:border-rose-400 hover:text-rose-400"
                    onClick={() => onRemoveGrade("rules", index)}
                    type="button"
                    title="Remove grade"
                    disabled={rules.length <= 1}
                  >
                    <Minus size={16} />
                  </button>
                </div>
                );
              })}
              <button
                className="btn-secondary gap-2 mt-2"
                onClick={() => onAddGrade("rules")}
                type="button"
              >
                <Plus size={16} />
                Add grade
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function OptionCard({ active, title, description, onClick }) {
  return (
    <button
      className={`border p-4 text-left transition ${
        active
          ? "border-[#4f8cff] bg-[#0f1728]"
          : "border-white/10 bg-[#0a0c10]"
      }`}
      onClick={onClick}
      type="button"
    >
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </button>
  );
}
