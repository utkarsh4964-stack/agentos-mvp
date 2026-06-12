import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "./AppShell";
import PipelineGraph from "./PipelineGraph";
import { api, ApiError } from "../lib/api";

export default function PipelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState(null);
  const [runs, setRuns] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [selectedStep, setSelectedStep] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [stepStatuses, setStepStatuses] = useState({});

  useEffect(() => {
    api.getPipeline(id).then(setPipeline).catch((e) => setError(e.message));
    api.listRuns(id).then(setRuns).catch(() => {});
  }, [id]);

  const handleRun = async () => {
    if (!pipeline) return;
    setRunning(true);
    setError("");
    setActiveRun(null);

    // Simulate live step progression for UX while waiting on the single sync call
    const statuses = {};
    pipeline.agent_graph.forEach((s, i) => {
      statuses[s.id] = i === 0 ? "RUNNING" : "PENDING";
    });
    setStepStatuses(statuses);

    try {
      const result = await api.runPipeline(id, inputValues);
      setActiveRun(result);

      const finalStatuses = {};
      result.step_logs.forEach((log) => {
        finalStatuses[log.agent_id] = log.skipped ? "SKIPPED" : log.status;
      });
      setStepStatuses(finalStatuses);

      const updatedRuns = await api.listRuns(id);
      setRuns(updatedRuns);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Run failed unexpectedly.");
      setStepStatuses({});
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this pipeline? This can't be undone.")) return;
    try {
      await api.deletePipeline(id);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete pipeline.");
    }
  };

  if (error && !pipeline) {
    return (
      <AppShell>
        <p className="text-ember text-sm">{error}</p>
      </AppShell>
    );
  }

  if (!pipeline) {
    return (
      <AppShell>
        <div className="h-40 rounded-xl border border-line bg-panel animate-pulse" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-paper">{pipeline.name}</h1>
              <p className="text-mist text-sm mt-1">{pipeline.description}</p>
            </div>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm font-medium text-ember border border-line rounded-lg hover:border-ember transition-colors"
            >
              Delete
            </button>
          </div>

          <PipelineGraph
            steps={pipeline.agent_graph}
            stepStatuses={stepStatuses}
            onSelectStep={setSelectedStep}
            selectedStepId={selectedStep?.id}
          />

          {/* Run form */}
          <div className="rounded-xl border border-line bg-panel p-5">
            <p className="font-mono text-xs text-mist mb-3">run this pipeline</p>
            <div className="space-y-3">
              {Object.keys(pipeline.input_schema || {}).length > 0 ? (
                Object.entries(pipeline.input_schema).map(([key, type]) => (
                  <label key={key} className="block">
                    <span className="text-sm font-medium text-paper">{key}</span>
                    <textarea
                      rows={String(type).toLowerCase().includes("text") ? 4 : 2}
                      value={inputValues[key] || ""}
                      onChange={(e) => setInputValues((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={`Enter ${key}…`}
                      className="mt-1.5 w-full px-3.5 py-2.5 bg-ink border border-line rounded-lg text-paper text-sm placeholder:text-mist/60 focus:border-signal transition-colors resize-none"
                    />
                  </label>
                ))
              ) : (
                <label className="block">
                  <span className="text-sm font-medium text-paper">input</span>
                  <textarea
                    rows={3}
                    value={inputValues.input || ""}
                    onChange={(e) => setInputValues((v) => ({ ...v, input: e.target.value }))}
                    placeholder="Enter your input…"
                    className="mt-1.5 w-full px-3.5 py-2.5 bg-ink border border-line rounded-lg text-paper text-sm placeholder:text-mist/60 focus:border-signal transition-colors resize-none"
                  />
                </label>
              )}
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="mt-4 w-full py-2.5 bg-signal text-white text-sm font-medium rounded-lg hover:bg-signal/90 transition-colors disabled:opacity-60"
            >
              {running ? "Running pipeline…" : "Run pipeline"}
            </button>
            {error && <p className="text-ember text-sm mt-3">{error}</p>}
          </div>

          {/* Result */}
          {activeRun && (
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-mist">result</p>
                <div className="flex items-center gap-3">
                  {activeRun.score !== null && activeRun.score !== undefined && (
                    <span className="font-mono text-xs text-signal">
                      score: {Math.round(activeRun.score)}/100
                    </span>
                  )}
                  <span
                    className={`font-mono text-xs ${
                      activeRun.status === "COMPLETED" ? "text-green-400" : "text-ember"
                    }`}
                  >
                    {activeRun.status}
                  </span>
                  <span className="font-mono text-xs text-mist">{activeRun.duration_ms}ms</span>
                </div>
              </div>
              {activeRun.error_message && (
                <p className="text-ember text-sm mb-3">{activeRun.error_message}</p>
              )}
              {activeRun.output_data?.result && (
                <div className="bg-ink border border-line rounded-lg p-4 text-sm text-paper whitespace-pre-wrap leading-relaxed">
                  {activeRun.output_data.result}
                </div>
              )}
              {activeRun.score_rationale && (
                <p className="font-mono text-xs text-mist mt-3">judge: {activeRun.score_rationale}</p>
              )}
            </div>
          )}

          {/* Run history */}
          {runs.length > 0 && (
            <div>
              <p className="font-mono text-xs text-mist mb-3">recent runs</p>
              <div className="space-y-2">
                {runs.slice(0, 10).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-2.5 text-sm"
                  >
                    <span className="text-mist font-mono text-xs">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      {run.score !== null && (
                        <span className="font-mono text-xs text-signal">{Math.round(run.score)}/100</span>
                      )}
                      <span
                        className={`font-mono text-xs ${
                          run.status === "COMPLETED" ? "text-green-400" : "text-ember"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: step detail */}
        <div className="lg:sticky lg:top-24 h-fit">
          {selectedStep ? (
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-xs text-mist mb-1">{selectedStep.id}</p>
              <h3 className="font-display text-lg font-semibold text-paper">{selectedStep.name}</h3>
              <p className="font-mono text-xs text-signal mt-1 mb-4">{selectedStep.type}</p>
              <p className="text-sm text-mist leading-relaxed whitespace-pre-wrap mb-4">
                {selectedStep.instructions}
              </p>

              {activeRun &&
                (() => {
                  const log = activeRun.step_logs.find((l) => l.agent_id === selectedStep.id);
                  if (!log) return null;
                  return (
                    <div className="pt-4 border-t border-line space-y-3">
                      <div>
                        <p className="font-mono text-xs text-mist mb-1">status</p>
                        <p className="font-mono text-sm text-paper">
                          {log.skipped ? `SKIPPED — ${log.skip_reason}` : `${log.status} · ${log.latency_ms}ms`}
                        </p>
                      </div>
                      {log.output && (
                        <div>
                          <p className="font-mono text-xs text-mist mb-1">output</p>
                          <div className="bg-ink border border-line rounded-lg p-3 text-xs text-paper whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                            {log.output}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-panel/40 p-5">
              <p className="text-mist text-sm">
                Click a step to view its instructions. After a run, you'll also see its output here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
