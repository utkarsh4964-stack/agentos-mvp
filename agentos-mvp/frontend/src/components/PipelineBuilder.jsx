import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "./AppShell";
import PipelineGraph from "./PipelineGraph";
import { api, ApiError } from "../lib/api";

const STARTER_PROMPTS = [
  "Write a blog post about AI trends, fact-check it, then optimize it for SEO",
  "Summarize meeting notes and draft a follow-up email",
  "Extract key data points from a report and write a summary",
];

export default function PipelineBuilder() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Describe the workflow you want to build. For example: \"Write a blog post, fact-check it, then make it SEO-optimized.\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [graph, setGraph] = useState(null); // {agent_graph, pipeline_name, explanation, input_schema}
  const [selectedStep, setSelectedStep] = useState(null);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (promptOverride) => {
    const prompt = promptOverride ?? input;
    if (!prompt.trim() || loading) return;

    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const existingGraph = graph?.agent_graph || null;
      const result = await api.buildPipeline(prompt, existingGraph);
      setGraph(result);
      setSelectedStep(null);
      setMessages((m) => [...m, { role: "assistant", text: result.explanation }]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Couldn't build the pipeline. Try rephrasing.";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", text: `Something went wrong: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!graph) return;
    setSaving(true);
    setError("");
    try {
      const created = await api.createPipeline({
        name: graph.pipeline_name,
        description: graph.explanation,
        agent_graph: graph.agent_graph,
        input_schema: graph.input_schema,
      });
      navigate(`/dashboard/pipeline/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the pipeline.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: pipeline graph + chat */}
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-paper">
              {graph?.pipeline_name || "New pipeline"}
            </h1>
            <p className="text-mist text-sm mt-1">
              {graph ? graph.explanation : "Describe what you want automated, in plain English."}
            </p>
          </div>

          <PipelineGraph
            steps={graph?.agent_graph}
            onSelectStep={setSelectedStep}
            selectedStepId={selectedStep?.id}
          />

          {graph && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-signal text-white text-sm font-medium rounded-lg hover:bg-signal/90 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save pipeline"}
              </button>
              <span className="font-mono text-xs text-mist">
                {Object.keys(graph.input_schema || {}).length} input field
                {Object.keys(graph.input_schema || {}).length !== 1 ? "s" : ""} ·{" "}
                {graph.agent_graph.length} step{graph.agent_graph.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Chat */}
          <div className="rounded-xl border border-line bg-panel flex flex-col h-[420px]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-signal text-white ml-auto"
                      : "bg-ink border border-line text-paper"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm bg-ink border border-line text-mist font-mono">
                  building pipeline…
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="border-t border-line p-3 flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={graph ? "Refine the pipeline… e.g. 'add a summarizer at the end'" : "Describe your workflow…"}
                className="flex-1 px-3.5 py-2.5 bg-ink border border-line rounded-lg text-paper text-sm placeholder:text-mist/60 focus:border-signal transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-signal text-white text-sm font-medium rounded-lg hover:bg-signal/90 transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>

          {!graph && (
            <div>
              <p className="font-mono text-xs text-mist mb-2">try one of these:</p>
              <div className="flex flex-col gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    disabled={loading}
                    className="text-left text-sm text-paper border border-line rounded-lg px-3.5 py-2.5 hover:border-signal transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-ember text-sm">{error}</p>}
        </div>

        {/* Right: step detail */}
        <div className="lg:sticky lg:top-24 h-fit">
          {selectedStep ? (
            <div className="rounded-xl border border-line bg-panel p-5">
              <p className="font-mono text-xs text-mist mb-1">{selectedStep.id}</p>
              <h3 className="font-display text-lg font-semibold text-paper">{selectedStep.name}</h3>
              <p className="font-mono text-xs text-signal mt-1 mb-4">{selectedStep.type}</p>
              <p className="text-sm text-mist leading-relaxed whitespace-pre-wrap">
                {selectedStep.instructions}
              </p>
              {selectedStep.condition && (
                <div className="mt-4 pt-4 border-t border-line">
                  <p className="font-mono text-xs text-mist">condition</p>
                  <p className="font-mono text-sm text-ember mt-1">{selectedStep.condition}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-panel/40 p-5">
              <p className="text-mist text-sm">
                Click a step in the pipeline to see its instructions and configuration.
              </p>
            </div>
          )}

          {graph?.input_schema && Object.keys(graph.input_schema).length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-5 mt-4">
              <p className="font-mono text-xs text-mist mb-3">expected input</p>
              <div className="space-y-2">
                {Object.entries(graph.input_schema).map(([key, type]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-paper">{key}</span>
                    <span className="font-mono text-xs text-mist">{String(type)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
