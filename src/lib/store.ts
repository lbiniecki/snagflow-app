/**
 * Global app state with Zustand
 */
import { create } from "zustand";
import type { Project, Snag } from "./api";

interface AppState {
  // Auth
  user: { id: string; email: string } | null;
  token: string | null;
  setAuth: (user: { id: string; email: string } | null, token: string | null) => void;
  logout: () => void;

  // Navigation
  screen: "login" | "projects" | "snags" | "capture";
  setScreen: (screen: AppState["screen"]) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;

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
    localStorage.removeItem("snagflow_token");
    set({ user: null, token: null, screen: "login" });
  },

  // Navigation
  screen: "login",
  setScreen: (screen) => set({ screen }),

  // Projects
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),

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
