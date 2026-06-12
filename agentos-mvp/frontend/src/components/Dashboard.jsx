import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "./AppShell";
import { api } from "../lib/api";

const TYPE_COLORS = {
  writer: "#7C5CFF",
  summarizer: "#7C5CFF",
  fact_checker: "#FF8A4C",
  seo_analyzer: "#FF8A4C",
  code_reviewer: "#7C5CFF",
  image_describer: "#FF8A4C",
  data_extractor: "#7C5CFF",
  email_drafter: "#FF8A4C",
  custom: "#9AA3AE",
};

export default function Dashboard() {
  const [pipelines, setPipelines] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listPipelines()
      .then(setPipelines)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-paper">Your pipelines</h1>
          <p className="text-mist text-sm mt-1">Build, run, and refine AI workflows.</p>
        </div>
        <Link
          to="/dashboard/new"
          className="px-4 py-2.5 bg-signal text-white text-sm font-medium rounded-lg hover:bg-signal/90 transition-colors"
        >
          + New pipeline
        </Link>
      </div>

      {error && <p className="text-ember text-sm">{error}</p>}

      {pipelines === null && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-line bg-panel animate-pulse" />
          ))}
        </div>
      )}

      {pipelines && pipelines.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-panel/40 p-12 text-center">
          <p className="font-display text-lg text-paper mb-2">No pipelines yet</p>
          <p className="text-mist text-sm mb-6">
            Describe what you want automated, and AgentOS will build the pipeline for you.
          </p>
          <Link
            to="/dashboard/new"
            className="inline-block px-5 py-2.5 bg-signal text-white text-sm font-medium rounded-lg hover:bg-signal/90 transition-colors"
          >
            Build your first pipeline
          </Link>
        </div>
      )}

      {pipelines && pipelines.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((p) => (
            <Link
              key={p.id}
              to={`/dashboard/pipeline/${p.id}`}
              className="rounded-xl border border-line bg-panel p-5 hover:border-mist transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-3">
                {p.agent_graph.slice(0, 5).map((step, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: TYPE_COLORS[step.type] || TYPE_COLORS.custom }}
                  />
                ))}
                {p.agent_graph.length > 5 && (
                  <span className="font-mono text-xs text-mist">+{p.agent_graph.length - 5}</span>
                )}
              </div>
              <h3 className="font-display text-base font-semibold text-paper group-hover:text-signal transition-colors">
                {p.name}
              </h3>
              <p className="text-mist text-sm mt-1.5 line-clamp-2">{p.description || "No description"}</p>
              <p className="font-mono text-xs text-mist mt-4">
                {p.agent_graph.length} step{p.agent_graph.length !== 1 ? "s" : ""} · v{p.version}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
