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

export default function PipelineGraph({ steps, stepStatuses, onSelectStep, selectedStepId }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-panel/40 p-10 text-center">
        <p className="text-mist text-sm">
          Describe a workflow below and the pipeline graph will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => {
        const status = stepStatuses?.[step.id];
        const color = TYPE_COLORS[step.type] || TYPE_COLORS.custom;
        const isSelected = selectedStepId === step.id;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onSelectStep?.(step)}
              className={`text-left rounded-xl border px-4 py-3 min-w-[150px] transition-colors ${
                isSelected ? "border-signal bg-panel" : "border-line bg-panel hover:border-mist"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {status === "RUNNING" && (
                  <span className="font-mono text-[10px] text-signal animate-pulse">RUNNING</span>
                )}
                {status === "COMPLETED" && <span className="font-mono text-[10px] text-green-400">DONE</span>}
                {status === "FAILED" && <span className="font-mono text-[10px] text-ember">FAILED</span>}
                {status === "SKIPPED" && <span className="font-mono text-[10px] text-mist">SKIPPED</span>}
              </div>
              <p className="font-display text-sm font-medium text-paper truncate">{step.name}</p>
              {step.condition && (
                <p className="font-mono text-[10px] text-mist mt-1 truncate">if {step.condition}</p>
              )}
            </button>
            {i < steps.length - 1 && (
              <svg width="28" height="20" viewBox="0 0 28 20" className="flex-shrink-0">
                <line x1="2" y1="10" x2="24" y2="10" stroke="#23272E" strokeWidth="2" />
                <path d="M19 5 L25 10 L19 15" fill="none" stroke="#23272E" strokeWidth="2" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { TYPE_COLORS };
