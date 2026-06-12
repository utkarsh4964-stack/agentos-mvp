const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("agentos_token");
}

function setToken(token) {
  if (token) localStorage.setItem("agentos_token", token);
  else localStorage.removeItem("agentos_token");
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth = true, form = false } = {}) {
  const headers = {};
  if (!form) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {
      // ignore json parse errors
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  signup: (email, password, name) =>
    request("/auth/signup", { method: "POST", body: { email, password, name }, auth: false }),

  login: (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return request("/auth/login", { method: "POST", body: form, auth: false, form: true });
  },

  me: () => request("/auth/me"),

  // Pipelines
  buildPipeline: (prompt, existingGraph) =>
    request("/pipelines/build", {
      method: "POST",
      body: { prompt, existing_graph: existingGraph || null },
    }),

  createPipeline: (data) => request("/pipelines", { method: "POST", body: data }),

  listPipelines: () => request("/pipelines"),

  getPipeline: (id) => request(`/pipelines/${id}`),

  updatePipeline: (id, data) => request(`/pipelines/${id}`, { method: "PUT", body: data }),

  deletePipeline: (id) => request(`/pipelines/${id}`, { method: "DELETE" }),

  runPipeline: (id, inputData) =>
    request(`/pipelines/${id}/run`, { method: "POST", body: { input_data: inputData } }),

  listRuns: (id) => request(`/pipelines/${id}/runs`),
};

export { getToken, setToken, ApiError };
