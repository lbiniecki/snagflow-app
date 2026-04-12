/**
 * SnagFlow API Client
 * Typed wrapper for all backend endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ─── Types ────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  client?: string;
  address?: string;
  user_id: string;
  snag_count: number;
  created_at: string;
}

export interface Snag {
  id: string;
  project_id: string;
  note: string;
  location?: string;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
  email: string;
}

export interface TranscribeResponse {
  text: string;
  duration?: number;
}

// ─── Token Management ─────────────────────────────────────────
let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("snagflow_token", token);
  } else {
    localStorage.removeItem("snagflow_token");
  }
}

export function getToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("snagflow_token");
  }
  return accessToken;
}

// ─── Fetch Helper ─────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser handles multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setToken(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
  login(email: string, password: string) {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  signup(email: string, password: string) {
    return apiFetch<{ message: string; user_id: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  magicLink(email: string) {
    return apiFetch<{ message: string }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  logout() {
    setToken(null);
  },
};

// ─── Projects ─────────────────────────────────────────────────
export const projects = {
  list() {
    return apiFetch<Project[]>("/projects/");
  },

  get(id: string) {
    return apiFetch<Project>(`/projects/${id}`);
  },

  create(data: { name: string; client?: string; address?: string }) {
    return apiFetch<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Project>) {
    return apiFetch<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return apiFetch<void>(`/projects/${id}`, { method: "DELETE" });
  },
};

// ─── Snags ────────────────────────────────────────────────────
export const snags = {
  list(projectId: string, status?: string, priority?: string) {
    const params = new URLSearchParams({ project_id: projectId });
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    return apiFetch<Snag[]>(`/snags/?${params}`);
  },

  create(data: {
    project_id: string;
    note: string;
    location?: string;
    priority?: string;
    photo?: File;
  }) {
    const form = new FormData();
    form.append("project_id", data.project_id);
    form.append("note", data.note);
    if (data.location) form.append("location", data.location);
    form.append("priority", data.priority || "medium");
    if (data.photo) form.append("photo", data.photo);

    return apiFetch<Snag>("/snags/", {
      method: "POST",
      body: form,
    });
  },

  update(id: string, data: Partial<Snag>) {
    return apiFetch<Snag>(`/snags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete(id: string) {
    return apiFetch<void>(`/snags/${id}`, { method: "DELETE" });
  },
};

// ─── Transcription ────────────────────────────────────────────
export const transcription = {
  transcribe(audioBlob: Blob, filename = "recording.webm") {
    const form = new FormData();
    form.append("audio", audioBlob, filename);
    return apiFetch<TranscribeResponse>("/transcribe/", {
      method: "POST",
      body: form,
    });
  },
};

// ─── Reports ──────────────────────────────────────────────────
export const reports = {
  async downloadPdf(projectId: string) {
    const token = getToken();
    const res = await fetch(
      `${API_BASE}/reports/${projectId}?include_closed=true&include_photos=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Failed to generate report");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snagging-report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  preview(projectId: string) {
    return apiFetch<{
      project: Project;
      summary: {
        total: number;
        open: number;
        closed: number;
        high_priority: number;
      };
      snags: Snag[];
    }>(`/reports/${projectId}/preview`);
  },
};
