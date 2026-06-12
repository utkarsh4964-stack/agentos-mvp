import { Link } from "react-router-dom";
import Logo from "./Logo";

const AGENT_COLORS = {
  Writer: "#7C5CFF",
  "Fact-Check": "#FF8A4C",
  SEO: "#7C5CFF",
};

function PipelinePreview() {
  const steps = ["Writer", "Fact-Check", "SEO"];
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex-1 rounded-xl border border-line bg-panel px-4 py-5 text-center">
              <div
                className="w-2.5 h-2.5 rounded-full mx-auto mb-3"
                style={{ background: AGENT_COLORS[step] }}
              />
              <p className="font-mono text-xs text-mist">step_{i + 1}</p>
              <p className="font-display text-sm font-medium text-paper mt-1">{step} Agent</p>
            </div>
            {i < steps.length - 1 && (
              <svg width="40" height="24" viewBox="0 0 40 24" className="flex-shrink-0 mx-1 hidden sm:block">
                <line x1="2" y1="12" x2="38" y2="12" stroke="#23272E" strokeWidth="2" />
                <line x1="2" y1="12" x2="38" y2="12" stroke="#7C5CFF" strokeWidth="2" className="flow-line" />
                <path d="M32 6 L38 12 L32 18" fill="none" stroke="#7C5CFF" strokeWidth="2" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-center font-mono text-xs text-mist mt-4">
        "write a blog post, fact-check it, optimize for seo" → pipeline built in 1.2s
      </p>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink">
      {/* Nav */}
      <nav className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-mist hover:text-paper transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium bg-signal text-white rounded-lg hover:bg-signal/90 transition-colors"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-panel font-mono text-xs text-mist mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
          natural-language AI pipelines
        </div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight text-paper max-w-3xl mx-auto leading-[1.1]">
          Describe your workflow.
          <br />
          <span className="text-signal">We'll build it.</span>
        </h1>
        <p className="text-mist text-lg mt-6 max-w-xl mx-auto">
          Type what you want done in plain English. AgentOS assembles the pipeline,
          runs it with real AI agents, and shows you exactly what happened at every step.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="px-6 py-3 bg-signal text-white font-medium rounded-lg hover:bg-signal/90 transition-colors"
          >
            Build your first pipeline
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border border-line text-paper font-medium rounded-lg hover:border-mist transition-colors"
          >
            Log in
          </Link>
        </div>

        <div className="mt-20">
          <PipelinePreview />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          <FeatureCard
            eyebrow="01 — Build"
            title="Talk, don't configure"
            body="Describe a workflow in plain English. The builder assembles a chain of agents — Writer, Fact-Check, SEO, Summarizer, and more — and you can keep refining it by typing more."
          />
          <FeatureCard
            eyebrow="02 — Run"
            title="Watch every step"
            body="Each agent runs in sequence, passing its output to the next. You see the input, output, and timing for every step — no black box."
          />
          <FeatureCard
            eyebrow="03 — Score"
            title="A judge grades every run"
            body="An independent judge model scores each pipeline's output from 0–100, so you know whether a pipeline is actually working before you rely on it."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <Logo size={22} />
          <p className="font-mono text-xs text-mist">built for builders</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ eyebrow, title, body }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-6">
      <p className="font-mono text-xs text-signal mb-3">{eyebrow}</p>
      <h3 className="font-display text-lg font-semibold text-paper mb-2">{title}</h3>
      <p className="text-mist text-sm leading-relaxed">{body}</p>
    </div>
  );
}
