# AgentOS — MVP

Natural-language AI workflow platform. Describe a workflow in plain English,
AgentOS assembles a chain of agents, runs it, and scores the output.

This MVP implements the **NL Builder + Agent Execution + Judge Scoring** core
from the PRD/TRD/Workflow docs, on a stack that one person can run and afford:
FastAPI + PostgreSQL backend, React frontend, Gemini 2.0 Flash (primary) with
Groq/Llama 3.3 70B fallback, deployed on Railway + Vercel/Railway.

The TRD's full enterprise architecture (Kafka, Temporal, Firecracker
microVMs, Elasticsearch, multi-region) is documented as a **future scale
roadmap** at the bottom of this file — none of that is required to launch.

---

## 1. Project structure

```
agentos-mvp/
├── backend/          FastAPI API (auth, pipeline CRUD, build, run, score)
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   ├── schemas.py
│   │   ├── models/db_models.py
│   │   ├── routers/{auth,pipelines}.py
│   │   └── services/{llm,agent_library,builder,execution,judge}.py
│   ├── requirements.txt
│   ├── Procfile
│   └── railway.json
└── frontend/         React (Vite) app
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   └── lib/{api.js, auth.jsx}
    └── package.json
```

---

## 2. What's implemented (MVP scope)

- **Auth**: signup/login (JWT), per-user accounts, free plan = 3 pipelines
- **NL Builder**: describe a workflow → LLM returns a structured agent graph
  (sequence of steps with type, instructions, optional condition)
- **Agent library**: writer, summarizer, fact_checker, seo_analyzer,
  code_reviewer, image_describer, data_extractor, email_drafter, custom
- **Execution engine**: runs steps sequentially, passes output forward,
  evaluates simple conditions (`output_length > 500`), retries failed
  steps up to 2x, returns friendly error messages
- **Judge**: scores each completed run 0–100 with a rationale
- **Pipeline CRUD**: save, list, view, edit, delete, run history

Not in this MVP (left for the roadmap): Marketplace, Trigger Engine,
Self-Learning instruction proposals, Teams/RBAC, Kafka/Temporal.

---

## 3. Prerequisites

