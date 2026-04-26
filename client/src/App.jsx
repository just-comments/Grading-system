import { useEffect, useMemo, useState } from "react";
import { GraduationCap, MoonStar, RefreshCcw, SunMedium } from "lucide-react";
import {
  analyzeFile,
  computeResults,
  exportResults,
  fetchConfigurations,
  login,
  saveConfiguration,
} from "./lib/api";
import { buildDefaultWeights, downloadBlob } from "./lib/helpers";
import UploadPanel from "./components/UploadPanel";
import DatasetPreviewPanel from "./components/DatasetPreviewPanel";
import WeightConfig from "./components/WeightConfig";
import GradingConfig, { buildDefaultGradingConfig } from "./components/GradingConfig";
import AnalyticsPanel from "./components/AnalyticsPanel";
import ResultsTable from "./components/ResultsTable";
import LoginPanel from "./components/LoginPanel";

const initialCredentials = {
  username: "admin",
  password: "flexgrade123",
};

export default function App() {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem("flexgrade-token")));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [datasetState, setDatasetState] = useState(null);
  const [weights, setWeights] = useState({});
  const [maxMarks, setMaxMarks] = useState({});
  const [gradingConfig, setGradingConfig] = useState(buildDefaultGradingConfig());
  const [results, setResults] = useState(null);
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  const [selectedConfigurationId, setSelectedConfigurationId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Upload a file to begin.");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("flexgrade-theme") !== "light");
  const [isComputing, setIsComputing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("flexgrade-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function handleUnauthorized() {
    localStorage.removeItem("flexgrade-token");
    setAuthenticated(false);
    setDatasetState(null);
    setResults(null);
    setSavedConfigurations([]);
    setSelectedConfigurationId("");
    setStatus("Your session expired. Please sign in again.");
  }

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;

    async function loadConfigurations() {
      try {
        const configurations = await fetchConfigurations();
        if (!cancelled) {
          setSavedConfigurations(configurations);
        }
      } catch (requestError) {
        if (!cancelled) {
          if (requestError.response?.status === 401) {
            handleUnauthorized();
            return;
          }
          setSavedConfigurations([]);
        }
      }
    }

    loadConfigurations();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const dataset = datasetState?.dataset;
  const totalWeight = useMemo(
    () => Object.values(weights).reduce((sum, weight) => sum + Number(weight || 0), 0),
    [weights],
  );

  useEffect(() => {
    if (!datasetState) {
      return;
    }

    if (!dataset?.numericColumns?.length) {
      setResults(null);
      setStatus("No numeric score columns were detected in this file.");
      return;
    }

    if (Math.abs(totalWeight - 100) > 0.001) {
      setResults(null);
      setStatus("Adjust component weights until they total exactly 100%.");
      return;
    }

    let cancelled = false;

    async function recomputeResults() {
      setIsComputing(true);
      try {
        setStatus("Computing weighted scores and analytics...");
        const activeMaxMarks = {};
        for (const [key, value] of Object.entries(maxMarks)) {
          if (value && Number(value) > 0) {
            activeMaxMarks[key] = Number(value);
          }
        }

        const nextResults = await computeResults({
          sessionId: datasetState.sessionId,
          config: {
            components: dataset.numericColumns,
            weights,
            maxMarks: activeMaxMarks,
            mode: gradingConfig.mode,
            grading: gradingConfig.grading,
            groupStrategy: gradingConfig.groupStrategy,
          },
        });

        if (!cancelled) {
          setResults(nextResults);
          setError("");
          setStatus("Results updated.");
        }
      } catch (computeError) {
        if (!cancelled) {
          if (computeError.response?.status === 401) {
            handleUnauthorized();
            return;
          }
          setError(computeError.response?.data?.message || "Unable to compute grading results.");
          setStatus("Result computation failed.");
        }
      } finally {
        if (!cancelled) {
          setIsComputing(false);
        }
      }
    }

    recomputeResults();

    return () => {
      cancelled = true;
    };
  }, [datasetState, dataset, totalWeight, weights, maxMarks, gradingConfig]);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      await login(credentials);
      setAuthenticated(true);
      setStatus("Signed in. Upload a file to begin.");
      setAuthError("");
    } catch (loginError) {
      setAuthError(loginError.response?.data?.message || "Could not sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setError("");
    setStatus("Reading upload and detecting dataset structure...");
    setIsUploading(true);
    try {
      const response = await analyzeFile(file);
      setDatasetState(response);
      setWeights(buildDefaultWeights(response.dataset.numericColumns));
      setMaxMarks({});
      setGradingConfig(buildDefaultGradingConfig());
      setSelectedConfigurationId("");
      setResults(null);
      setStatus("Dataset loaded. Adjust weights and grading rules.");
    } catch (uploadError) {
      if (uploadError.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(uploadError.response?.data?.message || "Unable to analyze the uploaded file.");
      setStatus("Upload analysis failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleWeightChange(component, value) {
    setWeights((current) => ({
      ...current,
      [component]: Number(value),
    }));
  }

  function handleMaxMarksChange(component, value) {
    setMaxMarks((current) => ({
      ...current,
      [component]: value === "" ? "" : Number(value),
    }));
  }

  function handleModeChange(mode) {
    setGradingConfig((current) => ({
      ...current,
      mode,
    }));
  }

  function handleRuleChange(index, value) {
    setGradingConfig((current) => ({
      ...current,
      grading: {
        ...current.grading,
        rules: current.grading.rules.map((rule, ruleIndex) =>
          ruleIndex === index ? { ...rule, k: value } : rule,
        ),
      },
    }));
  }

  function handleBoundaryChange(index, value) {
    setGradingConfig((current) => ({
      ...current,
      grading: {
        ...current.grading,
        boundaries: current.grading.boundaries.map((rule, ruleIndex) =>
          ruleIndex === index ? { ...rule, min: value } : rule,
        ),
      },
    }));
  }

  function handleAddGrade(type) {
    setGradingConfig((current) => {
      if (type === "boundaries") {
        const newBoundary = { grade: "", min: 0 };
        return {
          ...current,
          grading: {
            ...current.grading,
            boundaries: [...current.grading.boundaries, newBoundary],
          },
        };
      }
      const newRule = { grade: "", k: 0 };
      return {
        ...current,
        grading: {
          ...current.grading,
          rules: [...current.grading.rules, newRule],
        },
      };
    });
  }

  function handleRemoveGrade(type, index) {
    setGradingConfig((current) => {
      if (type === "boundaries") {
        return {
          ...current,
          grading: {
            ...current.grading,
            boundaries: current.grading.boundaries.filter((_, i) => i !== index),
          },
        };
      }
      return {
        ...current,
        grading: {
          ...current.grading,
          rules: current.grading.rules.filter((_, i) => i !== index),
        },
      };
    });
  }

  function handleGradeNameChange(type, index, value) {
    setGradingConfig((current) => {
      if (type === "boundaries") {
        return {
          ...current,
          grading: {
            ...current.grading,
            boundaries: current.grading.boundaries.map((rule, i) =>
              i === index ? { ...rule, grade: value } : rule,
            ),
          },
        };
      }
      return {
        ...current,
        grading: {
          ...current.grading,
          rules: current.grading.rules.map((rule, i) =>
            i === index ? { ...rule, grade: value } : rule,
          ),
        },
      };
    });
  }

  function handleGroupStrategyChange(groupStrategy) {
    setGradingConfig((current) => ({
      ...current,
      groupStrategy,
    }));
  }

  async function handleExport() {
    if (!dataset || !results) {
      return;
    }
    try {
      const rows = results.rows.map((row) => ({
        [dataset.nameColumn]: row[dataset.nameColumn],
        ...(dataset.groupColumn ? { [dataset.groupColumn]: row[dataset.groupColumn] } : {}),
        ...Object.fromEntries(dataset.numericColumns.map((component) => [component, row[component]])),
        weightedScore: row.weightedScore,
        groupScore: row.groupScore,
        finalGrade: row.finalGrade,
      }));

      const blob = await exportResults({
        rows,
        columns: Object.keys(rows[0] || {}),
      });

      downloadBlob(blob, "graded-results.csv");
      setStatus("CSV export completed.");
    } catch (exportError) {
      if (exportError.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(exportError.response?.data?.message || "Unable to export the computed results.");
      setStatus("CSV export failed.");
    }
  }

  async function handleSaveConfig() {
    if (!dataset) {
      return;
    }

    const name = window.prompt("Configuration name");
    if (!name) {
      return;
    }

    const payload = {
      name,
      datasetFingerprint: dataset.headers.join("|"),
      config: {
        components: dataset.numericColumns,
        weights,
        gradingConfig,
      },
    };

    try {
      const saved = await saveConfiguration(payload);
      setSavedConfigurations((current) => [saved, ...current]);
      setSelectedConfigurationId(saved.id);
      setStatus("Configuration saved.");
    } catch (saveError) {
      if (saveError.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(saveError.response?.data?.message || "Unable to save this configuration.");
      setStatus("Configuration save failed.");
    }
  }

  function handleLoadSavedConfig(configId) {
    if (!configId) {
      setSelectedConfigurationId("");
      return;
    }

    const selected = savedConfigurations.find((item) => item.id === configId);
    if (!selected) {
      return;
    }

    setSelectedConfigurationId(configId);
    setWeights(selected.config.weights);
    setGradingConfig(selected.config.gradingConfig);
    setStatus(`Loaded configuration: ${selected.name}`);
  }

  function resetWorkspace() {
    setDatasetState(null);
    setWeights({});
    setMaxMarks({});
    setResults(null);
    setGradingConfig(buildDefaultGradingConfig());
    setSelectedConfigurationId("");
    setError("");
    setStatus("Workspace reset. Upload a new dataset to continue.");
  }

  function equalizeWeights() {
    if (!dataset?.numericColumns?.length) {
      return;
    }

    setWeights(buildDefaultWeights(dataset.numericColumns));
    setStatus("Weights equalized.");
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#090a0d] px-6 py-16">
        <LoginPanel
          credentials={credentials}
          error={authError}
          loading={authLoading}
          onChange={(event) =>
            setCredentials((current) => ({ ...current, [event.target.name]: event.target.value }))
          }
          onSubmit={handleLogin}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090a0d] text-slate-100">
      <header className="section-divider sticky top-0 z-20 bg-[#090a0d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-[#4f8cff] text-white">
              <GraduationCap size={22} />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-[-0.04em] text-white">
                Gradient<span className="text-[#4f8cff]">.</span>
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-slate-400">
                Flexible Grading System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-secondary gap-2" onClick={resetWorkspace} type="button">
              <RefreshCcw size={16} />
              Reset
            </button>
            <button
              className="flex h-12 w-12 items-center justify-center border border-white/10 bg-[#0b0d11] text-slate-200 transition hover:border-white/20 hover:bg-[#11141a]"
              onClick={() => setDarkMode((current) => !current)}
              type="button"
            >
              {darkMode ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="section-divider bg-[#0b0d11] py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="rounded-full border border-white/10 bg-[#111216] px-4 py-3 text-sm text-slate-300">
            <span className="font-mono uppercase tracking-[0.24em] text-[#9db5ec]">Status</span>: {status}
            {isUploading || isComputing ? " Updating..." : ""}
            {error ? <span className="ml-3 text-rose-400">{error}</span> : null}
          </div>
        </div>
      </div>

      <UploadPanel dataset={dataset} error={error} loading={isUploading} onFileChange={handleFileChange} />
      <DatasetPreviewPanel dataset={dataset} />
        <WeightConfig
          components={dataset?.numericColumns || []}
          dataset={dataset}
          maxMarks={maxMarks}
          onEqualizeWeights={equalizeWeights}
          onMaxMarksChange={handleMaxMarksChange}
          onWeightChange={handleWeightChange}
          totalWeight={totalWeight}
          weights={weights}
        />
        <GradingConfig
          computedBoundaries={results?.boundaries || []}
          dataset={dataset}
          gradingConfig={gradingConfig}
          onAddGrade={handleAddGrade}
          onBoundaryChange={handleBoundaryChange}
          onGradeNameChange={handleGradeNameChange}
          onGroupStrategyChange={handleGroupStrategyChange}
          onLoadSavedConfig={handleLoadSavedConfig}
          onModeChange={handleModeChange}
          onRemoveGrade={handleRemoveGrade}
          onRuleChange={handleRuleChange}
          onSaveConfig={handleSaveConfig}
          savedConfigurations={savedConfigurations}
          selectedConfigurationId={selectedConfigurationId}
          statistics={results?.statistics || null}
        />
        <AnalyticsPanel results={results} />
        <ResultsTable
          boundaries={results?.boundaries || []}
          dataset={dataset}
          onExport={handleExport}
          results={results}
        />
    </main>
  );
}
