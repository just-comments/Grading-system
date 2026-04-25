import { Save, Sparkles } from "lucide-react";

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
}) {
  if (!dataset) {
    return null;
  }

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
                ? "Define each grade as mean plus a multiple of standard deviation."
                : "Define minimum weighted percent for each grade band."}
          </p>

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

          {gradingConfig.mode === "default" ? (
            <div className="mt-8 space-y-4">
              {gradingConfig.grading.boundaries.map((boundary) => (
                <div key={boundary.grade} className="grid items-center gap-4 border-b border-white/10 pb-4 md:grid-cols-[180px,1fr,140px]">
                  <div className="input flex items-center text-2xl font-semibold">{boundary.grade}</div>
                  <div className="h-[6px] rounded-full bg-[#1a2c4d]" />
                  <div className="input text-right font-mono text-2xl">{boundary.min}</div>
                </div>
              ))}
            </div>
          ) : null}

          {gradingConfig.mode === "statistical" ? (
            <div className="mt-8 space-y-4">
              {gradingConfig.grading.rules.map((rule, index) => (
                <div key={rule.grade} className="grid items-center gap-4 border-b border-white/10 pb-4 md:grid-cols-[180px,1fr,140px]">
                  <div className="input flex items-center text-2xl font-semibold">{rule.grade}</div>
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
                </div>
              ))}
            </div>
          ) : null}

          {gradingConfig.mode === "custom" ? (
            <div className="mt-8 space-y-4">
              {gradingConfig.grading.boundaries.map((boundary, index) => (
                <div key={boundary.grade} className="grid items-center gap-4 border-b border-white/10 pb-4 md:grid-cols-[180px,1fr,140px]">
                  <div className="input flex items-center text-2xl font-semibold">{boundary.grade}</div>
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
                </div>
              ))}
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