- A [Railway](https://railway.app) account (for backend + Postgres)
- A [Vercel](https://vercel.com) account (for frontend) — or use Railway for
  the frontend too, your choice
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key
  (Gemini — free tier available)
- A [Groq](https://console.groq.com/keys) API key (fallback — free tier
  available)
- Node.js 20+ and Python 3.12+ if you want to run locally first

---

## 4. Run locally first (recommended)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: add GEMINI_API_KEY, GROQ_API_KEY, JWT_SECRET
# DATABASE_URL can stay unset locally — it falls back to sqlite

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to confirm the API is up (Swagger UI).

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# set VITE_API_URL=http://localhost:8000

npm run dev
```

Visit `http://localhost:5173`. Sign up, describe a pipeline, save it, run it.

---

## 5. Deploy the backend to Railway

1. **Push this repo to GitHub** (create a new repo, push `agentos-mvp/`).

2. **Create a new Railway project**
   - Go to railway.app → New Project → Deploy from GitHub repo
   - Select your repo
   - When asked for the root directory, set it to `backend`

3. **Add a PostgreSQL database**
   - In the Railway project, click "+ New" → Database → Add PostgreSQL
   - Railway automatically injects `DATABASE_URL` into your backend service's
     environment — you don't need to copy it manually

4. **Set environment variables** on the backend service (Settings → Variables):
   ```
   GEMINI_API_KEY=your_gemini_key
   GROQ_API_KEY=your_groq_key
   JWT_SECRET=<generate a long random string, e.g. `openssl rand -hex 32`>
   ```

5. **Verify the build settings**
   - Railway should auto-detect Python via `requirements.txt` (Nixpacks)
   - `railway.json` already sets the start command:
     `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - If it doesn't pick this up automatically, set it manually in
     Settings → Deploy → Start Command

6. **Deploy** — Railway builds and deploys automatically on push. Once live,
   click "Generate Domain" under Settings → Networking to get a public URL,
   e.g. `https://agentos-backend-production.up.railway.app`

7. **Smoke test**:
   ```bash
   curl https://agentos-backend-production.up.railway.app/health
   # {"status":"healthy"}
   ```
   Visit `/docs` on that URL to confirm Swagger UI loads and tables were
   created (the app calls `Base.metadata.create_all()` on startup).

---

## 6. Deploy the frontend

### Option A: Vercel (recommended for React)

1. Push the repo to GitHub (same repo is fine)
2. Go to vercel.com → New Project → import your repo
3. Set **Root Directory** to `frontend`
4. Framework preset: Vite (auto-detected)
5. Add environment variable:
   ```
   VITE_API_URL=https://agentos-backend-production.up.railway.app
   ```
6. Deploy. Vercel gives you a URL like `https://agentos.vercel.app`

### Option B: Railway (single platform)

1. In the same Railway project, click "+ New" → GitHub repo (same repo)
2. Set root directory to `frontend`
3. Add a build command: `npm install && npm run build`
4. Add a start command (use a static server):
   ```
   npx serve -s dist -l $PORT
   ```
   (Railway will need `serve` — add it to `frontend/package.json`
   devDependencies: `npm install -D serve`, or use the command
   `npx --yes serve -s dist -l $PORT` so it installs on demand)
5. Add environment variable `VITE_API_URL=<your backend Railway URL>`
   — **note**: Vite env vars are baked in at build time, so this must be
   set before the build runs
6. Generate a domain under Settings → Networking

---

## 7. Post-deploy checklist

- [ ] Backend `/health` returns `{"status":"healthy"}`
- [ ] Backend CORS: in `backend/app/main.py`, change
      `allow_origins=["*"]` to your actual frontend domain once it's live,
      for security (e.g. `["https://agentos.vercel.app"]`), then redeploy
- [ ] Frontend loads, signup works, JWT is stored
- [ ] "New pipeline" → type a prompt → graph appears (tests Gemini/Groq keys)
- [ ] Save pipeline → appears on dashboard
- [ ] Run pipeline → see step-by-step output and a judge score
- [ ] Custom domain (optional): point your domain's CNAME at the Vercel/Railway
      target, configure in their dashboard

---

## 8. Environment variables reference

### Backend (`backend/.env`)
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Production | Auto-set by Railway Postgres plugin. Falls back to local SQLite if unset. |
| `GEMINI_API_KEY` | Yes | Primary LLM for builder, execution, judge |
| `GROQ_API_KEY` | Yes | Fallback if Gemini fails/quota exhausted |
| `JWT_SECRET` | Yes | Random secret for signing auth tokens |

### Frontend (`frontend/.env`)
| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | Yes | URL of your deployed backend (no trailing slash) |

---

## 9. Future roadmap (from the TRD — not in this MVP)

Build these incrementally as you get real users, not before:

1. **Marketplace** (PRD 5.4): publish pipelines, Razorpay checkout, 70/30
   revenue split, creator dashboard. Add `MarketplaceListing` and `Payout`
   tables (already specced in TRD §4.1).
2. **Self-Learning Engine** (PRD 5.3): background job (Celery or a simple
   cron) that checks `ScoreRecord` history every N runs, calls Claude/Gemini
   to propose instruction updates, surfaces accept/reject UI.
3. **Trigger Engine** (PRD 5.5): cron-based and webhook triggers using
   Railway's cron jobs or a lightweight scheduler (APScheduler) before
   reaching for Temporal.
4. **Scale architecture** (TRD §3): only revisit Kafka/Temporal/Firecracker
   once you're hitting real concurrency limits on a single Railway service —
   for most early-stage usage, FastAPI + Postgres + horizontal Railway
   replicas will comfortably handle thousands of runs/day.
5. **Observability**: add Sentry or Datadog once you have paying users;
   Railway's built-in logs are enough for the first cohort.

---

## 10. Troubleshooting

- **"Pipeline builder is temporarily unavailable"**: both Gemini and Groq
  calls failed — check API keys and quotas in Railway env vars.
- **CORS errors in browser console**: make sure `VITE_API_URL` has no
  trailing slash and matches the backend's actual domain; check
  `allow_origins` in `main.py`.
- **502/503 from Railway**: check deploy logs — usually a missing env var
  (`JWT_SECRET` not set causes auth to still work via default, but
  `DATABASE_URL` missing falls back to ephemeral SQLite, which resets on
  every redeploy — add the Postgres plugin).
- **bcrypt error about 72 bytes**: already handled in `app/auth.py`
  (passwords are truncated to 72 bytes before hashing — this is bcrypt's
  hard limit, not a security issue for typical passwords).
