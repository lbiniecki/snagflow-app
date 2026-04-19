/**
 * VoxSite API Client
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
  company_id?: string;
  snag_count: number;
  created_at: string;
}

export interface SiteVisit {
  id: string;
  project_id: string;
  visit_no: number;
  visit_ref?: string | null;  // Optional display override (e.g. "MIL-V01"); null/empty = use visit_no
  visit_date: string;
  weather: string;
  status: "open" | "closed";
  inspector: string;
  attendees: string;
  access_notes: string;
  checker: string;
  reviewer: string;
  approver: string;
  closing_notes: string;
  created_at: string;
  updated_at: string;
  // Summary counts returned by GET /site-visits (optional on objects
  // returned by create/update where we don't compute them).
  snag_count?: number;
  open_count?: number;
  closed_count?: number;
}

export interface Snag {
  id: string;
  project_id: string;
  visit_id?: string;
  snag_no?: number;  // auto-assigned item number within the project
  note: string;
  location?: string;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  photo_url?: string;
  photo_path?: string;
  /** 4-element list, slot-ordered. null = empty slot. Populated by backend _row_to_snag. */
  photo_urls?: (string | null)[];
  photo_count?: number;  // 0-4, how many photos currently attached
  rectification_photo_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_path?: string;
  plan: string;
  max_users: number;
  owner_id: string;
  member_count?: number;
  is_owner?: boolean;
  created_at: string;
  // ── Phase 1: report settings ─────────────────────────────────
  report_brand_colour?: string;              // '#RRGGBB', default '#F97316'
  report_footer_text?: string | null;
  report_include_rectification?: boolean;    // default false
  report_include_cover_page?: boolean;       // default true (Phase 2 will use)
  report_photos_per_page?: number;           // 1 | 2 | 4, default 2 (Phase 2 will use)
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
  full_name?: string;
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

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

// ─── Plan / Billing types ─────────────────────────────────────
export type PlanSlug = "free" | "starter" | "team" | "pro" | "business" | "enterprise";

export interface PlanLimits {
  max_users: number;
  max_projects: number;
  max_snags_per_month: number;
}

export interface PlanFeatures {
  pdf_watermark: boolean;
  email_reports: boolean;
  company_logo: boolean;
}

export interface Plan {
  slug: PlanSlug;
  name: string;
  limits: PlanLimits;
  features: PlanFeatures;
}

export interface PlansResponse {
  plans: Plan[];
  max_photos_per_snag: number;
}

export interface PlanUsage {
  plan: Plan;
  usage: {
    projects: number;
    snags_this_month: number;
    users: number;
  };
  limits_reached: {
    projects: boolean;
    snags_this_month: boolean;
    users: boolean;
  };
}

/** Matches the backend UNLIMITED sentinel. Keep in sync with plan_limits.py. */
export const UNLIMITED = 999_999;
export const isUnlimited = (n: number) => n >= UNLIMITED;

// ─── Token Management ─────────────────────────────────────────
let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("voxsite_token", token);
  } else {
    localStorage.removeItem("voxsite_token");
  }
}

export function getToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("voxsite_token");
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
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

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

