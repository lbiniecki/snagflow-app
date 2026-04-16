/**
 * Global app state with Zustand
 */
import { create } from "zustand";
import type { Project, Snag, SiteVisit } from "./api";

interface AppState {
  // Auth
  user: { id: string; email: string } | null;
  token: string | null;
  setAuth: (user: { id: string; email: string } | null, token: string | null) => void;
  logout: () => void;

  // Navigation
  screen: "login" | "projects" | "visits" | "snags" | "capture" | "pricing" | "settings";
  setScreen: (screen: AppState["screen"]) => void;

  // Company-ownership flag — set after fetching the user's company (in
  // ProjectsScreen / SettingsScreen). `null` while unknown, `true` if the
  // user owns their current company, `false` if they're a regular member.
  // Non-owners should not see Pricing/billing UI — only owners manage
  // subscriptions.
  isCompanyOwner: boolean | null;
  setIsCompanyOwner: (v: boolean | null) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;

  // Site Visits
  visits: SiteVisit[];
  currentVisit: SiteVisit | null;
  setVisits: (visits: SiteVisit[]) => void;
  setCurrentVisit: (visit: SiteVisit | null) => void;

  // Snags
  snags: Snag[];
  setSnags: (snags: Snag[]) => void;
  filter: "all" | "open" | "closed";
  setFilter: (filter: AppState["filter"]) => void;

  // UI
  loading: boolean;
  setLoading: (loading: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => {
    localStorage.removeItem("voxsite_token");
    set({ user: null, token: null, screen: "login", isCompanyOwner: null });
  },

  // Navigation
  screen: "login",
  setScreen: (screen) => set({ screen }),

  // Company ownership
  isCompanyOwner: null,
  setIsCompanyOwner: (v) => set({ isCompanyOwner: v }),

  // Projects
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),

  // Site Visits
  visits: [],
  currentVisit: null,
  setVisits: (visits) => set({ visits }),
  setCurrentVisit: (visit) => set({ currentVisit: visit }),

  // Snags
  snags: [],
  setSnags: (snags) => set({ snags }),
  filter: "all",
  setFilter: (filter) => set({ filter }),

  // UI
  loading: false,
  setLoading: (loading) => set({ loading }),
  toast: null,
  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 2500);
  },
}));