// ─── Site Visits ──────────────────────────────────────────────
export const siteVisits = {
  list(projectId: string) {
    return apiFetch<SiteVisit[]>(`/site-visits/?project_id=${projectId}`);
  },

  create(data: {
    project_id: string;
    visit_ref?: string | null;
    weather?: string;
    inspector?: string;
    attendees?: string;
    access_notes?: string;
    checker?: string;
    reviewer?: string;
    approver?: string;
    closing_notes?: string;
  }) {
    return apiFetch<SiteVisit>("/site-visits/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<SiteVisit>) {
    return apiFetch<SiteVisit>(`/site-visits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  close(id: string) {
    return apiFetch<SiteVisit>(`/site-visits/${id}/close`, {
      method: "POST",
    });
  },

  reopen(id: string) {
    return apiFetch<SiteVisit>(`/site-visits/${id}/reopen`, {
      method: "POST",
    });
  },

  delete(id: string) {
    return apiFetch<void>(`/site-visits/${id}`, { method: "DELETE" });
  },
};

// ─── Snags ────────────────────────────────────────────────────
export const snags = {
  list(projectId: string, visitId?: string) {
    const params = new URLSearchParams({ project_id: projectId });
    if (visitId) params.set("visit_id", visitId);
    return apiFetch<Snag[]>(`/snags/?${params}`);
  },

  create(data: {
    project_id: string;
    visit_id?: string;
    note: string;
    location?: string;
    priority?: string;
    photo?: File;
    photo2?: File;
    photo3?: File;
    photo4?: File;
  }) {
    const form = new FormData();
    form.append("project_id", data.project_id);
    if (data.visit_id) form.append("visit_id", data.visit_id);
    form.append("note", data.note);
    if (data.location) form.append("location", data.location);
    form.append("priority", data.priority || "medium");
    if (data.photo) form.append("photo", data.photo);
    if (data.photo2) form.append("photo2", data.photo2);
    if (data.photo3) form.append("photo3", data.photo3);
    if (data.photo4) form.append("photo4", data.photo4);

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

  closeWithPhoto(id: string, photo: File) {
    const form = new FormData();
    form.append("photo", photo);
    return apiFetch<Snag>(`/snags/${id}/close`, {
      method: "POST",
      body: form,
    });
  },

  /**
   * Append up to 4 photos to an existing snag. Backend rejects if adding
   * would exceed 4 photos total. Files should be pre-compressed by the
   * caller — same expectation as snags.create().
   */
  addPhotos(id: string, photos: (File | Blob)[]) {
    if (photos.length === 0 || photos.length > 4) {
      return Promise.reject(new Error("Provide 1-4 photos"));
    }
    const form = new FormData();
    const names = ["photo", "photo2", "photo3", "photo4"];
    photos.forEach((p, i) => {
      const name = names[i];
      // Give Blobs a filename for FastAPI's UploadFile.filename check
      const filename =
        p instanceof File ? p.name : `photo-${Date.now()}-${i + 1}.jpg`;
      form.append(name, p, filename);
    });
    return apiFetch<Snag>(`/snags/${id}/photos`, {
      method: "POST",
      body: form,
    });
  },

  /**
   * Remove a single photo from a snag by slot number (1..4, 1-based).
   * Backend clears the corresponding column and deletes the file from
   * Storage. No-op (returns current state) if the slot is already empty.
   */
  deletePhoto(id: string, slot: number) {
    if (slot < 1 || slot > 4) {
      return Promise.reject(new Error("slot must be between 1 and 4"));
    }
    return apiFetch<Snag>(`/snags/${id}/photos/${slot}`, {
      method: "DELETE",
    });
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
  async downloadPdf(
    projectId: string,
    opts?: { visitId?: string; weather?: string; visitNo?: string }
  ) {
    const token = getToken();
    const params = new URLSearchParams({
      include_closed: "true",
      include_photos: "true",
    });
    if (opts?.visitId) params.set("visit_id", opts.visitId);
    if (opts?.weather) params.set("weather", opts.weather);
    if (opts?.visitNo) params.set("visit_no", opts.visitNo);

    const res = await fetch(
      `${API_BASE}/reports/${projectId}?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Failed to generate report");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const visitSuffix = opts?.visitNo ? `-visit-${opts.visitNo}` : "";
    a.download = `site-visit-report${visitSuffix}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Email a PDF report to one or more recipients. Backend picks attach-vs-link
   * based on size (see /api/reports/{id}/email).
   *
   * Plan-gated: requires `email_reports` feature (Team+). A 403 from the
   * backend is surfaced verbatim — callers should catch and show it as a
   * paywall prompt.
   */
  emailReport(
    projectId: string,
    opts: {
      to: string[];
      visitId?: string;
      weather?: string;
      visitNo?: string;
      message?: string;
      includeClosed?: boolean;
    }
  ) {
    return apiFetch<{
      status: "sent";
      mode: "attachment" | "link";
      recipients: string[];
      size_mb: number;
    }>(`/reports/${projectId}/email`, {
      method: "POST",
      body: JSON.stringify({
        to: opts.to,
        visit_id: opts.visitId,
        weather: opts.weather,
        visit_no: opts.visitNo,
        message: opts.message,
        include_closed: opts.includeClosed ?? true,
      }),
    });
  },

  preview(projectId: string, visitId?: string) {
    const params = visitId ? `?visit_id=${visitId}` : "";
    return apiFetch<{
      project: Project;
      summary: {
        total: number;
        open: number;
        closed: number;
        high_priority: number;
      };
      snags: Snag[];
    }>(`/reports/${projectId}/preview${params}`);
  },
};

// ─── Companies ────────────────────────────────────────────────
export const companies = {
  getMyCompany() {
    return apiFetch<Company | null>("/companies/me");
  },

  create(name: string) {
    return apiFetch<Company>("/companies/", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  update(data: {
    name?: string;
    report_brand_colour?: string;
    report_footer_text?: string | null;
    report_include_rectification?: boolean;
    report_include_cover_page?: boolean;
    report_photos_per_page?: number;
  }) {
    return apiFetch<Company>("/companies/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  uploadLogo(file: File) {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<{ logo_path: string; message: string }>("/companies/logo", {
      method: "POST",
      body: form,
    });
  },

  deleteLogo() {
    return apiFetch<{ message: string }>("/companies/logo", {
      method: "DELETE",
    });
  },

  listMembers() {
    return apiFetch<CompanyMember[]>("/companies/members");
  },

  addMember(email: string, role = "member") {
    return apiFetch<CompanyMember>("/companies/members", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  removeMember(memberId: string) {
    return apiFetch<{ message: string }>(`/companies/members/${memberId}`, {
      method: "DELETE",
    });
  },
};

// ─── Profiles ─────────────────────────────────────────────────
export const profiles = {
  get() {
    return apiFetch<Profile>("/profiles/me");
  },

  update(data: { first_name?: string; last_name?: string }) {
    return apiFetch<Profile>("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ─── Billing ──────────────────────────────────────────────────
export const billing = {
  /** Public — returns the full plan matrix. No auth needed. */
  listPlans() {
    return apiFetch<PlansResponse>("/billing/plans");
  },

  /** Returns the current user's plan, usage numbers, and which limits are hit. */
  getMyPlan() {
    return apiFetch<PlanUsage>("/billing/plan");
  },

  createCheckout(priceId: string) {
    return apiFetch<{ checkout_url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ price_id: priceId }),
    });
  },

  createPortal() {
    return apiFetch<{ portal_url: string }>("/billing/portal", {
      method: "POST",
    });
  },
};
